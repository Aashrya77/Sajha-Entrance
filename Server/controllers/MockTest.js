import mongoose from "mongoose";
import MockTestModel, { MockTestAttemptModel } from "../models/MockTest.js";
import Student from "../models/Student.js";
import {
  buildStudentMockTestSummary,
  resolveMockTestLifecycle,
  serializeQuestionForReview,
  serializeQuestionForStudent,
} from "../services/mockTestService.js";
import {
  MockTestAttemptError,
  ensureAttemptTiming,
  finalizeExpiredAttempt,
  finalizeStartedAttempt,
  getConfiguredDurationSeconds,
  normalizeAnswerSelections,
} from "../services/mockTestAttemptService.js";

const buildSubjectLookupFromMockTest = (mockTest) =>
  (mockTest?.subjectRefs || []).reduce((lookup, subjectRef, index) => {
    const subjectId =
      subjectRef && typeof subjectRef === "object" && subjectRef.toString
        ? subjectRef.toString()
        : String(subjectRef || "");
    const subjectName = String(mockTest?.subjectNames?.[index] || "").trim();

    if (subjectId && subjectName) {
      lookup[subjectId] = subjectName;
    }

    return lookup;
  }, {});

const buildQuestionSubjectOverrides = async (mockTest) => {
  const questions = Array.isArray(mockTest?.questions) ? mockTest.questions : [];
  const subjectLookup = buildSubjectLookupFromMockTest(mockTest);
  const unresolvedSourceIds = [
    ...new Set(
      questions
        .filter(
          (question) =>
            !question?.subject &&
            question?.sourceQuestionId &&
            mongoose.Types.ObjectId.isValid(question.sourceQuestionId)
        )
        .map((question) => String(question.sourceQuestionId))
    ),
  ];

  if (!unresolvedSourceIds.length) {
    return {
      subjectLookup,
      questionOverrides: {},
    };
  }

  const sourceQuestions = await mongoose
    .model("MockQuestion")
    .find(
      { _id: { $in: unresolvedSourceIds } },
      { _id: 1, subject: 1 }
    )
    .lean()
    .exec();

  const unresolvedSubjectIds = [
    ...new Set(
      sourceQuestions
        .map((question) => String(question?.subject || ""))
        .filter((subjectId) => mongoose.Types.ObjectId.isValid(subjectId))
        .filter((subjectId) => !subjectLookup[subjectId])
    ),
  ];

  if (unresolvedSubjectIds.length) {
    const subjects = await mongoose
      .model("MockTestSubject")
      .find({ _id: { $in: unresolvedSubjectIds } }, { _id: 1, name: 1 })
      .lean()
      .exec();

    subjects.forEach((subject) => {
      subjectLookup[String(subject._id)] = subject.name;
    });
  }

  const questionOverrides = sourceQuestions.reduce((overrides, question) => {
    const subjectId = String(question?.subject || "").trim();
    const subjectName = subjectLookup[subjectId] || "";

    if (subjectId && subjectName) {
      overrides[String(question._id)] = {
        subject: subjectId,
        subjectName,
      };
    }

    return overrides;
  }, {});

  return {
    subjectLookup,
    questionOverrides,
  };
};

const toPlainQuestionSnapshot = (question) =>
  question?.toObject?.() ? question.toObject() : question;

const shuffleItems = (items = []) => {
  const shuffled = [...items];

  if (shuffled.length < 2) {
    return shuffled;
  }

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  // A random shuffle can occasionally keep every item in the same position.
  // Rotate once in that case so an enabled shuffle is always visible to students.
  if (shuffled.every((item, index) => item === items[index])) {
    return [...shuffled.slice(1), shuffled[0]];
  }

  return shuffled;
};

const buildExamQuestions = (mockTest) => {
  const questions = (mockTest.questions || []).map((question, sourceQuestionIndex) => {
    const plainQuestion = toPlainQuestionSnapshot(question);
    const options = (plainQuestion.options || []).map((option, sourceOptionIndex) => ({
      ...option,
      sourceOptionIndex,
    }));

    return {
      ...plainQuestion,
      sourceQuestionIndex,
      options: mockTest.shuffleOptions ? shuffleItems(options) : options,
    };
  });

  return mockTest.shuffleQuestions ? shuffleItems(questions) : questions;
};

