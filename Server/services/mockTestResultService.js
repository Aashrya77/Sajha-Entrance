import XLSX from "xlsx";
import mongoose from "mongoose";
import MockTestModel, { MockTestAttemptModel } from "../models/MockTest.js";
import MockTestCourseModel from "../models/MockTestCourse.js";
import MockTestResultModel from "../models/MockTestResult.js";
import MockTestResultAuditModel from "../models/MockTestResultAudit.js";
import StudentModel from "../models/Student.js";
import { finalizeExpiredMockTestAttempts } from "./mockTestAttemptService.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("mock-test-results");
const COMPLETED_ATTEMPT_STATUSES = new Set(["submitted", "completed"]);
const RANKING_RULE = "marks_time_submittedAt";
const NEPAL_TIME_ZONE = "Asia/Kathmandu";

class MockTestResultError extends Error {
  constructor(message, statusCode = 400, code = "MOCK_TEST_RESULT_ERROR") {
    super(message);
    this.name = "MockTestResultError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);
const toId = (value) => String(value?._id || value || "").trim();
const toDateMs = (value) => {
  const timestamp = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(timestamp) ? timestamp : null;
};

const resolveAttemptDuration = (attempt, mockTest) => {
  let duration = null;

  if (hasOwn(attempt, "timeTakenSeconds") && attempt.timeTakenSeconds !== null) {
    duration = Number(attempt.timeTakenSeconds);
  } else if (hasOwn(attempt, "timeTaken") && attempt.timeTaken !== null) {
    duration = Number(attempt.timeTaken);
  } else {
    const startedAt = toDateMs(attempt.startedAt);
    const submittedAt = toDateMs(attempt.submittedAt || attempt.completedAt);
    if (startedAt !== null && submittedAt !== null) {
      duration = Math.floor((submittedAt - startedAt) / 1000);
    }
  }

  if (!Number.isFinite(duration) || duration < 0) {
    return null;
  }

  const attemptDurationSeconds = Number(attempt?.durationSeconds);
  const allowedSeconds =
    Number.isFinite(attemptDurationSeconds) && attemptDurationSeconds > 0
      ? Math.floor(attemptDurationSeconds)
      : Number(mockTest?.duration || 0) * 60;
  return allowedSeconds > 0
    ? Math.min(Math.floor(duration), allowedSeconds)
    : Math.floor(duration);
};

const isLegacyCompletedAttempt = (attempt) =>
  !hasOwn(attempt, "status") && Boolean(toDateMs(attempt.completedAt));

const normalizeEligibleAttempt = (attempt, mockTest) => {
  const status = String(attempt?.status || "").toLowerCase();
  if (!COMPLETED_ATTEMPT_STATUSES.has(status) && !isLegacyCompletedAttempt(attempt)) {
    return { eligible: false, reason: "incomplete" };
  }

  if (
    attempt?.deletedAt ||
    attempt?.cancelledAt ||
    attempt?.invalidatedAt ||
    attempt?.disqualifiedAt ||
    attempt?.isDeleted ||
    attempt?.isInvalid ||
    attempt?.isDisqualified
  ) {
    return { eligible: false, reason: "invalid" };
  }

  const student = attempt?.student;
  const studentObjectId = toId(student);
  const studentName = String(
    student?.name || attempt?.studentNameSnapshot || ""
  ).trim();
  if (!mongoose.Types.ObjectId.isValid(studentObjectId) || !studentName) {
    return { eligible: false, reason: "student" };
  }

  if (student?.isTestAccount || attempt?.isTestAttempt || attempt?.isAdminAttempt) {
    return { eligible: false, reason: "test_account" };
  }

  const marks = Number(attempt?.totalScore);
  const fullMarks = Number(mockTest?.totalMarks);
  if (
    !Number.isFinite(marks) ||
    marks < 0 ||
    (Number.isFinite(fullMarks) && fullMarks >= 0 && marks > fullMarks + 0.000001)
  ) {
    return { eligible: false, reason: "marks" };
  }

  const submittedAtMs = toDateMs(attempt?.submittedAt || attempt?.completedAt);
  if (submittedAtMs === null) {
    return { eligible: false, reason: "incomplete" };
  }

  return {
    eligible: true,
    row: {
      attemptId: toId(attempt),
      studentId: studentObjectId,
      studentName,
      marks,
      timeTakenSeconds: resolveAttemptDuration(attempt, mockTest),
      submittedAtMs,
    },
  };
};

const compareFirstCompletedAttempt = (left, right) => {
  if (left.submittedAtMs !== right.submittedAtMs) {
    return left.submittedAtMs - right.submittedAtMs;
  }
  return left.attemptId.localeCompare(right.attemptId);
};

const compareRankingRows = (left, right) => {
  if (left.marks !== right.marks) {
    return right.marks - left.marks;
  }

  const leftDuration = left.timeTakenSeconds;
  const rightDuration = right.timeTakenSeconds;
  if (leftDuration !== rightDuration) {
    if (leftDuration === null) return 1;
    if (rightDuration === null) return -1;
    return leftDuration - rightDuration;
  }

  if (left.submittedAtMs !== right.submittedAtMs) {
    return left.submittedAtMs - right.submittedAtMs;
  }

  return left.attemptId.localeCompare(right.attemptId);
};

const rankEligibleMockTestAttempts = (attempts = [], mockTest = {}) => {
  const normalizedRows = [];
  const excluded = {
    incomplete: 0,
    invalid: 0,
    student: 0,
    test_account: 0,
    marks: 0,
  };

  attempts.forEach((attempt) => {
    const normalized = normalizeEligibleAttempt(attempt, mockTest);
    if (!normalized.eligible) {
      excluded[normalized.reason] = (excluded[normalized.reason] || 0) + 1;
      return;
    }
    normalizedRows.push(normalized.row);
  });

  normalizedRows.sort(compareFirstCompletedAttempt);
  const firstAttemptByStudent = new Map();
  let duplicateAttemptsExcluded = 0;
  normalizedRows.forEach((row) => {
    if (firstAttemptByStudent.has(row.studentId)) {
      duplicateAttemptsExcluded += 1;
      return;
    }
    firstAttemptByStudent.set(row.studentId, row);
  });

  const rankedRows = [...firstAttemptByStudent.values()]
    .sort(compareRankingRows)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  return {
    rows: rankedRows,
    duplicateAttemptsExcluded,
    missingDurationCount: rankedRows.filter((row) => row.timeTakenSeconds === null).length,
    excluded,
  };
};

const loadRankingForMockTest = async (mockTest) => {
  await finalizeExpiredMockTestAttempts({ mockTestId: mockTest._id, limit: 0 });
  const activeAttemptCount = await MockTestAttemptModel.countDocuments({
    mockTest: mockTest._id,
    status: "started",
  });
  if (activeAttemptCount > 0) {
    throw new MockTestResultError(
      `${activeAttemptCount} individual attempt(s) are still active. Wait for their deadlines before generating results.`,
      409,
      "ACTIVE_ATTEMPTS_REMAIN"
    );
  }
  const attempts = await MockTestAttemptModel.find({ mockTest: mockTest._id })
    .select(
      "student mockTest totalScore timeTaken timeTakenSeconds durationSeconds status startedAt deadlineAt submittedAt completedAt submissionType studentNameSnapshot isTestAttempt"
    )
    .populate("student", "name studentId isTestAccount")
    .lean()
    .exec();

  const ranking = rankEligibleMockTestAttempts(attempts, mockTest);
  if (ranking.missingDurationCount > 0) {
    logger.warn(
      `${ranking.missingDurationCount} ranked attempt(s) for mock test ${mockTest._id} have no valid duration.`
    );
  }
  return ranking;
};

const assertObjectId = (value, label = "ID") => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new MockTestResultError(`Invalid ${label}.`, 400, "INVALID_ID");
  }
};

