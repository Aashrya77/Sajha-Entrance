import mongoose from "mongoose";

const COURSE_SUBJECTS = {
  BIT: ["English", "Computer", "Math"],
  BCA: ["English", "GK", "Math"],
  CMAT: ["English", "GK", "Math", "Logical Reasoning"],
  CSIT: ["Physics", "English", "Math", "Chemistry"],
};

const COURSES = Object.keys(COURSE_SUBJECTS);

const SubjectSchema = new mongoose.Schema({
  subjectName: {
    type: String,
    required: true,
  },
  fullMarks: {
    type: Number,
    required: true,
  },
  passMarks: {
    type: Number,
    required: true,
  },
  obtainedMarks: {
    type: Number,
    required: true,
  },
}, { _id: false });

const StudentResultSchema = new mongoose.Schema({
  symbolNumber: {
    type: String,
    required: true,
    index: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  course: {
    type: String,
    required: true,
    enum: COURSES,
  },
  examDate: {
    type: Date,
    required: true,
  },
  subjects: [SubjectSchema],
  totalFullMarks: {
    type: Number,
    default: 0,
  },
  totalObtainedMarks: {
    type: Number,
    default: 0,
  },
  percentage: {
    type: Number,
    default: 0,
  },
  result: {
    type: String,
    enum: ["Pass", "Fail"],
    default: "Fail",
  },
  remarks: {
    type: String,
    default: "",
  },
  publishedAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-calculate totals, percentage, and result before saving
StudentResultSchema.pre("save", function (next) {
  if (this.subjects && this.subjects.length > 0) {
    this.totalFullMarks = this.subjects.reduce((sum, s) => sum + s.fullMarks, 0);
    this.totalObtainedMarks = this.subjects.reduce((sum, s) => sum + s.obtainedMarks, 0);
    this.percentage = this.totalFullMarks > 0
      ? parseFloat(((this.totalObtainedMarks / this.totalFullMarks) * 100).toFixed(2))
      : 0;

    // Check if student passed all subjects
    const allPassed = this.subjects.every((s) => s.obtainedMarks >= s.passMarks);
    this.result = allPassed ? "Pass" : "Fail";
  }
  next();
});

const StudentResultModel = mongoose.model("StudentResult", StudentResultSchema);

export default StudentResultModel;
