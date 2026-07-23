import uploadFeature from "@adminjs/upload";

import QuestionBankModel from "../../models/QuestionBank.js";
import {
  MAX_QUESTION_BANK_PDF_SIZE_BYTES,
  MAX_QUESTION_BANK_IMAGE_SIZE_BYTES,
  QUESTION_BANK_EXAMS,
  QUESTION_BANK_IMAGE_MIME_TYPES,
  QUESTION_BANK_PDF_MIME_TYPES,
  QUESTION_BANK_RESOURCE_TYPES,
  QUESTION_BANK_TYPES,
  toAdminAvailableValues,
} from "../../constants/questionBank.js";
import { questionBankStorageDirectory } from "../../utils/questionBankFiles.js";
import { buildUniqueQuestionSlug } from "../../controllers/QuestionBank.js";
import componentLoader from "../ComponentLoader.js";
import UploadProvider from "../UploadProvider.js";
import CloudinaryUploadProvider from "../CloudinaryUploadProvider.js";
import { isCloudinaryQuestionBankEnabled } from "../../utils/cloudinaryQuestionBank.js";
import { buildAdminPath } from "../config/paths.js";
import {
  buildUploadFieldMap,
  createPrefixedUploadPath,
} from "./helpers/single-image-upload.js";

const pdfFields = buildUploadFieldMap({ keyProperty: "pdfUrl", propertyBase: "pdf" });
const imageFields = buildUploadFieldMap({
  keyProperty: "imageUrls",
  propertyBase: "resourceImages",
});

const createQuestionBankProvider = () =>
  isCloudinaryQuestionBankEnabled()
    ? new CloudinaryUploadProvider()
    : new UploadProvider({
        bucket: questionBankStorageDirectory,
        baseUrl: buildAdminPath("/api/question-bank/assets"),
      });

const pdfUploadFeature = uploadFeature({
  componentLoader,
  provider: createQuestionBankProvider(),
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

const imageUploadFeature = uploadFeature({
  componentLoader,
  provider: createQuestionBankProvider(),
  multiple: true,
  validation: {
    mimeTypes: QUESTION_BANK_IMAGE_MIME_TYPES,
    maxSize: MAX_QUESTION_BANK_IMAGE_SIZE_BYTES,
  },
  uploadPath: createPrefixedUploadPath("image"),
  properties: {
    file: imageFields.fileProperty,
    filePath: imageFields.filePathProperty,
    filesToDelete: imageFields.filesToDeleteProperty,
    key: imageFields.keyProperty,
    mimeType: imageFields.mimeTypeProperty,
    filename: imageFields.filenameProperty,
    size: imageFields.sizeProperty,
  },
});

const prepareQuestionRecord = async (request, context) => {
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

  if (!QUESTION_BANK_RESOURCE_TYPES.includes(payload.resourceType)) {
    payload.resourceType = context.record?.param?.("resourceType") || "PDF";
  }

  const adminId = context.currentAdmin?.id || null;
  if (adminId) {
    payload.updatedBy = adminId;
    if (context.action?.name === "new") payload.createdBy = adminId;
  }

  return { ...request, payload };
};

const resource = {
  resource: QuestionBankModel,
  features: [pdfUploadFeature, imageUploadFeature],
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
      "resourceType",
      pdfFields.fileProperty,
      imageFields.fileProperty,
      "allowDownload",
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
      "resourceType",
      pdfFields.fileProperty,
      imageFields.fileProperty,
      "allowDownload",
      "isPublished",
      "createdAt",
      "updatedAt",
    ],
    filterProperties: ["title", "exam", "questionType", "year", "isPublished"],
    actions: {
      new: { before: [prepareQuestionRecord] },
      edit: { before: [prepareQuestionRecord] },
      delete: { guard: "Delete this past-question resource?" },
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
      resourceType: {
        label: "Resource format",
        availableValues: toAdminAvailableValues(QUESTION_BANK_RESOURCE_TYPES),
      },
      allowDownload: {
        label: "Allow users to download",
        description: "Turn this off to permit previewing only.",
      },
      isPublished: { label: "Visible to users" },
      displayOrder: { label: "Display order" },
      [pdfFields.fileProperty]: {
        label: "Past Question PDF",
        description: "Required when Resource format is PDF (maximum 50 MB).",
      },
      [imageFields.fileProperty]: {
        label: "Past Question Images",
        description: "Required when Resource format is Images. Upload one or more JPG, PNG, or WEBP files.",
      },
      [pdfFields.keyProperty]: { isVisible: false },
      [pdfFields.mimeTypeProperty]: { isVisible: false },
      [pdfFields.filenameProperty]: { isVisible: false },
      [pdfFields.sizeProperty]: { isVisible: false },
      [pdfFields.filePathProperty]: { isVisible: false },
      [pdfFields.filesToDeleteProperty]: { isVisible: false },
      [pdfFields.orderProperty]: { isVisible: false },
      [imageFields.keyProperty]: { isVisible: false },
      [imageFields.mimeTypeProperty]: { isVisible: false },
      [imageFields.filenameProperty]: { isVisible: false },
      [imageFields.sizeProperty]: { isVisible: false },
      [imageFields.filePathProperty]: { isVisible: false },
      [imageFields.filesToDeleteProperty]: { isVisible: false },
      [imageFields.orderProperty]: { isVisible: false },
    },
  },
};

export default resource;
