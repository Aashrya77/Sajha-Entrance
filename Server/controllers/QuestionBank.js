import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import mongoose from "mongoose";

import {
  MAX_QUESTION_BANK_IMAGE_SIZE_BYTES,
  MAX_QUESTION_BANK_PDF_SIZE_BYTES,
  QUESTION_BANK_EXAMS,
  QUESTION_BANK_IMAGE_MIME_TYPES,
  QUESTION_BANK_PDF_MIME_TYPES,
  QUESTION_BANK_RESOURCE_TYPES,
  QUESTION_BANK_TYPES,
} from "../constants/questionBank.js";
import QuestionBankModel from "../models/QuestionBank.js";
import {
  deleteQuestionBankResourceFile,
  detectPdfPageCountFromKey,
  getQuestionBankResourceMimeType,
  normalizeStorageKey,
  resolveQuestionBankStoragePath,
  saveQuestionBankResourceFile,
} from "../utils/questionBankFiles.js";
import {
  MEDIA_TYPES,
  getMediaPublicPath,
  mediaRootDirectory,
} from "../utils/media.js";
import { slugifyText } from "../utils/slug.js";
import QuestionBankViewModel from "../models/QuestionBankView.js";

const THUMBNAIL_FOLDER = path.join(mediaRootDirectory, MEDIA_TYPES.questionBank);
const QUESTION_VIEWER_COOKIE = "sajha_question_viewer_id";
const QUESTION_VIEWER_HEADER = "x-question-viewer-id";
const ALL_UPLOAD_MIME_TYPES = new Set([
  ...QUESTION_BANK_IMAGE_MIME_TYPES,
  ...QUESTION_BANK_PDF_MIME_TYPES,
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_QUESTION_BANK_PDF_SIZE_BYTES,
    files: 40,
  },
  fileFilter: (_req, file, callback) => {
    const mimeType = String(file?.mimetype || "").toLowerCase();
    if (!ALL_UPLOAD_MIME_TYPES.has(mimeType)) {
      callback(new Error("Only PDF, JPG, JPEG, PNG, and WEBP files are supported."));
      return;
    }

    callback(null, true);
  },
}).fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "pdf", maxCount: 1 },
  { name: "images", maxCount: 30 },
]);

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return ["true", "1", "yes", "on"].includes(String(value).trim().toLowerCase());
};

const parseInteger = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const readField = (value) => (Array.isArray(value) ? value[0] : value);

const parseArrayField = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (value === undefined || value === null || value === "") {
    return [];
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [value];
    } catch (_error) {
      return value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
  }

  return [value].filter(Boolean);
};

const escapeRegex = (value = "") =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeViewerId = (value = "") =>
  String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9._:-]/g, "")
    .slice(0, 128);

const createAnonymousViewerId = () => crypto.randomUUID();

const hashValue = (value = "") =>
  value
    ? crypto.createHash("sha256").update(String(value)).digest("hex")
    : "";

const resolveQuestionViewer = (req, res) => {
  const studentId = req.student?.id || req.student?._id || "";

  if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
    return {
      viewerKey: `student:${studentId}`,
      viewerType: "student",
      student: studentId,
    };
  }

  const requestViewerId =
    normalizeViewerId(req.cookies?.[QUESTION_VIEWER_COOKIE]) ||
    normalizeViewerId(req.get(QUESTION_VIEWER_HEADER)) ||
    createAnonymousViewerId();

  res.cookie(QUESTION_VIEWER_COOKIE, requestViewerId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });

  return {
    viewerKey: `anonymous:${requestViewerId}`,
    viewerType: "anonymous",
    student: null,
  };
};

const normalizeOptionValue = (value, allowedValues, fallback = "") => {
  const normalized = String(value || "").trim();
  return allowedValues.includes(normalized) ? normalized : fallback;
};

const buildUniqueQuestionSlug = async ({ title = "", slug = "", existingId = null }) => {
  const baseSlug = slugifyText(slug || title) || "question";
  let nextSlug = baseSlug;
  let counter = 2;

  while (true) {
    const query = { slug: nextSlug };
    if (existingId && mongoose.Types.ObjectId.isValid(existingId)) {
      query._id = { $ne: existingId };
    }

    const exists = await QuestionBankModel.exists(query);
    if (!exists) {
      return nextSlug;
    }

    nextSlug = `${baseSlug}-${counter}`;
    counter += 1;
  }
};

