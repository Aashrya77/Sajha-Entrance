import mongoose from "mongoose";
import { Schema } from "mongoose";

const QuestionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  questionImage: String,
  options: [
    {
      text: { type: String, required: true },
      image: String,
    },
  ],
  correctOption: {
    type: Number,
    required: true,
    min: 0,
    max: 3,
  },
  explanation: String,
  marks: {
    type: Number,
    default: 1,
  },
  negativeMarks: {
    type: Number,
    default: 0,
  },
});

const MockTestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  admissionTest: {
    type: String,
    default: "",
  },
  course: {
    type: String,
    default: "",
  },
  totalMarks: {
    type: Number,
    default: 0,
  },
  duration: {
    type: Number,
    default: 60,
  },
  questions: [QuestionSchema],
  isActive: {
    type: Boolean,
    default: true,
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

MockTestSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  if (this.questions && this.questions.length > 0) {
    this.totalMarks = this.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  }
  next();
});

const MockTestModel = mongoose.model("MockTest", MockTestSchema);

export const MockTestFileModel = {
  resource: MockTestModel,
  options: {
    id: "MockTest",
    properties: {
      title: {
        type: "string",
        isVisible: { list: true, show: true, edit: true, filter: true },
      },
      admissionTest: {
        type: "string",
        isVisible: { list: true, show: true, edit: true, filter: true },
      },
      course: {
        type: "string",
        isVisible: { list: true, show: true, edit: true, filter: true },
      },
      description: {
        type: "textarea",
        isVisible: { list: false, show: true, edit: true, filter: false },
      },
      totalMarks: {
        type: "number",
        isVisible: { list: true, show: true, edit: false, filter: false },
      },
      duration: {
        type: "number",
        isVisible: { list: true, show: true, edit: true, filter: false },
      },
      isActive: {
        type: "boolean",
        isVisible: { list: true, show: true, edit: true, filter: true },
      },
      questions: {
        type: "mixed",
        isVisible: { list: false, show: true, edit: true, filter: false },
      },
    },
  },
};

export default MockTestModel;

// MockTestAttempt - stores student attempts
const MockTestAttemptSchema = new mongoose.Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  mockTest: {
    type: Schema.Types.ObjectId,
    ref: "MockTest",
    required: true,
  },
  answers: [
    {
      questionIndex: Number,
      selectedOption: Number,
      isCorrect: Boolean,
      marksObtained: Number,
    },
  ],
  totalScore: {
    type: Number,
    default: 0,
  },
  totalCorrect: {
    type: Number,
    default: 0,
  },
  totalWrong: {
    type: Number,
    default: 0,
  },
  totalUnanswered: {
    type: Number,
    default: 0,
  },
  percentage: {
    type: Number,
    default: 0,
  },
  timeTaken: {
    type: Number,
    default: 0,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
});

export const MockTestAttemptModel = mongoose.model(
  "MockTestAttempt",
  MockTestAttemptSchema
);
