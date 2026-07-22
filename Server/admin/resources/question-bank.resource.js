import uploadFeature from "@adminjs/upload";

import QuestionBankModel from "../../models/QuestionBank.js";
import {
  MAX_QUESTION_BANK_PDF_SIZE_BYTES,
  QUESTION_BANK_EXAMS,
  QUESTION_BANK_PDF_MIME_TYPES,
  QUESTION_BANK_TYPES,
  toAdminAvailableValues,
} from "../../constants/questionBank.js";
import { questionBankStorageDirectory } from "../../utils/questionBankFiles.js";
import { buildUniqueQuestionSlug } from "../../controllers/QuestionBank.js";
import componentLoader from "../ComponentLoader.js";
import UploadProvider from "../UploadProvider.js";
import { buildAdminPath } from "../config/paths.js";
import {
  buildUploadFieldMap,
  createPrefixedUploadPath,
} from "./helpers/single-image-upload.js";

const pdfFields = buildUploadFieldMap({ keyProperty: "pdfUrl", propertyBase: "pdf" });

const pdfUploadFeature = uploadFeature({
  componentLoader,
  provider: new UploadProvider({
    bucket: questionBankStorageDirectory,
    baseUrl: buildAdminPath("/api/question-bank/assets"),
  }),
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

const preparePdfRecord = async (request, context) => {
  if (request.method !== "post" || !request.payload) return request;

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

  payload.resourceType = "PDF";
  payload.allowDownload = true;
  payload.imageUrls = [];
  payload.imageCount = 0;

  const adminId = context.currentAdmin?.id || null;
  if (adminId) {
    payload.updatedBy = adminId;
    if (context.action?.name === "new") payload.createdBy = adminId;
  }

  return { ...request, payload };
};

const resource = {
  resource: QuestionBankModel,
  features: [pdfUploadFeature],
  options: {
    id: "QuestionBank",
    navigation: { name: "Past Questions", icon: "FileText" },
    listProperties: ["title", "exam", "questionType", "year", "isPublished", "createdAt"],
    editProperties: [
      "title",
      "exam",
      "questionType",
      "year",
      "description",
      pdfFields.fileProperty,
      "isPublished",
      "displayOrder",
    ],
    showProperties: [
      "title",
      "slug",
      "exam",
      "questionType",
      "year",
      "description",
      pdfFields.fileProperty,
      "isPublished",
      "createdAt",
      "updatedAt",
    ],
    filterProperties: ["title", "exam", "questionType", "year", "isPublished"],
    actions: {
      new: { before: [preparePdfRecord] },
      edit: { before: [preparePdfRecord] },
      delete: { guard: "Delete this past-question PDF?" },
    },
    properties: {
      title: { isTitle: true },
      slug: { isVisible: { list: false, show: true, edit: false, filter: false } },
      exam: { availableValues: toAdminAvailableValues(QUESTION_BANK_EXAMS) },
      questionType: {
        label: "Question Type",
        availableValues: toAdminAvailableValues(QUESTION_BANK_TYPES),
      },
      description: { type: "textarea", label: "Description (optional)" },
      isPublished: { label: "Visible to users" },
      displayOrder: { label: "Display order" },
      [pdfFields.fileProperty]: {
        label: "Past Question PDF",
        description: "Upload one PDF (maximum 50 MB). Users can preview and download it.",
      },
      [pdfFields.keyProperty]: { isVisible: false },
      [pdfFields.mimeTypeProperty]: { isVisible: false },
      [pdfFields.filenameProperty]: { isVisible: false },
      [pdfFields.sizeProperty]: { isVisible: false },
      [pdfFields.filePathProperty]: { isVisible: false },
      [pdfFields.filesToDeleteProperty]: { isVisible: false },
      [pdfFields.orderProperty]: { isVisible: false },
    },
  },
};

export default resource;
