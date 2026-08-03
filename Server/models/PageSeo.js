import mongoose from "mongoose";

const normalizePagePath = (value = "") => {
  const trimmed = String(value ?? "").trim();

  if (!trimmed) {
    return "/";
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  if (withLeadingSlash === "/") {
    return withLeadingSlash;
  }

  return withLeadingSlash.replace(/\/+$/, "");
};

const PageSeoSchema = new mongoose.Schema(
  {
    pagePath: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      set: normalizePagePath,
    },
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    keywords: {
      type: String,
      trim: true,
    },
    robots: {
      type: String,
      trim: true,
    },
    canonicalUrl: {
      type: String,
      trim: true,
    },
    ogTitle: {
      type: String,
      trim: true,
    },
    ogDescription: {
      type: String,
      trim: true,
    },
    ogImage: {
      type: String,
      trim: true,
    },
    twitterCard: {
      type: String,
      enum: ["summary", "summary_large_image"],
      default: "summary_large_image",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const PageSeo = mongoose.model("PageSeo", PageSeoSchema);

export default PageSeo;
