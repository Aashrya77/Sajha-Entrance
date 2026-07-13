import {
  MockTestResultError,
  exportInternalLeads,
  exportLockedResult,
  finalizeResult,
  generateDraftResult,
  getMockTestResultDetail,
  listMockTestsForResults,
  unlockResult,
} from "../services/mockTestResultService.js";
import { createLogger, isProduction } from "../utils/logger.js";

const logger = createLogger("mock-test-result-controller");

const getCurrentAdminId = (req) => req.session?.adminUser?.id;

const handleError = (res, error) => {
  const statusCode =
    error instanceof MockTestResultError ? error.statusCode : 500;
  if (statusCode >= 500) {
    logger.error(error.message, isProduction ? "" : error.stack);
  }
  return res.status(statusCode).json({
    success: false,
    error:
      statusCode >= 500 && isProduction
        ? "Unable to complete the result request."
        : error.message,
    ...(error.code ? { code: error.code } : {}),
  });
};

const ListMockTestsForResults = async (req, res) => {
  try {
    const data = await listMockTestsForResults({
      courseId: req.query.courseId,
      examDate: req.query.examDate,
      resultStatus: req.query.resultStatus,
      search: req.query.search,
    });
    data.capabilities = {
      canUnlock: req.session?.adminUser?.role === "super_admin",
    };
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
};

const GetMockTestResult = async (req, res) => {
  try {
    const data = await getMockTestResultDetail(req.params.mockTestId);
    return res.json({ success: true, data });
  } catch (error) {
    return handleError(res, error);
  }
};

const GenerateMockTestResultPreview = async (req, res) => {
  try {
    const data = await generateDraftResult({
      mockTestId: req.params.mockTestId,
      adminId: getCurrentAdminId(req),
      regenerate: false,
    });
    return res.json({
      success: true,
      message: "Result preview generated successfully.",
      data,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const RegenerateMockTestResult = async (req, res) => {
  try {
    const data = await generateDraftResult({
      mockTestId: req.params.mockTestId,
      adminId: getCurrentAdminId(req),
      regenerate: true,
    });
    return res.json({
      success: true,
      message: "Draft result regenerated successfully.",
      data,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const FinalizeMockTestResult = async (req, res) => {
  try {
    const data = await finalizeResult({
      mockTestId: req.params.mockTestId,
      adminId: getCurrentAdminId(req),
    });
    return res.json({
      success: true,
      message: "Result finalized and locked successfully.",
      data,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const UnlockMockTestResult = async (req, res) => {
  try {
    const data = await unlockResult({
      mockTestId: req.params.mockTestId,
      adminId: getCurrentAdminId(req),
    });
    return res.json({
      success: true,
      message: "Result unlocked. Regenerate it before locking again.",
      data,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const ExportMockTestResult = async (req, res) => {
  try {
    const { buffer, filename } = await exportLockedResult(req.params.mockTestId);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename.replace(/["\r\n]/g, "")}"`
    );
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Length", buffer.length);
    return res.send(buffer);
  } catch (error) {
    return handleError(res, error);
  }
};

const ExportMockTestInternalLeads = async (req, res) => {
  try {
    const { buffer, filename } = await exportInternalLeads({
      mockTestId: req.params.mockTestId,
      adminId: getCurrentAdminId(req),
    });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename.replace(/["\r\n]/g, "")}"`
    );
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Length", buffer.length);
    return res.send(buffer);
  } catch (error) {
    return handleError(res, error);
  }
};

export {
  ExportMockTestInternalLeads,
  ExportMockTestResult,
  FinalizeMockTestResult,
  GenerateMockTestResultPreview,
  GetMockTestResult,
  ListMockTestsForResults,
  RegenerateMockTestResult,
  UnlockMockTestResult,
};