const getFirstFile = (files = {}, fieldName) => {
  const value = files?.[fieldName];
  return Array.isArray(value) ? value[0] || null : value || null;
};

const getFileList = (files = {}, fieldName) => {
  const value = files?.[fieldName];
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
};

const validateUploadedQuestionBankFiles = (files = {}) => {
  const thumbnail = getFirstFile(files, "thumbnail");
  const pdf = getFirstFile(files, "pdf");
  const images = getFileList(files, "images");

  if (thumbnail) {
    const mimeType = String(thumbnail.mimetype || "").toLowerCase();
    if (!QUESTION_BANK_IMAGE_MIME_TYPES.includes(mimeType)) {
      throw new Error("Thumbnail must be JPG, PNG, or WEBP.");
    }

    if (Number(thumbnail.size || 0) > MAX_QUESTION_BANK_IMAGE_SIZE_BYTES) {
      throw new Error("Thumbnail must be 10 MB or smaller.");
    }
  }

  if (pdf) {
    const mimeType = String(pdf.mimetype || "").toLowerCase();
    if (!QUESTION_BANK_PDF_MIME_TYPES.includes(mimeType)) {
      throw new Error("PDF upload must be a PDF file.");
    }

    if (Number(pdf.size || 0) > MAX_QUESTION_BANK_PDF_SIZE_BYTES) {
      throw new Error("PDF must be 50 MB or smaller.");
    }
  }

  images.forEach((image) => {
    const mimeType = String(image.mimetype || "").toLowerCase();
    if (!QUESTION_BANK_IMAGE_MIME_TYPES.includes(mimeType)) {
      throw new Error("Question images must be JPG, PNG, or WEBP.");
    }

    if (Number(image.size || 0) > MAX_QUESTION_BANK_IMAGE_SIZE_BYTES) {
      throw new Error("Each question image must be 10 MB or smaller.");
    }
  });
};

const QuestionBankUploadMiddleware = (req, res, next) => {
  upload(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message || "Question bank upload failed.",
      });
    }

    try {
      validateUploadedQuestionBankFiles(req.files);
      return next();
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError.message || "Question bank upload failed.",
      });
    }
  });
};

const buildPublicPreviewUrl = (question, resourceKind, index = null) => {
  const encodedSlug = encodeURIComponent(question.slug);
  if (resourceKind === "pdf") {
    return `/api/question-bank/${encodedSlug}/preview/pdf`;
  }

  return `/api/question-bank/${encodedSlug}/preview/image/${index}`;
};

const buildPublicDownloadUrl = (question, resourceKind, index = null) => {
  if (!question.allowDownload) {
    return "";
  }

  const encodedSlug = encodeURIComponent(question.slug);
  if (resourceKind === "pdf") {
    return `/api/question-bank/${encodedSlug}/download/pdf`;
  }

  return `/api/question-bank/${encodedSlug}/download/image/${index}`;
};

const serializeQuestionBank = (question = {}, { includeResources = true } = {}) => {
  const plainQuestion = question?.toObject?.() ? question.toObject() : question;
  const imageKeys = Array.isArray(plainQuestion.imageUrls) ? plainQuestion.imageUrls : [];
  const hasPdf = Boolean(plainQuestion.pdfUrl);
  const hasImages = imageKeys.length > 0;
  const imageUrls = includeResources
    ? imageKeys.map((_key, index) => buildPublicPreviewUrl(plainQuestion, "image", index))
    : [];
  const downloadUrls = includeResources && plainQuestion.allowDownload
    ? imageKeys.map((_key, index) => buildPublicDownloadUrl(plainQuestion, "image", index))
    : [];

  return {
    id: plainQuestion._id,
    title: plainQuestion.title,
    slug: plainQuestion.slug,
    description: plainQuestion.description || "",
    exam: plainQuestion.exam,
    questionType: plainQuestion.questionType,
    year: plainQuestion.year,
    thumbnailUrl: plainQuestion.thumbnailUrl
      ? getMediaPublicPath(MEDIA_TYPES.questionBank, plainQuestion.thumbnailUrl)
      : "",
    resourceType: plainQuestion.resourceType,
    pdfUrl: includeResources && hasPdf ? buildPublicPreviewUrl(plainQuestion, "pdf") : "",
    imageUrls,
    allowDownload: Boolean(plainQuestion.allowDownload),
    downloadUrl:
      includeResources && hasPdf
        ? buildPublicDownloadUrl(plainQuestion, "pdf")
        : downloadUrls[0] || "",
    downloadUrls,
    isPublished: Boolean(plainQuestion.isPublished),
    displayOrder: Number(plainQuestion.displayOrder || 0),
    viewsCount: Number(plainQuestion.viewsCount || 0),
    pageCount: Number(plainQuestion.pageCount || 0),
    imageCount: plainQuestion.resourceType === "Images"
      ? Number(plainQuestion.imageCount || imageKeys.length)
      : 0,
    uploadedDate: plainQuestion.createdAt,
    createdAt: plainQuestion.createdAt,
    updatedAt: plainQuestion.updatedAt,
    hasResource: plainQuestion.resourceType === "PDF" ? hasPdf : hasImages,
  };
};

