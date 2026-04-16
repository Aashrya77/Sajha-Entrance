import mongoose from "mongoose";
import {
  normalizeStudentCourse,
} from "../constants/studentCourses.js";
import { resolveOnlineClassCourses } from "../utils/onlineClassCourses.js";

const OnlineClassSchema = new mongoose.Schema({
  classTitle: {
    type: String,
    required: true,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  courses: {
    type: [String],
    default: [],
    validate: [
      {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "Select at least one valid course.",
      },
    ],
  },
  course: {
    type: String,
    trim: true,
    set: (value) => normalizeStudentCourse(value) || String(value || "").trim(),
  },
  classDateTime: {
    type: Date,
    required: true,
  },
  zoomMeetingLink: {
    type: String,
    required: true,
    trim: true,
  },
  duration: {
    type: Number,
    default: 60, // Duration in minutes
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

OnlineClassSchema.pre("validate", function preValidate(next) {
  this.courses = resolveOnlineClassCourses(this);
  next();
});

const OnlineClass = mongoose.model("OnlineClass", OnlineClassSchema);

export default OnlineClass;
