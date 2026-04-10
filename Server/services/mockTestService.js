import mongoose from "mongoose";
import MockQuestionModel, {
  MOCK_QUESTION_DIFFICULTIES,
  MOCK_QUESTION_STATUSES,
  hasRenderableContent,
  hasRenderableText,
} from "../models/MockQuestion.js";
import MockTestCourseModel from "../models/MockTestCourse.js";
import MockTestSubjectModel from "../models/MockTestSubject.js";
import { slugifyText } from "../utils/slug.js";

const MOCK_TEST_STATUSES = ["draft", "scheduled", "live", "completed", "archived"];
const STUDENT_VISIBLE_STATUSES = new Set(["scheduled", "live"]);

const toPlainText = (value = "") =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const ensureStringArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null || value === "") {
    return [];
  }

  return [value];
};

const toObjectIdString = (value = "") => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value.toString();
  }

  if (value?._id) {
    return toObjectIdString(value._id);
  }

  return String(value);
};

const toObjectIdArray = (value) =>
  ensureStringArray(value)
    .map((entry) => toObjectIdString(entry))
    .filter((entry) => mongoose.Types.ObjectId.isValid(entry))
    .map((entry) => new mongoose.Types.ObjectId(entry));

const normalizeQuestionOption = (option = {}) => ({
  text: typeof option?.text === "string" ? option.text : "",
  image: typeof option?.image === "string" ? option.image : "",
});

const normalizeQuestionPayload = (payload = {}) => {
  const options = Array.from({ length: 4 }, (_, index) =>
    normalizeQuestionOption(payload?.options?.[index])
  );

  const parsedMarks = Number(payload?.marks);
  const correctOption = Number(payload?.correctOption);
  const difficulty = String(payload?.difficulty || "").trim().toLowerCase();
  const status = String(payload?.status || "draft").trim().toLowerCase();
  const displayOrder = Number(payload?.displayOrder);

  return {
    questionText: typeof payload?.questionText === "string" ? payload.questionText : "",
    questionImage:
      typeof payload?.questionImage === "string" ? payload.questionImage : "",
    options,
    correctOption: Number.isFinite(correctOption) ? correctOption : -1,
    marks: Number.isFinite(parsedMarks) ? parsedMarks : 1,
    explanation: typeof payload?.explanation === "string" ? payload.explanation : "",
    difficulty: MOCK_QUESTION_DIFFICULTIES.includes(difficulty) ? difficulty : "",
    status: MOCK_QUESTION_STATUSES.includes(status) ? status : "draft",
    displayOrder: Number.isFinite(displayOrder) ? displayOrder : 0,
  };
};

