import mongoose from "mongoose";

const TopCollegeSectionSchema = new mongoose.Schema({
  sectionKey: {
    type: String,
    default: "top-colleges",
    unique: true,
    immutable: true,
  },
  title: {
    type: String,
    default: "Top Colleges in Nepal",
    trim: true,
  },
  topCollegeImages: {
    type: [String],
    default: [],
  },
  topCollegeImageMimeType: {
    type: [String],
    default: [],
  },
  topCollegeImageFilename: {
    type: [String],
    default: [],
  },
  topCollegeImageSize: {
    type: [Number],
    default: [],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

export default mongoose.model("TopCollegeSection", TopCollegeSectionSchema);