const serializeAttemptSession = (attempt, serverNow = new Date()) => ({
  attemptId: attempt._id,
  startedAt: attempt.startedAt,
  deadlineAt: attempt.deadlineAt,
  durationSeconds: attempt.durationSeconds,
  attemptNumber: attempt.attemptNumber,
  serverNow,
  answers: (attempt.answers || []).map((answer) => ({
    questionIndex: answer.questionIndex,
    selectedOption: answer.selectedOption,
  })),
});

const buildAttemptResultData = async ({ attempt, mockTest, attemptNumber }) => {
  const { subjectLookup, questionOverrides } = await buildQuestionSubjectOverrides(mockTest);
  const resultQuestions = (mockTest.questions || []).map((question, index) => {
    const answer = (attempt.answers || []).find((entry) => entry.questionIndex === index);
    const plainQuestion = toPlainQuestionSnapshot(question);
    return serializeQuestionForReview(
      {
        ...plainQuestion,
        subject:
          plainQuestion?.subject ||
          questionOverrides[String(plainQuestion?.sourceQuestionId)]?.subject ||
          null,
        subjectName:
          plainQuestion?.subjectName ||
          questionOverrides[String(plainQuestion?.sourceQuestionId)]?.subjectName ||
          "",
      },
      answer,
      index,
      subjectLookup
    );
  });
  return {
    attemptId: attempt._id,
    attemptNumber: attemptNumber || attempt.attemptNumber || 1,
    testTitle: mockTest.title,
    totalMarks: mockTest.totalMarks,
    passMarks: mockTest.passMarks || 0,
    totalScore: attempt.totalScore,
    totalCorrect: attempt.totalCorrect,
    totalWrong: attempt.totalWrong,
    totalUnanswered: attempt.totalUnanswered,
    totalQuestions: mockTest.questions.length,
    percentage: attempt.percentage,
    timeTaken: attempt.timeTakenSeconds ?? attempt.timeTaken,
    duration: mockTest.duration,
    startedAt: attempt.startedAt,
    deadlineAt: attempt.deadlineAt,
    submittedAt: attempt.submittedAt,
    completedAt: attempt.completedAt,
    submissionType: attempt.submissionType,
    questions: resultQuestions,
  };
};

const matchSearch = (mockTest, search = "") => {
  const normalizedSearch = String(search || "").trim().toLowerCase();
  if (!normalizedSearch) {
    return true;
  }

  return [
    mockTest?.title,
    mockTest?.admissionTest,
    mockTest?.courseName,
    mockTest?.course,
    ...(mockTest?.subjectNames || []),
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalizedSearch);
};

const matchCourse = (mockTest, course = "") => {
  const normalizedCourse = String(course || "").trim().toLowerCase();
  if (!normalizedCourse) {
    return true;
  }

  return [mockTest?.courseName, mockTest?.course]
    .join(" ")
    .toLowerCase()
    .includes(normalizedCourse);
};

const normalizeMaxAttempts = (mockTest = {}) => {
  const parsedMaxAttempts = Number(mockTest?.maxAttempts);

  return Number.isFinite(parsedMaxAttempts)
    ? Math.max(0, Math.floor(parsedMaxAttempts))
    : 1;
};

const completedAttemptStatusFilter = {
  $or: [
    { status: { $in: ["submitted", "completed"] } },
    { status: { $exists: false }, completedAt: { $ne: null } },
  ],
};

// Keep list-card reads independent of the embedded question snapshots. A
// single test can contain hundreds of rich-text questions and image URLs.
const MOCK_TEST_LIST_FIELDS = [
  "title",
  "slug",
  "description",
  "instructions",
  "admissionTest",
  "course",
  "courseName",
  "subjectNames",
  "totalMarks",
  "passMarks",
  "duration",
  "allowRetake",
  "maxAttempts",
  "questionCount",
  "status",
  "isActive",
  "manualStatusOverride",
  "startAt",
  "endAt",
  "publishedAt",
  "examDate",
  "createdAt",
].join(" ");

