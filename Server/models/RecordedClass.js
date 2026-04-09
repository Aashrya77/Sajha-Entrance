import mongoose from "mongoose";
import {
  extractYoutubePlaylistId,
  extractYoutubeVideoId,
  resolveRecordedClassMedia,
} from "../utils/youtube.js";

const RecordedClassSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  topicName: {
    type: String,
    required: true,
    trim: true,
  },
  courseIds: {
    type: [String],
    default: [],
    validate: {
      validator(value) {
        return Array.isArray(value) && value.length > 0;
      },
      message: "At least one course must be selected",
    },
  },
  contentType: {
    type: String,
    enum: ["video", "playlist"],
    default: "video",
    trim: true,
  },
  youtubeUrl: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator(value) {
        const normalizedUrl = String(value || "").trim();

        if (!normalizedUrl) {
          return false;
        }

        if (this.contentType === "playlist") {
          return Boolean(extractYoutubePlaylistId(normalizedUrl));
        }

        if (this.contentType === "video") {
          return Boolean(extractYoutubeVideoId(normalizedUrl));
        }

        return Boolean(
          extractYoutubeVideoId(normalizedUrl) || extractYoutubePlaylistId(normalizedUrl)
        );
      },
      message: "Provide a valid YouTube video or playlist URL",
    },
  },
  videoId: {
    type: String,
    trim: true,
  },
  playlistId: {
    type: String,
    trim: true,
  },
  classDate: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

RecordedClassSchema.pre("save", function preSave(next) {
  if (typeof this.courseIds === "string") {
    this.courseIds = this.courseIds
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
  }

  const media = resolveRecordedClassMedia(this);
  this.contentType = media.contentType;
  this.videoId = media.videoId;
  this.playlistId = media.contentType === "playlist" ? media.playlistId : "";

  this.updatedAt = Date.now();
  next();
});

const RecordedClass = mongoose.model("RecordedClass", RecordedClassSchema);

export default RecordedClass;
