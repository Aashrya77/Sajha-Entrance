import assert from "node:assert/strict";
import test from "node:test";
import XLSX from "xlsx";
import mongoose from "mongoose";
import MockTestResultModel from "../models/MockTestResult.js";
import MockTestResultAuditModel from "../models/MockTestResultAudit.js";
import MockTestModel from "../models/MockTest.js";
import StudentModel from "../models/Student.js";
import { requireAdminPermission } from "../admin/utils/admin-auth.js";
import {
  buildInternalLeadsWorkbook,
  buildMockTestResultWorkbook,
  exportInternalLeads,
  finalizeResult,
  generateDraftResult,
  rankEligibleMockTestAttempts,
  sanitizeSpreadsheetText,
  serializeSnapshot,
} from "../services/mockTestResultService.js";

const student = (name = "Student", overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  name,
  isTestAccount: false,
  ...overrides,
});

const attempt = ({
  learner = student(),
  marks = 50,
  time = 100,
  submittedAt = "2026-07-13T04:00:00.000Z",
  status = "completed",
  id = new mongoose.Types.ObjectId(),
  ...overrides
} = {}) => ({
  _id: id,
  student: learner,
  totalScore: marks,
  timeTakenSeconds: time,
  submittedAt,
  completedAt: submittedAt,
  status,
  ...overrides,
});

const mockTest = { totalMarks: 100, duration: 60 };

test("higher marks receive a better unique sequential rank", () => {
  const ranking = rankEligibleMockTestAttempts(
    [attempt({ marks: 70 }), attempt({ marks: 90 }), attempt({ marks: 80 })],
    mockTest
  );
  assert.deepEqual(ranking.rows.map((row) => row.marks), [90, 80, 70]);
  assert.deepEqual(ranking.rows.map((row) => row.rank), [1, 2, 3]);
});

test("equal marks use lower time, then earlier submission, then deterministic ID", () => {
  const baseTime = "2026-07-13T04:00:00.000Z";
  const lowId = new mongoose.Types.ObjectId("000000000000000000000001");
  const highId = new mongoose.Types.ObjectId("000000000000000000000002");
  const ranking = rankEligibleMockTestAttempts(
    [
      attempt({ marks: 80, time: 130 }),
      attempt({ marks: 80, time: 90, submittedAt: "2026-07-13T04:01:00.000Z" }),
      attempt({ marks: 80, time: 90, submittedAt: baseTime, id: highId }),
      attempt({ marks: 80, time: 90, submittedAt: baseTime, id: lowId }),
    ],
    mockTest
  );
  assert.deepEqual(ranking.rows.map((row) => row.attemptId), [
    lowId.toString(),
    highId.toString(),
    ranking.rows[2].attemptId,
    ranking.rows[3].attemptId,
  ]);
  assert.equal(ranking.rows[2].submittedAtMs, new Date("2026-07-13T04:01:00.000Z").getTime());
  assert.equal(ranking.rows[3].timeTakenSeconds, 130);
});

test("incomplete, invalid, corrupt and test-account attempts are excluded", () => {
  const ranking = rankEligibleMockTestAttempts(
    [
      attempt({ status: "started" }),
      attempt({ status: "invalidated" }),
      attempt({ marks: Number.NaN }),
      attempt({ learner: student("Test", { isTestAccount: true }) }),
      attempt({ learner: null }),
      attempt({ marks: 75 }),
    ],
    mockTest
  );
  assert.equal(ranking.rows.length, 1);
  assert.equal(ranking.rows[0].marks, 75);
});

test("only the first valid completed attempt per student is ranked", () => {
  const learner = student("Retake Student");
  const ranking = rankEligibleMockTestAttempts(
    [
      attempt({ learner, marks: 40, submittedAt: "2026-07-13T04:00:00.000Z" }),
      attempt({ learner, marks: 99, submittedAt: "2026-07-13T05:00:00.000Z" }),
    ],
    mockTest
  );
  assert.equal(ranking.rows.length, 1);
  assert.equal(ranking.rows[0].marks, 40);
  assert.equal(ranking.duplicateAttemptsExcluded, 1);
});

