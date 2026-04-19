import {
  getYouTubeLibraryConfig,
  getYouTubeLibraryForStudent,
  getYouTubeLiveStatusForStudent,
  getYouTubePlaylistsForStudent,
  getYouTubeVideosForStudent,
  sanitizeYouTubeLibraryQuery,
  saveYouTubeLibraryConfig,
  syncYouTubeLibrary,
  validateYouTubeLibraryConfig,
} from "../services/youtubeLibraryService.js";
import { refreshYouTubeLibrarySchedule } from "../services/youtubeLibraryScheduler.js";

const resolveCurrentAdmin = (req) => req.session?.adminUser || null;

const sendError = (res, error, fallbackStatus = 500) => {
  const status = Number(error?.status || fallbackStatus);
  return res.status(status).json({
    success: false,
    error: error?.message || "Something went wrong.",
  });
};

export const getAdminYouTubeLibraryConfig = async (_req, res) => {
  try {
    const config = await getYouTubeLibraryConfig();
    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    sendError(res, error);
  }
};

export const upsertAdminYouTubeLibraryConfig = async (req, res) => {
  try {
    const validatedChannel = await validateYouTubeLibraryConfig({
      channelUrl: req.body?.channelUrl,
      channelId: req.body?.channelId,
    });

    const config = await saveYouTubeLibraryConfig({
      payload: {
        ...req.body,
        channelId: validatedChannel.channelId,
        channelUrl: req.body?.channelUrl || validatedChannel.channelUrl,
        channelTitle: validatedChannel.channelTitle,
        channelThumbnail: validatedChannel.channelThumbnail,
        channelHandle: validatedChannel.channelHandle,
      },
      currentAdmin: resolveCurrentAdmin(req),
    });

    await refreshYouTubeLibrarySchedule();

    res.json({
      success: true,
      data: {
        ...config,
        channelTitle: validatedChannel.channelTitle || config.channelTitle,
        channelThumbnail: validatedChannel.channelThumbnail || config.channelThumbnail,
      },
    });
  } catch (error) {
    sendError(res, error, 400);
  }
};

export const runAdminYouTubeLibrarySync = async (req, res) => {
  try {
    const result = await syncYouTubeLibrary({
      currentAdmin: resolveCurrentAdmin(req),
      trigger: "manual",
      force: true,
    });

    await refreshYouTubeLibrarySchedule();

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    sendError(res, error, 400);
  }
};

export const getStudentYouTubeLibraryHome = async (req, res) => {
  try {
    const query = sanitizeYouTubeLibraryQuery(req.query);
    const data = await getYouTubeLibraryForStudent({
      studentPayload: req.student,
      search: query.search,
      subject: query.subject,
      page: query.page,
      limit: query.limit,
      course: query.course,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    sendError(res, error, 400);
  }
};

export const getStudentYouTubeLibraryPlaylists = async (req, res) => {
  try {
    const query = sanitizeYouTubeLibraryQuery(req.query);
    const data = await getYouTubePlaylistsForStudent({
      studentPayload: req.student,
      search: query.search,
      subject: query.subject,
      page: query.page,
      limit: query.limit,
      course: query.course,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    sendError(res, error, 400);
  }
};

export const getStudentYouTubeLibraryVideos = async (req, res) => {
  try {
    const query = sanitizeYouTubeLibraryQuery(req.query);
    const data = await getYouTubeVideosForStudent({
      studentPayload: req.student,
      search: query.search,
      subject: query.subject,
      page: query.page,
      limit: query.limit,
      course: query.course,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    sendError(res, error, 400);
  }
};

export const getStudentYouTubeLibraryLive = async (req, res) => {
  try {
    const query = sanitizeYouTubeLibraryQuery(req.query);
    const data = await getYouTubeLiveStatusForStudent({
      studentPayload: req.student,
      course: query.course,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    sendError(res, error, 400);
  }
};