const MOCK_TEST_LIST_ATTEMPT_FIELDS = [
  "mockTest",
  "status",
  "attemptNumber",
  "startedAt",
  "deadlineAt",
  "completedAt",
  "totalScore",
  "percentage",
].join(" ");

const buildAttemptLimitState = ({ mockTest, lifecycle, attempts = [] }) => {
  const maxAttempts = normalizeMaxAttempts(mockTest);
  const attemptCount = attempts.length;
  const hasCompletedAttempt = attemptCount > 0;
  const latestAttempt = hasCompletedAttempt
    ? [...attempts].sort(
        (left, right) =>
          new Date(right.completedAt || 0).getTime() -
          new Date(left.completedAt || 0).getTime()
      )[0]
    : null;
  const isUnlimited = maxAttempts === 0;
  const attemptsRemaining = isUnlimited
    ? null
    : Math.max(0, maxAttempts - attemptCount);
  const canRetake =
    Boolean(mockTest?.allowRetake) &&
    Boolean(lifecycle?.isAccessible) &&
    (isUnlimited || attemptsRemaining > 0);
  const canStartAttempt =
    Boolean(lifecycle?.isAccessible) &&
    (!hasCompletedAttempt || canRetake);

  return {
    hasCompletedAttempt,
    attemptCount,
    latestAttempt: latestAttempt
      ? {
          id: latestAttempt._id,
          attemptNumber: latestAttempt.attemptNumber || attemptCount,
          completedAt: latestAttempt.completedAt,
          totalScore: latestAttempt.totalScore,
          percentage: latestAttempt.percentage,
        }
      : null,
    canRetake,
    canStartAttempt,
    attemptsRemaining,
    maxAttempts,
    isUnlimited,
  };
};

const fetchStudentAttemptsForTest = async (studentId, mockTestId) => {
  if (!studentId || !mongoose.Types.ObjectId.isValid(mockTestId)) {
    return [];
  }

  return MockTestAttemptModel.find({
    student: studentId,
    mockTest: mockTestId,
    ...completedAttemptStatusFilter,
  })
    .sort({ completedAt: -1 })
    .lean()
    .exec();
};

