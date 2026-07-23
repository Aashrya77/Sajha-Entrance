import mongoose from "mongoose";
import { Schema } from "mongoose";
import { addSlugField } from "../utils/slug.js";

const CourseScheme = new mongoose.Schema({
  title: String,
  fullForm: String,
  descriptionUnformatted: String,
  descriptionFormatted: String,
  scholarshipDescription: String,
  scholarshipAvailable: Boolean,
  universityName: String,
  duration: String,
  contactCardEnabled: {
    type: Boolean,
    default: false,
  },
  contactCardTitle: {
    type: String,
    trim: true,
    default: "Prepare with Sajha Entrance",
  },
  contactCardDescription: {
    type: String,
    trim: true,
    default: "Contact our team on WhatsApp to learn about entrance preparation classes.",
  },
  contactCardPrice: {
    type: String,
    trim: true,
    default: "",
  },
  contactCardWhatsAppNumber: {
    type: String,
    trim: true,
    default: "",
  },
  contactCardWhatsAppMessage: {
    type: String,
    trim: true,
    default: "",
  },
  contactCardButtonLabel: {
    type: String,
    trim: true,
    default: "Contact us on WhatsApp",
  },
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

addSlugField(CourseScheme, "title");

const CourseModel = mongoose.model("Course", CourseScheme);

export default CourseModel;
