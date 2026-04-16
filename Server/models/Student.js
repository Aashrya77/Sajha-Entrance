import mongoose from "mongoose";
import bcrypt from "bcrypt";
import {
  isValidStudentCourse,
  normalizeStudentCourse,
} from "../constants/studentCourses.js";

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
    const count = await mongoose.model("Student").countDocuments();
    this.studentId = `SE-${String(count + 1).padStart(4, "0")}`;
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
