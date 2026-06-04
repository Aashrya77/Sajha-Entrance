import uploadFeature from "@adminjs/upload";

import QuestionBankModel from "../../models/QuestionBank.js";
import {
  MAX_QUESTION_BANK_IMAGE_SIZE_BYTES,
  MAX_QUESTION_BANK_PDF_SIZE_BYTES,
  QUESTION_BANK_EXAMS,
  QUESTION_BANK_IMAGE_MIME_TYPES,
  QUESTION_BANK_PDF_MIME_TYPES,
  QUESTION_BANK_RESOURCE_TYPES,
  QUESTION_BANK_SUBJECTS,
  QUESTION_BANK_TYPES,
  toAdminAvailableValues,
} from "../../constants/questionBank.js";
import {
  detectPdfPageCountFromKey,
  questionBankStorageDirectory,
} from "../../utils/questionBankFiles.js";
import { buildUniqueQuestionSlug } from "../../controllers/QuestionBank.js";
import componentLoader, { Components } from "../ComponentLoader.js";
import UploadProvider from "../UploadProvider.js";
import { buildAdminPath } from "../config/paths.js";
import {
  buildUploadFieldMap,
  createMultipleImageUpload,
  createPrefixedUploadPath,
  createSingleImageUpload,
} from "./helpers/single-image-upload.js";

const thumbnailUpload = createSingleImageUpload({
  keyProperty: "thumbnailUrl",
  propertyBase: "thumbnail",
  label: "Thumbnail Upload",
  entityName: "question thumbnail",
  storageFolder: "question-bank",
  publicBaseUrl: "/media/question-bank",
  uploadPathLabel: "/public/media/question-bank",
  uploadPath: createPrefixedUploadPath("thumbnail"),
  mimeTypes: QUESTION_BANK_IMAGE_MIME_TYPES,
  maxSize: MAX_QUESTION_BANK_IMAGE_SIZE_BYTES,
  description: "Upload the image shown on public question cards and detail pages.",
});

const resourceImagesUpload = createMultipleImageUpload({
  keyProperty: "imageUrls",
  propertyBase: "resourceImages",
  label: "Multiple Image Upload",
  entityName: "question page image",
  storageFolder: "question-bank",
  bucketPath: questionBankStorageDirectory,
  publicBaseUrl: buildAdminPath("/api/question-bank/assets"),
  uploadPathLabel: "protected question bank storage",
  uploadPath: createPrefixedUploadPath("image"),
  mimeTypes: QUESTION_BANK_IMAGE_MIME_TYPES,
  maxSize: MAX_QUESTION_BANK_IMAGE_SIZE_BYTES,
  description:
    "Use this when Resource Type is Images. Upload scanned pages in reading order; drag thumbnails to reorder.",
});

const pdfFields = buildUploadFieldMap({
  keyProperty: "pdfUrl",
  propertyBase: "pdf",
});

const pdfProvider = new UploadProvider({
  bucket: questionBankStorageDirectory,
  baseUrl: buildAdminPath("/api/question-bank/assets"),
});

const pdfUploadFeature = uploadFeature({
  componentLoader,
  provider: pdfProvider,
  validation: {
    mimeTypes: QUESTION_BANK_PDF_MIME_TYPES,
    maxSize: MAX_QUESTION_BANK_PDF_SIZE_BYTES,
  },
  uploadPath: createPrefixedUploadPath("pdf"),
  properties: {
    file: pdfFields.fileProperty,
    filePath: pdfFields.filePathProperty,
    filesToDelete: pdfFields.filesToDeleteProperty,
    key: pdfFields.keyProperty,
    mimeType: pdfFields.mimeTypeProperty,
    filename: pdfFields.filenameProperty,
    size: pdfFields.sizeProperty,
  },
});