const buildQuestionBankQuery = (queryParams = {}, includeDrafts = false) => {
  const query = includeDrafts ? {} : { isPublished: true };
  const search = String(queryParams.search || "").trim();
  const exam = String(queryParams.exam || "").trim();
  const questionType = String(queryParams.type || queryParams.questionType || "").trim();
  const year = String(queryParams.year || "").trim();

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    query.$or = [
      { title: regex },
      { exam: regex },
      { year: regex },
    ];
  }

  if (QUESTION_BANK_EXAMS.includes(exam)) {
    query.exam = exam;
  }

  if (QUESTION_BANK_TYPES.includes(questionType)) {
    query.questionType = questionType;
  }

  if (year) {
    query.year = year;
  }

  return query;
};

const getQuestionBankFiltersPayload = async () => {
  const years = await QuestionBankModel.distinct("year", { isPublished: true });

  return {
    exams: QUESTION_BANK_EXAMS,
    questionTypes: QUESTION_BANK_TYPES,
    resourceTypes: QUESTION_BANK_RESOURCE_TYPES,
    years: years
      .filter(Boolean)
      .map(String)
      .sort((left, right) => Number(right) - Number(left)),
  };
};

const getPopularExamCategories = async () =>
  QuestionBankModel.aggregate([
    { $match: { isPublished: true } },
    {
      $group: {
        _id: "$exam",
        count: { $sum: 1 },
        viewsCount: { $sum: "$viewsCount" },
      },
    },
    { $sort: { count: -1, viewsCount: -1, _id: 1 } },
    { $limit: 9 },
    {
      $project: {
        _id: 0,
        exam: "$_id",
        count: 1,
        viewsCount: 1,
      },
    },
  ]);

