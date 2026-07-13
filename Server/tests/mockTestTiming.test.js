import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import XLSX from "xlsx";
import MockTestModel, { MockTestAttemptModel } from "../models/MockTest.js";
import StudentModel from "../models/Student.js";
import {
  SaveMockTestAnswers,
  StartMockTestAttempt,
  SubmitMockTest,
} from "../controllers/MockTest.js";
import {
  calculateAttemptDeadline,
  calculateTimeTakenSeconds,
  finalizeExpiredMockTestAttempts,
  gradeMockTestAnswers,
  resolveAttemptTiming,
} from "../services/mockTestAttemptService.js";
import {
  resolveMockTestLifecycle,
  validateMockTestPayload,
} from "../services/mockTestService.js";
import {
  buildInternalLeadsWorkbook,
  buildMockTestResultWorkbook,
  formatTimeTaken,
  rankEligibleMockTestAttempts,
  serializeSnapshot,
} from "../services/mockTestResultService.js";

const availabilityTest = (overrides = {}) => ({
  status: "scheduled",
  startAt: new Date("2026-07-13T06:00:00.000Z"),
  endAt: new Date("2026-07-13T10:00:00.000Z"),
  duration: 120,
  questions: [{ questionText: "Q", options: [], correctOption: 0, marks: 1 }],
  ...overrides,
});

const createResponse = () => {
  const state = { statusCode: 200, payload: null };
  return {
    state,
    response: {
      status(code) {
        state.statusCode = code;
        return this;
      },
      json(payload) {
        state.payload = payload;
        return this;
      },
    },
  };
};

const mockStudentLookup = (student) => {
  const original = StudentModel.findById;
  StudentModel.findById = () => ({
    select: () => ({ lean: () => ({ exec: async () => student }) }),
  });
  return () => {
    StudentModel.findById = original;
  };
};

test("1. student can start during the inclusive availability window", () => {
  const lifecycle = resolveMockTestLifecycle(
    availabilityTest(),
    new Date("2026-07-13T09:55:00.000Z")
  );
  assert.equal(lifecycle.isAccessible, true);
});

test("2. student cannot start before availability start", () => {
  const lifecycle = resolveMockTestLifecycle(
    availabilityTest(),
    new Date("2026-07-13T05:59:59.999Z")
  );
  assert.equal(lifecycle.isAccessible, false);
  assert.equal(lifecycle.isUpcoming, true);
});

test("3. student cannot start after availability end", () => {
  const lifecycle = resolveMockTestLifecycle(
    availabilityTest(),
    new Date("2026-07-13T10:00:00.001Z")
  );
  assert.equal(lifecycle.isAccessible, false);
  assert.equal(lifecycle.hasEnded, true);
});

test("4. a 9:55 start creates an 11:55 deadline for a two-hour test", () => {
  const startedAt = new Date("2026-07-13T09:55:00.000Z");
  assert.equal(calculateAttemptDeadline(startedAt, 7200).toISOString(), "2026-07-13T11:55:00.000Z");
});

test("5. availability end does not shorten an existing attempt", () => {
  const timing = resolveAttemptTiming(
    { startedAt: "2026-07-13T09:55:00.000Z", durationSeconds: 7200 },
    availabilityTest()
  );
  assert.equal(timing.deadlineAt.toISOString(), "2026-07-13T11:55:00.000Z");
});

test("6. repeated start requests return the original server timing", async () => {
  const mockTestId = new mongoose.Types.ObjectId();
  const studentId = new mongoose.Types.ObjectId();
  const originalFindById = MockTestModel.findById;
  const originalFindOne = MockTestAttemptModel.findOne;
  const restoreStudent = mockStudentLookup({ _id: studentId, name: "Student" });
  const startedAt = new Date(Date.now() - 15 * 60 * 1000);
  const deadlineAt = new Date(startedAt.getTime() + 7200 * 1000);
  const activeAttempt = {
    _id: new mongoose.Types.ObjectId(),
    startedAt,
    deadlineAt,
    durationSeconds: 7200,
    attemptNumber: 1,
    answers: [],
    status: "started",
  };
  MockTestModel.findById = () => ({ exec: async () => availabilityTest({ _id: mockTestId }) });
  MockTestAttemptModel.findOne = () => ({ exec: async () => activeAttempt });
  try {
    for (let index = 0; index < 2; index += 1) {
      const { state, response } = createResponse();
      await StartMockTestAttempt(
        { params: { id: mockTestId.toString() }, student: { id: studentId.toString() } },
        response
      );
      assert.equal(state.statusCode, 200);
      assert.equal(new Date(state.payload.data.startedAt).getTime(), startedAt.getTime());
      assert.equal(new Date(state.payload.data.deadlineAt).getTime(), deadlineAt.getTime());
    }
  } finally {
    MockTestModel.findById = originalFindById;
    MockTestAttemptModel.findOne = originalFindOne;
    restoreStudent();
  }
});

