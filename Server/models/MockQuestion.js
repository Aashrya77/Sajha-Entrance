import mongoose from "mongoose";

const MOCK_QUESTION_DIFFICULTIES = ["", "easy", "medium", "hard"];
const MOCK_QUESTION_STATUSES = ["draft", "published"];

const hasRenderableText = (value = "") =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim().length > 0;

const hasRenderableContent = (text = "", image = "") =>
  hasRenderableText(text) || Boolean(String(image || "").trim());

const MockQuestionOptionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
  }
);

const MockQuestionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MockTestCourse",
      required: true,
      index: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MockTestSubject",
      required: true,
      index: true,
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
      validate: {
        validator: (value) => Array.isArray(value) && value.length === 4,
        message: "Exactly four options are required.",
      },
    },
    correctOption: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    marks: {
      type: Number,
      default: 1,
      min: 0,
    },
    explanation: {
      type: String,
      default: "",
    },
    difficulty: {
      type: String,
      enum: MOCK_QUESTION_DIFFICULTIES,
      default: "",
    },
    status: {
      type: String,
      enum: MOCK_QUESTION_STATUSES,
      default: "draft",
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

MockQuestionSchema.pre("validate", function validateMockQuestion(next) {
  if (!hasRenderableContent(this.questionText, this.questionImage)) {
    this.invalidate(
      "questionText",
      "A question must include text or an image."
    );
  }

  if (!Array.isArray(this.options) || this.options.length !== 4) {
    this.invalidate("options", "Exactly four options are required.");
    return next();
  }

  this.options.forEach((option, index) => {
    if (!hasRenderableContent(option?.text, option?.image)) {
      this.invalidate(
        `options.${index}.text`,
        `Option ${index + 1} must include text or an image.`
      );
    }
  });

  next();
});

MockQuestionSchema.index({ subject: 1, displayOrder: 1, createdAt: 1 });
MockQuestionSchema.index({ subject: 1, status: 1, difficulty: 1 });
MockQuestionSchema.index({ course: 1, status: 1, createdAt: -1 });

const MockQuestionModel = mongoose.model("MockQuestion", MockQuestionSchema);

export {
  MOCK_QUESTION_DIFFICULTIES,
  MOCK_QUESTION_STATUSES,
  MockQuestionOptionSchema,
  hasRenderableContent,
  hasRenderableText,
};
export default MockQuestionModel;
