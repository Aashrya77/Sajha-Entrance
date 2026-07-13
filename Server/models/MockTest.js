import mongoose from "mongoose";
import { Schema } from "mongoose";
import { MockQuestionOptionSchema } from "./MockQuestion.js";

const MOCK_TEST_STATUSES = ["draft", "scheduled", "live", "completed", "archived"];

const QuestionSchema = new mongoose.Schema(
  {
    sourceQuestionId: {
      type: Schema.Types.ObjectId,
      ref: "MockQuestion",
      default: null,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: "MockTestSubject",
      default: null,
    },
    subjectName: {
      type: String,
      default: "",
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "MockTestCourse",
      default: null,
    },
    questionText: {
      type: String,
      default: "",
    },
    questionImage: {
      type: String,
      default: "",
    },
    options: {
      type: [MockQuestionOptionSchema],
      default: () =>
        Array.from({ length: 4 }, () => ({
          text: "",
          image: "",
        })),
    },
    correctOption: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    explanation: {
      type: String,
      default: "",
    },
    marks: {
      type: Number,
      default: 1,
      min: 0,
    },
    negativeMarks: {
      type: Number,
      default: 0,
      min: 0,
    },
    difficulty: {
      type: String,
      default: "",
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

const MockTestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    default: "",
    trim: true,
    lowercase: true,
  },
  description: String,
  instructions: {
    type: String,
    default: "",
  },
  admissionTest: {
    type: String,
    default: "",
  },
  course: {
    type: String,
    default: "",
  },
  courseRef: {
    type: Schema.Types.ObjectId,
    ref: "MockTestCourse",
    default: null,
    index: true,
  },
  courseName: {
    type: String,
    default: "",
  },
  subjectRefs: [
    {
      type: Schema.Types.ObjectId,
      ref: "MockTestSubject",
    },
  ],
  subjectNames: {
    type: [String],
    default: [],
  },
  questionRefs: [
    {
      type: Schema.Types.ObjectId,
      ref: "MockQuestion",
    },
  ],
  totalMarks: {
    type: Number,
    default: 0,
  },
  passMarks: {
    type: Number,
    default: 0,
  },
  duration: {
    type: Number,
    default: 60,
  },
  allowRetake: {
    type: Boolean,
    default: false,
  },
  maxAttempts: {
    type: Number,
    default: 1,
    min: 0,
  },
  shuffleQuestions: {
    type: Boolean,
    default: false,
  },
  shuffleOptions: {
    type: Boolean,
    default: false,
  },
  questions: [QuestionSchema],
  questionCount: {
    type: Number,
    default: 0,
  },
  examDate: {
    type: Date,
    default: null,
  },
  startAt: {
    type: Date,
    default: null,
  },
  endAt: {
    type: Date,
    default: null,
  },
  publishedAt: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: MOCK_TEST_STATUSES,
    default: "draft",
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isLive: {
    type: Boolean,
    default: false,
  },
  manualStatusOverride: {
    type: Boolean,
    default: false,
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

  this.questionCount = Array.isArray(this.questions) ? this.questions.length : 0;

  if (!this.courseName && this.course) {
    this.courseName = this.course;
  }

  if (!this.course && this.courseName) {
    this.course = this.courseName;
  }

  if (!this.examDate && this.startAt) {
    this.examDate = this.startAt;
  }

  if (this.status === "draft") {
    this.isActive = false;
    this.isLive = false;
  } else if (this.status === "scheduled") {
    this.isActive = true;
    this.isLive = false;
    if (!this.publishedAt) {
      this.publishedAt = new Date();
    }
  } else if (this.status === "live") {
    this.isActive = true;
    this.isLive = true;
    if (!this.publishedAt) {
      this.publishedAt = new Date();
    }
  } else {
    this.isActive = false;
    this.isLive = false;
  }

  next();
});

MockTestSchema.index({ status: 1, startAt: 1, endAt: 1 });
MockTestSchema.index({ courseRef: 1, status: 1, startAt: 1 });
MockTestSchema.index({ slug: 1 }, { sparse: true });

const MockTestModel = mongoose.model("MockTest", MockTestSchema);

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
      questionId: {
        type: Schema.Types.ObjectId,
        ref: "MockQuestion",
        default: null,
      },
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
    default: null,
  },
  timeTakenSeconds: {
    type: Number,
    default: null,
    min: 0,
  },
  status: {
    type: String,
    enum: [
      "started",
      "submitted",
      "completed",
      "abandoned",
      "cancelled",
      "invalidated",
      "preview",
      "disqualified",
    ],
    default: "started",
    index: true,
  },
  startedAt: {
    type: Date,
    default: null,
  },
  deadlineAt: {
    type: Date,
    default: null,
    index: true,
  },
  durationSeconds: {
    type: Number,
    default: null,
    min: 0,
  },
  submittedAt: {
    type: Date,
    default: null,
    index: true,
  },
  scoreCalculatedAt: {
    type: Date,
    default: null,
  },
  studentNameSnapshot: {
    type: String,
    default: "",
    trim: true,
  },
  isTestAttempt: {
    type: Boolean,
    default: false,
  },
  attemptNumber: {
    type: Number,
    default: 1,
    min: 1,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  submissionType: {
    type: String,
    enum: ["manual", "auto"],
    default: null,
  },
  answersUpdatedAt: {
    type: Date,
    default: null,
  },
});

MockTestAttemptSchema.index({ student: 1, mockTest: 1, completedAt: -1 });
MockTestAttemptSchema.index({ student: 1, mockTest: 1, attemptNumber: 1 });
// Attempts contain per-question answer payloads and are useful only for recent
// review. MongoDB removes them automatically seven days after completion.
MockTestAttemptSchema.index(
  { completedAt: 1 },
  { expireAfterSeconds: 7 * 24 * 60 * 60, name: "completedAt_7d_retention" }
);
MockTestAttemptSchema.index({ mockTest: 1, status: 1, submittedAt: 1 });
MockTestAttemptSchema.index({ mockTest: 1, student: 1, status: 1 });
MockTestAttemptSchema.index({ status: 1, deadlineAt: 1 });
MockTestAttemptSchema.index(
  { student: 1, mockTest: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "started" } }
);

export const MockTestAttemptModel = mongoose.model(
  "MockTestAttempt",
  MockTestAttemptSchema
);
