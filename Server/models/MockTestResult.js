import mongoose from "mongoose";

const { Schema } = mongoose;

const RankedStudentSchema = new Schema(
  {
    rank: { type: Number, required: true, min: 1 },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    studentName: { type: String, required: true, trim: true },
    marks: { type: Number, required: true },
    timeTakenSeconds: { type: Number, default: null, min: 0 },
  },
  { _id: false }
);

const MockTestResultSchema = new Schema(
  {
    mockTest: {
      type: Schema.Types.ObjectId,
      ref: "MockTest",
      required: true,
      unique: true,
      index: true,
    },
    mockTestTitle: { type: String, required: true, trim: true },
    course: { type: Schema.Types.ObjectId, ref: "MockTestCourse", default: null, index: true },
    courseName: { type: String, default: "", trim: true },
    examStartTime: { type: Date, default: null },
    examEndTime: { type: Date, default: null },
    durationMinutes: { type: Number, default: 0, min: 0 },
    fullMarks: { type: Number, default: 0 },
    totalParticipants: { type: Number, default: 0, min: 0 },
    rankingRule: {
      type: String,
      enum: ["marks_time_submittedAt"],
      default: "marks_time_submittedAt",
    },
    status: {
      type: String,
      enum: ["draft", "finalized", "locked"],
      default: "draft",
      index: true,
    },
    generatedAt: { type: Date, required: true, default: Date.now },
    generatedBy: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
    lockedAt: { type: Date, default: null },
    lockedBy: { type: Schema.Types.ObjectId, ref: "AdminUser", default: null },
    duplicateAttemptsExcluded: { type: Number, default: 0, min: 0 },
    missingDurationCount: { type: Number, default: 0, min: 0 },
    version: { type: Number, default: 1, min: 1 },
    results: { type: [RankedStudentSchema], default: [] },
  },
  { timestamps: true }
);

MockTestResultSchema.index({ course: 1, status: 1, generatedAt: -1 });

const MockTestResultModel = mongoose.model("MockTestResult", MockTestResultSchema);

export default MockTestResultModel;
