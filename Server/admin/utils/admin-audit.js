import AdminActivityModel from "../../models/AdminActivity.js";
import AdminNotificationModel from "../../models/AdminNotification.js";
import { createLogger } from "../../utils/logger.js";

const AUDIT_EXCLUDED_RESOURCES = new Set(["AdminActivity", "AdminNotification"]);
const logger = createLogger("admin-audit");

const toRecordParams = (record) => record?.params || {};

const getRecordTitle = (record, resourceId) => {
  const params = toRecordParams(record);
  return (
    params.title ||
    params.fullName ||
    params.name ||
    params.studentName ||
    params.blogTitle ||
    params.collegeName ||
    params.universityName ||
    params.popupTitle ||
    params.advertisementName ||
    params.transactionUuid ||
    params.email ||
    params._id ||
    resourceId
  );
};

const createAdminActivity = async ({
  currentAdmin,
  action,
  resource,
  record,
  message,
  meta = {},
}) => {
  await AdminActivityModel.create({
    actor: currentAdmin?.id || null,
    actorName: currentAdmin?.fullName || currentAdmin?.email || "System",
    actorEmail: currentAdmin?.email || "",
    actorRole: currentAdmin?.role || "system",
    action,
    resource,
    recordId: record?.id || record?.params?._id || "",
    message,
    meta,
  });
};

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

const buildAuditMessage = ({ actionName, resourceId, record }) => {
  const recordTitle = getRecordTitle(record, resourceId);
  const actionLabel =
    actionName === "new" ? "created" : actionName === "edit" ? "updated" : "deleted";

  if (resourceId === "Student" && actionName === "new") {
    return `Added student ${recordTitle}.`;
  }

  if (resourceId === "Payment" && actionName === "edit") {
    return `Updated payment ${recordTitle}.`;
  }

  if (resourceId === "Course" && actionName === "edit") {
    return `Updated course ${recordTitle}.`;
  }

  return `${resourceId} ${recordTitle} was ${actionLabel}.`;
};

const createAuditAfterHook = (actionName, resourceId) => async (response, request, context) => {
  if (request.method !== "post" || AUDIT_EXCLUDED_RESOURCES.has(resourceId)) {
    return response;
  }

  const record = response.record || context.record;
  if (!record) {
    return response;
  }

  const message = buildAuditMessage({ actionName, resourceId, record });
  const meta = {
    actionName,
    resourceId,
  };

  try {
    await createAdminActivity({
      currentAdmin: context.currentAdmin,
      action: actionName,
      resource: resourceId,
      record,
      message,
      meta,
    });

    const notificationPayload = buildNotificationPayload({
      resourceId,
      actionName,
      record,
    });

    if (notificationPayload) {
      await createAdminNotification(notificationPayload);
    }
  } catch (error) {
    logger.error("Admin audit log error:", error);
  }

  return response;
};

const logAdminLogin = async (currentAdmin) => {
  await createAdminActivity({
    currentAdmin,
    action: "login",
    resource: "Auth",
    record: null,
    message: `${currentAdmin.fullName || currentAdmin.email} signed in to the admin panel.`,
  });
};

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