const getMockTestOrThrow = async (mockTestId) => {
  assertObjectId(mockTestId, "mock test ID");
  const mockTest = await MockTestModel.findById(mockTestId).lean().exec();
  if (!mockTest) {
    throw new MockTestResultError("Mock test not found.", 404, "NOT_FOUND");
  }
  return mockTest;
};

const hasMockTestEnded = (mockTest, now = new Date()) => {
  const status = String(mockTest?.status || "").toLowerCase();
  if (["completed", "archived"].includes(status)) return true;
  const endAt = toDateMs(mockTest?.endAt);
  return endAt !== null && endAt <= now.getTime();
};

const mapPublicResultRows = (results = []) =>
  results.map((result) => ({
    rank: result.rank,
    studentName: result.studentName,
    marks: result.marks,
    timeTakenSeconds:
      result.timeTakenSeconds === null || result.timeTakenSeconds === undefined
        ? null
        : result.timeTakenSeconds,
  }));

const serializeSnapshot = (snapshot) => {
  if (!snapshot) return null;
  const plain = snapshot.toObject ? snapshot.toObject() : snapshot;
  return {
    id: toId(plain),
    mockTestId: toId(plain.mockTest),
    mockTestTitle: plain.mockTestTitle,
    courseId: toId(plain.course) || null,
    courseName: plain.courseName,
    examStartTime: plain.examStartTime,
    examEndTime: plain.examEndTime,
    durationMinutes: plain.durationMinutes,
    fullMarks: plain.fullMarks,
    totalParticipants: plain.totalParticipants,
    rankingRule: plain.rankingRule,
    status: plain.status,
    generatedAt: plain.generatedAt,
    lockedAt: plain.lockedAt,
    duplicateAttemptsExcluded: plain.duplicateAttemptsExcluded || 0,
    missingDurationCount: plain.missingDurationCount || 0,
    version: plain.version || 1,
    results: mapPublicResultRows(plain.results),
  };
};

