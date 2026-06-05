import ZoomRecording from "../models/ZoomRecording.js";
import {
  getZoomRecordingUserIds,
  hasZoomRecordingConfig,
  zoomRecordingEnv,
} from "../utils/zoomRecordingEnv.js";
import { resolveZoomRecordingCategory } from "../utils/zoomRecordingCategory.js";
import { listZoomUserRecordings } from "./zoomRecordingClient.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const formatDate = (date) => date.toISOString().slice(0, 10);

const parseZoomDate = (value) => (value ? new Date(value) : undefined);

const buildDateWindows = (fromDate, toDate) => {
  const windows = [];
  let cursor = new Date(fromDate);

  while (cursor <= toDate) {
    const windowEnd = new Date(Math.min(cursor.getTime() + 29 * DAY_MS, toDate.getTime()));
    windows.push({
      from: formatDate(cursor),
      to: formatDate(windowEnd),
    });
    cursor = new Date(windowEnd.getTime() + DAY_MS);
  }

  return windows;
};

const getDefaultDateRange = () => {
  const to = new Date();
  const from = new Date(to.getTime() - (zoomRecordingEnv.syncLookbackDays - 1) * DAY_MS);

  return { from, to };
};

const startOfZoomDate = (date) => new Date(`${formatDate(date)}T00:00:00.000Z`);
const endOfZoomDate = (date) => new Date(`${formatDate(date)}T23:59:59.999Z`);

const isVideoFile = (file) =>
  file?.file_type === "MP4" && file?.status === "completed" && file?.id && file?.download_url;

const isThumbnailFile = (file) =>
  (file?.recording_type === "thumbnail" ||
    file?.file_extension === "JPG" ||
    file?.file_type === "JPG") &&
  file?.download_url;

const friendlyRecordingType = (type) =>
  type ? type.replace(/\(CC\)/g, "").replace(/_/g, " ") : "";

const buildTitle = (meeting, videoFiles, file) => {
  const baseTitle = meeting.topic || "Untitled Zoom class";

  if (videoFiles.length <= 1) {
    return baseTitle;
  }

  const type = friendlyRecordingType(file.recording_type);
  return type ? `${baseTitle} - ${type}` : baseTitle;
};

const resolveDurationMinutes = (meeting, file) => {
  if (meeting.duration) {
    return Number(meeting.duration);
  }

  const start = parseZoomDate(file.recording_start);
  const end = parseZoomDate(file.recording_end);

  if (!start || !end) {
    return undefined;
  }

  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 60_000));
};

const syncMeeting = async (meeting) => {
  const files = Array.isArray(meeting.recording_files) ? meeting.recording_files : [];
  const videoFiles = files.filter(isVideoFile);
  const thumbnailFile = files.find(isThumbnailFile);
  const results = [];
  const zoomFileIds = [];

  for (const file of videoFiles) {
    zoomFileIds.push(file.id);

    const title = buildTitle(meeting, videoFiles, file);
    const update = {
      zoomFileId: file.id,
      zoomMeetingId: String(meeting.id ?? file.meeting_id ?? ""),
      zoomMeetingUuid: meeting.uuid,
      hostId: meeting.host_id,
      title,
      category: resolveZoomRecordingCategory(title),
      startTime: parseZoomDate(meeting.start_time ?? file.recording_start),
      recordingStart: parseZoomDate(file.recording_start),
      recordingEnd: parseZoomDate(file.recording_end),
      durationMinutes: resolveDurationMinutes(meeting, file),
      fileType: file.file_type,
      recordingType: file.recording_type,
      fileSize: file.file_size,
      playUrl: file.play_url,
      downloadUrl: file.download_url,
      thumbnailDownloadUrl: thumbnailFile?.download_url,
      shareUrl: meeting.share_url,
      passcode: meeting.recording_play_passcode ?? meeting.password,
      source: "zoom",
      syncedAt: new Date(),
      raw: {
        meeting,
        file,
        thumbnailFile,
      },
    };

    const result = await ZoomRecording.updateOne(
      { zoomFileId: file.id },
      { $set: update },
      { upsert: true }
    );

    results.push(result);
  }

  return {
    videoFiles: videoFiles.length,
    zoomFileIds,
    upserted: results.reduce((sum, result) => sum + (result.upsertedCount || 0), 0),
    modified: results.reduce((sum, result) => sum + (result.modifiedCount || 0), 0),
  };
};

const removeDeletedZoomRecordings = async ({ currentZoomFileIds, fromDate, toDate }) => {
  const syncedRangeStart = startOfZoomDate(fromDate);
  const syncedRangeEnd = endOfZoomDate(toDate);
  const staleRecordings = await ZoomRecording.find({
    source: "zoom",
    startTime: {
      $gte: syncedRangeStart,
      $lte: syncedRangeEnd,
    },
    zoomFileId: {
      $nin: Array.from(currentZoomFileIds),
    },
  })
    .select("_id zoomFileId title startTime")
    .lean();

  if (staleRecordings.length === 0) {
    return {
      deleted: 0,
      removed: [],
    };
  }

  const deleteResult = await ZoomRecording.deleteMany({
    _id: {
      $in: staleRecordings.map((recording) => recording._id),
    },
  });

  return {
    deleted: deleteResult.deletedCount || staleRecordings.length,
    removed: staleRecordings.map((recording) => ({
      id: recording._id.toString(),
      zoomFileId: recording.zoomFileId,
      title: recording.title,
      startTime: recording.startTime,
    })),
  };
};

export const syncZoomRecordings = async ({ from, to } = {}) => {
  if (!hasZoomRecordingConfig()) {
    throw new Error(
      "Zoom credentials are not configured. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, and ZOOM_USER_ID or ZOOM_USER_IDS."
    );
  }

  const defaultRange = getDefaultDateRange();
  const fromDate = from ? new Date(from) : defaultRange.from;
  const toDate = to ? new Date(to) : defaultRange.to;
  const windows = buildDateWindows(fromDate, toDate);
  const userIds = getZoomRecordingUserIds();
  const currentZoomFileIds = new Set();

  const summary = {
    users: userIds.length,
    windows: windows.length,
    meetingsFetched: 0,
    videoFilesSeen: 0,
    created: 0,
    updated: 0,
    deleted: 0,
    removed: [],
    startedAt: new Date(),
    finishedAt: null,
  };

  for (const userId of userIds) {
    for (const window of windows) {
      let nextPageToken = "";

      do {
        const response = await listZoomUserRecordings({
          userId,
          from: window.from,
          to: window.to,
          nextPageToken,
        });

        const meetings = Array.isArray(response.meetings) ? response.meetings : [];
        summary.meetingsFetched += meetings.length;

        for (const meeting of meetings) {
          const result = await syncMeeting(meeting);
          summary.videoFilesSeen += result.videoFiles;
          summary.created += result.upserted;
          summary.updated += result.modified;
          result.zoomFileIds.forEach((zoomFileId) => currentZoomFileIds.add(zoomFileId));
        }

        nextPageToken = response.next_page_token || "";
      } while (nextPageToken);
    }
  }

  const cleanupResult = await removeDeletedZoomRecordings({
    currentZoomFileIds,
    fromDate,
    toDate,
  });

  summary.deleted = cleanupResult.deleted;
  summary.removed = cleanupResult.removed;
  summary.finishedAt = new Date();
  return summary;
};
