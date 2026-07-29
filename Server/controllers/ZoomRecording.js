import mongoose from "mongoose";
import { Readable } from "node:stream";
import Student from "../models/Student.js";
import ZoomRecording from "../models/ZoomRecording.js";
import { publicZoomRecording } from "../utils/publicZoomRecording.js";
import { fetchZoomRecordingFile } from "../services/zoomRecordingClient.js";
import {
  normalizeZoomPlaybackError,
  openZoomRecordingStream,
} from "../services/zoomRecordingPlayback.js";
import {
  getZoomRecordingSyncStatus,
  runZoomRecordingSync,
} from "../services/zoomRecordingScheduler.js";

const parseLimit = (value) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return 24;
  }

  return Math.max(1, Math.min(parsed, 200));
};

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildRecordingFilter = (query = {}) => {
  const filter = {};
  const category = String(query.category || "").trim();
  const search = String(query.search || "").trim();

  if (category) {
    filter.category = category;
  }

  if (search) {
    const searchRegex = new RegExp(escapeRegExp(search), "i");
    filter.$or = [{ title: searchRegex }, { category: searchRegex }];
  }

  return filter;
};

const loadPaidStudent = async (req, res) => {
  const student = await Student.findById(req.student?.id).select("accountStatus");

  if (!student) {
    res.status(404).json({ success: false, error: "Student not found." });
    return null;
  }

  if (student.accountStatus !== "Paid") {
    res.status(403).json({
      success: false,
      error: "Complete payment to access recorded classes.",
    });
    return null;
  }

  return student;
};

const findRecordingById = async (recordingId) => {
  if (!mongoose.isValidObjectId(recordingId)) {
    return null;
  }

  return ZoomRecording.findById(recordingId);
};

export const getStudentZoomRecordings = async (req, res) => {
  try {
    const student = await loadPaidStudent(req, res);
    if (!student) {
      return;
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = parseLimit(req.query.limit);
    const filter = buildRecordingFilter(req.query);

    const [items, total] = await Promise.all([
      ZoomRecording.find(filter)
        .sort({ startTime: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ZoomRecording.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        items: items.map(publicZoomRecording),
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get Zoom recordings error:", error);
    res.status(500).json({ success: false, error: "Failed to load Zoom recordings." });
  }
};

export const getStudentZoomRecordingCategories = async (req, res) => {
  try {
    const student = await loadPaidStudent(req, res);
    if (!student) {
      return;
    }

    const items = await ZoomRecording.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, name: "$_id", count: 1 } },
    ]);

    res.json({
      success: true,
      data: { items },
    });
  } catch (error) {
    console.error("Get Zoom recording categories error:", error);
    res.status(500).json({ success: false, error: "Failed to load Zoom recording categories." });
  }
};

export const getStudentZoomRecordingSyncStatus = async (req, res) => {
  try {
    const student = await loadPaidStudent(req, res);
    if (!student) {
      return;
    }

    res.json({
      success: true,
      data: getZoomRecordingSyncStatus(),
    });
  } catch (error) {
    console.error("Get Zoom recording sync status error:", error);
    res.status(500).json({ success: false, error: "Failed to load Zoom sync status." });
  }
};

export const syncStudentZoomRecordings = async (req, res) => {
  try {
    const student = await loadPaidStudent(req, res);
    if (!student) {
      return;
    }

    const result = await runZoomRecordingSync();
    res.json({
      success: true,
      message: "Zoom sync completed.",
      data: { result },
    });
  } catch (error) {
    console.error("Zoom recording sync error:", error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || "Failed to sync Zoom recordings.",
    });
  }
};

export const getStudentZoomRecordingThumbnail = async (req, res) => {
  try {
    const student = await loadPaidStudent(req, res);
    if (!student) {
      return;
    }

    const recording = await findRecordingById(req.params.recordingId);

    if (!recording?.thumbnailDownloadUrl) {
      return res.status(404).json({ success: false, error: "Thumbnail not found." });
    }

    const zoomResponse = await fetchZoomRecordingFile(recording.thumbnailDownloadUrl);

    if (!zoomResponse.ok) {
      return res
        .status(zoomResponse.status)
        .json({ success: false, error: "Unable to load thumbnail from Zoom." });
    }

    res.status(zoomResponse.status);
    res.setHeader("Content-Type", zoomResponse.headers.get("content-type") || "image/jpeg");
    res.setHeader("Cache-Control", "private, max-age=300");

    if (!zoomResponse.body) {
      return res.end();
    }

    return Readable.fromWeb(zoomResponse.body).pipe(res);
  } catch (error) {
    console.error("Zoom recording thumbnail error:", error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || "Failed to load Zoom recording thumbnail.",
    });
  }
};

export const streamStudentZoomRecording = async (req, res) => {
  try {
    const student = await loadPaidStudent(req, res);
    if (!student) {
      return;
    }

    const recording = await findRecordingById(req.params.recordingId);

    if (!recording?.downloadUrl) {
      return res.status(404).json({
        success: false,
        error: "Recording video is not available.",
      });
    }

    const { response: zoomResponse } = await openZoomRecordingStream(recording, {
      range: req.headers.range,
      persistMetadata: async (metadata) => {
        await ZoomRecording.updateOne(
          { _id: recording._id },
          {
            $set: metadata,
            $unset: { raw: 1 },
          }
        );
      },
    });

    res.status(zoomResponse.status);

    ["accept-ranges", "content-length", "content-range", "last-modified"].forEach(
      (header) => {
        const value = zoomResponse.headers.get(header);
        if (value) {
          res.setHeader(header, value);
        }
      }
    );

    res.setHeader("Content-Type", zoomResponse.headers.get("content-type"));
    res.setHeader("Cache-Control", "private, max-age=300");

    if (!zoomResponse.body) {
      return res.end();
    }

    return Readable.fromWeb(zoomResponse.body).pipe(res);
  } catch (error) {
    const playbackError = normalizeZoomPlaybackError(error);
    console.error("Zoom recording stream error:", {
      code: playbackError.code,
      upstreamStatus: playbackError.upstreamStatus,
      message: playbackError.message,
    });
    res.status(playbackError.status).json({
      success: false,
      error: "Unable to play this recording right now. Please retry.",
    });
  }
};
