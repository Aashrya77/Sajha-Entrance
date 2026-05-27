import NoticeModel from "../../models/Notice.js";

const coerceBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true" || value === "on" || value === "1";
  }

  return Boolean(value);
};

const normalizeNoticePayload = async (request) => {
  if (request.method !== "post" || !request.payload) {
    return request;
  }

  const payload = { ...request.payload };

  if (payload.title !== undefined) {
    payload.title = String(payload.title ?? "").trim();
  }

  if (payload.url !== undefined) {
    payload.url = String(payload.url ?? "").trim();
  }

  if (payload.isActive !== undefined) {
    payload.isActive = coerceBoolean(payload.isActive);
  }

  return {
    ...request,
    payload,
  };
};

const syncActiveNoticeAfterMutation = async (response, request, context) => {
  if (request?.method !== "post") {
    return response;
  }

  const currentRecordId = response?.record?.params?._id || context?.record?.params?._id;
  const isActive = response?.record?.params?.isActive;

  if (!currentRecordId || !coerceBoolean(isActive)) {
    return response;
  }

  await NoticeModel.updateMany(
    { _id: { $ne: currentRecordId }, isActive: true },
    { $set: { isActive: false } }
  );

  return response;
};

const NoticeAdminResource = {
  resource: NoticeModel,
  options: {
    id: "Notice",
    sort: {
      sortBy: "updatedAt",
      direction: "desc",
    },
    listProperties: ["title", "url", "isActive", "updatedAt"],
    editProperties: ["title", "url", "isActive"],
    showProperties: ["title", "url", "isActive", "createdAt", "updatedAt"],
    filterProperties: ["title", "url", "isActive", "createdAt", "updatedAt"],
    actions: {
      new: {
        before: [normalizeNoticePayload],
        after: [syncActiveNoticeAfterMutation],
      },
      edit: {
        before: [normalizeNoticePayload],
        after: [syncActiveNoticeAfterMutation],
      },
    },
    properties: {
      title: {
        isTitle: true,
      },
      url: {
        label: "Link URL",
      },
      isActive: {
        type: "boolean",
      },
      createdAt: {
        isVisible: { list: false, show: true, edit: false, filter: true },
      },
      updatedAt: {
        isVisible: { list: true, show: true, edit: false, filter: true },
      },
    },
  },
};

export default NoticeAdminResource;
