import { buildZoomRecordingShareUrl } from "./zoomRecordingUrl.js";

export const publicZoomRecording = (recording) => ({
  id: recording._id.toString(),
  title: recording.title,
  category: recording.category,
  startTime: recording.startTime,
  recordingStart: recording.recordingStart,
  recordingEnd: recording.recordingEnd,
  durationMinutes: recording.durationMinutes,
  fileType: recording.fileType,
  recordingType: recording.recordingType,
  fileSize: recording.fileSize,
  playUrl: buildZoomRecordingShareUrl({
    shareUrl: recording.shareUrl,
    playUrl: recording.playUrl,
    passcode: recording.passcode,
  }),
  source: recording.source,
  hasThumbnail: Boolean(recording.thumbnailDownloadUrl),
  createdAt: recording.createdAt,
  updatedAt: recording.updatedAt,
});
