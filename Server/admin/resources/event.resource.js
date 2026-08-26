import { flat } from "adminjs";
import ValidationError from "../../node_modules/adminjs/lib/backend/utils/errors/validation-error.js";
import EventModel, { EVENT_STATUSES } from "../../models/Event.js";
import { sanitizeRichHtml } from "../../utils/htmlSanitizer.js";
import { findAvailableSlug, slugify } from "../../utils/slug.js";
import { hasPermission } from "../utils/admin-auth.js";
import { Components } from "../ComponentLoader.js";
import { createSingleImageUpload } from "./helpers/single-image-upload.js";

const eventUpload = createSingleImageUpload({
  keyProperty: "featuredImage",
  propertyBase: "featuredImage",
  label: "Featured image",
  entityName: "event image",
  storageFolder: "event",
  publicBaseUrl: "/media/event",
  description: "Upload the image used on Event cards and the Event detail page.",
});

const PUBLISHING_FIELDS = ["status", "publishAt", "publishedAt"];

const getPayloadValue = (payload, propertyName, fallback) => {
  const value = flat.get(payload, propertyName);
  return value === undefined ? fallback : value;
};

const enforcePublishPermission = (request, context) => {
  if (request.method !== "post" || !request.payload) return request;

  const canPublish = hasPermission(context.currentAdmin, "events", "publish");
  if (canPublish) return request;

  const currentStatus = context.record?.params?.status || "draft";
  const nextStatus = getPayloadValue(request.payload, "status", currentStatus);
  const statusChanged = nextStatus !== currentStatus;
  const publishFieldChanged = PUBLISHING_FIELDS.some((fieldName) =>
    flat.get(request.payload, fieldName) !== undefined
  );

  if (
    (statusChanged && (currentStatus === "published" || nextStatus === "published")) ||
    (nextStatus === "published" && publishFieldChanged)
  ) {
    throw new ValidationError({
      status: {
        message: "You need Events publish permission to publish, unpublish, or reschedule Events.",
      },
    });
  }

  return request;
};

const normalizeEventPayload = async (request, context) => {
  if (request.method !== "post" || !request.payload) return request;

  let payload = { ...request.payload };

  if (flat.get(payload, "title") !== undefined) {
    payload = flat.set(payload, "title", String(flat.get(payload, "title") || "").trim());
  }

  if (flat.get(payload, "slug") !== undefined || flat.get(payload, "title") !== undefined) {
    const nextSlugSource =
      String(flat.get(payload, "slug") || "").trim() ||
      String(flat.get(payload, "title") || context.record?.params?.title || "").trim();
    payload = flat.set(
      payload,
      "slug",
      await findAvailableSlug(EventModel, slugify(nextSlugSource), context.record?.params?._id)
    );
  }

  if (flat.get(payload, "content") !== undefined) {
    payload = flat.set(payload, "content", sanitizeRichHtml(flat.get(payload, "content")));
  }

  return { ...request, payload };
};

const publishEvent = async (_request, _response, context) => {
  await context.record.update({
    status: "published",
    publishAt: null,
    publishedAt: new Date(),
  });

  return {
    record: context.record.toJSON(context.currentAdmin),
    notice: { message: "Event published.", type: "success" },
  };
};

const unpublishEvent = async (_request, _response, context) => {
  await context.record.update({ status: "draft" });

  return {
    record: context.record.toJSON(context.currentAdmin),
    notice: { message: "Event moved back to draft.", type: "success" },
  };
};

const EventAdminResource = {
  resource: EventModel,
  features: [eventUpload.feature],
  options: {
    id: "Event",
    navigation: { name: "Content", icon: "Calendar" },
    sort: { sortBy: "startAt", direction: "asc" },
    listProperties: ["title", "startAt", "venue", "status", "featured", "updatedAt"],
    editProperties: [
      "title",
      "slug",
      "legacyId",
      "excerpt",
      "content",
      eventUpload.fields.fileProperty,
      "imageAlt",
      "category",
      "startAt",
      "endAt",
      "venue",
      "address",
      "organizer",
      "contact",
      "registrationUrl",
      "externalUrl",
      "status",
      "featured",
      "publishAt",
      "publishedAt",
      "seoTitle",
      "metaDescription",
      "canonicalUrl",
      "ogTitle",
      "ogDescription",
      "ogImage",
    ],
    showProperties: [
      "title",
      "slug",
      "legacyId",
      "excerpt",
      "content",
      eventUpload.fields.fileProperty,
      "imageAlt",
      "category",
      "startAt",
      "endAt",
      "venue",
      "address",
      "organizer",
      "contact",
      "registrationUrl",
      "externalUrl",
      "status",
      "featured",
      "publishAt",
      "publishedAt",
      "seoTitle",
      "metaDescription",
      "canonicalUrl",
      "ogTitle",
      "ogDescription",
      "ogImage",
      "createdAt",
      "updatedAt",
    ],
    filterProperties: ["title", "category", "status", "featured", "startAt", "venue", "updatedAt"],
    actions: {
      new: {
        before: [enforcePublishPermission, normalizeEventPayload, ...(eventUpload.actionHooks.new?.before || [])],
      },
      edit: {
        before: [enforcePublishPermission, normalizeEventPayload, ...(eventUpload.actionHooks.edit?.before || [])],
      },
      delete: {
        guard: "Delete this Event record? Archiving is safer for normal content lifecycle.",
      },
      bulkDelete: {
        guard: "Delete selected Event records? Archiving is safer for normal content lifecycle.",
      },
      publish: {
        actionType: "record",
        icon: "Send",
        guard: "Publish this Event immediately?",
        handler: publishEvent,
      },
      unpublish: {
        actionType: "record",
        icon: "Undo",
        guard: "Move this Event back to draft?",
        handler: unpublishEvent,
      },
    },
    properties: {
      title: { isTitle: true, position: 10 },
      slug: {
        label: "Public URL slug",
        description: "Changing this intentionally changes the public URL. Existing legacy IDs still resolve.",
        position: 20,
      },
      legacyId: {
        label: "Legacy URL ID",
        description: "Used only to preserve old /events/:id URLs.",
        position: 30,
      },
      excerpt: { type: "textarea", position: 40 },
      content: {
        type: "richtext",
        components: { edit: Components.RichTextEditor },
        position: 50,
      },
      category: { position: 80 },
      status: {
        availableValues: EVENT_STATUSES.map((status) => ({ value: status, label: status })),
        position: 150,
      },
      featured: { type: "boolean", position: 160 },
      publishAt: {
        label: "Scheduled publish time",
        description: "Future dates remain hidden publicly until this time.",
        position: 170,
      },
      publishedAt: {
        label: "Published time",
        description: "Set automatically for immediate publishing.",
        position: 180,
      },
      metaDescription: { type: "textarea" },
      ogDescription: { type: "textarea" },
      ...eventUpload.propertyOptions,
    },
  },
};

export { enforcePublishPermission as enforceEventPublishPermission, normalizeEventPayload };
export default EventAdminResource;