test("missing or unreasonable duration ranks after valid duration for equal marks", () => {
  const ranking = rankEligibleMockTestAttempts(
    [attempt({ marks: 70, time: null }), attempt({ marks: 70, time: 120 })],
    mockTest
  );
  assert.equal(ranking.rows[0].timeTakenSeconds, 120);
  assert.equal(ranking.rows[1].timeTakenSeconds, null);
  assert.equal(ranking.missingDurationCount, 1);
});

test("zero attempts return an empty ranking", () => {
  const ranking = rankEligibleMockTestAttempts([], mockTest);
  assert.deepEqual(ranking.rows, []);
  assert.equal(ranking.duplicateAttemptsExcluded, 0);
});

test("snapshot schema enforces one unique result document per mock test", () => {
  const mockTestIndex = MockTestResultModel.schema.indexes().find(
    ([fields]) => fields.mockTest === 1
  );
  assert.ok(mockTestIndex);
  assert.equal(mockTestIndex[1].unique, true);
});

test("a locked snapshot cannot be regenerated accidentally", async () => {
  const originalFindById = MockTestModel.findById;
  const originalFindOne = MockTestResultModel.findOne;
  const mockTestId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();
  MockTestModel.findById = () => ({
    lean: () => ({
      exec: async () => ({
        _id: mockTestId,
        status: "completed",
        title: "Locked Test",
        totalMarks: 100,
        duration: 60,
      }),
    }),
  });
  MockTestResultModel.findOne = () => ({
    exec: async () => ({ status: "locked" }),
  });
  try {
    await assert.rejects(
      generateDraftResult({ mockTestId, adminId }),
      (error) => error.code === "RESULT_LOCKED"
    );
  } finally {
    MockTestModel.findById = originalFindById;
    MockTestResultModel.findOne = originalFindOne;
  }
});

test("finalization locks the reviewed draft with a guarded atomic update", async () => {
  const originalFindById = MockTestModel.findById;
  const originalFindOne = MockTestResultModel.findOne;
  const originalFindOneAndUpdate = MockTestResultModel.findOneAndUpdate;
  const originalAuditCreate = MockTestResultAuditModel.create;
  const mockTestId = new mongoose.Types.ObjectId();
  const snapshotId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();
  let updateCall = null;
  let auditCount = 0;
  MockTestModel.findById = () => ({
    lean: () => ({ exec: async () => ({ _id: mockTestId, status: "completed" }) }),
  });
  MockTestResultModel.findOne = () => ({
    exec: async () => ({ _id: snapshotId, mockTest: mockTestId, status: "draft" }),
  });
  MockTestResultModel.findOneAndUpdate = (filter, update) => {
    updateCall = { filter, update };
    return {
      exec: async () => ({
        _id: snapshotId,
        mockTest: mockTestId,
        mockTestTitle: "Test",
        status: "locked",
        totalParticipants: 1,
        version: 1,
        results: [],
      }),
    };
  };
  MockTestResultAuditModel.create = async () => {
    auditCount += 1;
  };
  try {
    const result = await finalizeResult({ mockTestId, adminId });
    assert.equal(result.status, "locked");
    assert.deepEqual(updateCall.filter.status, { $ne: "locked" });
    assert.equal(updateCall.update.$set.status, "locked");
    assert.equal(auditCount, 1);
  } finally {
    MockTestModel.findById = originalFindById;
    MockTestResultModel.findOne = originalFindOne;
    MockTestResultModel.findOneAndUpdate = originalFindOneAndUpdate;
    MockTestResultAuditModel.create = originalAuditCreate;
  }
});

