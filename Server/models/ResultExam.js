import mongoose from "mongoose";

const normalizeDateValue = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const ResultExamSubjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      default: "",
      trim: true,
    },
    fullMarks: {
      type: Number,
      default: 0,
      min: 0,
    },
    passMarks: {
      type: Number,
      default: 0,
      min: 0,
    },
    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const ResultExamSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  course: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  courseName: {
    type: String,
    default: "",
    trim: true,
  },
  examDate: {
    type: Date,
    required: true,
    index: true,
  },
  publishDate: {
    type: Date,
    default: null,
  },
  description: {
    type: String,
    default: "",
    trim: true,
  },
  status: {
    type: String,
    enum: ["draft", "scheduled", "published"],
    default: "draft",
    index: true,
  },
  subjects: {
    type: [ResultExamSubjectSchema],
    default: [],
  },
  resultCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastImportedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

ResultExamSchema.index({ course: 1, examDate: -1, status: 1 });
ResultExamSchema.index({ course: 1, publishDate: -1, status: 1 });
ResultExamSchema.index({ course: 1, title: 1, examDate: 1 }, { unique: true });

ResultExamSchema.pre("save", function updateTimestamps(next) {
  this.updatedAt = new Date();

  if (this.examDate) {
    this.examDate = normalizeDateValue(this.examDate);
  }

  if (this.publishDate) {
    const publishDate = new Date(this.publishDate);
    this.publishDate = Number.isNaN(publishDate.getTime()) ? null : publishDate;
  }

  if (this.status === "published" && !this.publishDate) {
    this.publishDate = new Date();
  }

  next();
});

const ResultExamModel = mongoose.model("ResultExam", ResultExamSchema);

export default ResultExamModel;
