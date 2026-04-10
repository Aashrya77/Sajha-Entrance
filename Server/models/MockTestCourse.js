import mongoose from "mongoose";
import { slugifyText } from "../utils/slug.js";

const MOCK_TEST_COURSE_STATUSES = ["active", "inactive"];

const MockTestCourseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Course name is required."],
      trim: true,
      unique: true,
      maxlength: 140,
      validate: {
        validator: async function validateUniqueCourseName(value) {
          const normalizedName = String(value || "").trim();
          if (!normalizedName) {
            return true;
          }

          const existingCourse = await this.constructor.exists({
            _id: { $ne: this._id },
            name: normalizedName,
          });

          return !existingCourse;
        },
        message: "A mock test course with this name already exists.",
      },
    },
    slug: {
      type: String,
      required: [true, "Slug is required."],
      trim: true,
      lowercase: true,
      maxlength: 160,
      validate: {
        validator: async function validateUniqueCourseSlug(value) {
          const normalizedSlug = slugifyText(value);
          if (!normalizedSlug) {
            return true;
          }

          const existingCourse = await this.constructor.exists({
            _id: { $ne: this._id },
            slug: normalizedSlug,
          });

          return !existingCourse;
        },
        message: "This mock test course slug is already in use.",
      },
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: MOCK_TEST_COURSE_STATUSES,
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

MockTestCourseSchema.pre("validate", function syncCourseSlug(next) {
  const nextName = String(this.name || "").trim();
  const shouldRegenerateSlug =
    this.isNew || this.isModified("name") || this.isModified("slug") || !String(this.slug || "").trim();

  if (shouldRegenerateSlug) {
    this.slug = slugifyText(this.slug || nextName);
  }

  if (!this.slug) {
    this.invalidate("slug", "Slug could not be generated. Please provide a valid course name.");
  }

  next();
});

MockTestCourseSchema.index({ slug: 1 }, { unique: true });
MockTestCourseSchema.index({ status: 1, name: 1 });

const MockTestCourseModel = mongoose.model("MockTestCourse", MockTestCourseSchema);

export { MOCK_TEST_COURSE_STATUSES };
export default MockTestCourseModel;
