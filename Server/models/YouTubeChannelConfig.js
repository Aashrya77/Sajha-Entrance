import mongoose from "mongoose";
import {
  normalizeYouTubeLibraryCourseList,
  YOUTUBE_LIBRARY_ALL_COURSES,
} from "../constants/youtubeLibrary.js";

const normalizeStringArray = (value = []) =>
  (Array.isArray(value) ? value : value == null ? [] : [value])
    .flatMap((entry) => (typeof entry === "string" ? entry.split(",") : [entry]))
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);

const YouTubeChannelConfigSchema = new mongoose.Schema(
  {
    configKey: {
      type: String,
      default: "default",
      unique: true,
      immutable: true,
      trim: true,
    },
    channelUrl: {
      type: String,
      trim: true,
      default: "",
    },
    channelId: {
      type: String,
      trim: true,
      default: "",
    },
    channelHandle: {
      type: String,
      trim: true,
      default: "",
    },
    channelTitle: {
      type: String,
      trim: true,
      default: "",
    },
    channelThumbnail: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    allowedCourses: {
      type: [String],
      default: () => [YOUTUBE_LIBRARY_ALL_COURSES],
    },
    subjectTags: {
      type: [String],
      default: [],
    },
    showPlaylists: {
      type: Boolean,
      default: true,
    },
    showVideos: {
      type: Boolean,
      default: true,
    },
    maxVideos: {
      type: Number,
      default: 24,
      min: 1,
      max: 250,
    },
    syncMode: {
      type: String,
      enum: ["manual", "interval"],
      default: "manual",
    },
    syncIntervalMinutes: {
      type: Number,
      default: 60,
      min: 5,
      max: 1440,
    },
    showPlaylistsFirst: {
      type: Boolean,
      default: true,
    },
    enableLiveDetection: {
      type: Boolean,
      default: true,
    },
    liveStatusRefreshMinutes: {
      type: Number,
      default: 2,
      min: 1,
      max: 60,
    },
    showEmbeddedLivePlayer: {
      type: Boolean,
      default: true,
    },
    liveSectionLabel: {
      type: String,
      trim: true,
      default: "Currently Live",
    },
    lastLiveCheckedAt: {
      type: Date,
      default: null,
    },
    lastLiveStatus: {
      type: String,
      enum: ["unknown", "live", "offline", "error"],
      default: "unknown",
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
    lastSyncStatus: {
      type: String,
      enum: ["idle", "running", "success", "failed"],
      default: "idle",
    },
    lastSyncError: {
      type: String,
      trim: true,
      default: "",
    },
    lastSyncSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

YouTubeChannelConfigSchema.pre("validate", function normalizeConfig(next) {
  this.allowedCourses = normalizeYouTubeLibraryCourseList(this.allowedCourses);
  if (!this.allowedCourses.length) {
    this.allowedCourses = [YOUTUBE_LIBRARY_ALL_COURSES];
  }
  this.subjectTags = normalizeStringArray(this.subjectTags);
  this.liveSectionLabel = String(this.liveSectionLabel || "").trim() || "Currently Live";
  next();
});

const YouTubeChannelConfig = mongoose.model("YouTubeChannelConfig", YouTubeChannelConfigSchema);

export default YouTubeChannelConfig;
