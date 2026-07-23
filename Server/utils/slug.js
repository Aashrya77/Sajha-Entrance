import mongoose from "mongoose";

const DEFAULT_SLUG = "item";

export const slugify = (value = "") => {
  const slug = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  return slug || DEFAULT_SLUG;
};

// Backward-compatible normalizer used by mock tests and past questions.
// Unlike public document slugs, those callers intentionally handle an empty
// result themselves.
export const slugifyText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 160);

const findAvailableSlug = async (model, source, excludedId) => {
  const baseSlug = slugify(source);
  let candidate = baseSlug;
  let suffix = 2;

  while (
    await model.exists({
      slug: candidate,
      ...(excludedId ? { _id: { $ne: excludedId } } : {}),
    })
  ) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

export const addSlugField = (schema, sourceField) => {
  schema.add({
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      unique: true,
      sparse: true,
    },
  });

  schema.pre("validate", async function generateDocumentSlug() {
    // Keep published URLs stable when an editor later adjusts the title.
    if (this.slug) {
      return;
    }

    this.slug = await findAvailableSlug(
      this.constructor,
      this.get(sourceField),
      this._id
    );
  });
};

export const buildPublicIdentifierFilter = (identifier) => {
  const value = String(identifier || "").trim();

  if (mongoose.Types.ObjectId.isValid(value)) {
    return { $or: [{ _id: value }, { slug: value }] };
  }

  return { slug: value.toLowerCase() };
};

export const backfillModelSlugs = async (model, sourceField) => {
  const records = await model
    .find({ $or: [{ slug: { $exists: false } }, { slug: "" }, { slug: null }] })
    .select(`_id ${sourceField}`)
    .exec();

  for (const record of records) {
    record.slug = await findAvailableSlug(model, record.get(sourceField), record._id);
    await record.save();
  }

  return records.length;
};
