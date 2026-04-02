import AdminNotificationModel from "../../models/AdminNotification.js";
import { createLogger } from "../../utils/logger.js";

const NOTIFICATION_EXCLUDED_RESOURCES = new Set(["AdminNotification"]);
const logger = createLogger("admin-audit");

const toRecordParams = (record) => record?.params || {};

const createAdminNotification = async ({ title, message, type = "info", resource = "" }) => {
  await AdminNotificationModel.create({
    title,
    message,
    type,
    resource,
  });
};

const buildNotificationPayload = ({ resourceId, actionName, record }) => {
  const params = toRecordParams(record);

  if (resourceId === "Student" && actionName === "new") {
    return {
      title: "New student registered",
      message: `${params.name || "A student"} joined ${params.course || "a course"}.`,
      type: "success",
      resource: resourceId,
    };
  }

  if (resourceId === "Payment" && actionName === "new") {
    return {
      title: "New payment received",
      message: `${params.studentName || "A student"} submitted Rs. ${params.totalAmount || 0}.`,
      type: "success",
      resource: resourceId,
    };
  }

  if (resourceId === "Payment" && actionName === "edit") {
    const status = params.status;
    if (status === "failed" || status === "canceled" || status === "refunded") {
      return {
        title: "Payment needs attention",
        message: `${params.studentName || "A payment"} is now marked as ${status}.`,
        type: status === "failed" ? "error" : "warning",
        resource: resourceId,
      };
    }
  }

  return null;
};

const createAuditAfterHook = (actionName, resourceId) => async (response, request, context) => {
  if (request.method !== "post" || NOTIFICATION_EXCLUDED_RESOURCES.has(resourceId)) {
    return response;
  }

  const record = response.record || context.record;
  if (!record) {
    return response;
  }

  try {
    const notificationPayload = buildNotificationPayload({
      resourceId,
      actionName,
      record,
    });

    if (notificationPayload) {
      await createAdminNotification(notificationPayload);
    }
  } catch (error) {
    logger.error("Admin notification hook error:", error);
  }

  return response;
};

const logAdminLogin = async () => {};

const logAdminSystemError = async (source, error) => {
  try {
    await createAdminNotification({
      title: "Admin error detected",
      message: `${source}: ${error.message}`,
      type: "error",
      resource: source,
    });
  } catch (notificationError) {
    logger.error("Admin notification error:", notificationError);
  }
};

export {
  createAdminNotification,
  createAuditAfterHook,
  logAdminLogin,
  logAdminSystemError,
};