// Create a server-timed attempt before the exam timer starts.
const StartMockTestAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.student?.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, error: "Invalid test ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(403).json({ success: false, error: "A valid student account is required." });
    }

    const [mockTest, student] = await Promise.all([
      MockTestModel.findById(id).exec(),
      Student.findById(studentId).select("name isTestAccount").lean().exec(),
    ]);
    if (!mockTest) {
      return res.status(404).json({ success: false, error: "Mock test not found" });
    }
    if (!student) {
      return res.status(403).json({ success: false, error: "A valid student account is required." });
    }

    let existingStartedAttempt = await MockTestAttemptModel.findOne({
      student: studentId,
      mockTest: id,
      status: "started",
    }).exec();
    if (existingStartedAttempt) {
      const timing = await ensureAttemptTiming(existingStartedAttempt, mockTest);
      const serverNow = new Date();
      if (serverNow.getTime() >= timing.deadlineAt.getTime()) {
        await finalizeExpiredAttempt({ attempt: existingStartedAttempt, mockTest, now: serverNow });
        existingStartedAttempt = null;
      } else {
        return res.json({
          success: true,
          data: serializeAttemptSession(existingStartedAttempt, serverNow),
        });
      }
    }

    const lifecycle = resolveMockTestLifecycle(mockTest);
    if (!lifecycle.isAccessible) {
      return res.status(403).json({
        success: false,
        error: lifecycle.isUpcoming
          ? "This mock test has not started yet."
          : "The availability window for starting this mock test has ended.",
      });
    }

    const previousAttempts = await fetchStudentAttemptsForTest(studentId, mockTest._id);
    const attemptState = buildAttemptLimitState({ mockTest, lifecycle, attempts: previousAttempts });
    if (!attemptState.canStartAttempt) {
      return res.status(403).json({ success: false, error: getRetakeLimitMessage(attemptState) });
    }

    try {
      const startedAt = new Date();
      const durationSeconds = getConfiguredDurationSeconds(mockTest);
      const deadlineAt = new Date(startedAt.getTime() + durationSeconds * 1000);
      const attempt = await MockTestAttemptModel.create({
        student: studentId,
        mockTest: id,
        attemptNumber: previousAttempts.length + 1,
        status: "started",
        startedAt,
        deadlineAt,
        durationSeconds,
        studentNameSnapshot: student.name,
        isTestAttempt: Boolean(student.isTestAccount),
      });
      return res.json({
        success: true,
        data: serializeAttemptSession(attempt, new Date()),
      });
    } catch (error) {
      if (error?.code === 11000) {
        const concurrentAttempt = await MockTestAttemptModel.findOne({
          student: studentId,
          mockTest: id,
          status: "started",
        }).lean();
        if (concurrentAttempt) {
          await ensureAttemptTiming(concurrentAttempt, mockTest);
          return res.json({
            success: true,
            data: serializeAttemptSession(concurrentAttempt, new Date()),
          });
        }
      }
      throw error;
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const getRetakeLimitMessage = (attemptState) => {
  if (attemptState?.hasCompletedAttempt) {
    return "You have already completed this mock test and no retake attempts are available.";
  }

  return "No attempts are available for this mock test.";
};

const attachDisplayAttemptNumbers = (attempts = []) => {
  const fallbackAttemptNumberById = new Map();
  const attemptsByTestId = attempts.reduce((lookup, attempt) => {
    const testId = String(attempt.mockTest?._id || attempt.mockTest || "");
    if (!lookup.has(testId)) {
      lookup.set(testId, []);
    }

    lookup.get(testId).push(attempt);
    return lookup;
  }, new Map());

  attemptsByTestId.forEach((testAttempts) => {
    [...testAttempts]
      .sort(
        (left, right) =>
          new Date(left.completedAt || 0).getTime() -
          new Date(right.completedAt || 0).getTime()
      )
      .forEach((attempt, index) => {
        fallbackAttemptNumberById.set(String(attempt._id), index + 1);
      });
  });

  return attempts.map((attempt) => ({
    ...attempt,
    attemptNumber:
      attempt.attemptNumber || fallbackAttemptNumberById.get(String(attempt._id)) || 1,
  }));
};

// Get all student-visible mock tests.
const GetMockTests = async (req, res) => {
  try {
    const mockTests = await MockTestModel.find({
      $or: [
        { status: { $in: ["scheduled", "live"] } },
        { status: { $exists: false }, isActive: true },
      ],
    })
      .select(MOCK_TEST_LIST_FIELDS)
      .sort({ startAt: 1, createdAt: -1 })
      .lean()
      .exec();

    const visibleEntries = mockTests
      .map((mockTest) => {
        const lifecycle = resolveMockTestLifecycle(mockTest);
        return {
          mockTest,
          lifecycle,
          summary: buildStudentMockTestSummary(mockTest, lifecycle),
        };
      })
      .filter(
        ({ lifecycle, summary }) =>
          lifecycle.isStudentVisible &&
          matchSearch(summary, req.query.search) &&
          matchCourse(summary, req.query.course)
      );
    const studentId = req.student?.id;
    const visibleTestIds = visibleEntries.map(({ mockTest }) => mockTest._id);
    const serverNow = new Date();
    const attempts = studentId
      ? await MockTestAttemptModel.find({
          student: studentId,
          mockTest: { $in: visibleTestIds },
          $or: [
            { status: "started", deadlineAt: { $gt: serverNow } },
            { status: { $in: ["submitted", "completed"] } },
            { status: { $exists: false }, completedAt: { $ne: null } },
          ],
        })
          .select(MOCK_TEST_LIST_ATTEMPT_FIELDS)
          .sort({ completedAt: -1 })
          .lean()
          .exec()
      : [];
    const attemptsByTestId = attempts.reduce((lookup, attempt) => {
      const testId = String(attempt.mockTest || "");
      if (!lookup.has(testId)) {
        lookup.set(testId, []);
      }

      lookup.get(testId).push(attempt);
      return lookup;
    }, new Map());
    const visibleTests = visibleEntries.map(({ mockTest, lifecycle, summary }) => {
      const testAttempts = attemptsByTestId.get(String(mockTest._id)) || [];
      const activeAttempt = testAttempts.find((attempt) => attempt.status === "started") || null;
      const attemptState = buildAttemptLimitState({
        mockTest,
        lifecycle,
        attempts: testAttempts.filter((attempt) => attempt.status !== "started"),
      });

      return {
        ...summary,
        canStart: Boolean(activeAttempt) || attemptState.canStartAttempt,
        canResume: Boolean(activeAttempt),
        activeAttempt: activeAttempt
          ? {
              id: activeAttempt._id,
              startedAt: activeAttempt.startedAt,
              deadlineAt: activeAttempt.deadlineAt,
            }
          : null,
        hasCompletedAttempt: attemptState.hasCompletedAttempt,
        latestAttempt: attemptState.latestAttempt,
        canRetake: attemptState.canRetake,
        attemptsRemaining: attemptState.attemptsRemaining,
        attemptCount: attemptState.attemptCount,
        maxAttempts: attemptState.maxAttempts,
        isUnlimitedAttempts: attemptState.isUnlimited,
      };
    });

    res.json({
      success: true,
      data: {
        mockTests: visibleTests,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get a live/accessible mock test for taking the exam.
const GetMockTestForExam = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, error: "Invalid test ID" });
    }

    const mockTest = await MockTestModel.findById(req.params.id).lean().exec();

    if (!mockTest) {
      return res.status(404).json({ success: false, error: "Mock test not found" });
    }

    const lifecycle = resolveMockTestLifecycle(mockTest);
    const summary = buildStudentMockTestSummary(mockTest, lifecycle);
    let activeAttempt = req.student?.id
      ? await MockTestAttemptModel.findOne({
          student: req.student.id,
          mockTest: mockTest._id,
          status: "started",
        }).exec()
      : null;
    if (activeAttempt) {
      const timing = await ensureAttemptTiming(activeAttempt, mockTest);
      const serverNow = new Date();
      if (serverNow.getTime() >= timing.deadlineAt.getTime()) {
        await finalizeExpiredAttempt({ attempt: activeAttempt, mockTest, now: serverNow });
        activeAttempt = null;
      }
    }
    const canResume = Boolean(activeAttempt);

    if (!lifecycle.isStudentVisible && !canResume) {
      return res.status(404).json({
        success: false,
        error: "This mock test is not available to students right now.",
      });
    }

    if (lifecycle.isUpcoming && !canResume) {
      return res.status(403).json({
        success: false,
        error: "This mock test has not started yet.",
        data: summary,
      });
    }

    if (!lifecycle.isAccessible && !canResume) {
      return res.status(403).json({
        success: false,
        error: "This mock test is no longer accessible.",
        data: summary,
      });
    }

    const studentAttempts = await fetchStudentAttemptsForTest(req.student?.id, mockTest._id);
    const attemptState = buildAttemptLimitState({
      mockTest,
      lifecycle,
      attempts: studentAttempts,
    });

    if (req.student?.id && !canResume && !attemptState.canStartAttempt) {
      return res.status(403).json({
        success: false,
        error: getRetakeLimitMessage(attemptState),
        data: {
          ...summary,
          canStart: false,
          hasCompletedAttempt: attemptState.hasCompletedAttempt,
          latestAttempt: attemptState.latestAttempt,
          canRetake: false,
          attemptsRemaining: attemptState.attemptsRemaining,
          attemptCount: attemptState.attemptCount,
          maxAttempts: attemptState.maxAttempts,
          isUnlimitedAttempts: attemptState.isUnlimited,
        },
      });
    }

    const { subjectLookup, questionOverrides } = await buildQuestionSubjectOverrides(mockTest);

    const sanitizedQuestions = buildExamQuestions(mockTest).map((question, index) => {
      const plainQuestion = toPlainQuestionSnapshot(question);

      return serializeQuestionForStudent(
        {
          ...plainQuestion,
          subject:
            plainQuestion?.subject ||
            questionOverrides[String(plainQuestion?.sourceQuestionId)]?.subject ||
            null,
          subjectName:
            plainQuestion?.subjectName ||
            questionOverrides[String(plainQuestion?.sourceQuestionId)]?.subjectName ||
            "",
        },
        index,
        subjectLookup
      );
    });

    res.json({
      success: true,
      data: {
        ...summary,
        canStart: req.student?.id
          ? canResume || attemptState.canStartAttempt
          : summary.canStart,
        canResume,
        activeAttempt: activeAttempt
          ? serializeAttemptSession(activeAttempt, new Date())
          : null,
        hasCompletedAttempt: attemptState.hasCompletedAttempt,
        latestAttempt: attemptState.latestAttempt,
        canRetake: attemptState.canRetake,
        attemptsRemaining: attemptState.attemptsRemaining,
        attemptCount: attemptState.attemptCount,
        maxAttempts: attemptState.maxAttempts,
        isUnlimitedAttempts: attemptState.isUnlimited,
        questions: sanitizedQuestions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Persist answer selections while an authoritative server-timed attempt is active.
const SaveMockTestAnswers = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, attemptId } = req.body;
    const studentId = req.student.id;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(404).json({ success: false, error: "Invalid attempt" });
    }
    const [mockTest, attempt] = await Promise.all([
      MockTestModel.findById(id).exec(),
      MockTestAttemptModel.findOne({ _id: attemptId, student: studentId, mockTest: id }).exec(),
    ]);
    if (!mockTest || !attempt) {
      return res.status(404).json({ success: false, error: "Attempt not found" });
    }
    if (attempt.status !== "started") {
      return res.status(409).json({
        success: false,
        error: "This attempt has already been finalized.",
        code: "ATTEMPT_FINALIZED",
      });
    }
    const timing = await ensureAttemptTiming(attempt, mockTest);
    const serverNow = new Date();
    if (serverNow.getTime() >= timing.deadlineAt.getTime()) {
      await finalizeExpiredAttempt({ attempt, mockTest, now: serverNow });
      return res.status(409).json({
        success: false,
        error: "The individual attempt deadline has passed.",
        code: "ATTEMPT_DEADLINE_PASSED",
      });
    }
    const selections = normalizeAnswerSelections(answers, mockTest.questions.length).map(
      (answer) => ({
        ...answer,
        questionId: mockTest.questions[answer.questionIndex]?.sourceQuestionId || null,
      })
    );
    const updatedAttempt = await MockTestAttemptModel.findOneAndUpdate(
      {
        _id: attempt._id,
        student: studentId,
        mockTest: id,
        status: "started",
        deadlineAt: { $gt: serverNow },
      },
      { $set: { answers: selections, answersUpdatedAt: serverNow } },
      { new: true }
    ).exec();
    if (!updatedAttempt) {
      return res.status(409).json({
        success: false,
        error: "The attempt could not accept answer changes.",
        code: "ATTEMPT_NOT_ACTIVE",
      });
    }
    return res.json({
      success: true,
      data: {
        attemptId: updatedAttempt._id,
        savedAt: updatedAttempt.answersUpdatedAt,
        deadlineAt: updatedAttempt.deadlineAt,
      },
    });
  } catch (error) {
    const status = error instanceof MockTestAttemptError ? error.statusCode : 500;
    return res.status(status).json({ success: false, error: error.message, code: error.code });
  }
};

// Submit against the individual attempt deadline; the general window only controls starts.
const SubmitMockTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, attemptId } = req.body;
    const studentId = req.student.id;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(404).json({ success: false, error: "Invalid attempt" });
    }
    const [mockTest, currentAttempt] = await Promise.all([
      MockTestModel.findById(id).exec(),
      MockTestAttemptModel.findOne({ _id: attemptId, student: studentId, mockTest: id }).exec(),
    ]);
    if (!mockTest || !currentAttempt) {
      return res.status(404).json({ success: false, error: "Attempt not found" });
    }
    if (["submitted", "completed"].includes(currentAttempt.status)) {
      return res.json({
        success: true,
        data: await buildAttemptResultData({ attempt: currentAttempt, mockTest }),
      });
    }
    if (currentAttempt.status !== "started") {
      return res.status(409).json({
        success: false,
        error: "This attempt is not active.",
        code: "ATTEMPT_NOT_ACTIVE",
      });
    }
    const timing = await ensureAttemptTiming(currentAttempt, mockTest);
    const serverNow = new Date();
    const attempt =
      serverNow.getTime() >= timing.deadlineAt.getTime()
        ? await finalizeExpiredAttempt({ attempt: currentAttempt, mockTest, now: serverNow })
        : await finalizeStartedAttempt({
            attempt: currentAttempt,
            mockTest,
            answers,
            submissionType: "manual",
            now: serverNow,
          });
    return res.json({
      success: true,
      data: await buildAttemptResultData({ attempt, mockTest }),
    });
  } catch (error) {
    const status = error instanceof MockTestAttemptError ? error.statusCode : 500;
    return res.status(status).json({ success: false, error: error.message, code: error.code });
  }
};