test("repeated finalization returns the same locked snapshot without another write", async () => {
  const originalFindById = MockTestModel.findById;
  const originalFindOne = MockTestResultModel.findOne;
  const originalFindOneAndUpdate = MockTestResultModel.findOneAndUpdate;
  const mockTestId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();
  let updateCount = 0;
  MockTestModel.findById = () => ({
    lean: () => ({ exec: async () => ({ _id: mockTestId, status: "completed" }) }),
  });
  MockTestResultModel.findOne = () => ({
    exec: async () => ({
      _id: new mongoose.Types.ObjectId(),
      mockTest: mockTestId,
      mockTestTitle: "Test",
      status: "locked",
      totalParticipants: 0,
      version: 1,
      results: [],
    }),
  });
  MockTestResultModel.findOneAndUpdate = () => {
    updateCount += 1;
    return { exec: async () => null };
  };
  try {
    const result = await finalizeResult({ mockTestId, adminId });
    assert.equal(result.status, "locked");
    assert.equal(updateCount, 0);
  } finally {
    MockTestModel.findById = originalFindById;
    MockTestResultModel.findOne = originalFindOne;
    MockTestResultModel.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("unauthenticated users cannot access result APIs", () => {
  const middleware = requireAdminPermission("mock_test_results", "view");
  let statusCode = null;
  let payload = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(value) {
      payload = value;
      return this;
    },
  };
  middleware({ session: null }, res, () => assert.fail("next should not be called"));
  assert.equal(statusCode, 401);
  assert.equal(payload.success, false);
});

test("spreadsheet names are protected from formula injection", () => {
  ["=SUM(A1:A2)", "+cmd", "-2+3", "@payload", "  =hidden", "\t+hidden"].forEach((value) => {
    assert.equal(sanitizeSpreadsheetText(value).startsWith("'"), true);
  });
  assert.equal(sanitizeSpreadsheetText("Ram Sharma"), "Ram Sharma");
});

test("public result serialization and ranking snapshots contain no lead fields", () => {
  const studentId = new mongoose.Types.ObjectId();
  const serialized = serializeSnapshot({
    _id: new mongoose.Types.ObjectId(),
    mockTest: new mongoose.Types.ObjectId(),
    results: [
      {
        rank: 1,
        studentId,
        studentName: "Public Student",
        marks: 90,
        timeTakenSeconds: 60,
        phone: "0987654321",
        address: "Kathmandu",
      },
    ],
  });
  assert.deepEqual(Object.keys(serialized.results[0]), [
    "rank",
    "studentName",
    "marks",
    "timeTakenSeconds",
  ]);
  const rankedStudentSchema = MockTestResultModel.schema.path("results").schema;
  assert.equal(rankedStudentSchema.path("phone"), undefined);
  assert.equal(rankedStudentSchema.path("address"), undefined);
});

test("Excel contains the exact four result columns in locked snapshot order", async () => {
  const workbook = buildMockTestResultWorkbook({
    mockTestTitle: "Weekly Test",
    courseName: "BCA",
    examStartTime: "2026-07-13T04:00:00.000Z",
    fullMarks: 100,
    totalParticipants: 2,
    results: [
      { rank: 1, studentName: "First Student", marks: 87.5, timeTakenSeconds: 90 },
      { rank: 2, studentName: "=Unsafe", marks: 85, timeTakenSeconds: null },
    ],
  });
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const parsed = XLSX.read(buffer, { type: "buffer" });
  const sheet = parsed.Sheets["Mock Test Result"];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  assert.deepEqual(rows[9], [
    "Rank",
    "Student Name",
    "Marks",
    "Time Taken",
  ]);
  assert.deepEqual(rows[10], [1, "First Student", 87.5, "1m 30s"]);
  assert.deepEqual(rows[11], [2, "'=Unsafe", 85, "—"]);
  assert.equal(XLSX.utils.decode_range(sheet["!ref"]).e.c + 1, 4);
});

test("internal leads Excel uses profile fields and preserves finalized snapshot order", () => {
  const firstStudentId = new mongoose.Types.ObjectId();
  const secondStudentId = new mongoose.Types.ObjectId();
  const legacyStudentId = new mongoose.Types.ObjectId();
  const { workbook, metadata } = buildInternalLeadsWorkbook(
    {
      mockTestTitle: "Weekly Test",
      courseName: "BCA",
      examStartTime: "2026-07-13T04:00:00.000Z",
      fullMarks: 100,
      totalParticipants: 3,
      results: [
        {
          rank: 2,
          studentId: firstStudentId,
          studentName: "Snapshot Second",
          marks: 85,
          timeTakenSeconds: 91,
        },
        {
          rank: 1,
          studentId: secondStudentId,
          studentName: "Snapshot First",
          marks: 90,
          timeTakenSeconds: 60,
        },
        {
          rank: 3,
          studentId: legacyStudentId,
          studentName: "Legacy Student",
          marks: 70,
          timeTakenSeconds: null,
        },
      ],
    },
    [
      { _id: secondStudentId, phone: "+9779812345678", address: "@Unsafe Place" },
      { _id: firstStudentId, phone: "0987654321", address: "Kathmandu" },
      { _id: legacyStudentId, phone: "", address: "" },
    ]
  );

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const parsed = XLSX.read(buffer, { type: "buffer" });
  const sheet = parsed.Sheets["INTERNAL Leads"];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  assert.deepEqual(rows[9], [
    "Rank",
    "Student Name",
    "Contact Number",
    "Location",
    "Marks",
    "Time Taken",
  ]);
  assert.deepEqual(rows[10], [2, "Snapshot Second", "0987654321", "Kathmandu", 85, "1m 31s"]);
  assert.deepEqual(rows[11], [1, "Snapshot First", "'+9779812345678", "'@Unsafe Place", 90, "1m 00s"]);
  assert.deepEqual(rows[12], [3, "Legacy Student", "\u2014", "\u2014", 70, "\u2014"]);
  assert.equal(sheet.C11.t, "s");
  assert.equal(workbook.Sheets["INTERNAL Leads"].C11.z, "@");
  assert.equal(metadata.missingProfileFieldRecordCount, 1);
  assert.equal(metadata.missingContactNumberCount, 1);
  assert.equal(metadata.missingLocationCount, 1);
});

test("internal leads export batches profile lookup and records defensive fallback counts", async () => {
  const originalFindById = MockTestModel.findById;
  const originalResultFindOne = MockTestResultModel.findOne;
  const originalStudentFind = StudentModel.find;
  const originalAuditCreate = MockTestResultAuditModel.create;
  const mockTestId = new mongoose.Types.ObjectId();
  const snapshotId = new mongoose.Types.ObjectId();
  const adminId = new mongoose.Types.ObjectId();
  const completeStudentId = new mongoose.Types.ObjectId();
  const corruptStudentId = new mongoose.Types.ObjectId();
  let studentFindCount = 0;
  let studentFilter = null;
  let auditPayload = null;

  MockTestModel.findById = () => ({
    lean: () => ({ exec: async () => ({ _id: mockTestId, status: "completed" }) }),
  });
  MockTestResultModel.findOne = () => ({
    lean: () => ({
      exec: async () => ({
        _id: snapshotId,
        mockTest: mockTestId,
        mockTestTitle: "Final Test",
        courseName: "BCA",
        examStartTime: "2026-07-13T04:00:00.000Z",
        fullMarks: 100,
        totalParticipants: 2,
        version: 4,
        status: "locked",
        results: [
          {
            rank: 1,
            studentId: completeStudentId,
            studentName: "Complete Student",
            marks: 90,
            timeTakenSeconds: 60,
          },
          {
            rank: 2,
            studentId: corruptStudentId,
            studentName: "Corrupt Student",
            marks: 80,
            timeTakenSeconds: 90,
          },
        ],
      }),
    }),
  });
  StudentModel.find = (filter) => {
    studentFindCount += 1;
    studentFilter = filter;
    return {
      select: () => ({
        lean: () => ({
          exec: async () => [
            { _id: completeStudentId, phone: "0123456789", address: "Pokhara" },
            { _id: corruptStudentId, phone: "", address: "" },
          ],
        }),
      }),
    };
  };
  MockTestResultAuditModel.create = async (payload) => {
    auditPayload = payload;
  };

  try {
    const result = await exportInternalLeads({ mockTestId, adminId });
    assert.equal(studentFindCount, 1);
    assert.deepEqual(new Set(studentFilter._id.$in), new Set([
      completeStudentId.toString(),
      corruptStudentId.toString(),
    ]));
    assert.match(result.filename, /_INTERNAL_Leads_/);
    assert.ok(result.buffer.length > 0);
    assert.equal(auditPayload.action, "internal_exported");
    assert.equal(auditPayload.performedBy, adminId);
    assert.equal(auditPayload.metadata.missingProfileFieldRecordCount, 1);
    assert.equal(auditPayload.metadata.missingContactNumberCount, 1);
    assert.equal(auditPayload.metadata.missingLocationCount, 1);
  } finally {
    MockTestModel.findById = originalFindById;
    MockTestResultModel.findOne = originalResultFindOne;
    StudentModel.find = originalStudentFind;
    MockTestResultAuditModel.create = originalAuditCreate;
  }
});
