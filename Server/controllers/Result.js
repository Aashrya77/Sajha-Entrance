import path from "path";
import fs from "fs/promises";
import {
  buildTemplateFile,
  createResultExam,
  deleteResultExamSet,
  listAdminResultCourses,
  getPublicResultCourses,
  getPublishedTopResults,
  importResultUpload,
  listAdminResultExams,
  listPublishedResultExams,
  previewResultUpload,
  recalculateExamRanks,
  searchPublishedResult,
  setResultExamStatus,
  updateResultExam,
} from "../services/resultService.js";
import { createLogger } from "../utils/logger.js";

const SUPPORTED_RESULT_UPLOAD_EXTENSIONS = new Set([".csv", ".xls", ".xlsx"]);
const logger = createLogger("result-controller");

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

const getUploadedFile = (req) => {
  if (req.file) {
    return req.file;
  }

  const uploadedFile = req.files?.file;
  return Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile || null;
};

const getUploadedFileBuffer = async (req) => {
  const uploadedFile = getUploadedFile(req);
  if (!uploadedFile) {
    return null;
  }

  if (uploadedFile.buffer) {
    return uploadedFile.buffer;
  }

  const filePath = uploadedFile.filepath || uploadedFile.path || uploadedFile.tempFilePath;
  if (!filePath) {
    return null;
  }

  try {
    return await fs.readFile(filePath);
  } finally {
    await fs.unlink(filePath).catch(() => null);
  }
};

const validateUploadedResultFile = (req) => {
  const uploadedFile = getUploadedFile(req);
  const filename = String(
    uploadedFile?.originalname ||
      uploadedFile?.originalFilename ||
      uploadedFile?.name ||
      ""
  ).trim();
  const extension = path.extname(filename).toLowerCase();

  if (!filename || !SUPPORTED_RESULT_UPLOAD_EXTENSIONS.has(extension)) {
    throw new Error("Please upload a CSV, XLS, or XLSX result file.");
  }
};

const logAdminRouteError = (label, error, details = {}) => {
  logger.error(`${label} failed:`, error.message, details);
};

const sendAdminError = (res, statusCode, label, error) =>
  res.status(statusCode).json({
    success: false,
    message: label,
    error: error.message,
  });

const SearchResult = async (req, res) => {
  try {
    const result = await searchPublishedResult({
      course: req.query.course,
      symbolNumber: req.query.symbolNumber,
      examId: req.query.examId,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "No published result found for the provided course and symbol number.",
      });
    }

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const GetTopResults = async (req, res) => {
  try {
    const data = await getPublishedTopResults({
      course: req.query.course,
      examId: req.query.examId,
      limit: req.query.limit,
    });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const GetPublishedExams = async (req, res) => {
  try {
    const data = await listPublishedResultExams(req.query.course);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const GetResultCourses = async (req, res) => {
  try {
    const data = await getPublicResultCourses();
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const GetAdminResultExams = async (req, res) => {
  try {
    const data = await listAdminResultExams({
      course: req.query.course,
      status: req.query.status,
    });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    logAdminRouteError("Listing result sets", error, { query: req.query });
    return sendAdminError(res, 400, "Failed to load result sets.", error);
  }
};

const GetAdminResultCourses = async (req, res) => {
  try {
    const data = await listAdminResultCourses();
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    logAdminRouteError("Listing result courses", error);
    return sendAdminError(res, 400, "Failed to load result courses.", error);
  }
};

const CreateAdminResultExam = async (req, res) => {
  try {
    const data = await createResultExam(getRequestPayload(req));
    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    logAdminRouteError("Creating result set", error, { payload: getRequestPayload(req) });
    return sendAdminError(res, 400, "Failed to create result set.", error);
  }
};

const UpdateAdminResultExam = async (req, res) => {
  try {
    const data = await updateResultExam(req.params.examId, getRequestPayload(req));
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    logAdminRouteError("Updating result set", error, {
      examId: req.params.examId,
      payload: getRequestPayload(req),
    });
    return sendAdminError(res, 400, "Failed to update result set.", error);
  }
};

const PreviewBulkUploadResults = async (req, res) => {
  try {
    validateUploadedResultFile(req);
    const payload = getRequestPayload(req);
    const fileBuffer = await getUploadedFileBuffer(req);
    if (!fileBuffer) {
      return res.status(400).json({
        success: false,
        error: "Please upload a CSV or Excel file.",
      });
    }

    const data = await previewResultUpload({
      examId: readFieldValue(payload.examId),
      course: readFieldValue(payload.course),
      fileBuffer,
      duplicateStrategy: readFieldValue(payload.duplicateStrategy) || "block",
    });

    return res.json(data);
  } catch (error) {
    logAdminRouteError("Previewing bulk upload", error, { payload: getRequestPayload(req) });
    return sendAdminError(res, 400, "Failed to preview result file.", error);
  }
};

const ImportBulkUploadResults = async (req, res) => {
  try {
    validateUploadedResultFile(req);
    const payload = getRequestPayload(req);
    const fileBuffer = await getUploadedFileBuffer(req);
    if (!fileBuffer) {
      return res.status(400).json({
        success: false,
        error: "Please upload a CSV or Excel file.",
      });
    }

    const data = await importResultUpload({
      examId: readFieldValue(payload.examId),
      course: readFieldValue(payload.course),
      fileBuffer,
      duplicateStrategy: readFieldValue(payload.duplicateStrategy) || "block",
    });

    return res.json(data);
  } catch (error) {
    logAdminRouteError("Importing bulk upload", error, { payload: getRequestPayload(req) });
    return sendAdminError(res, 400, "Failed to import result file.", error);
  }
};

const DownloadResultTemplate = async (req, res) => {
  try {
    const { buffer, contentType, filename } = buildTemplateFile({
      course: req.query.course,
      format: req.query.format || "csv",
    });

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const PublishResultExam = async (req, res) => {
  try {
    const payload = getRequestPayload(req);
    const data = await setResultExamStatus(
      req.params.examId,
      "published",
      readFieldValue(payload.publishDate)
    );
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    logAdminRouteError("Publishing result set", error, { examId: req.params.examId });
    return sendAdminError(res, 400, "Failed to publish result set.", error);
  }
};

const UnpublishResultExam = async (req, res) => {
  try {
    const data = await setResultExamStatus(req.params.examId, "draft");
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    logAdminRouteError("Unpublishing result set", error, { examId: req.params.examId });
    return sendAdminError(res, 400, "Failed to move result set to draft.", error);
  }
};

const RecalculateExamRanks = async (req, res) => {
  try {
    const data = await recalculateExamRanks(req.params.examId);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    logAdminRouteError("Recalculating result set ranks", error, { examId: req.params.examId });
    return sendAdminError(res, 400, "Failed to recalculate ranks.", error);
  }
};

const DeleteResultExamSet = async (req, res) => {
  try {
    const data = await deleteResultExamSet(req.params.examId);
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    logAdminRouteError("Deleting result set", error, { examId: req.params.examId });
    return sendAdminError(res, 400, "Failed to delete result set.", error);
  }
};

export {
  CreateAdminResultExam,
  DeleteResultExamSet,
  DownloadResultTemplate,
  GetAdminResultCourses,
  GetAdminResultExams,
  GetPublishedExams,
  GetResultCourses,
  GetTopResults,
  ImportBulkUploadResults,
  PreviewBulkUploadResults,
  PublishResultExam,
  RecalculateExamRanks,
  SearchResult,
  UpdateAdminResultExam,
  UnpublishResultExam,
};
