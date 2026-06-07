import mongoose from "mongoose";

const { Schema } = mongoose;

const QuestionBankViewSchema = new Schema(
  {
    question: {
      type: Schema.Types.ObjectId,
      ref: "QuestionBank",
      required: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      default: null,
      index: true,
    },
    viewerKey: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    viewerType: {
      type: String,
      enum: ["student", "anonymous"],
      required: true,
      index: true,
    },
    ipHash: {
      type: String,
      default: "",
      trim: true,
    },
    userAgent: {
      type: String,
      default: "",
      trim: true,
    },
    lastViewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "question_bank_views",
    timestamps: true,
  }
);

QuestionBankViewSchema.index({ question: 1, viewerKey: 1 }, { unique: true });

const QuestionBankViewModel =
  mongoose.models.QuestionBankView ||
  mongoose.model("QuestionBankView", QuestionBankViewSchema);

export default QuestionBankViewModel;