// Get student's past attempts.
const GetMyAttempts = async (req, res) => {
  try {
    const studentId = req.student.id;

    const attempts = await MockTestAttemptModel.find({
      student: studentId,
      ...completedAttemptStatusFilter,
    })
      .select("-answers")
      .populate("mockTest", "title courseName course totalMarks duration status startAt endAt")
      .sort({ completedAt: -1 })
      .lean()
      .exec();

    res.json({
      success: true,
      data: {
        attempts: attachDisplayAttemptNumbers(attempts),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get a specific attempt result.
const GetAttemptResult = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const studentId = req.student.id;

    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(404).json({ success: false, error: "Invalid attempt ID" });
    }

    const attempt = await MockTestAttemptModel.findOne({
      _id: attemptId,
      student: studentId,
      ...completedAttemptStatusFilter,
    })
      .populate("mockTest")
      .lean()
      .exec();

    if (!attempt || !attempt.mockTest) {
      return res.status(404).json({ success: false, error: "Attempt not found" });
    }

    const mockTest = attempt.mockTest;
    const displayAttemptNumber =
      attempt.attemptNumber ||
      (await MockTestAttemptModel.countDocuments({
        student: studentId,
        mockTest: mockTest._id,
        completedAt: { $lte: attempt.completedAt || new Date() },
      }));
    const { subjectLookup, questionOverrides } = await buildQuestionSubjectOverrides(mockTest);

    const resultQuestions = (mockTest.questions || []).map((question, index) => {
      const answer = (attempt.answers || []).find((entry) => entry.questionIndex === index);
      const plainQuestion = toPlainQuestionSnapshot(question);

      return serializeQuestionForReview(
        {
          ...plainQuestion,
          subject:
            plainQuestion?.subject ||
            questionOverrides[String(plainQuestion?.sourceQuestionId)]?.subject ||
            null,
          subjectName:
            plainQuestion?.subjectName ||
            questionOverrides[String(plainQuestion?.sourceQuestionId)]?.subjectName ||
            "",
        },
        answer,
        index,
        subjectLookup
      );
    });

    res.json({
      success: true,
      data: {
        attemptId: attempt._id,
        attemptNumber: displayAttemptNumber || 1,
        testTitle: mockTest.title,
        totalMarks: mockTest.totalMarks,
        passMarks: mockTest.passMarks || 0,
        totalScore: attempt.totalScore,
        totalCorrect: attempt.totalCorrect,
        totalWrong: attempt.totalWrong,
        totalUnanswered: attempt.totalUnanswered,
        totalQuestions: mockTest.questions.length,
        percentage: attempt.percentage,
        timeTaken: attempt.timeTakenSeconds ?? attempt.timeTaken,
        duration: mockTest.duration,
        completedAt: attempt.completedAt,
        questions: resultQuestions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export {
  GetAttemptResult,
  GetMockTestForExam,
  StartMockTestAttempt,
  GetMockTests,
  GetMyAttempts,
  SaveMockTestAnswers,
  SubmitMockTest,
};