const buildSnapshotPayload = ({ mockTest, ranking, adminId }) => ({
  mockTest: mockTest._id,
  mockTestTitle: mockTest.title,
  course: mockTest.courseRef || null,
  courseName: mockTest.courseName || mockTest.course || "",
  examStartTime: mockTest.startAt || mockTest.examDate || null,
  examEndTime: mockTest.endAt || null,
  durationMinutes: Number(mockTest.duration || 0),
  fullMarks: Number(mockTest.totalMarks || 0),
  totalParticipants: ranking.rows.length,
  rankingRule: RANKING_RULE,
  status: "draft",
  generatedAt: new Date(),
  generatedBy: adminId,
  lockedAt: null,
  lockedBy: null,
  duplicateAttemptsExcluded: ranking.duplicateAttemptsExcluded,
  missingDurationCount: ranking.missingDurationCount,
  results: ranking.rows.map((row) => ({
    rank: row.rank,
    studentId: row.studentId,
    studentName: row.studentName,
    marks: row.marks,
    timeTakenSeconds: row.timeTakenSeconds,
  })),
});

const createAudit = async ({ snapshot, action, adminId }) =>
  MockTestResultAuditModel.create({
    mockTest: snapshot.mockTest,
    resultSnapshot: snapshot._id,
    action,
    performedBy: adminId,
    participantCount: snapshot.totalParticipants,
    snapshotVersion: snapshot.version,
  });

const generateDraftResult = async ({ mockTestId, adminId, regenerate = false }) => {
  assertObjectId(adminId, "admin ID");
  const mockTest = await getMockTestOrThrow(mockTestId);
  if (!hasMockTestEnded(mockTest)) {
    throw new MockTestResultError(
      "Results can only be generated after the mock test has ended.",
      409,
      "TEST_NOT_ENDED"
    );
  }

  const existing = await MockTestResultModel.findOne({ mockTest: mockTest._id }).exec();
  if (existing?.status === "locked") {
    throw new MockTestResultError(
      "This result is locked and cannot be regenerated.",
      409,
      "RESULT_LOCKED"
    );
  }

  const ranking = await loadRankingForMockTest(mockTest);
  const payload = {
    ...buildSnapshotPayload({ mockTest, ranking, adminId }),
    version: existing ? Number(existing.version || 1) + 1 : 1,
  };
  const snapshot = await MockTestResultModel.findOneAndUpdate(
    { mockTest: mockTest._id, status: { $ne: "locked" } },
    { $set: payload },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  ).exec();

  await createAudit({
    snapshot,
    action: regenerate || existing ? "regenerated" : "generated",
    adminId,
  });

  return serializeSnapshot(snapshot);
};

