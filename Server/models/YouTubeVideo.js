import mongoose from "mongoose";
import {
  normalizeYouTubeLibraryCourseList,
  YOUTUBE_LIBRARY_ALL_COURSES,
} from "../constants/youtubeLibrary.js";

const normalizeStringArray = (value = []) => {
  const seen = new Set();

  return (Array.isArray(value) ? value : value == null ? [] : [value])
    .flatMap((entry) => (typeof entry === "string" ? entry.split(",") : [entry]))
    .map((entry) => String(entry || "").trim())
    .filter(Boolean)
    .filter((entry) => {
      if (seen.has(entry)) {
        return false;
      }

      seen.add(entry);
      return true;
    });
};

const YouTubeVideoSchema = new mongoose.Schema(
  {
    youtubeVideoId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    thumbnail: {
      type: String,
      trim: true,
      default: "",
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    videoUrl: {
      type: String,
      trim: true,
      default: "",
    },
    embedUrl: {
      type: String,
      trim: true,
      default: "",
    },
    channelId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    playlistIds: {
      type: [String],
      default: [],
    },
    isLiveStreamRecording: {
      type: Boolean,
      default: false,
    },
    livestreamArchive: {
      type: Boolean,
      default: false,
    },
    isVisible: {
      type: Boolean,
      default: true,
      index: true,
    },
    subjectTag: {
      type: String,
      trim: true,
      default: "",
    },
    allowedCourses: {
      type: [String],
      default: () => [YOUTUBE_LIBRARY_ALL_COURSES],
    },
    rawData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    syncSource: {
      type: String,
      trim: true,
      default: "youtube-data-api-v3",
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

YouTubeVideoSchema.pre("validate", function normalizeVideo(next) {
  this.allowedCourses = normalizeYouTubeLibraryCourseList(this.allowedCourses);
  if (!this.allowedCourses.length) {
    this.allowedCourses = [YOUTUBE_LIBRARY_ALL_COURSES];
  }
  this.playlistIds = normalizeStringArray(this.playlistIds);
  next();
});

YouTubeVideoSchema.index({ channelId: 1, publishedAt: -1 });
YouTubeVideoSchema.index({ channelId: 1, isVisible: 1 });

const YouTubeVideo = mongoose.model("YouTubeVideo", YouTubeVideoSchema);

export default YouTubeVideo;
