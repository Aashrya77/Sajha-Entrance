import mongoose from "mongoose";
import {
  QUESTION_BANK_EXAMS,
  QUESTION_BANK_RESOURCE_TYPES,
  QUESTION_BANK_SUBJECTS,
  QUESTION_BANK_TYPES,
} from "../constants/questionBank.js";
import { slugifyText } from "../utils/slug.js";

const { Schema } = mongoose;

const QuestionBankSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    exam: {
      type: String,
      enum: QUESTION_BANK_EXAMS,
      required: true,
      index: true,
    },
    subject: {
      type: String,
      enum: QUESTION_BANK_SUBJECTS,
      required: true,
      index: true,
    },
    questionType: {
      type: String,
      enum: QUESTION_BANK_TYPES,
      required: true,
      index: true,
    },
    year: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    thumbnailUrl: {
      type: String,
      default: "",
      trim: true,
    },
    thumbnailMimeType: String,
    thumbnailFilename: String,
    thumbnailSize: Number,
    resourceType: {
      type: String,
      enum: QUESTION_BANK_RESOURCE_TYPES,
      required: true,
      default: "PDF",
      index: true,
    },
    pdfUrl: {
      type: String,
      default: "",
      trim: true,
    },
    pdfMimeType: String,
    pdfFilename: String,
    pdfSize: Number,
    imageUrls: {
      type: [String],
      default: [],
    },
    resourceImagesMimeType: {
      type: [String],
      default: [],
    },
    resourceImagesFilename: {
      type: [String],
      default: [],
    },
    resourceImagesSize: {
      type: [Number],
      default: [],
    },
    allowDownload: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    viewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    pageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    imageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },
  },
  {
    collection: "question_bank",
    timestamps: true,
  }
);

QuestionBankSchema.pre("validate", function normalizeQuestionBank(next) {
  if (!this.slug && this.title) {
    this.slug = slugifyText(this.title);
  } else if (this.slug) {
    this.slug = slugifyText(this.slug);
  }

  this.imageUrls = Array.isArray(this.imageUrls)
    ? this.imageUrls.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
  this.imageCount = this.resourceType === "Images" ? this.imageUrls.length : 0;

  if (this.resourceType === "Images") {
    this.pageCount = this.imageCount;
  }

  next();
});

QuestionBankSchema.index({
  title: "text",
  exam: "text",
  subject: "text",
  year: "text",
});
QuestionBankSchema.index({ isPublished: 1, displayOrder: 1, createdAt: -1 });
QuestionBankSchema.index({ exam: 1, subject: 1, questionType: 1, year: -1 });
QuestionBankSchema.index({ viewsCount: -1, createdAt: -1 });

const QuestionBankModel = mongoose.model("QuestionBank", QuestionBankSchema);

export default QuestionBankModel;