const finalizeResult = async ({ mockTestId, adminId }) => {
  assertObjectId(adminId, "admin ID");
  const mockTest = await getMockTestOrThrow(mockTestId);
  if (!hasMockTestEnded(mockTest)) {
    throw new MockTestResultError(
      "Results can only be finalized after the mock test has ended.",
      409,
      "TEST_NOT_ENDED"
    );
  }

  const existing = await MockTestResultModel.findOne({ mockTest: mockTest._id }).exec();
  if (!existing) {
    throw new MockTestResultError(
      "Generate and review a preview before finalizing the result.",
      409,
      "PREVIEW_REQUIRED"
    );
  }
  if (existing.status === "locked") {
    return serializeSnapshot(existing);
  }

  const lockedAt = new Date();
  const snapshot = await MockTestResultModel.findOneAndUpdate(
    { _id: existing._id, status: { $ne: "locked" } },
    { $set: { status: "locked", lockedAt, lockedBy: adminId } },
    { new: true, runValidators: true }
  ).exec();

  if (!snapshot) {
    const lockedSnapshot = await MockTestResultModel.findById(existing._id).exec();
    if (lockedSnapshot?.status === "locked") return serializeSnapshot(lockedSnapshot);
    throw new MockTestResultError("The result could not be finalized.", 409);
  }

  await createAudit({ snapshot, action: "locked", adminId });
  return serializeSnapshot(snapshot);
};

const unlockResult = async ({ mockTestId, adminId }) => {
  assertObjectId(adminId, "admin ID");
  await getMockTestOrThrow(mockTestId);
  const snapshot = await MockTestResultModel.findOneAndUpdate(
    { mockTest: mockTestId, status: "locked" },
    {
      $set: { status: "draft", lockedAt: null, lockedBy: null },
      $inc: { version: 1 },
    },
    { new: true, runValidators: true }
  ).exec();
  if (!snapshot) {
    throw new MockTestResultError("No locked result was found.", 409, "NOT_LOCKED");
  }
  await createAudit({ snapshot, action: "unlocked", adminId });
  return serializeSnapshot(snapshot);
};

const getMockTestResultDetail = async (mockTestId) => {
  const mockTest = await getMockTestOrThrow(mockTestId);
  const [snapshot, ranking] = await Promise.all([
    MockTestResultModel.findOne({ mockTest: mockTest._id }).lean().exec(),
    loadRankingForMockTest(mockTest),
  ]);

  return {
    summary: {
      mockTestId: toId(mockTest),
      mockTestTitle: mockTest.title,
      courseId: toId(mockTest.courseRef) || null,
      courseName: mockTest.courseName || mockTest.course || "",
      examStartTime: mockTest.startAt || mockTest.examDate || null,
      examEndTime: mockTest.endAt || null,
      durationMinutes: Number(mockTest.duration || 0),
      fullMarks: Number(mockTest.totalMarks || 0),
      totalSubmittedStudents: ranking.rows.length,
      resultStatus: snapshot?.status || "not_generated",
      hasEnded: hasMockTestEnded(mockTest),
      allowRetake: Boolean(mockTest.allowRetake),
      maxAttempts: Number(mockTest.maxAttempts ?? 1),
    },
    eligibility: {
      duplicateAttemptsExcluded: ranking.duplicateAttemptsExcluded,
      missingDurationCount: ranking.missingDurationCount,
      excludedAttemptCount: Object.values(ranking.excluded).reduce(
        (sum, count) => sum + count,
        0
      ),
    },
    snapshot: serializeSnapshot(snapshot),
  };
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const listMockTestsForResults = async (filters = {}) => {
  const query = {};
  if (filters.courseId) {
    assertObjectId(filters.courseId, "course ID");
    query.courseRef = filters.courseId;
  }
  if (filters.search) {
    query.title = { $regex: escapeRegex(filters.search.trim()), $options: "i" };
  }
  if (filters.examDate) {
    const start = new Date(`${filters.examDate}T00:00:00+05:45`);
    if (Number.isNaN(start.getTime())) {
      throw new MockTestResultError("Invalid exam date.", 400);
    }
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    query.$or = [
      { startAt: { $gte: start, $lt: end } },
      { startAt: null, examDate: { $gte: start, $lt: end } },
    ];
  }

  const [courses, tests] = await Promise.all([
    MockTestCourseModel.find().select("name status").sort({ name: 1 }).lean().exec(),
    MockTestModel.find(query)
      .select(
        "title courseRef courseName course examDate startAt endAt duration totalMarks status allowRetake maxAttempts"
      )
      .sort({ endAt: -1, startAt: -1, createdAt: -1 })
      .limit(500)
      .lean()
      .exec(),
  ]);
  const snapshots = await MockTestResultModel.find({
    mockTest: { $in: tests.map((test) => test._id) },
  })
    .select("mockTest status totalParticipants generatedAt lockedAt")
    .lean()
    .exec();
  const snapshotByTest = new Map(snapshots.map((snapshot) => [toId(snapshot.mockTest), snapshot]));
  const requestedStatus = String(filters.resultStatus || "").toLowerCase();
  const now = new Date();

  const mappedTests = tests
    .map((test) => {
      const snapshot = snapshotByTest.get(toId(test));
      return {
        id: toId(test),
        title: test.title,
        courseId: toId(test.courseRef) || null,
        courseName: test.courseName || test.course || "",
        examDate: test.startAt || test.examDate || null,
        startAt: test.startAt || null,
        endAt: test.endAt || null,
        durationMinutes: Number(test.duration || 0),
        fullMarks: Number(test.totalMarks || 0),
        mockTestStatus: test.status,
        resultStatus: snapshot?.status || "not_generated",
        totalParticipants: snapshot?.totalParticipants || 0,
        generatedAt: snapshot?.generatedAt || null,
        lockedAt: snapshot?.lockedAt || null,
        hasEnded: hasMockTestEnded(test, now),
      };
    })
    .filter((test) => !requestedStatus || test.resultStatus === requestedStatus)
    .sort((left, right) => {
      if (left.hasEnded !== right.hasEnded) return left.hasEnded ? -1 : 1;
      return (toDateMs(right.examDate) || 0) - (toDateMs(left.examDate) || 0);
    });

  return {
    courses: courses.map((course) => ({ id: toId(course), name: course.name })),
    mockTests: mappedTests,
  };
};

const formatTimeTaken = (seconds) => {
  if (seconds === null || seconds === undefined || !Number.isFinite(Number(seconds))) {
    return "—";
  }
  const safe = Math.max(0, Math.floor(Number(seconds)));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remaining = safe % 60;
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(remaining).padStart(2, "0")}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${String(remaining).padStart(2, "0")}s`;
  }
  return `${remaining}s`;
};

const sanitizeSpreadsheetText = (value) => {
  const text = String(value ?? "");
  return /^[\u0000-\u0020]*[=+\-@]/.test(text) ? `'${text}` : text;
};