const validateQuestionPayload = (payload = {}) => {
  const normalizedPayload = normalizeQuestionPayload(payload);
  const errors = {};

  if (!hasRenderableContent(normalizedPayload.questionText, normalizedPayload.questionImage)) {
    errors.questionText = "A question must include text or an image.";
  }

  normalizedPayload.options.forEach((option, index) => {
    if (!hasRenderableContent(option.text, option.image)) {
      errors[`options.${index}`] = `Option ${String.fromCharCode(65 + index)} must include text or an image.`;
    }
  });

  if (normalizedPayload.correctOption < 0 || normalizedPayload.correctOption > 3) {
    errors.correctOption = "Select the correct option before saving.";
  }

  if (!Number.isFinite(normalizedPayload.marks) || normalizedPayload.marks <= 0) {
    errors.marks = "Marks must be greater than zero.";
  }

  return {
    normalizedPayload,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};

const buildQuestionSnapshot = (question) => ({
  sourceQuestionId: question?._id || question?.sourceQuestionId || null,
  subject: question?.subject || null,
  subjectName: question?.subjectName || "",
  course: question?.course || null,
  questionText: question?.questionText || "",
  questionImage: question?.questionImage || "",
  options: Array.from({ length: 4 }, (_, index) =>
    normalizeQuestionOption(question?.options?.[index])
  ),
  correctOption: Number(question?.correctOption ?? 0),
  explanation: question?.explanation || "",
  marks: Number(question?.marks || 0) || 0,
  negativeMarks: Number(question?.negativeMarks || 0) || 0,
  difficulty: question?.difficulty || "",
  displayOrder: Number(question?.displayOrder || 0) || 0,
});

const calculateQuestionTotals = (questions = []) => {
  const normalizedQuestions = Array.isArray(questions) ? questions : [];
  const totalMarks = normalizedQuestions.reduce(
    (sum, question) => sum + (Number(question?.marks) || 0),
    0
  );

  return {
    totalMarks,
    questionCount: normalizedQuestions.length,
  };
};

const normalizeMockTestPayload = (payload = {}) => {
  const status = String(payload?.status || "draft").trim().toLowerCase();
  const duration = Number(payload?.duration);
  const passMarks = Number(payload?.passMarks);
  const startAt = payload?.startAt ? new Date(payload.startAt) : null;
  const endAt = payload?.endAt ? new Date(payload.endAt) : null;
  const examDate = payload?.examDate ? new Date(payload.examDate) : startAt;

  return {
    title: String(payload?.title || "").trim(),
    slug: slugifyText(payload?.slug || payload?.title || ""),
    description: typeof payload?.description === "string" ? payload.description : "",
    instructions: typeof payload?.instructions === "string" ? payload.instructions : "",
    status: MOCK_TEST_STATUSES.includes(status) ? status : "draft",
    courseRef: toObjectIdString(payload?.courseRef),
    subjectRefs: ensureStringArray(payload?.subjectRefs).map(toObjectIdString).filter(Boolean),
    questionRefs: ensureStringArray(payload?.questionRefs).map(toObjectIdString).filter(Boolean),
    duration: Number.isFinite(duration) ? duration : 0,
    passMarks: Number.isFinite(passMarks) ? passMarks : 0,
    startAt: startAt && !Number.isNaN(startAt.getTime()) ? startAt : null,
    endAt: endAt && !Number.isNaN(endAt.getTime()) ? endAt : null,
    examDate: examDate && !Number.isNaN(examDate.getTime()) ? examDate : null,
    manualStatusOverride: Boolean(payload?.manualStatusOverride),
  };
};

const validateMockTestPayload = ({ payload = {}, selectedQuestions = [] }) => {
  const normalizedPayload = normalizeMockTestPayload(payload);
  const errors = {};

  if (!normalizedPayload.title) {
    errors.title = "Mock test title is required.";
  }

  if (!normalizedPayload.courseRef || !mongoose.Types.ObjectId.isValid(normalizedPayload.courseRef)) {
    errors.courseRef = "Select a course for this mock test.";
  }

  if (!normalizedPayload.subjectRefs.length) {
    errors.subjectRefs = "Select at least one subject.";
  }

  if (!normalizedPayload.questionRefs.length) {
    errors.questionRefs = "Select at least one question.";
  }

  if (!selectedQuestions.length) {
    errors.questionRefs = "At least one published question must be selected.";
  }

  if (!Number.isFinite(normalizedPayload.duration) || normalizedPayload.duration <= 0) {
    errors.duration = "Duration must be greater than zero.";
  }

  if (
    normalizedPayload.passMarks < 0 ||
    normalizedPayload.passMarks > calculateQuestionTotals(selectedQuestions).totalMarks
  ) {
    errors.passMarks = "Pass marks must be between zero and the selected total marks.";
  }

  if (
    ["scheduled", "live", "completed"].includes(normalizedPayload.status) &&
    !normalizedPayload.startAt
  ) {
    errors.startAt = "Start date and time is required for scheduled or live tests.";
  }

  if (
    ["scheduled", "live", "completed"].includes(normalizedPayload.status) &&
    !normalizedPayload.endAt
  ) {
    errors.endAt = "End date and time is required for scheduled or live tests.";
  }

  if (
    normalizedPayload.startAt &&
    normalizedPayload.endAt &&
    normalizedPayload.endAt <= normalizedPayload.startAt
  ) {
    errors.endAt = "End time must be later than start time.";
  }

  if (normalizedPayload.startAt && normalizedPayload.endAt) {
    const durationFromSchedule = Math.round(
      (normalizedPayload.endAt.getTime() - normalizedPayload.startAt.getTime()) / 60000
    );

    if (normalizedPayload.duration > durationFromSchedule) {
      errors.duration =
        "Duration cannot be longer than the scheduled start/end window.";
    }
  }

  return {
    normalizedPayload,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};

const resolveMockTestLifecycle = (mockTest, now = new Date()) => {
  const explicitStatus = String(mockTest?.status || "").trim().toLowerCase();
  const fallbackStatus = explicitStatus || (mockTest?.isActive ? "live" : "draft");
  const startAt = mockTest?.startAt ? new Date(mockTest.startAt) : null;
  const endAt = mockTest?.endAt ? new Date(mockTest.endAt) : null;
  const manualStatusOverride = Boolean(mockTest?.manualStatusOverride);
  const safeStatus = MOCK_TEST_STATUSES.includes(fallbackStatus) ? fallbackStatus : "draft";
  let derivedStatus = safeStatus;
  let studentState = safeStatus;
  let isAccessible = false;

  if (safeStatus === "archived") {
    studentState = "archived";
  } else if (safeStatus === "completed") {
    studentState = "completed";
  } else if (safeStatus === "draft") {
    studentState = "draft";
  } else if (safeStatus === "live") {
    if (endAt && now > endAt) {
      derivedStatus = "completed";
      studentState = "completed";
    } else if (startAt && now < startAt && !manualStatusOverride) {
      studentState = "upcoming";
    } else {
      studentState = "live";
      isAccessible = true;
    }
  } else if (safeStatus === "scheduled") {
    if (startAt && now < startAt) {
      studentState = "upcoming";
    } else if (endAt && now > endAt) {
      derivedStatus = "completed";
      studentState = "completed";
    } else {
      derivedStatus = "live";
      studentState = "live";
      isAccessible = true;
    }
  }

  const isStudentVisible =
    Boolean(mockTest?.questions?.length) &&
    STUDENT_VISIBLE_STATUSES.has(safeStatus) &&
    studentState !== "archived" &&
    studentState !== "draft";

  return {
    rawStatus: safeStatus,
    derivedStatus,
    studentState,
    isAccessible,
    isStudentVisible,
    isUpcoming: studentState === "upcoming",
    hasEnded: studentState === "completed",
    startAt,
    endAt,
    msUntilStart: startAt ? startAt.getTime() - now.getTime() : null,
    msUntilEnd: endAt ? endAt.getTime() - now.getTime() : null,
  };
};

const resolveSerializedQuestionSubject = (question, subjectLookup = {}) => {
  const subjectId = toObjectIdString(question?.subject);
  const subjectName =
    subjectLookup[subjectId] ||
    String(question?.subjectName || question?.subjectLabel || "").trim();

  return {
    subjectId,
    subject: subjectName || "General",
  };
};

const serializeQuestionForStudent = (question, index, subjectLookup = {}) => ({
  index,
  ...resolveSerializedQuestionSubject(question, subjectLookup),
  questionText: question?.questionText || "",
  questionImage: question?.questionImage || "",
  options: Array.from({ length: 4 }, (_, optionIndex) => ({
    text: question?.options?.[optionIndex]?.text || "",
    image: question?.options?.[optionIndex]?.image || "",
  })),
  marks: Number(question?.marks || 0) || 0,
});

const serializeQuestionForReview = (
  question,
  gradedAnswer,
  index,
  subjectLookup = {}
) => ({
  index,
  ...resolveSerializedQuestionSubject(question, subjectLookup),
  questionText: question?.questionText || "",
  questionImage: question?.questionImage || "",
  options: Array.from({ length: 4 }, (_, optionIndex) => ({
    text: question?.options?.[optionIndex]?.text || "",
    image: question?.options?.[optionIndex]?.image || "",
  })),
  correctOption: Number(question?.correctOption ?? 0),
  explanation: question?.explanation || "",
  marks: Number(question?.marks || 0) || 0,
  difficulty: question?.difficulty || "",
  selectedOption: Number(gradedAnswer?.selectedOption ?? -1),
  isCorrect: Boolean(gradedAnswer?.isCorrect),
  marksObtained: Number(gradedAnswer?.marksObtained || 0) || 0,
});

const buildStudentMockTestSummary = (mockTest, lifecycle = resolveMockTestLifecycle(mockTest)) => ({
  _id: mockTest?._id,
  title: mockTest?.title || "",
  slug: mockTest?.slug || "",
  description: mockTest?.description || "",
  instructions: mockTest?.instructions || "",
  admissionTest: mockTest?.admissionTest || "",
  course: mockTest?.courseName || mockTest?.course || "",
  courseName: mockTest?.courseName || mockTest?.course || "",
  subjectNames: Array.isArray(mockTest?.subjectNames) ? mockTest.subjectNames : [],
  totalMarks: Number(mockTest?.totalMarks || 0) || 0,
  passMarks: Number(mockTest?.passMarks || 0) || 0,
  duration: Number(mockTest?.duration || 0) || 0,
  totalQuestions:
    Number(mockTest?.questionCount || 0) || (Array.isArray(mockTest?.questions) ? mockTest.questions.length : 0),
  status: lifecycle.rawStatus,
  availabilityStatus: lifecycle.studentState,
  canStart: lifecycle.isAccessible,
  isLive: lifecycle.studentState === "live",
  startAt: lifecycle.startAt,
  endAt: lifecycle.endAt,
  publishedAt: mockTest?.publishedAt || null,
  examDate: mockTest?.examDate || lifecycle.startAt || null,
  msUntilStart: lifecycle.msUntilStart,
  msUntilEnd: lifecycle.msUntilEnd,
});

const syncSubjectQuestionStats = async (subjectId) => {
  const normalizedSubjectId = toObjectIdString(subjectId);
  if (!mongoose.Types.ObjectId.isValid(normalizedSubjectId)) {
    return null;
  }

  const subjectObjectId = new mongoose.Types.ObjectId(normalizedSubjectId);
  const [summary] = await MockQuestionModel.aggregate([
    {
      $match: {
        subject: subjectObjectId,
      },
    },
    {
      $group: {
        _id: "$subject",
        totalQuestionCount: { $sum: 1 },
        questionDraftCount: {
          $sum: {
            $cond: [{ $eq: ["$status", "draft"] }, 1, 0],
          },
        },
        questionPublishedCount: {
          $sum: {
            $cond: [{ $eq: ["$status", "published"] }, 1, 0],
          },
        },
      },
    },
  ]);

  const update = summary || {
    totalQuestionCount: 0,
    questionDraftCount: 0,
    questionPublishedCount: 0,
  };

  await MockTestSubjectModel.findByIdAndUpdate(subjectObjectId, update, { new: true });

  return update;
};

const buildQuestionWorkspacePayload = async (subjectId) => {
  const subject = await MockTestSubjectModel.findById(subjectId)
    .populate("course", "name slug status")
    .lean();

  if (!subject) {
    return null;
  }

  const questions = await MockQuestionModel.find({ subject: subjectId })
    .sort({ displayOrder: 1, createdAt: 1 })
    .lean();

  return {
    subject,
    questions: questions.map((question) => ({
      ...question,
      questionSummary: toPlainText(question.questionText).slice(0, 160),
      optionSummaries: Array.from({ length: 4 }, (_, index) =>
        toPlainText(question?.options?.[index]?.text || "").slice(0, 80)
      ),
    })),
  };
};

const buildSchedulerWorkspacePayload = async () => {
  const [courses, subjects, tests] = await Promise.all([
    MockTestCourseModel.find().sort({ name: 1 }).lean(),
    MockTestSubjectModel.find()
      .populate("course", "name")
      .sort({ displayOrder: 1, name: 1 })
      .lean(),
    mongoose.model("MockTest").find().sort({ createdAt: -1 }).lean(),
  ]);

  return {
    courses,
    subjects,
    tests: tests.map((test) => ({
      ...buildStudentMockTestSummary(test, resolveMockTestLifecycle(test)),
      status: test.status || "draft",
      rawStatus: test.status || "draft",
      questionRefs: ensureStringArray(test.questionRefs).map(toObjectIdString),
      subjectRefs: ensureStringArray(test.subjectRefs).map(toObjectIdString),
      courseRef: toObjectIdString(test.courseRef),
      manualStatusOverride: Boolean(test.manualStatusOverride),
    })),
  };
};

export {
  MOCK_TEST_STATUSES,
  MOCK_QUESTION_DIFFICULTIES,
  MOCK_QUESTION_STATUSES,
  buildQuestionSnapshot,
  buildQuestionWorkspacePayload,
  buildSchedulerWorkspacePayload,
  buildStudentMockTestSummary,
  calculateQuestionTotals,
  hasRenderableContent,
  hasRenderableText,
  normalizeMockTestPayload,
  normalizeQuestionPayload,
  resolveMockTestLifecycle,
  serializeQuestionForReview,
  serializeQuestionForStudent,
  slugifyText,
  syncSubjectQuestionStats,
  toObjectIdArray,
  toObjectIdString,
  validateMockTestPayload,
  validateQuestionPayload,
};
