import mongoose from "mongoose";

const ZoomRecordingSchema = new mongoose.Schema(
  {
    zoomFileId: { type: String, required: true, unique: true, index: true },
    zoomMeetingId: { type: String, index: true },
    zoomMeetingUuid: { type: String, index: true },
    hostId: String,
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, default: "General", index: true },
    startTime: { type: Date, index: true },
    recordingStart: Date,
    recordingEnd: Date,
    durationMinutes: Number,
    fileType: String,
    recordingType: String,
    fileSize: Number,
    playUrl: String,
    downloadUrl: String,
    thumbnailDownloadUrl: String,
    shareUrl: String,
    passcode: String,
    source: { type: String, default: "zoom" },
    syncedAt: { type: Date, default: Date.now },
    raw: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

ZoomRecordingSchema.index({ category: 1, startTime: -1 });
ZoomRecordingSchema.index({ title: "text", category: "text" });

const ZoomRecording =
  mongoose.models.Recording || mongoose.model("Recording", ZoomRecordingSchema);

export default ZoomRecording;