const sanitizeFilenamePart = (value) =>
  String(value || "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 70) || "Mock_Test";

const formatNepalDate = (value) => {
  if (!value) return "Not set";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: NEPAL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date(value))
    .reduce((lookup, part) => ({ ...lookup, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}`;
};

const buildMockTestResultWorkbook = (snapshot) => {
  const examTime = snapshot.examStartTime
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: NEPAL_TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(snapshot.examStartTime))
    : "Not set";
  const rows = [
    ["Sajha Entrance"],
    ["Mock Test Result"],
    [],
    ["Mock Test Title", sanitizeSpreadsheetText(snapshot.mockTestTitle)],
    ["Course", sanitizeSpreadsheetText(snapshot.courseName || "Not set")],
    ["Exam Date", formatNepalDate(snapshot.examStartTime)],
    ["Exam Time / Shift", examTime],
    ["Full Marks", Number(snapshot.fullMarks || 0)],
    ["Total Participants", Number(snapshot.totalParticipants || 0)],
    ["Rank", "Student Name", "Marks", "Time Taken"],
    ...snapshot.results.map((result) => [
      Number(result.rank),
      sanitizeSpreadsheetText(result.studentName),
      Number(result.marks),
      formatTimeTaken(result.timeTakenSeconds),
    ]),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet["!merges"] = [
    XLSX.utils.decode_range("A1:D1"),
    XLSX.utils.decode_range("A2:D2"),
    ...Array.from({ length: 6 }, (_, index) =>
      XLSX.utils.decode_range(`B${index + 4}:D${index + 4}`)
    ),
  ];
  worksheet["!cols"] = [{ wch: 12 }, { wch: 34 }, { wch: 16 }, { wch: 20 }];
  worksheet["!freeze"] = { xSplit: 0, ySplit: 10, topLeftCell: "A11", state: "frozen" };
  worksheet.A1.s = { font: { bold: true, sz: 18 }, alignment: { horizontal: "center" } };
  worksheet.A2.s = { font: { bold: true, sz: 14 }, alignment: { horizontal: "center" } };
  for (let column = 0; column < 4; column += 1) {
    const headerCell = worksheet[XLSX.utils.encode_cell({ r: 9, c: column })];
    headerCell.s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "FF7422" } },
      alignment: { horizontal: column === 1 ? "left" : "center" },
      border: {
        top: { style: "thin", color: { rgb: "D1D5DB" } },
        bottom: { style: "thin", color: { rgb: "D1D5DB" } },
        left: { style: "thin", color: { rgb: "D1D5DB" } },
        right: { style: "thin", color: { rgb: "D1D5DB" } },
      },
    };
  }
  snapshot.results.forEach((_result, rowIndex) => {
    const marksCell = worksheet[XLSX.utils.encode_cell({ r: rowIndex + 10, c: 2 })];
    marksCell.z = "0.########";
  });

  const workbook = XLSX.utils.book_new();
  workbook.Props = { Title: "Mock Test Result", Author: "Sajha Entrance" };
  XLSX.utils.book_append_sheet(workbook, worksheet, "Mock Test Result");
  return workbook;
};

const buildInternalLeadRows = (snapshot, studentProfiles = []) => {
  const profilesById = new Map(
    studentProfiles.map((profile) => [toId(profile), profile])
  );
  let missingProfileFieldRecordCount = 0;
  let missingContactNumberCount = 0;
  let missingLocationCount = 0;

  const rows = snapshot.results.map((result) => {
    const profile = profilesById.get(toId(result.studentId));
    const contactNumber = String(profile?.phone ?? "").trim();
    const location = String(profile?.address ?? "").trim();
    const contactMissing = !contactNumber;
    const locationMissing = !location;

    if (contactMissing) missingContactNumberCount += 1;
    if (locationMissing) missingLocationCount += 1;
    if (contactMissing || locationMissing) missingProfileFieldRecordCount += 1;

    return [
      Number(result.rank),
      sanitizeSpreadsheetText(result.studentName),
      contactMissing ? "\u2014" : sanitizeSpreadsheetText(contactNumber),
      locationMissing ? "\u2014" : sanitizeSpreadsheetText(location),
      Number(result.marks),
      formatTimeTaken(result.timeTakenSeconds),
    ];
  });

  return {
    rows,
    metadata: {
      exportType: "internal_leads",
      missingProfileFieldRecordCount,
      missingContactNumberCount,
      missingLocationCount,
      matchedStudentProfileCount: studentProfiles.length,
    },
  };
};

const buildInternalLeadsWorkbook = (snapshot, studentProfiles = []) => {
  const examTime = snapshot.examStartTime
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: NEPAL_TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(snapshot.examStartTime))
    : "Not set";
  const { rows: resultRows, metadata } = buildInternalLeadRows(
    snapshot,
    studentProfiles
  );
  const rows = [
    ["Sajha Entrance"],
    ["Mock Test Internal Leads (INTERNAL)"],
    [],
    ["Mock Test Title", sanitizeSpreadsheetText(snapshot.mockTestTitle)],
    ["Course", sanitizeSpreadsheetText(snapshot.courseName || "Not set")],
    ["Exam Date", formatNepalDate(snapshot.examStartTime)],
    ["Exam Time / Shift", examTime],
    ["Full Marks", Number(snapshot.fullMarks || 0)],
    ["Total Participants", Number(snapshot.totalParticipants || 0)],
    ["Rank", "Student Name", "Contact Number", "Location", "Marks", "Time Taken"],
    ...resultRows,
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet["!merges"] = [
    XLSX.utils.decode_range("A1:F1"),
    XLSX.utils.decode_range("A2:F2"),
    ...Array.from({ length: 6 }, (_, index) =>
      XLSX.utils.decode_range(`B${index + 4}:F${index + 4}`)
    ),
  ];
  worksheet["!cols"] = [
    { wch: 10 },
    { wch: 32 },
    { wch: 24 },
    { wch: 32 },
    { wch: 14 },
    { wch: 20 },
  ];
  worksheet["!freeze"] = { xSplit: 0, ySplit: 10, topLeftCell: "A11", state: "frozen" };
  worksheet.A1.s = { font: { bold: true, sz: 18 }, alignment: { horizontal: "center" } };
  worksheet.A2.s = {
    font: { bold: true, sz: 14, color: { rgb: "B91C1C" } },
    alignment: { horizontal: "center" },
  };
  for (let column = 0; column < 6; column += 1) {
    const headerCell = worksheet[XLSX.utils.encode_cell({ r: 9, c: column })];
    headerCell.s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "B91C1C" } },
      alignment: { horizontal: [1, 2, 3].includes(column) ? "left" : "center" },
      border: {
        top: { style: "thin", color: { rgb: "D1D5DB" } },
        bottom: { style: "thin", color: { rgb: "D1D5DB" } },
        left: { style: "thin", color: { rgb: "D1D5DB" } },
        right: { style: "thin", color: { rgb: "D1D5DB" } },
      },
    };
  }
  resultRows.forEach((_result, rowIndex) => {
    const contactCell = worksheet[XLSX.utils.encode_cell({ r: rowIndex + 10, c: 2 })];
    contactCell.t = "s";
    contactCell.z = "@";
    const locationCell = worksheet[XLSX.utils.encode_cell({ r: rowIndex + 10, c: 3 })];
    locationCell.t = "s";
    locationCell.z = "@";
    const marksCell = worksheet[XLSX.utils.encode_cell({ r: rowIndex + 10, c: 4 })];
    marksCell.z = "0.########";
  });

  const workbook = XLSX.utils.book_new();
  workbook.Props = { Title: "INTERNAL Mock Test Leads", Author: "Sajha Entrance" };
  XLSX.utils.book_append_sheet(workbook, worksheet, "INTERNAL Leads");
  return { workbook, metadata };
};

const exportLockedResult = async (mockTestId) => {
  await getMockTestOrThrow(mockTestId);
  const snapshot = await MockTestResultModel.findOne({
    mockTest: mockTestId,
    status: "locked",
  })
    .lean()
    .exec();
  if (!snapshot) {
    throw new MockTestResultError(
      "Finalize and lock the result before exporting Excel.",
      409,
      "LOCKED_RESULT_REQUIRED"
    );
  }
  const workbook = buildMockTestResultWorkbook(snapshot);
  const buffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "buffer",
    cellStyles: true,
  });
  const date = formatNepalDate(snapshot.examStartTime).replace(/\//g, "-");
  const filename = `${sanitizeFilenamePart(snapshot.courseName)}_${sanitizeFilenamePart(
    snapshot.mockTestTitle
  )}_Result_${date}.xlsx`;
  return { buffer, filename };
};

const exportInternalLeads = async ({ mockTestId, adminId }) => {
  assertObjectId(adminId, "admin ID");
  await getMockTestOrThrow(mockTestId);
  const snapshot = await MockTestResultModel.findOne({
    mockTest: mockTestId,
    status: "locked",
  })
    .lean()
    .exec();
  if (!snapshot) {
    throw new MockTestResultError(
      "Finalize and lock the result before exporting internal leads.",
      409,
      "LOCKED_RESULT_REQUIRED"
    );
  }

  const studentIds = [
    ...new Set(
      snapshot.results
        .map((result) => toId(result.studentId))
        .filter((studentId) => mongoose.Types.ObjectId.isValid(studentId))
    ),
  ];
  const studentProfiles = studentIds.length
    ? await StudentModel.find({ _id: { $in: studentIds } })
        .select("_id phone address")
        .lean()
        .exec()
    : [];
  const { workbook, metadata } = buildInternalLeadsWorkbook(snapshot, studentProfiles);
  const buffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "buffer",
    cellStyles: true,
  });

  await MockTestResultAuditModel.create({
    mockTest: snapshot.mockTest,
    resultSnapshot: snapshot._id,
    action: "internal_exported",
    performedBy: adminId,
    participantCount: snapshot.totalParticipants,
    snapshotVersion: snapshot.version,
    metadata,
  });

  const date = formatNepalDate(snapshot.examStartTime).replace(/\//g, "-");
  const filename = `${sanitizeFilenamePart(snapshot.courseName)}_${sanitizeFilenamePart(
    snapshot.mockTestTitle
  )}_INTERNAL_Leads_${date}.xlsx`;
  return { buffer, filename };
};

export {
  MockTestResultError,
  buildInternalLeadRows,
  buildInternalLeadsWorkbook,
  buildMockTestResultWorkbook,
  compareRankingRows,
  exportLockedResult,
  exportInternalLeads,
  finalizeResult,
  formatTimeTaken,
  generateDraftResult,
  getMockTestResultDetail,
  listMockTestsForResults,
  rankEligibleMockTestAttempts,
  sanitizeSpreadsheetText,
  serializeSnapshot,
  unlockResult,
};
