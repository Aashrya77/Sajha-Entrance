import mongoose from "mongoose";
import { slugifyText } from "../utils/slug.js";

const MOCK_TEST_SUBJECT_STATUSES = ["active", "inactive"];

const MockTestSubjectSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MockTestCourse",
      required: [true, "Select a course for this subject."],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Subject name is required."],
      trim: true,
      maxlength: 140,
    },
    slug: {
      type: String,
      required: [true, "Slug is required."],
      trim: true,
      lowercase: true,
      maxlength: 160,
      validate: {
        validator: async function validateUniqueSubjectSlug(value) {
          const normalizedSlug = slugifyText(value);
          if (!normalizedSlug || !this.course) {
            return true;
          }

          const existingSubject = await this.constructor.exists({
            _id: { $ne: this._id },
            course: this.course,
            slug: normalizedSlug,
          });

          return !existingSubject;
        },
        message: "This subject slug is already in use for the selected course.",
      },
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: MOCK_TEST_SUBJECT_STATUSES,
      default: "active",
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    totalQuestionCount: {
      type: Number,
      default: 0,
    },
    questionDraftCount: {
      type: Number,
      default: 0,
    },
    questionPublishedCount: {
      type: Number,
      default: 0,
    },
    lastQuestionUploadAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

MockTestSubjectSchema.pre("validate", function syncSubjectSlug(next) {
  const nextName = String(this.name || "").trim();
  const shouldRegenerateSlug =
    this.isNew || this.isModified("name") || this.isModified("slug") || !String(this.slug || "").trim();

  if (shouldRegenerateSlug) {
    this.slug = slugifyText(this.slug || nextName);
  }

  if (!this.slug) {
    this.invalidate("slug", "Slug could not be generated. Please provide a valid subject name.");
  }

  next();
});

MockTestSubjectSchema.index({ course: 1, slug: 1 }, { unique: true });
MockTestSubjectSchema.index({ course: 1, status: 1, displayOrder: 1, name: 1 });

const MockTestSubjectModel = mongoose.model("MockTestSubject", MockTestSubjectSchema);

export { MOCK_TEST_SUBJECT_STATUSES };
export default MockTestSubjectModel;
