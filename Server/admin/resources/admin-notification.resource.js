import AdminNotificationModel from "../../models/AdminNotification.js";

const coerceBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true" || value === "on" || value === "1";
  }

  return Boolean(value);
};

const syncReadState = async (request) => {
  if (request.method !== "post" || !request.payload || request.payload.isRead === undefined) {
    return request;
  }

  const isRead = coerceBoolean(request.payload.isRead);

  return {
    ...request,
    payload: {
      ...request.payload,
      isRead,
      readAt: isRead ? new Date() : null,
    },
  };
};

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
      edit: {
        before: [syncReadState],
      },
      markAsRead: {
        actionType: "record",
        icon: "Check",
        guard: "Mark this notification as read?",
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