const GetQuestionBank = async (req, res) => {
  try {
    const page = Math.max(parseInteger(req.query.page, 1), 1);
    const limit = Math.min(Math.max(parseInteger(req.query.limit, 12), 1), 48);
    const query = buildQuestionBankQuery(req.query);
    const skip = (page - 1) * limit;

    const [
      questions,
      totalQuestions,
      popularExamCategories,
      filters,
    ] = await Promise.all([
      QuestionBankModel.find(query)
        .sort({ displayOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      QuestionBankModel.countDocuments(query),
      getPopularExamCategories(),
      getQuestionBankFiltersPayload(),
    ]);

    return res.json({
      success: true,
      data: {
        questions: questions.map((question) => serializeQuestionBank(question)),
        popularExamCategories,
        filters,
        totalQuestions,
        currentPage: page,
        totalPages: Math.ceil(totalQuestions / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const GetQuestionBankDetail = async (req, res) => {
  try {
    const slug = slugifyText(req.params.slug || "");
    if (!slug) {
      return res.status(404).json({ success: false, error: "Question not found." });
    }

    const question = await QuestionBankModel.findOne({ slug, isPublished: true })
      .lean()
      .exec();

    if (!question) {
      return res.status(404).json({ success: false, error: "Question not found." });
    }

    const viewer = resolveQuestionViewer(req, res);
    let viewsCount = Number(question.viewsCount || 0);

    try {
      const viewedAt = new Date();
      const viewResult = await QuestionBankViewModel.updateOne(
        {
          question: question._id,
          viewerKey: viewer.viewerKey,
        },
        {
          $set: {
            lastViewedAt: viewedAt,
          },
          $setOnInsert: {
            question: question._id,
            student: viewer.student,
            viewerKey: viewer.viewerKey,
            viewerType: viewer.viewerType,
            ipHash: hashValue(req.ip || req.headers["x-forwarded-for"] || ""),
            userAgent: String(req.get("user-agent") || "").slice(0, 500),
          },
        },
        { upsert: true, setDefaultsOnInsert: true }
      );

      if (Number(viewResult?.upsertedCount || 0) > 0) {
        const updatedQuestion = await QuestionBankModel.findByIdAndUpdate(
          question._id,
          { $inc: { viewsCount: 1 } },
          { new: true }
        )
          .select("viewsCount")
          .lean();

        viewsCount = Number(updatedQuestion?.viewsCount || viewsCount + 1);
      }
    } catch (viewError) {
      if (viewError?.code === 11000) {
        await QuestionBankViewModel.updateOne(
          { question: question._id, viewerKey: viewer.viewerKey },
          { $set: { lastViewedAt: new Date() } }
        );
      } else {
        throw viewError;
      }
    }

    const relatedQuestions = await QuestionBankModel.find({
      _id: { $ne: question._id },
      isPublished: true,
      exam: question.exam,
    })
      .sort({ displayOrder: 1, viewsCount: -1, createdAt: -1 })
      .limit(6)
      .lean();

    return res.json({
      success: true,
      data: {
        question: serializeQuestionBank({ ...question, viewsCount }),
        relatedQuestions: relatedQuestions.map((entry) => serializeQuestionBank(entry)),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const sendQuestionBankAsset = async (res, key = "", { download = false } = {}) => {
  const normalizedKey = normalizeStorageKey(key);
  const filePath = resolveQuestionBankStoragePath(normalizedKey);

  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: "Resource file not found." });
  }

  const filename = path.basename(normalizedKey).replace(/"/g, "");
  const disposition = download ? "attachment" : "inline";

  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Content-Type", getQuestionBankResourceMimeType(normalizedKey));
  res.setHeader("Content-Disposition", `${disposition}; filename="${filename}"`);

  return res.sendFile(filePath);
};

const findPublishedQuestionBySlug = async (slugParam = "") => {
  const slug = slugifyText(slugParam || "");
  if (!slug) {
    return null;
  }

  return QuestionBankModel.findOne({ slug, isPublished: true }).lean().exec();
};

const serveQuestionResource = async (req, res, { resourceKind, download = false }) => {
  try {
    const question = await findPublishedQuestionBySlug(req.params.slug);
    if (!question) {
      return res.status(404).json({ success: false, error: "Question not found." });
    }

    if (download && !question.allowDownload) {
      return res.status(403).json({ success: false, error: "Download is disabled." });
    }

    if (resourceKind === "pdf") {
      if (question.resourceType !== "PDF" || !question.pdfUrl) {
        return res.status(404).json({ success: false, error: "PDF resource not found." });
      }

      return sendQuestionBankAsset(res, question.pdfUrl, { download });
    }

    const imageIndex = parseInteger(req.params.index, -1);
    const imageKeys = Array.isArray(question.imageUrls) ? question.imageUrls : [];
    const imageKey = imageKeys[imageIndex];

    if (question.resourceType !== "Images" || !imageKey) {
      return res.status(404).json({ success: false, error: "Image resource not found." });
    }

    return sendQuestionBankAsset(res, imageKey, { download });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const PreviewQuestionBankPdf = (req, res) =>
  serveQuestionResource(req, res, { resourceKind: "pdf", download: false });

const DownloadQuestionBankPdf = (req, res) =>
  serveQuestionResource(req, res, { resourceKind: "pdf", download: true });

const PreviewQuestionBankImage = (req, res) =>
  serveQuestionResource(req, res, { resourceKind: "image", download: false });

const DownloadQuestionBankImage = (req, res) =>
  serveQuestionResource(req, res, { resourceKind: "image", download: true });

const ServeAdminQuestionBankAsset = async (req, res) => {
  try {
    const key = normalizeStorageKey(req.params?.[0] || "");
    if (!key) {
      return res.status(404).json({ success: false, error: "Resource file not found." });
    }

    const question = await QuestionBankModel.findOne({
      $or: [{ pdfUrl: key }, { imageUrls: key }],
    })
      .select("_id")
      .lean();

    if (!question) {
      return res.status(404).json({ success: false, error: "Resource file not found." });
    }

    return sendQuestionBankAsset(res, key, { download: false });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const saveQuestionBankThumbnailFile = async (file) => {
  if (!file?.buffer) {
    return "";
  }

  await fs.promises.mkdir(THUMBNAIL_FOLDER, { recursive: true });
  const originalName = file.originalname || "thumbnail";
  const extension = path.extname(originalName).toLowerCase() || ".jpg";
  const filename = `${Date.now()}-${slugifyText(path.parse(originalName).name) || "thumbnail"}${extension}`;
  const targetPath = path.join(THUMBNAIL_FOLDER, filename);

  await fs.promises.writeFile(targetPath, file.buffer);
  return filename;
};

const deleteQuestionBankThumbnailFile = async (key = "") => {
  if (!key || key.startsWith("http") || key.startsWith("/media/")) {
    return;
  }

  const targetPath = path.join(THUMBNAIL_FOLDER, path.basename(key));
  if (fs.existsSync(targetPath)) {
    await fs.promises.unlink(targetPath);
  }
};

const buildAdminQuestionBankPayload = async (req, existingQuestion = null) => {
  const payload = req.body || {};
  const files = req.files || {};
  const title = String(readField(payload.title) || existingQuestion?.title || "").trim();
  const slugInput =
    payload.slug !== undefined ? readField(payload.slug) : existingQuestion?.slug || "";
  const resourceType = normalizeOptionValue(
    readField(payload.resourceType),
    QUESTION_BANK_RESOURCE_TYPES,
    existingQuestion?.resourceType || "PDF"
  );
  const questionPayload = {
    title,
    slug: await buildUniqueQuestionSlug({
      title,
      slug: slugInput,
      existingId: existingQuestion?._id,
    }),
    description:
      payload.description !== undefined
        ? String(readField(payload.description) || "").trim()
        : existingQuestion?.description || "",
    exam: normalizeOptionValue(
      readField(payload.exam),
      QUESTION_BANK_EXAMS,
      existingQuestion?.exam || ""
    ),
    questionType: normalizeOptionValue(
      readField(payload.questionType),
      QUESTION_BANK_TYPES,
      existingQuestion?.questionType || ""
    ),
    year:
      payload.year !== undefined
        ? String(readField(payload.year) || "").trim()
        : existingQuestion?.year || "",
    resourceType,
    pdfUrl: existingQuestion?.pdfUrl || "",
    imageUrls: Array.isArray(existingQuestion?.imageUrls)
      ? [...existingQuestion.imageUrls]
      : [],
    allowDownload: parseBoolean(readField(payload.allowDownload), existingQuestion?.allowDownload || false),
    isPublished: parseBoolean(readField(payload.isPublished), existingQuestion?.isPublished ?? true),
    displayOrder: parseInteger(readField(payload.displayOrder), existingQuestion?.displayOrder || 0),
    updatedBy: req.session?.adminUser?.id || null,
  };

  if (!existingQuestion) {
    questionPayload.createdBy = req.session?.adminUser?.id || null;
  }

  const thumbnail = getFirstFile(files, "thumbnail");
  if (thumbnail) {
    if (existingQuestion?.thumbnailUrl) {
      await deleteQuestionBankThumbnailFile(existingQuestion.thumbnailUrl);
    }
    questionPayload.thumbnailUrl = await saveQuestionBankThumbnailFile(thumbnail);
    questionPayload.thumbnailMimeType = thumbnail.mimetype;
    questionPayload.thumbnailFilename = thumbnail.originalname;
    questionPayload.thumbnailSize = thumbnail.size;
  } else if (payload.thumbnailUrl !== undefined) {
    questionPayload.thumbnailUrl = String(readField(payload.thumbnailUrl) || "").trim();
  }

  const pdf = getFirstFile(files, "pdf");
  const images = getFileList(files, "images");

  if (pdf) {
    if (existingQuestion?.pdfUrl) {
      await deleteQuestionBankResourceFile(existingQuestion.pdfUrl);
    }
    questionPayload.pdfUrl = await saveQuestionBankResourceFile(pdf, "pdf");
    questionPayload.pdfMimeType = pdf.mimetype;
    questionPayload.pdfFilename = pdf.originalname;
    questionPayload.pdfSize = pdf.size;
    questionPayload.pageCount = await detectPdfPageCountFromKey(questionPayload.pdfUrl);
  } else if (payload.pdfUrl !== undefined) {
    questionPayload.pdfUrl = normalizeStorageKey(readField(payload.pdfUrl));
  }

  if (images.length) {
    if (Array.isArray(existingQuestion?.imageUrls)) {
      await Promise.all(existingQuestion.imageUrls.map(deleteQuestionBankResourceFile));
    }

    questionPayload.imageUrls = await Promise.all(
      images.map((image, index) => saveQuestionBankResourceFile(image, `image-${index + 1}`))
    );
    questionPayload.resourceImagesMimeType = images.map((image) => image.mimetype);
    questionPayload.resourceImagesFilename = images.map((image) => image.originalname);
    questionPayload.resourceImagesSize = images.map((image) => image.size);
  } else if (payload.imageUrls !== undefined) {
    questionPayload.imageUrls = parseArrayField(payload.imageUrls).map(normalizeStorageKey);
  }

  if (resourceType === "Images") {
    questionPayload.pdfUrl = "";
    questionPayload.imageUrls = questionPayload.imageUrls || existingQuestion?.imageUrls || [];
    questionPayload.imageCount = questionPayload.imageUrls.length;
    questionPayload.pageCount = questionPayload.imageUrls.length;
  } else {
    questionPayload.imageUrls = [];
    questionPayload.imageCount = 0;
  }

  return questionPayload;
};

const validateAdminQuestionBankPayload = (payload = {}) => {
  const errors = {};

  ["title", "exam", "questionType", "year", "resourceType"].forEach((fieldName) => {
    if (!payload[fieldName]) {
      errors[fieldName] = `${fieldName} is required.`;
    }
  });

  if (payload.resourceType === "PDF" && !payload.pdfUrl) {
    errors.pdf = "A PDF resource is required.";
  }

  if (payload.resourceType === "Images" && !payload.imageUrls?.length) {
    errors.images = "At least one image resource is required.";
  }

  return errors;
};

const GetAdminQuestionBank = async (req, res) => {
  try {
    const page = Math.max(parseInteger(req.query.page, 1), 1);
    const limit = Math.min(Math.max(parseInteger(req.query.limit, 25), 1), 100);
    const query = buildQuestionBankQuery(req.query, true);
    const skip = (page - 1) * limit;
    const [questions, totalQuestions] = await Promise.all([
      QuestionBankModel.find(query)
        .sort({ displayOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      QuestionBankModel.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: {
        questions: questions.map((question) => serializeQuestionBank(question)),
        totalQuestions,
        currentPage: page,
        totalPages: Math.ceil(totalQuestions / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const CreateAdminQuestionBank = async (req, res) => {
  try {
    const payload = await buildAdminQuestionBankPayload(req);
    const errors = validateAdminQuestionBankPayload(payload);

    if (Object.keys(errors).length) {
      return res.status(422).json({
        success: false,
        error: "Question validation failed.",
        errors,
      });
    }

    const question = await QuestionBankModel.create(payload);

    return res.status(201).json({
      success: true,
      message: "Question bank resource created successfully.",
      data: serializeQuestionBank(question),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const UpdateAdminQuestionBank = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, error: "Invalid question ID." });
    }

    const existingQuestion = await QuestionBankModel.findById(req.params.id);
    if (!existingQuestion) {
      return res.status(404).json({ success: false, error: "Question not found." });
    }

    const payload = await buildAdminQuestionBankPayload(req, existingQuestion);
    const errors = validateAdminQuestionBankPayload(payload);

    if (Object.keys(errors).length) {
      return res.status(422).json({
        success: false,
        error: "Question validation failed.",
        errors,
      });
    }

    Object.assign(existingQuestion, payload);
    await existingQuestion.save();

    return res.json({
      success: true,
      message: "Question bank resource updated successfully.",
      data: serializeQuestionBank(existingQuestion),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const DeleteAdminQuestionBank = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, error: "Invalid question ID." });
    }

    const question = await QuestionBankModel.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, error: "Question not found." });
    }

    await Promise.all([
      deleteQuestionBankThumbnailFile(question.thumbnailUrl),
      deleteQuestionBankResourceFile(question.pdfUrl),
      ...(question.imageUrls || []).map(deleteQuestionBankResourceFile),
      QuestionBankViewModel.deleteMany({ question: question._id }),
    ]);

    return res.json({
      success: true,
      message: "Question bank resource deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export {
  CreateAdminQuestionBank,
  DeleteAdminQuestionBank,
  DownloadQuestionBankImage,
  DownloadQuestionBankPdf,
  GetAdminQuestionBank,
  GetQuestionBank,
  GetQuestionBankDetail,
  PreviewQuestionBankImage,
  PreviewQuestionBankPdf,
  QuestionBankUploadMiddleware,
  ServeAdminQuestionBankAsset,
  UpdateAdminQuestionBank,
  buildUniqueQuestionSlug,
  serializeQuestionBank,
};