test("7. refresh derives the same persisted individual deadline", () => {
  const persistedDeadline = new Date("2026-07-13T11:55:00.000Z");
  const timing = resolveAttemptTiming(
    {
      startedAt: "2026-07-13T09:55:00.000Z",
      deadlineAt: persistedDeadline,
      durationSeconds: 7200,
    },
    { duration: 30 }
  );
  assert.equal(timing.deadlineAt.getTime(), persistedDeadline.getTime());
  assert.equal(timing.durationSeconds, 7200);
});

test("8. manual submission uses actual server elapsed time", () => {
  assert.equal(
    calculateTimeTakenSeconds({
      startedAt: "2026-07-13T09:00:00.000Z",
      submittedAt: "2026-07-13T10:20:00.000Z",
      durationSeconds: 7200,
      submissionType: "manual",
    }),
    4800
  );
});

test("9. one hour thirty-five minutes is exactly 5700 seconds", () => {
  assert.equal(
    calculateTimeTakenSeconds({
      startedAt: "2026-07-13T06:15:00.000Z",
      submittedAt: "2026-07-13T07:50:00.000Z",
      durationSeconds: 7200,
    }),
    5700
  );
});

test("10. automatic submission records the full configured duration", () => {
  assert.equal(
    calculateTimeTakenSeconds({
      startedAt: "2026-07-13T07:30:00.000Z",
      submittedAt: "2026-07-13T09:30:00.000Z",
      durationSeconds: 7200,
      submissionType: "auto",
    }),
    7200
  );
});

test("11. duration never exceeds the attempt duration", () => {
  assert.equal(
    calculateTimeTakenSeconds({
      startedAt: "2026-07-13T08:00:00.000Z",
      submittedAt: "2026-07-13T10:03:00.000Z",
      durationSeconds: 7200,
    }),
    7200
  );
});

