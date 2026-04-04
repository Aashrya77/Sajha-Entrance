import mongoose from "mongoose";

const normalizeSymbolNumber = (value) => String(value || "").trim().toUpperCase();
const normalizeDateValue = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const SubjectSchema = new mongoose.Schema(
  {
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    fullMarks: {
      type: Number,
      required: true,
      min: 0,
    },
    passMarks: {
      type: Number,
      required: true,
      min: 0,
    },
    obtainedMarks: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Pass", "Fail"],
      default: "Fail",
    },
  },
  { _id: false }
);

const StudentResultSchema = new mongoose.Schema({
  symbolNumber: {
    type: String,
    required: true,
    index: true,
    set: normalizeSymbolNumber,
  },
  studentName: {
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
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ResultExam",
    index: true,
    default: null,
  },
  examDate: {
    type: Date,
    required: true,
    index: true,
  },
  subjects: {
    type: [SubjectSchema],
    default: [],
  },
  totalFullMarks: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalPassMarks: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalObtainedMarks: {
    type: Number,
    default: 0,
    min: 0,
    index: true,
  },
  percentage: {
    type: Number,
    default: 0,
    min: 0,
    index: true,
  },
  resultStatus: {
    type: String,
    enum: ["Pass", "Fail"],
    default: "Fail",
    index: true,
  },
  result: {
    type: String,
    enum: ["Pass", "Fail"],
    default: "Fail",
    index: true,
  },
  rank: {
    type: Number,
    default: null,
    min: 1,
    index: true,
  },
  remarks: {
    type: String,
    default: "",
    trim: true,
  },
  publishedAt: {
    type: Date,
    default: null,
  },
  lastCalculatedAt: {
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

StudentResultSchema.index(
  { exam: 1, course: 1, symbolNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      exam: { $exists: true },
    },
  }
);

StudentResultSchema.index({ course: 1, symbolNumber: 1, examDate: -1 });
StudentResultSchema.index({ exam: 1, course: 1, rank: 1 });

StudentResultSchema.pre("save", function calculateTotals(next) {
  this.updatedAt = new Date();

  if (this.examDate) {
    this.examDate = normalizeDateValue(this.examDate);
  }

  if (Array.isArray(this.subjects) && this.subjects.length > 0) {
    this.subjects = this.subjects.map((subject) => {
      const normalizedSubject = subject?.toObject
        ? subject.toObject()
        : { ...subject };
      normalizedSubject.status =
        Number(normalizedSubject.obtainedMarks || 0) >= Number(normalizedSubject.passMarks || 0)
          ? "Pass"
          : "Fail";
      return normalizedSubject;
    });

    this.totalFullMarks = this.subjects.reduce(
      (sum, subject) => sum + Number(subject.fullMarks || 0),
      0
    );
    this.totalPassMarks = this.subjects.reduce(
      (sum, subject) => sum + Number(subject.passMarks || 0),
      0
    );
    this.totalObtainedMarks = this.subjects.reduce(
      (sum, subject) => sum + Number(subject.obtainedMarks || 0),
      0
    );
    this.percentage =
      this.totalFullMarks > 0
        ? Number(((this.totalObtainedMarks / this.totalFullMarks) * 100).toFixed(2))
        : 0;

    const finalStatus = this.subjects.every((subject) => subject.status === "Pass")
      ? "Pass"
      : "Fail";

    this.resultStatus = finalStatus;
    this.result = finalStatus;
    this.lastCalculatedAt = new Date();
  }

  next();
});

const StudentResultModel = mongoose.model("StudentResult", StudentResultSchema);

export { normalizeSymbolNumber };
export default StudentResultModel;
