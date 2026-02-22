import mongoose from "mongoose";

// Helper function to extract YouTube video ID from URL
const extractVideoId = (url) => {
  if (!url) return "";
  
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]+)/,
  ];
  
  for (let pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return "";
};

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
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: "At least one course must be selected",
    },
  },
  youtubeUrl: {
    type: String,
    required: true,
    trim: true,
  },
  videoId: {
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

// Pre-save hook to process courseIds and videoId
RecordedClassSchema.pre("save", function (next) {
  console.log("🔍 RecordedClass pre-save hook triggered");
  console.log("Current data:", {
    subject: this.subject,
    topicName: this.topicName,
    courseIds: this.courseIds,
    youtubeUrl: this.youtubeUrl,
  });

  // Convert courseIds string to array if needed
  if (this.courseIds) {
    if (typeof this.courseIds === "string") {
      console.log("Converting courseIds from string to array");
      this.courseIds = this.courseIds
        .split(",")
        .map(id => id.trim())
        .filter(id => id.length > 0);
    }
  }
  
  // Auto-extract video ID from YouTube URL
  if (this.youtubeUrl && !this.videoId) {
    console.log("Extracting video ID from URL:", this.youtubeUrl);
    this.videoId = extractVideoId(this.youtubeUrl);
    console.log("Extracted video ID:", this.videoId);
  }
  
  // Update timestamp
  this.updatedAt = Date.now();
  console.log("✅ Pre-save hook completed. Final courseIds:", this.courseIds);
  next();
});

const RecordedClass = mongoose.model("RecordedClass", RecordedClassSchema);

export default RecordedClass;
