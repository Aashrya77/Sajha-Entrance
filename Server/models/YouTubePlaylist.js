import mongoose from "mongoose";
import {
  normalizeYouTubeLibraryCourseList,
  YOUTUBE_LIBRARY_ALL_COURSES,
} from "../constants/youtubeLibrary.js";

const YouTubePlaylistSchema = new mongoose.Schema(
  {
    youtubePlaylistId: {
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
    videoCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    playlistUrl: {
      type: String,
      trim: true,
      default: "",
    },
    firstVideoId: {
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

YouTubePlaylistSchema.pre("validate", function normalizePlaylist(next) {
  this.allowedCourses = normalizeYouTubeLibraryCourseList(this.allowedCourses);
  if (!this.allowedCourses.length) {
    this.allowedCourses = [YOUTUBE_LIBRARY_ALL_COURSES];
  }
  next();
});

YouTubePlaylistSchema.index({ channelId: 1, publishedAt: -1 });
YouTubePlaylistSchema.index({ channelId: 1, isVisible: 1 });

const YouTubePlaylist = mongoose.model("YouTubePlaylist", YouTubePlaylistSchema);

export default YouTubePlaylist;
