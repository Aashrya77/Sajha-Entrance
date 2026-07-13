import MockTestModel, { MockTestAttemptModel } from "../models/MockTest.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("mock-test-attempts");

class MockTestAttemptError extends Error {
  constructor(message, statusCode = 400, code = "MOCK_TEST_ATTEMPT_ERROR") {
    super(message);
    this.name = "MockTestAttemptError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

const toDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date : null;
};

const getConfiguredDurationSeconds = (mockTest = {}) => {
  const durationMinutes = Number(mockTest?.duration);
  return Number.isFinite(durationMinutes) && durationMinutes > 0
    ? Math.floor(durationMinutes * 60)
    : 0;
};

const calculateAttemptDeadline = (startedAt, durationSeconds) => {
  const safeStartedAt = toDate(startedAt);
  const safeDuration = Math.max(0, Math.floor(Number(durationSeconds) || 0));
  if (!safeStartedAt || safeDuration <= 0) return null;
  return new Date(safeStartedAt.getTime() + safeDuration * 1000);
};

const resolveAttemptTiming = (attempt = {}, mockTest = {}) => {
  const startedAt = toDate(attempt.startedAt);
  const configuredDurationSeconds = getConfiguredDurationSeconds(mockTest);
  const storedDurationSeconds = Number(attempt.durationSeconds);
  const durationSeconds =
    Number.isFinite(storedDurationSeconds) && storedDurationSeconds > 0
      ? Math.floor(storedDurationSeconds)
      : configuredDurationSeconds;
  const storedDeadline = toDate(attempt.deadlineAt);
  const deadlineAt = storedDeadline || calculateAttemptDeadline(startedAt, durationSeconds);

  return { startedAt, deadlineAt, durationSeconds };
};

const isAttemptExpired = (attempt, mockTest, now = new Date()) => {
  const { deadlineAt } = resolveAttemptTiming(attempt, mockTest);
  const serverNow = toDate(now);
  return Boolean(deadlineAt && serverNow && serverNow.getTime() >= deadlineAt.getTime());
};

const calculateTimeTakenSeconds = ({
  startedAt,
  submittedAt,
  durationSeconds,
  submissionType = "manual",
}) => {
  const cap = Math.max(0, Math.floor(Number(durationSeconds) || 0));
  if (submissionType === "auto") return cap;
  const start = toDate(startedAt);
  const submitted = toDate(submittedAt);
  if (!start || !submitted) return 0;
  const elapsed = Math.max(0, Math.floor((submitted.getTime() - start.getTime()) / 1000));
  return cap > 0 ? Math.min(elapsed, cap) : elapsed;
};

const normalizeAnswerSelections = (answers, questionCount) => {
  const safeQuestionCount = Math.max(0, Math.floor(Number(questionCount) || 0));
  const byQuestion = new Map();
  (Array.isArray(answers) ? answers : []).forEach((answer) => {
    const questionIndex = Number(answer?.questionIndex);
    const selectedOption = Number(answer?.selectedOption);
    if (
      Number.isInteger(questionIndex) &&
      questionIndex >= 0 &&
      questionIndex < safeQuestionCount &&
      Number.isInteger(selectedOption) &&
      selectedOption >= -1 &&
      selectedOption <= 3
    ) {
      byQuestion.set(questionIndex, { questionIndex, selectedOption });
    }
  });
  return [...byQuestion.values()].sort((left, right) => left.questionIndex - right.questionIndex);
};

const gradeMockTestAnswers = (mockTest, submittedAnswers) => {
  let totalScore = 0;
  let totalCorrect = 0;
  let totalWrong = 0;
  let totalUnanswered = 0;
  const selections = normalizeAnswerSelections(
    submittedAnswers,
    mockTest?.questions?.length || 0
  );
  const selectionByQuestion = new Map(
    selections.map((answer) => [answer.questionIndex, answer.selectedOption])
  );
  const answers = (mockTest?.questions || []).map((question, questionIndex) => {
    const selectedOption = selectionByQuestion.get(questionIndex) ?? -1;
    if (selectedOption === -1) {
      totalUnanswered += 1;
      return {
        questionIndex,
        questionId: question?.sourceQuestionId || null,
        selectedOption: -1,
        isCorrect: false,
        marksObtained: 0,
      };
    }
    const isCorrect = selectedOption === Number(question.correctOption);
    if (isCorrect) {
      totalCorrect += 1;
      totalScore += Number(question.marks || 0) || 0;
    } else {
      totalWrong += 1;
      totalScore -= Number(question.negativeMarks || 0) || 0;
    }
    return {
      questionIndex,
      questionId: question?.sourceQuestionId || null,
      selectedOption,
      isCorrect,
      marksObtained: isCorrect
        ? Number(question.marks || 0) || 0
        : -(Number(question.negativeMarks || 0) || 0),
    };
  });
  const totalScoreSafe = Math.max(0, totalScore);
  const percentage =
    Number(mockTest?.totalMarks) > 0
      ? Math.round((totalScoreSafe / Number(mockTest.totalMarks)) * 10000) / 100
      : 0;
  return {
    answers,
    totalScore: totalScoreSafe,
    totalCorrect,
    totalWrong,
    totalUnanswered,
    percentage,
  };
};

const ensureAttemptTiming = async (attempt, mockTest) => {
  const timing = resolveAttemptTiming(attempt, mockTest);
  if (!timing.startedAt || !timing.deadlineAt || timing.durationSeconds <= 0) {
    throw new MockTestAttemptError(
      "This attempt has invalid server timing data.",
      409,
      "INVALID_ATTEMPT_TIMING"
    );
  }
  const needsUpdate =
    !toDate(attempt.deadlineAt) || Number(attempt.durationSeconds) !== timing.durationSeconds;
  if (needsUpdate) {
    attempt.deadlineAt = timing.deadlineAt;
    attempt.durationSeconds = timing.durationSeconds;
    if (typeof attempt.save === "function") await attempt.save();
  }
  return timing;
};

const finalizeStartedAttempt = async ({
  attempt,
  mockTest,
  answers,
  submissionType,
  now = new Date(),
}) => {
  const timing = await ensureAttemptTiming(attempt, mockTest);
  const serverNow = toDate(now) || new Date();
  const isAuto = submissionType === "auto";
  if (!isAuto && serverNow.getTime() >= timing.deadlineAt.getTime()) {
    throw new MockTestAttemptError(
      "The individual attempt deadline has passed.",
      409,
      "ATTEMPT_DEADLINE_PASSED"
    );
  }
  const submittedAt = isAuto ? timing.deadlineAt : serverNow;
  const grading = gradeMockTestAnswers(mockTest, answers);
  const timeTakenSeconds = calculateTimeTakenSeconds({
    startedAt: timing.startedAt,
    submittedAt,
    durationSeconds: timing.durationSeconds,
    submissionType: isAuto ? "auto" : "manual",
  });
  const filter = { _id: attempt._id, status: "started" };
  if (isAuto) filter.deadlineAt = { $lte: serverNow };
  else filter.deadlineAt = { $gt: serverNow };
  const finalized = await MockTestAttemptModel.findOneAndUpdate(
    filter,
    {
      $set: {
        ...grading,
        status: "completed",
        startedAt: timing.startedAt,
        deadlineAt: timing.deadlineAt,
        durationSeconds: timing.durationSeconds,
        submittedAt,
        completedAt: submittedAt,
        scoreCalculatedAt: serverNow,
        timeTakenSeconds,
        timeTaken: timeTakenSeconds,
        submissionType: isAuto ? "auto" : "manual",
      },
    },
    { new: true }
  ).exec();
  if (finalized) return finalized;
  return MockTestAttemptModel.findById(attempt._id).exec();
};

const finalizeExpiredAttempt = async ({ attempt, mockTest, now = new Date() }) => {
  const timing = await ensureAttemptTiming(attempt, mockTest);
  const serverNow = toDate(now) || new Date();
  if (serverNow.getTime() < timing.deadlineAt.getTime()) return attempt;
  return finalizeStartedAttempt({
    attempt,
    mockTest,
    answers: attempt.answers || [],
    submissionType: "auto",
    now: serverNow,
  });
};

const finalizeExpiredMockTestAttempts = async ({
  mockTestId = null,
  studentId = null,
  now = new Date(),
  limit = 500,
} = {}) => {
  const filter = {
    status: "started",
    ...(mockTestId ? { mockTest: mockTestId } : {}),
    ...(studentId ? { student: studentId } : {}),
    $or: [{ deadlineAt: { $lte: now } }, { deadlineAt: null }],
  };
  let query = MockTestAttemptModel.find(filter).populate("mockTest");
  if (limit > 0) query = query.limit(limit);
  const attempts = await query.exec();
  let finalizedCount = 0;
  let normalizedCount = 0;
  for (const attempt of attempts) {
    let mockTest = attempt.mockTest;
    if (!mockTest || typeof mockTest !== "object" || !mockTest.questions) {
      mockTest = await MockTestModel.findById(attempt.mockTest).exec();
    }
    if (!mockTest) continue;
    const hadDeadline = Boolean(toDate(attempt.deadlineAt));
    const timing = await ensureAttemptTiming(attempt, mockTest);
    if (!hadDeadline) normalizedCount += 1;
    if (new Date(now).getTime() >= timing.deadlineAt.getTime()) {
      const finalized = await finalizeExpiredAttempt({ attempt, mockTest, now });
      if (finalized?.status === "completed") finalizedCount += 1;
    }
  }
  return { scannedCount: attempts.length, finalizedCount, normalizedCount };
};

let expiryWorkerTimer = null;
const runMockTestAttemptExpiryWorker = async () => {
  try {
    return await finalizeExpiredMockTestAttempts();
  } catch (error) {
    logger.error("Mock-test attempt expiry worker failed:", error.message);
    return { scannedCount: 0, finalizedCount: 0, normalizedCount: 0, error };
  }
};

const startMockTestAttemptExpiryWorker = ({ intervalMs = 30000 } = {}) => {
  if (expiryWorkerTimer) return expiryWorkerTimer;
  void runMockTestAttemptExpiryWorker();
  expiryWorkerTimer = setInterval(() => void runMockTestAttemptExpiryWorker(), intervalMs);
  expiryWorkerTimer.unref?.();
  return expiryWorkerTimer;
};

export {
  MockTestAttemptError,
  calculateAttemptDeadline,
  calculateTimeTakenSeconds,
  ensureAttemptTiming,
  finalizeExpiredAttempt,
  finalizeExpiredMockTestAttempts,
  finalizeStartedAttempt,
  getConfiguredDurationSeconds,
  gradeMockTestAnswers,
  isAttemptExpired,
  normalizeAnswerSelections,
  resolveAttemptTiming,
  runMockTestAttemptExpiryWorker,
  startMockTestAttemptExpiryWorker,
};
