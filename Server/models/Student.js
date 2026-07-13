import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Counter from "./Counter.js";
import {
  isValidStudentCourse,
  normalizeStudentCourse,
} from "../constants/studentCourses.js";

const STUDENT_ID_COUNTER_KEY = "studentId";
const STUDENT_ID_PREFIX = "SE-";
const STUDENT_ID_REGEX = /^SE-(\d+)$/;

const formatStudentId = (value) =>
  `${STUDENT_ID_PREFIX}${String(value).padStart(4, "0")}`;

const extractStudentIdSequence = (studentId = "") => {
  const match = String(studentId).match(STUDENT_ID_REGEX);
  return match ? Number(match[1]) : 0;
};

const getMaxExistingStudentSequence = async () => {
  const students = await mongoose
    .model("Student")
    .find({ studentId: STUDENT_ID_REGEX })
    .select("studentId")
    .lean();

  return students.reduce((maxValue, student) => {
    const nextValue = extractStudentIdSequence(student?.studentId);
    return nextValue > maxValue ? nextValue : maxValue;
  }, 0);
};

const getNextStudentId = async () => {
  const existingCounter = await Counter.findById(STUDENT_ID_COUNTER_KEY).lean();

  if (!existingCounter) {
    const maxExistingSequence = await getMaxExistingStudentSequence();
    await Counter.updateOne(
      { _id: STUDENT_ID_COUNTER_KEY },
      { $max: { seq: maxExistingSequence } },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }

  const counter = await Counter.findByIdAndUpdate(
    STUDENT_ID_COUNTER_KEY,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return formatStudentId(counter.seq);
};

const StudentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  collegeName: {
    type: String,
    trim: true,
  },
  course: {
    type: String,
    required: true,
    trim: true,
    set: (value) => normalizeStudentCourse(value) || String(value || "").trim(),
    validate: {
      validator(value) {
        const courseWasModified =
          typeof this?.isModified === "function" ? this.isModified("course") : true;
        return !courseWasModified || isValidStudentCourse(value);
      },
      message: "Please select a valid course.",
    },
  },
  accountStatus: {
    type: String,
    enum: ["Unpaid", "Paid"],
    default: "Unpaid",
  },
  isTestAccount: {
    type: Boolean,
    default: false,
    index: true,
  },
  passwordResetToken: {
    type: String,
    trim: true,
  },
  passwordResetExpires: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-generate studentId before saving
StudentSchema.pre("save", async function (next) {
  if (!this.studentId) {
    this.studentId = await getNextStudentId();
  }
  if (this.isModified("password")) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Method to compare password
StudentSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Student = mongoose.model("Student", StudentSchema);

export default Student;
