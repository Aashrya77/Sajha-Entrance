import express from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  validateResetToken,
  getProfile,
  updateProfile,
  getClasses,
  logout,
} from "../controllers/Auth.js";
import { getRecordedClassDetails } from "../controllers/RecordedClass.js";
import {
  getStudentZoomRecordingCategories,
  getStudentZoomRecordings,
  getStudentZoomRecordingSyncStatus,
  getStudentZoomRecordingThumbnail,
  streamStudentZoomRecording,
  syncStudentZoomRecordings,
} from "../controllers/ZoomRecording.js";
import { authenticateToken } from "../middleware/auth.js";

const Router = express.Router();

// Public routes
Router.post("/register", register);
Router.post("/login", login);
Router.post("/forgot-password", forgotPassword);
Router.get("/reset-password/:token", validateResetToken);
Router.post("/reset-password/:token", resetPassword);

// Protected routes
Router.get("/profile", authenticateToken, getProfile);
Router.put("/profile", authenticateToken, updateProfile);
Router.get("/classes", authenticateToken, getClasses);
Router.get("/classes/recorded/:classId", authenticateToken, getRecordedClassDetails);
Router.get("/zoom-recordings", authenticateToken, getStudentZoomRecordings);
Router.get("/zoom-recordings/categories", authenticateToken, getStudentZoomRecordingCategories);
Router.get("/zoom-recordings/sync/status", authenticateToken, getStudentZoomRecordingSyncStatus);
Router.post("/zoom-recordings/sync", authenticateToken, syncStudentZoomRecordings);
Router.get("/zoom-recordings/:recordingId/thumbnail", authenticateToken, getStudentZoomRecordingThumbnail);
Router.get("/zoom-recordings/:recordingId/stream", authenticateToken, streamStudentZoomRecording);
Router.post("/logout", authenticateToken, logout);

export default Router;
