import fs from "fs";
import path from "path";
import mongoose from "mongoose";

import MockTestCourseModel from "../models/MockTestCourse.js";
import MockTestSubjectModel from "../models/MockTestSubject.js";
import MockQuestionModel from "../models/MockQuestion.js";
import MockTestModel from "../models/MockTest.js";
import { mediaRootDirectory } from "../utils/media.js";
import {
  buildQuestionSnapshot,
  buildQuestionWorkspacePayload,
  buildSchedulerWorkspacePayload,
  calculateQuestionTotals,
  normalizeMockTestPayload,
  resolveMockTestLifecycle,
  slugifyText,
  syncSubjectQuestionStats,
  toObjectIdString,
  validateMockTestPayload,
  validateQuestionPayload,
} from "../services/mockTestService.js";

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_UPLOAD_IMAGE_COUNT = 5;
const QUESTION_IMAGE_FOLDER = path.join(mediaRootDirectory, "mocktest");
const QUESTION_IMAGE_PUBLIC_PREFIX = "/media/mocktest";

const ensureQuestionImageDirectory = async () => {
  await fs.promises.mkdir(QUESTION_IMAGE_FOLDER, { recursive: true });
};

const extractExtensionFromFile = (file = {}) => {
  const mimeTypeMap = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  const mimeType = String(file.mimetype || file.type || "").trim().toLowerCase();

  if (mimeTypeMap[mimeType]) {
    return mimeTypeMap[mimeType];
  }

  const parsedExtension = path
    .extname(file.originalname || file.originalFilename || file.name || "")
    .toLowerCase();
  return parsedExtension || ".img";
};

const buildImageFilename = (prefix, originalName = "", fallbackExtension = ".png") => {
  const base = slugifyText(path.parse(originalName).name || prefix || "question-image") || prefix;
  return `${Date.now()}-${base}${fallbackExtension}`;
};

const getUploadedFileBuffer = async (file = {}) => {
  if (file?.buffer) {
    return file.buffer;
  }

  const temporaryPath = file?.filepath || file?.path || file?.tempFilePath;
  if (!temporaryPath) {
    return null;
  }

  try {
    return await fs.promises.readFile(temporaryPath);
  } finally {
    await fs.promises.unlink(temporaryPath).catch(() => null);
  }
};

const saveUploadedImage = async (file, prefix = "question") => {
  const fileBuffer = await getUploadedFileBuffer(file);
  if (!fileBuffer) {
    return "";
  }

  await ensureQuestionImageDirectory();

  const extension = extractExtensionFromFile(file);
  const filename = buildImageFilename(
    prefix,
    file.originalname || file.originalFilename || file.name || "",
    extension
  );
  const targetPath = path.join(QUESTION_IMAGE_FOLDER, filename);

  await fs.promises.writeFile(targetPath, fileBuffer);
  return `${QUESTION_IMAGE_PUBLIC_PREFIX}/${filename}`;
};

const deleteStoredImage = async (publicPath = "") => {
  if (!publicPath || typeof publicPath !== "string") {
    return;
  }

  if (!publicPath.startsWith(QUESTION_IMAGE_PUBLIC_PREFIX)) {
    return;
  }

  const filename = path.basename(publicPath);
  const targetPath = path.join(QUESTION_IMAGE_FOLDER, filename);

  if (fs.existsSync(targetPath)) {
    await fs.promises.unlink(targetPath);
  }
};

const parseBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["true", "1", "yes", "on"].includes(value.trim().toLowerCase());
  }

  return Boolean(value);
};