const toHookArray = (value) => {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

const prepareQuestionBankPayload = async (request, context) => {
  if (request.method !== "post" || !request.payload) {
    return request;
  }

  const payload = { ...request.payload };
  const recordId = context.record?.param?.("_id") || context.record?.params?._id || null;
  const title = String(payload.title || "").trim();

  if (title) {
    payload.title = title;
    payload.slug = await buildUniqueQuestionSlug({
      title,
      slug: payload.slug,
      existingId: recordId,
    });
  }

  const currentAdminId = context.currentAdmin?.id || null;
  if (currentAdminId) {
    payload.updatedBy = currentAdminId;

    if (context.action?.name === "new") {
      payload.createdBy = currentAdminId;
    }
  }

  return {
    ...request,
    payload,
  };
};

const syncDerivedQuestionBankFields = async (response, request, context) => {
  if (request.method !== "post" || !context.record || !context.record.isValid()) {
    return response;
  }

  const resourceType = context.record.get("resourceType");
  const imageUrls = context.record.get("imageUrls");
  const imageCount = Array.isArray(imageUrls) ? imageUrls.length : 0;
  const updates = {
    imageCount: resourceType === "Images" ? imageCount : 0,
    pageCount: resourceType === "Images" ? imageCount : 0,
  };

  if (resourceType === "PDF") {
    updates.pageCount = await detectPdfPageCountFromKey(context.record.get("pdfUrl"));
  }

  await context.record.update(updates);
  return response;
};

const galleryHooks = resourceImagesUpload.actionHooks;

const mergeQuestionBankActionHooks = (actionName) => ({
  before: [
    prepareQuestionBankPayload,
    ...toHookArray(galleryHooks[actionName]?.before),
  ],
  after: [
    ...toHookArray(galleryHooks[actionName]?.after),
    syncDerivedQuestionBankFields,
  ],
});

const QuestionBankAdminResource = {
  resource: QuestionBankModel,
  features: [
    thumbnailUpload.feature,
    pdfUploadFeature,
    resourceImagesUpload.feature,
  ],
  options: {
    id: "QuestionBank",
    navigation: { name: "Question Bank", icon: "BookOpen" },
    listProperties: [
      thumbnailUpload.fields.fileProperty,
      "title",
      "exam",
      "subject",
      "questionType",
      "year",
      "resourceType",
      "allowDownload",
      "isPublished",
      "viewsCount",
    ],
    editProperties: [
      "title",
      "slug",
      "exam",
      "subject",
      "questionType",
      "year",
      "description",
      thumbnailUpload.fields.fileProperty,
      "resourceType",
      pdfFields.fileProperty,
      resourceImagesUpload.fields.fileProperty,
      "allowDownload",
      "isPublished",
      "displayOrder",
    ],
    showProperties: [
      thumbnailUpload.fields.fileProperty,
      "title",
      "slug",
      "description",
      "exam",
      "subject",
      "questionType",
      "year",
      "resourceType",
      pdfFields.fileProperty,
      resourceImagesUpload.fields.fileProperty,
      "allowDownload",
      "isPublished",
      "displayOrder",
      "viewsCount",
      "pageCount",
      "imageCount",
      "createdBy",
      "updatedBy",
      "createdAt",
      "updatedAt",
    ],
    filterProperties: [
      "title",
      "exam",
      "subject",
      "questionType",
      "year",
      "resourceType",
      "allowDownload",
      "isPublished",
    ],
    actions: {
      new: mergeQuestionBankActionHooks("new"),
      edit: mergeQuestionBankActionHooks("edit"),
      delete: {
        guard: "Delete this question bank resource and its uploaded files?",
      },
    },
    properties: {
      title: {
        isTitle: true,
        label: "Title",
      },
      slug: {
        label: "Slug",
        description: "Leave blank to generate from the title.",
      },
      description: {
        label: "Short Description",
        type: "textarea",
      },
      exam: {
        label: "Exam",
        availableValues: toAdminAvailableValues(QUESTION_BANK_EXAMS),
      },
      subject: {
        label: "Subject",
        availableValues: toAdminAvailableValues(QUESTION_BANK_SUBJECTS),
      },
      questionType: {
        label: "Question Type",
        availableValues: toAdminAvailableValues(QUESTION_BANK_TYPES),
      },
      resourceType: {
        label: "Resource Type",
        availableValues: toAdminAvailableValues(QUESTION_BANK_RESOURCE_TYPES),
        description: "Choose PDF for a single document or Images for scanned pages.",
      },
      allowDownload: {
        label: "Download Enabled",
      },
      isPublished: {
        label: "Published",
      },
      displayOrder: {
        label: "Display Order",
      },
      viewsCount: {
        label: "Views",
        isVisible: { list: true, show: true, edit: false, filter: false },
      },
      pageCount: {
        label: "Detected Page Count",
        isVisible: { list: false, show: true, edit: false, filter: false },
      },
      imageCount: {
        label: "Detected Image Count",
        isVisible: { list: false, show: true, edit: false, filter: false },
      },
      createdBy: {
        isVisible: { list: false, show: true, edit: false, filter: false },
      },
      updatedBy: {
        isVisible: { list: false, show: true, edit: false, filter: false },
      },
      createdAt: {
        isVisible: { list: false, show: true, edit: false, filter: true },
      },
      updatedAt: {
        isVisible: { list: false, show: true, edit: false, filter: true },
      },
      [pdfFields.fileProperty]: {
        label: "PDF Upload",
        description:
          "Use this when Resource Type is PDF. Maximum file size: 50 MB. Stored in protected question bank storage.",
      },
      [pdfFields.keyProperty]: { isVisible: false },
      [pdfFields.mimeTypeProperty]: { isVisible: false },
      [pdfFields.filenameProperty]: { isVisible: false },
      [pdfFields.sizeProperty]: { isVisible: false },
      [pdfFields.filePathProperty]: { isVisible: false },
      [pdfFields.filesToDeleteProperty]: { isVisible: false },
      [pdfFields.orderProperty]: { isVisible: false },
      ...thumbnailUpload.propertyOptions,
      ...resourceImagesUpload.propertyOptions,
    },
  },
};

export default QuestionBankAdminResource;
