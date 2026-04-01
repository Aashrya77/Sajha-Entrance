import AdminNotificationModel from "../../models/AdminNotification.js";
import { hasPermission } from "../utils/admin-auth.js";

const markAsReadHandler = async (request, response, context) => {
  const { record } = context;

  if (!record) {
    return {
      record: null,
      notice: {
        message: "Notification record not found.",
        type: "error",
      },
    };
  }

  await record.update({
    isRead: true,
    readAt: new Date(),
  });

  return {
    record: record.toJSON(context.currentAdmin),
    notice: {
      message: "Notification marked as read.",
      type: "success",
    },
  };
};

const AdminNotificationAdminResource = {
  resource: AdminNotificationModel,
  options: {
    id: "AdminNotification",
    navigation: { name: "Administration", icon: "Notification" },
    listProperties: ["createdAt", "title", "type", "isRead"],
    editProperties: ["isRead"],
    showProperties: ["title", "message", "type", "resource", "isRead", "readAt", "createdAt"],
    filterProperties: ["type", "isRead", "resource", "createdAt"],
    actions: {
      new: { isAccessible: false },
      delete: { isAccessible: false },
      bulkDelete: { isAccessible: false },
      markAsRead: {
        actionType: "record",
        icon: "Check",
        guard: "Mark this notification as read?",
        isAccessible: ({ currentAdmin }) => hasPermission(currentAdmin, "write"),
        isVisible: ({ record }) => !record?.params?.isRead,
        handler: markAsReadHandler,
      },
    },
    properties: {
      message: {
        type: "textarea",
      },
      readAt: {
        isVisible: { list: false, show: true, edit: false, filter: true },
      },
      createdAt: {
        isVisible: { list: true, show: true, edit: false, filter: true },
      },
      updatedAt: {
        isVisible: false,
      },
    },
  },
};

export default AdminNotificationAdminResource;