const parseJsonPayload = (value, fallback = {}) => {
  if (!value) {
    return fallback;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const readFieldValue = (value) => (Array.isArray(value) ? value[0] : value);

const getRequestPayload = (req) => {
  const bodyPayload =
    req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? req.body
      : null;
  const fieldPayload =
    req.fields && typeof req.fields === "object" && !Array.isArray(req.fields)
      ? req.fields
      : null;

  return bodyPayload && Object.keys(bodyPayload).length > 0 ? bodyPayload : fieldPayload || {};
};

const mapUploadFiles = (files = {}) =>
  Object.entries(files || {}).reduce((accumulator, [fieldName, value]) => {
    accumulator[fieldName] = Array.isArray(value) ? value[0] || null : value || null;
    return accumulator;
  }, {});

const buildQuestionValidationPayload = ({
  payload = {},
  files = {},
  existingQuestion = null,
}) => {
  const removeQuestionImage = parseBoolean(payload?.removeQuestionImage);
  const removeOptionImages = Array.isArray(payload?.removeOptionImages)
    ? payload.removeOptionImages
    : [];

  return {
    ...payload,
    questionImage: files.questionImage
      ? "__uploaded__"
      : !removeQuestionImage && existingQuestion?.questionImage
        ? existingQuestion.questionImage
        : typeof payload?.questionImage === "string"
          ? payload.questionImage
          : "",
    options: Array.from({ length: 4 }, (_, index) => {
      const nextOption = payload?.options?.[index] || {};
      const removeOptionImage = parseBoolean(removeOptionImages[index]);
      const existingOptionImage = existingQuestion?.options?.[index]?.image || "";

      return {
        ...nextOption,
        image: files[`optionImage${index}`]
          ? "__uploaded__"
          : !removeOptionImage && existingOptionImage
            ? existingOptionImage
            : typeof nextOption?.image === "string"
              ? nextOption.image
              : "",
      };
    }),
  };
};

const validateUploadedFiles = async (files = {}) => {
  const uploadFiles = Object.values(mapUploadFiles(files)).filter(Boolean);

  if (uploadFiles.length > MAX_UPLOAD_IMAGE_COUNT) {
    throw new Error("Only five images can be uploaded at a time.");
  }

  for (const file of uploadFiles) {
    const mimeType = String(file?.mimetype || file?.type || "").trim().toLowerCase();
    const size = Number(file?.size || file?.length || 0);

    if (!IMAGE_MIME_TYPES.has(mimeType)) {
      throw new Error("Only JPG, PNG, WEBP, and GIF images are supported.");
    }

    if (!Number.isFinite(size) || size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error("Each image must be 5 MB or smaller.");
    }
  }
};

const HandleQuestionImageUpload = async (req, res, next) => {
  try {
    await validateUploadedFiles(req.files);
    return next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message || "Image upload failed.",
    });
  }
};

const getCurrentAdminId = (req) => req.session?.adminUser?.id || null;

const respondWithWorkspace = async (res, subjectId, message) => {
  const workspace = await buildQuestionWorkspacePayload(subjectId);

  return res.json({
    success: true,
    message,
    data: workspace,
  });
};

const respondWithSchedulerWorkspace = async (res, message, selectedTestId = "") => {
  const workspace = await buildSchedulerWorkspacePayload();
  const selectedTest =
    selectedTestId && workspace.tests.find((test) => `${test._id}` === `${selectedTestId}`);

  return res.json({
    success: true,
    message,
    data: {
      ...workspace,
      selectedTestId: selectedTest?._id || null,
    },
  });
};