test("12. answer changes at or after deadline are rejected and do not replace saved answers", async () => {
  const mockTestId = new mongoose.Types.ObjectId();
  const studentId = new mongoose.Types.ObjectId();
  const attemptId = new mongoose.Types.ObjectId();
  const originalFindById = MockTestModel.findById;
  const originalFindOne = MockTestAttemptModel.findOne;
  const originalFindOneAndUpdate = MockTestAttemptModel.findOneAndUpdate;
  const mockTest = availabilityTest({ _id: mockTestId });
  const attempt = {
    _id: attemptId,
    status: "started",
    startedAt: new Date(Date.now() - 7201 * 1000),
    deadlineAt: new Date(Date.now() - 1000),
    durationSeconds: 7200,
    answers: [{ questionIndex: 0, selectedOption: 0 }],
  };
  let finalizedAnswers = null;
  MockTestModel.findById = () => ({ exec: async () => mockTest });
  MockTestAttemptModel.findOne = () => ({ exec: async () => attempt });
  MockTestAttemptModel.findOneAndUpdate = (_filter, update) => ({
    exec: async () => {
      finalizedAnswers = update.$set.answers;
      return { ...attempt, ...update.$set };
    },
  });
  try {
    const { state, response } = createResponse();
    await SaveMockTestAnswers(
      {
        params: { id: mockTestId.toString() },
        student: { id: studentId.toString() },
        body: { attemptId: attemptId.toString(), answers: [{ questionIndex: 0, selectedOption: 3 }] },
      },
      response
    );
    assert.equal(state.statusCode, 409);
    assert.equal(state.payload.code, "ATTEMPT_DEADLINE_PASSED");
    assert.equal(finalizedAnswers[0].selectedOption, 0);
  } finally {
    MockTestModel.findById = originalFindById;
    MockTestAttemptModel.findOne = originalFindOne;
    MockTestAttemptModel.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("13. browser clock differences cannot alter backend duration", () => {
  const calculation = {
    startedAt: "2026-07-13T08:00:00.000Z",
    submittedAt: "2026-07-13T09:35:00.000Z",
    durationSeconds: 7200,
    browserReportedElapsedSeconds: 1,
  };
  assert.equal(calculateTimeTakenSeconds(calculation), 5700);
});

test("14. manual submission after availability end succeeds before individual deadline", async () => {
  const mockTestId = new mongoose.Types.ObjectId();
  const studentId = new mongoose.Types.ObjectId();
  const attemptId = new mongoose.Types.ObjectId();
  const originalFindById = MockTestModel.findById;
  const originalFindOne = MockTestAttemptModel.findOne;
  const originalFindOneAndUpdate = MockTestAttemptModel.findOneAndUpdate;
  const now = Date.now();
  const mockTest = availabilityTest({
    _id: mockTestId,
    startAt: new Date(now - 5 * 60 * 60 * 1000),
    endAt: new Date(now - 20 * 60 * 1000),
    totalMarks: 1,
  });
  const attempt = {
    _id: attemptId,
    status: "started",
    startedAt: new Date(now - 80 * 60 * 1000),
    deadlineAt: new Date(now + 40 * 60 * 1000),
    durationSeconds: 7200,
    attemptNumber: 1,
    answers: [],
  };
  MockTestModel.findById = () => ({ exec: async () => mockTest });
  MockTestAttemptModel.findOne = () => ({ exec: async () => attempt });
  MockTestAttemptModel.findOneAndUpdate = (_filter, update) => ({
    exec: async () => ({ ...attempt, ...update.$set }),
  });
  try {
    const { state, response } = createResponse();
    await SubmitMockTest(
      {
        params: { id: mockTestId.toString() },
        student: { id: studentId.toString() },
        body: { attemptId: attemptId.toString(), answers: [{ questionIndex: 0, selectedOption: 0 }] },
      },
      response
    );
    assert.equal(state.statusCode, 200);
    assert.equal(state.payload.success, true);
    assert.equal(state.payload.data.submissionType, "manual");
    assert.ok(state.payload.data.timeTaken >= 4799 && state.payload.data.timeTaken <= 4801);
  } finally {
    MockTestModel.findById = originalFindById;
    MockTestAttemptModel.findOne = originalFindOne;
    MockTestAttemptModel.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("15. start endpoint rejects a new start after general availability end", async () => {
  const mockTestId = new mongoose.Types.ObjectId();
  const studentId = new mongoose.Types.ObjectId();
  const originalFindById = MockTestModel.findById;
  const originalFindOne = MockTestAttemptModel.findOne;
  const restoreStudent = mockStudentLookup({ _id: studentId, name: "Student" });
  MockTestModel.findById = () => ({
    exec: async () => availabilityTest({
      _id: mockTestId,
      startAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      endAt: new Date(Date.now() - 1000),
    }),
  });
  MockTestAttemptModel.findOne = () => ({ exec: async () => null });
  try {
    const { state, response } = createResponse();
    await StartMockTestAttempt(
      { params: { id: mockTestId.toString() }, student: { id: studentId.toString() } },
      response
    );
    assert.equal(state.statusCode, 403);
    assert.match(state.payload.error, /availability window/i);
  } finally {
    MockTestModel.findById = originalFindById;
    MockTestAttemptModel.findOne = originalFindOne;
    restoreStudent();
  }
});

test("16. closed-browser expired attempt is finalized by the server worker from saved answers", async () => {
  const originalFind = MockTestAttemptModel.find;
  const originalFindOneAndUpdate = MockTestAttemptModel.findOneAndUpdate;
  const deadlineAt = new Date(Date.now() - 1000);
  const mockTest = availabilityTest({ totalMarks: 1 });
  const attempt = {
    _id: new mongoose.Types.ObjectId(),
    mockTest,
    status: "started",
    startedAt: new Date(deadlineAt.getTime() - 7200 * 1000),
    deadlineAt,
    durationSeconds: 7200,
    answers: [{ questionIndex: 0, selectedOption: 0 }],
  };
  let finalUpdate = null;
  MockTestAttemptModel.find = () => ({
    populate: () => ({ limit: () => ({ exec: async () => [attempt] }) }),
  });
  MockTestAttemptModel.findOneAndUpdate = (_filter, update) => ({
    exec: async () => {
      finalUpdate = update.$set;
      return { ...attempt, ...update.$set };
    },
  });
  try {
    const result = await finalizeExpiredMockTestAttempts({ now: new Date() });
    assert.equal(result.finalizedCount, 1);
    assert.equal(finalUpdate.submissionType, "auto");
    assert.equal(finalUpdate.submittedAt.getTime(), deadlineAt.getTime());
    assert.equal(finalUpdate.timeTakenSeconds, 7200);
    assert.equal(finalUpdate.totalScore, 1);
  } finally {
    MockTestAttemptModel.find = originalFind;
    MockTestAttemptModel.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("17. preview snapshot and both Excel exports use the same duration value", () => {
  const studentId = new mongoose.Types.ObjectId();
  const snapshot = {
    mockTestTitle: "Timing Test",
    courseName: "BCA",
    examStartTime: "2026-07-13T06:00:00.000Z",
    fullMarks: 100,
    totalParticipants: 1,
    results: [{ rank: 1, studentId, studentName: "Student", marks: 90, timeTakenSeconds: 5700 }],
  };
  const preview = serializeSnapshot({ _id: new mongoose.Types.ObjectId(), mockTest: new mongoose.Types.ObjectId(), ...snapshot });
  const publicBook = buildMockTestResultWorkbook(snapshot);
  const { workbook: internalBook } = buildInternalLeadsWorkbook(snapshot, [
    { _id: studentId, phone: "0980000000", address: "Kathmandu" },
  ]);
  const publicRows = XLSX.utils.sheet_to_json(publicBook.Sheets["Mock Test Result"], { header: 1 });
  const internalRows = XLSX.utils.sheet_to_json(internalBook.Sheets["INTERNAL Leads"], { header: 1 });
  assert.equal(preview.results[0].timeTakenSeconds, 5700);
  assert.equal(formatTimeTaken(5700), "1h 35m 00s");
  assert.equal(publicRows[10][3], "1h 35m 00s");
  assert.equal(internalRows[10][5], "1h 35m 00s");
});

test("18. ranking uses the same validated capped timeTakenSeconds", () => {
  const learner = { _id: new mongoose.Types.ObjectId(), name: "Student" };
  const ranked = rankEligibleMockTestAttempts(
    [{
      _id: new mongoose.Types.ObjectId(),
      student: learner,
      totalScore: 90,
      timeTakenSeconds: 7380,
      durationSeconds: 7200,
      submittedAt: new Date(),
      status: "completed",
    }],
    { totalMarks: 100, duration: 120 }
  );
  assert.equal(ranked.rows[0].timeTakenSeconds, 7200);
});

test("19. network-delayed submission cannot exceed configured duration", () => {
  assert.equal(
    calculateTimeTakenSeconds({
      startedAt: "2026-07-13T08:00:00.000Z",
      submittedAt: "2026-07-13T12:00:00.000Z",
      durationSeconds: 7200,
    }),
    7200
  );
});

test("20. multiple tabs resolve one shared startedAt and deadlineAt", () => {
  const attempt = {
    startedAt: "2026-07-13T08:00:00.000Z",
    deadlineAt: "2026-07-13T10:00:00.000Z",
    durationSeconds: 7200,
  };
  const tabOne = resolveAttemptTiming(attempt, availabilityTest());
  const tabTwo = resolveAttemptTiming(attempt, availabilityTest());
  assert.equal(tabOne.startedAt.getTime(), tabTwo.startedAt.getTime());
  assert.equal(tabOne.deadlineAt.getTime(), tabTwo.deadlineAt.getTime());
});

test("attempt duration may exceed the availability-window length", () => {
  const questionId = new mongoose.Types.ObjectId();
  const courseId = new mongoose.Types.ObjectId();
  const subjectId = new mongoose.Types.ObjectId();
  const validation = validateMockTestPayload({
    payload: {
      title: "Short Window",
      status: "scheduled",
      courseRef: courseId,
      subjectRefs: [subjectId],
      questionRefs: [questionId],
      duration: 120,
      startAt: "2026-07-13T09:00:00.000Z",
      endAt: "2026-07-13T10:00:00.000Z",
    },
    selectedQuestions: [{ _id: questionId, marks: 1 }],
  });
  assert.equal(validation.errors.duration, undefined);
});

test("auto grading uses only the last server-saved answer selections", () => {
  const graded = gradeMockTestAnswers(
    availabilityTest({ totalMarks: 1 }),
    [{ questionIndex: 0, selectedOption: 0 }]
  );
  assert.equal(graded.totalScore, 1);
  assert.equal(graded.answers[0].selectedOption, 0);
});
