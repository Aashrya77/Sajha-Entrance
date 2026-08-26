import mongoose from "mongoose";
import { findAvailableSlug, slugify } from "../utils/slug.js";
import { sanitizeRichHtml } from "../utils/htmlSanitizer.js";

const NEWS_STATUSES = ["draft", "published", "archived"];
const URL_FIELDS = ["sourceUrl", "canonicalUrl", "ogImage"];

const normalizeOptionalString = (value = "") => String(value || "").trim();

const isValidOptionalUrl = (value = "") => {
  const normalizedValue = normalizeOptionalString(value);
  if (!normalizedValue) return true;

  try {
    const parsedUrl = new URL(normalizedValue);
    return ["http:", "https:"].includes(parsedUrl.protocol);
  } catch (_error) {
    return false;
  }
};

const getEffectivePublicationDate = (record) => {
  const publishAt = record?.publishAt instanceof Date ? record.publishAt : null;
  const publishedAt = record?.publishedAt instanceof Date ? record.publishedAt : null;
  return publishAt || publishedAt || null;
};

const buildPublicNewsFilter = (now = new Date()) => ({
  status: "published",
  $or: [
    { publishAt: { $lte: now } },
    {
      $and: [
        { $or: [{ publishAt: { $exists: false } }, { publishAt: null }] },
        { publishedAt: { $lte: now } },
      ],
    },
  ],
});

const NewsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    legacyId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    excerpt: { type: String, required: true, trim: true, maxlength: 500 },
    content: { type: String, default: "" },
    featuredImage: String,
    featuredImageMimeType: String,
    featuredImageFilename: String,
    featuredImageSize: Number,
    imageAlt: { type: String, trim: true, maxlength: 180 },
    category: { type: String, trim: true, maxlength: 80, default: "General" },
    tags: [{ type: String, trim: true, maxlength: 60 }],
    author: { type: String, trim: true, maxlength: 120 },
    sourceName: { type: String, trim: true, maxlength: 120 },
    sourceUrl: {
      type: String,
      trim: true,
      validate: { validator: isValidOptionalUrl, message: "Source URL must be a valid HTTP(S) URL." },
    },
    status: { type: String, enum: NEWS_STATUSES, default: "draft", index: true },
    featured: { type: Boolean, default: false, index: true },
    publishAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    seoTitle: { type: String, trim: true, maxlength: 180 },
    metaDescription: { type: String, trim: true, maxlength: 320 },
    canonicalUrl: {
      type: String,
      trim: true,
      validate: { validator: isValidOptionalUrl, message: "Canonical URL must be a valid HTTP(S) URL." },
    },
    ogTitle: { type: String, trim: true, maxlength: 180 },
    ogDescription: { type: String, trim: true, maxlength: 320 },
    ogImage: {
      type: String,
      trim: true,
      validate: { validator: isValidOptionalUrl, message: "Open Graph image must be a valid HTTP(S) URL." },
    },
  },
  { timestamps: true }
);

NewsSchema.index({ status: 1, publishedAt: -1 });
NewsSchema.index({ status: 1, publishAt: -1 });
NewsSchema.index({ featured: 1, status: 1, publishedAt: -1 });

NewsSchema.pre("validate", async function normalizeNewsDocument() {
  this.title = normalizeOptionalString(this.title);
  this.excerpt = normalizeOptionalString(this.excerpt);
  this.legacyId = normalizeOptionalString(this.legacyId) || undefined;
  this.category = normalizeOptionalString(this.category) || "General";
  this.content = sanitizeRichHtml(this.content);
  this.tags = Array.isArray(this.tags)
    ? [...new Set(this.tags.map(normalizeOptionalString).filter(Boolean))]
    : [];

  URL_FIELDS.forEach((fieldName) => {
    this[fieldName] = normalizeOptionalString(this[fieldName]);
  });

  this.slug = await findAvailableSlug(
    this.constructor,
    this.slug ? slugify(this.slug) : this.title,
    this._id
  );

  if (this.status === "published") {
    const now = new Date();
    const publishAtTime = this.publishAt instanceof Date ? this.publishAt.getTime() : NaN;

    if (!this.publishAt || publishAtTime <= now.getTime()) {
      this.publishedAt = this.publishedAt instanceof Date ? this.publishedAt : now;
    }
  }
});

NewsSchema.statics.buildPublicFilter = buildPublicNewsFilter;
NewsSchema.methods.getEffectivePublicationDate = function getNewsEffectivePublicationDate() {
  return getEffectivePublicationDate(this);
};

const NewsModel = mongoose.model("News", NewsSchema);

export { NEWS_STATUSES, buildPublicNewsFilter, getEffectivePublicationDate };
export default NewsModel;
