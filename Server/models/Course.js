import mongoose from "mongoose";
import { Schema } from "mongoose";

const CourseScheme = new mongoose.Schema({
  title: String,
  fullForm: String,
  descriptionUnformatted: String,
  descriptionFormatted: String,
  scholarshipDescription: String,
  scholarshipAvailable: Boolean,
  universityName: String,
  duration: String,
  // New tab content fields
  aboutTab: String,
  eligibilityTab: String,
  curricularStructureTab: String,
  jobProspectsTab: String,
  colleges: [
    {
      collegeDetails: { type: Schema.Types.ObjectId, ref: "College" },
      seatsAvailable: Number,
      fee: String,
      scholarshipAvailable: Boolean,
    },
  ],
});

const CourseModel = mongoose.model("Course", CourseScheme);

export default CourseModel;