const GetMockQuestionStudioWorkspace = async (req, res) => {
  try {
    const { subjectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(404).json({ success: false, error: "Invalid subject ID." });
    }

    const workspace = await buildQuestionWorkspacePayload(subjectId);
    if (!workspace) {
      return res.status(404).json({ success: false, error: "Subject not found." });
    }

    return res.json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const CreateMockQuestion = async (req, res) => {
  try {
    const { subjectId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(404).json({ success: false, error: "Invalid subject ID." });
    }

    const subject = await MockTestSubjectModel.findById(subjectId).lean();
    if (!subject) {
      return res.status(404).json({ success: false, error: "Subject not found." });
    }

    const requestPayload = getRequestPayload(req);
    const payload = parseJsonPayload(readFieldValue(requestPayload.payload));
    const files = mapUploadFiles(req.files);
    const validationPayload = buildQuestionValidationPayload({ payload, files });
    const { normalizedPayload, errors, isValid } = validateQuestionPayload(validationPayload);

    if (!isValid) {
      return res.status(422).json({
        success: false,
        error: "Question validation failed.",
        errors,
      });
    }

    const maxQuestion = await MockQuestionModel.findOne({ subject: subjectId })
      .sort({ displayOrder: -1 })
      .select("displayOrder")
      .lean();

    const questionData = {
      ...normalizedPayload,
      course: subject.course,
      subject: subject._id,
      createdBy: getCurrentAdminId(req),
      updatedBy: getCurrentAdminId(req),
      displayOrder:
        Number.isFinite(Number(payload?.displayOrder)) && Number(payload.displayOrder) >= 0
          ? Number(payload.displayOrder)
          : Number(maxQuestion?.displayOrder || 0) + 1,
    };

    if (files.questionImage) {
      questionData.questionImage = await saveUploadedImage(
        files.questionImage,
        `question-${subject.name}`
      );
    }

    for (let index = 0; index < 4; index += 1) {
      const optionFile = files[`optionImage${index}`];
      if (!optionFile) {
        continue;
      }

      questionData.options[index].image = await saveUploadedImage(
        optionFile,
        `option-${index + 1}-${subject.name}`
      );
    }

    await MockQuestionModel.create(questionData);
    await syncSubjectQuestionStats(subjectId);

    return await respondWithWorkspace(res, subjectId, "Question added successfully.");
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const UpdateMockQuestion = async (req, res) => {
  try {
    const { subjectId, questionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(subjectId) || !mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(404).json({ success: false, error: "Invalid question or subject ID." });
    }

    const question = await MockQuestionModel.findOne({
      _id: questionId,
      subject: subjectId,
    });

    if (!question) {
      return res.status(404).json({ success: false, error: "Question not found." });
    }

    const requestPayload = getRequestPayload(req);
    const payload = parseJsonPayload(readFieldValue(requestPayload.payload));
    const removeOptionImages = Array.isArray(payload?.removeOptionImages)
      ? payload.removeOptionImages
      : [];
    const files = mapUploadFiles(req.files);
    const validationPayload = buildQuestionValidationPayload({
      payload,
      files,
      existingQuestion: question,
    });
    const { normalizedPayload, errors, isValid } = validateQuestionPayload(validationPayload);

    if (!isValid) {
      return res.status(422).json({
        success: false,
        error: "Question validation failed.",
        errors,
      });
    }

    if (parseBoolean(payload?.removeQuestionImage) && question.questionImage) {
      await deleteStoredImage(question.questionImage);
      question.questionImage = "";
    }

    question.questionText = normalizedPayload.questionText;
    question.explanation = normalizedPayload.explanation;
    question.correctOption = normalizedPayload.correctOption;
    question.marks = normalizedPayload.marks;
    question.difficulty = normalizedPayload.difficulty;
    question.status = normalizedPayload.status;
    question.displayOrder = normalizedPayload.displayOrder;
    question.updatedBy = getCurrentAdminId(req);

    for (let index = 0; index < normalizedPayload.options.length; index += 1) {
      const option = normalizedPayload.options[index];
      question.options[index].text = option.text;
      if (parseBoolean(removeOptionImages[index]) && question.options[index].image) {
        await deleteStoredImage(question.options[index].image);
        question.options[index].image = "";
      }
    }

    if (files.questionImage) {
      await deleteStoredImage(question.questionImage);
      question.questionImage = await saveUploadedImage(
        files.questionImage,
        `question-${question._id}`
      );
    }

    for (let index = 0; index < 4; index += 1) {
      const optionFile = files[`optionImage${index}`];
      if (!optionFile) {
        continue;
      }

      await deleteStoredImage(question.options[index].image);
      question.options[index].image = await saveUploadedImage(
        optionFile,
        `option-${index + 1}-${question._id}`
      );
    }

    await question.save();
    await syncSubjectQuestionStats(subjectId);

    return await respondWithWorkspace(res, subjectId, "Question updated successfully.");
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const DeleteMockQuestion = async (req, res) => {
  try {
    const { subjectId, questionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(subjectId) || !mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(404).json({ success: false, error: "Invalid question or subject ID." });
    }

    const question = await MockQuestionModel.findOneAndDelete({
      _id: questionId,
      subject: subjectId,
    });

    if (!question) {
      return res.status(404).json({ success: false, error: "Question not found." });
    }

    await deleteStoredImage(question.questionImage);
    await Promise.all(
      (question.options || []).map((option) => deleteStoredImage(option?.image))
    );

    await syncSubjectQuestionStats(subjectId);
    return await respondWithWorkspace(res, subjectId, "Question deleted successfully.");
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const PublishSubjectQuestionSet = async (req, res) => {
  try {
    const { subjectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(404).json({ success: false, error: "Invalid subject ID." });
    }

    const payload = getRequestPayload(req);
    const selectedQuestionIds = Array.isArray(payload.questionIds)
      ? payload.questionIds.filter((questionId) => mongoose.Types.ObjectId.isValid(questionId))
      : [];

    const query = {
      subject: subjectId,
      status: "draft",
    };

    if (selectedQuestionIds.length) {
      query._id = {
        $in: selectedQuestionIds.map((questionId) => new mongoose.Types.ObjectId(questionId)),
      };
    }

    await MockQuestionModel.updateMany(query, {
      $set: {
        status: "published",
        updatedBy: getCurrentAdminId(req),
        updatedAt: new Date(),
      },
    });

    await syncSubjectQuestionStats(subjectId);
    await MockTestSubjectModel.findByIdAndUpdate(subjectId, {
      $set: {
        lastQuestionUploadAt: new Date(),
      },
    });

    return await respondWithWorkspace(
      res,
      subjectId,
      "Draft questions were uploaded and published successfully."
    );
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const ReorderSubjectQuestions = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const payload = getRequestPayload(req);
    const orderedQuestionIds = Array.isArray(payload?.orderedQuestionIds)
      ? payload.orderedQuestionIds
      : [];

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(404).json({ success: false, error: "Invalid subject ID." });
    }

    const questions = await MockQuestionModel.find({ subject: subjectId })
      .sort({ displayOrder: 1, createdAt: 1 })
      .select("_id")
      .lean();

    if (!questions.length) {
      return await respondWithWorkspace(res, subjectId, "Nothing to reorder.");
    }

    const orderedIds = orderedQuestionIds
      .map((questionId) => `${questionId}`)
      .filter((questionId) => questions.some((question) => `${question._id}` === questionId));

    const trailingIds = questions
      .map((question) => `${question._id}`)
      .filter((questionId) => !orderedIds.includes(questionId));

    const finalOrder = [...orderedIds, ...trailingIds];

    await Promise.all(
      finalOrder.map((questionId, index) =>
        MockQuestionModel.updateOne(
          { _id: questionId, subject: subjectId },
          {
            $set: {
              displayOrder: index + 1,
              updatedBy: getCurrentAdminId(req),
            },
          }
        )
      )
    );

    return await respondWithWorkspace(res, subjectId, "Question order updated.");
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const GetMockTestSchedulerWorkspace = async (_req, res) => {
  try {
    return await respondWithSchedulerWorkspace(res);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const GetMockTestDetail = async (req, res) => {
  try {
    const { testId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(404).json({ success: false, error: "Invalid mock test ID." });
    }

    const mockTest = await MockTestModel.findById(testId).lean();
    if (!mockTest) {
      return res.status(404).json({ success: false, error: "Mock test not found." });
    }

    return res.json({
      success: true,
      data: {
        ...mockTest,
        lifecycle: resolveMockTestLifecycle(mockTest),
        courseRef: toObjectIdString(mockTest.courseRef),
        subjectRefs: Array.isArray(mockTest.subjectRefs)
          ? mockTest.subjectRefs.map((entry) => toObjectIdString(entry))
          : [],
        questionRefs: Array.isArray(mockTest.questionRefs)
          ? mockTest.questionRefs.map((entry) => toObjectIdString(entry))
          : [],
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const GetPublishedQuestions = async (req, res) => {
  try {
    const courseRef = toObjectIdString(req.query?.courseRef);
    const subjectRefs = String(req.query?.subjectRefs || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const search = String(req.query?.search || "").trim();

    const query = {
      status: "published",
    };

    if (mongoose.Types.ObjectId.isValid(courseRef)) {
      query.course = new mongoose.Types.ObjectId(courseRef);
    }

    const validSubjectIds = subjectRefs.filter((subjectId) =>
      mongoose.Types.ObjectId.isValid(subjectId)
    );
    if (validSubjectIds.length) {
      query.subject = {
        $in: validSubjectIds.map((subjectId) => new mongoose.Types.ObjectId(subjectId)),
      };
    }

    if (search) {
      query.$or = [
        { questionText: { $regex: search, $options: "i" } },
        { explanation: { $regex: search, $options: "i" } },
      ];
    }

    const questions = await MockQuestionModel.find(query)
      .populate("subject", "name")
      .populate("course", "name")
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();

    return res.json({
      success: true,
      data: questions.map((question) => ({
        ...question,
        courseName: question?.course?.name || "",
        subjectName: question?.subject?.name || "",
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const resolveMockTestSelection = async (payload = {}) => {
  const normalizedPayload = normalizeMockTestPayload(payload);
  if (!mongoose.Types.ObjectId.isValid(normalizedPayload.courseRef)) {
    return {
      normalizedPayload,
      course: null,
      subjects: [],
      selectedQuestions: [],
    };
  }

  const course = await MockTestCourseModel.findById(normalizedPayload.courseRef).lean();

  if (!course) {
    return {
      normalizedPayload,
      course: null,
      subjects: [],
      selectedQuestions: [],
    };
  }

  const subjectIds = normalizedPayload.subjectRefs.filter((subjectId) =>
    mongoose.Types.ObjectId.isValid(subjectId)
  );
  const questionIds = normalizedPayload.questionRefs.filter((questionId) =>
    mongoose.Types.ObjectId.isValid(questionId)
  );

  const [subjects, selectedQuestions] = await Promise.all([
    MockTestSubjectModel.find({
      _id: { $in: subjectIds },
      course: course._id,
    })
      .sort({ displayOrder: 1, name: 1 })
      .lean(),
    MockQuestionModel.find({
      _id: { $in: questionIds },
      course: course._id,
      status: "published",
    })
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean(),
  ]);

  const subjectIdSet = new Set(subjects.map((subject) => `${subject._id}`));
  const questionMap = new Map(selectedQuestions.map((question) => [`${question._id}`, question]));
  const sortedSelectedQuestions = questionIds
    .map((questionId) => questionMap.get(`${questionId}`))
    .filter(
      (question) => question && subjectIdSet.has(`${question.subject}`)
    );

  return {
    normalizedPayload,
    course,
    subjects,
    selectedQuestions: sortedSelectedQuestions,
  };
};

const upsertMockTest = async (req, res, existingTest = null) => {
  const requestPayload = getRequestPayload(req);
  const { normalizedPayload, course, subjects, selectedQuestions } =
    await resolveMockTestSelection(requestPayload);

  const validation = validateMockTestPayload({
    payload: normalizedPayload,
    selectedQuestions,
  });

  if (!validation.isValid) {
    return res.status(422).json({
      success: false,
      error: "Mock test validation failed.",
      errors: validation.errors,
    });
  }

  const subjectNameById = subjects.reduce((lookup, subject) => {
    lookup[String(subject._id)] = subject.name;
    return lookup;
  }, {});

  const questionSnapshots = selectedQuestions.map((question, index) => ({
    ...buildQuestionSnapshot({
      ...question,
      subjectName: subjectNameById[String(question.subject)] || "",
    }),
    displayOrder: index + 1,
  }));
  const totals = calculateQuestionTotals(questionSnapshots);
  const payloadToSave = {
    title: normalizedPayload.title,
    slug: normalizedPayload.slug,
    description: normalizedPayload.description,
    instructions: normalizedPayload.instructions,
    courseRef: course._id,
    courseName: course.name,
    course: course.name,
    subjectRefs: subjects.map((subject) => subject._id),
    subjectNames: subjects.map((subject) => subject.name),
    questionRefs: selectedQuestions.map((question) => question._id),
    questions: questionSnapshots,
    totalMarks: totals.totalMarks,
    questionCount: totals.questionCount,
    passMarks: normalizedPayload.passMarks,
    duration: normalizedPayload.duration,
    examDate: normalizedPayload.examDate || normalizedPayload.startAt,
    startAt: normalizedPayload.startAt,
    endAt: normalizedPayload.endAt,
    status: normalizedPayload.status,
    manualStatusOverride:
      normalizedPayload.manualStatusOverride || normalizedPayload.status === "live",
    updatedBy: getCurrentAdminId(req),
  };

  if (normalizedPayload.status !== "draft") {
    payloadToSave.publishedAt = existingTest?.publishedAt || new Date();
  } else if (!existingTest) {
    payloadToSave.publishedAt = null;
  }

  let savedTestId = existingTest?._id || null;

  if (existingTest) {
    Object.assign(existingTest, payloadToSave);
    await existingTest.save();
  } else {
    const createdTest = await MockTestModel.create({
      ...payloadToSave,
      createdBy: getCurrentAdminId(req),
    });
    savedTestId = createdTest?._id || null;
  }

  return await respondWithSchedulerWorkspace(
    res,
    existingTest ? "Mock test updated successfully." : "Mock test created successfully.",
    savedTestId
  );
};

const CreateAdminMockTest = async (req, res) => {
  try {
    return await upsertMockTest(req, res, null);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const UpdateAdminMockTest = async (req, res) => {
  try {
    const { testId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(404).json({ success: false, error: "Invalid mock test ID." });
    }

    const existingTest = await MockTestModel.findById(testId);
    if (!existingTest) {
      return res.status(404).json({ success: false, error: "Mock test not found." });
    }

    return await upsertMockTest(req, res, existingTest);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const DeleteAdminMockTest = async (req, res) => {
  try {
    const { testId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(404).json({ success: false, error: "Invalid mock test ID." });
    }

    const existingAttemptCount = await mongoose
      .model("MockTestAttempt")
      .countDocuments({ mockTest: testId });

    if (existingAttemptCount > 0) {
      await MockTestModel.findByIdAndUpdate(testId, {
        $set: {
          status: "archived",
          manualStatusOverride: false,
          updatedBy: getCurrentAdminId(req),
        },
      });

      return await respondWithSchedulerWorkspace(
        res,
        "This mock test already has student attempts, so it was archived instead of deleted."
      );
    }

    await MockTestModel.findByIdAndDelete(testId);
    return await respondWithSchedulerWorkspace(res, "Mock test deleted successfully.");
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const UpdateAdminMockTestStatus = async (req, res) => {
  try {
    const { testId } = req.params;
    const requestPayload = getRequestPayload(req);
    const nextStatus = String(readFieldValue(requestPayload?.status) || "")
      .trim()
      .toLowerCase();

    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(404).json({ success: false, error: "Invalid mock test ID." });
    }

    if (!["draft", "scheduled", "live", "completed", "archived"].includes(nextStatus)) {
      return res.status(422).json({ success: false, error: "Unsupported mock test status." });
    }

    const mockTest = await MockTestModel.findById(testId);
    if (!mockTest) {
      return res.status(404).json({ success: false, error: "Mock test not found." });
    }

    mockTest.status = nextStatus;
    mockTest.manualStatusOverride = nextStatus === "live";
    mockTest.updatedBy = getCurrentAdminId(req);

    if (nextStatus !== "draft" && !mockTest.publishedAt) {
      mockTest.publishedAt = new Date();
    }

    await mockTest.save();
    return await respondWithSchedulerWorkspace(
      res,
      "Mock test status updated.",
      mockTest._id
    );
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export {
  CreateAdminMockTest,
  CreateMockQuestion,
  DeleteAdminMockTest,
  DeleteMockQuestion,
  GetMockQuestionStudioWorkspace,
  GetMockTestDetail,
  GetMockTestSchedulerWorkspace,
  GetPublishedQuestions,
  PublishSubjectQuestionSet,
  HandleQuestionImageUpload,
  ReorderSubjectQuestions,
  UpdateAdminMockTest,
  UpdateAdminMockTestStatus,
  UpdateMockQuestion,
};
