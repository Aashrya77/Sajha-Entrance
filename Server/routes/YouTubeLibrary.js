import express from "express";
import {
  getAdminYouTubeLibraryConfig,
  getStudentYouTubeLibraryHome,
  getStudentYouTubeLibraryLive,
  getStudentYouTubeLibraryPlaylists,
  getStudentYouTubeLibraryVideos,
  runAdminYouTubeLibrarySync,
  upsertAdminYouTubeLibraryConfig,
} from "../controllers/YouTubeLibrary.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireAdminPermission } from "../admin/utils/admin-auth.js";
import { getAdminSessionMiddleware } from "../admin/utils/admin-session.js";

const Router = express.Router();
const adminSessionMiddleware = (req, res, next) => getAdminSessionMiddleware()(req, res, next);

Router.get(
  "/config",
  adminSessionMiddleware,
  requireAdminPermission("youtube_library", "view"),
  getAdminYouTubeLibraryConfig
);

Router.post(
  "/config",
  adminSessionMiddleware,
  requireAdminPermission("youtube_library", "edit"),
  upsertAdminYouTubeLibraryConfig
);

Router.post(
  "/sync",
  adminSessionMiddleware,
  requireAdminPermission("youtube_library", "edit"),
  runAdminYouTubeLibrarySync
);

Router.get("/live", authenticateToken, getStudentYouTubeLibraryLive);
Router.get("/playlists", authenticateToken, getStudentYouTubeLibraryPlaylists);
Router.get("/videos", authenticateToken, getStudentYouTubeLibraryVideos);
Router.get("/home", authenticateToken, getStudentYouTubeLibraryHome);

export default Router;
