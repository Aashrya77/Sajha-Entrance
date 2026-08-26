import { flat } from "adminjs";
import ValidationError from "../../node_modules/adminjs/lib/backend/utils/errors/validation-error.js";
import NewsModel, { NEWS_STATUSES } from "../../models/News.js";
import { sanitizeRichHtml } from "../../utils/htmlSanitizer.js";
import { findAvailableSlug, slugify } from "../../utils/slug.js";
import { hasPermission } from "../utils/admin-auth.js";
import { Components } from "../ComponentLoader.js";
import { createSingleImageUpload } from "./helpers/single-image-upload.js";

const newsUpload = createSingleImageUpload({
  keyProperty: "featuredImage",
  propertyBase: "featuredImage",
  label: "Featured image",
  entityName: "news image",
  storageFolder: "news",
  publicBaseUrl: "/media/news",
  description: "Upload the image used on News cards and the News detail page.",
});

const PUBLISHING_FIELDS = ["status", "publishAt", "publishedAt"];

const getPayloadValue = (payload, propertyName, fallback) => {
  const value = flat.get(payload, propertyName);
  return value === undefined ? fallback : value;
};

const enforcePublishPermission = (request, context) => {
  if (request.method !== "post" || !request.payload) return request;

  const canPublish = hasPermission(context.currentAdmin, "news", "publish");
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
        message: "You need News publish permission to publish, unpublish, or reschedule News.",
      },
    });
  }

  return request;
};

const normalizeNewsPayload = async (request, context) => {
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
      await findAvailableSlug(NewsModel, slugify(nextSlugSource), context.record?.params?._id)
    );
  }

  if (flat.get(payload, "content") !== undefined) {
    payload = flat.set(payload, "content", sanitizeRichHtml(flat.get(payload, "content")));
  }

  return { ...request, payload };
};

const publishNews = async (_request, _response, context) => {
  await context.record.update({
    status: "published",
    publishAt: null,
    publishedAt: new Date(),
  });

  return {
    record: context.record.toJSON(context.currentAdmin),
    notice: { message: "News published.", type: "success" },
  };
};

const unpublishNews = async (_request, _response, context) => {
  await context.record.update({ status: "draft" });

  return {
    record: context.record.toJSON(context.currentAdmin),
    notice: { message: "News moved back to draft.", type: "success" },
  };
};

const NewsAdminResource = {
  resource: NewsModel,
  features: [newsUpload.feature],
  options: {
    id: "News",
    navigation: { name: "Content", icon: "Newspaper" },
    sort: { sortBy: "updatedAt", direction: "desc" },
    listProperties: ["title", "category", "status", "featured", "publishedAt", "updatedAt"],
    editProperties: [
      "title",
      "slug",
      "legacyId",
      "excerpt",
      "content",
      newsUpload.fields.fileProperty,
      "imageAlt",
      "category",
      "tags",
      "author",
      "sourceName",
      "sourceUrl",
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
      newsUpload.fields.fileProperty,
      "imageAlt",
      "category",
      "tags",
      "author",
      "sourceName",
      "sourceUrl",
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
    filterProperties: ["title", "category", "status", "featured", "publishAt", "publishedAt", "updatedAt"],
    actions: {
      new: {
        before: [enforcePublishPermission, normalizeNewsPayload, ...(newsUpload.actionHooks.new?.before || [])],
      },
      edit: {
        before: [enforcePublishPermission, normalizeNewsPayload, ...(newsUpload.actionHooks.edit?.before || [])],
      },
      delete: {
        guard: "Delete this News record? Archiving is safer for normal content lifecycle.",
      },
      bulkDelete: {
        guard: "Delete selected News records? Archiving is safer for normal content lifecycle.",
      },
      publish: {
        actionType: "record",
        icon: "Send",
        guard: "Publish this News record immediately?",
        handler: publishNews,
      },
      unpublish: {
        actionType: "record",
        icon: "Undo",
        guard: "Move this News record back to draft?",
        handler: unpublishNews,
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
        description: "Used only to preserve old /news/:id URLs.",
        position: 30,
      },
      excerpt: { type: "textarea", position: 40 },
      content: {
        type: "richtext",
        components: { edit: Components.RichTextEditor },
        position: 50,
      },
      category: { position: 80 },
      tags: { position: 90 },
      status: {
        availableValues: NEWS_STATUSES.map((status) => ({ value: status, label: status })),
        position: 120,
      },
      featured: { type: "boolean", position: 130 },
      publishAt: {
        label: "Scheduled publish time",
        description: "Future dates remain hidden publicly until this time.",
        position: 140,
      },
      publishedAt: {
        label: "Published time",
        description: "Set automatically for immediate publishing.",
        position: 150,
      },
      metaDescription: { type: "textarea" },
      ogDescription: { type: "textarea" },
      ...newsUpload.propertyOptions,
    },
  },
};

export { enforcePublishPermission as enforceNewsPublishPermission, normalizeNewsPayload };
export default NewsAdminResource;
