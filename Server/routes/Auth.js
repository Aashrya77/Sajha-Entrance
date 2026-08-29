import express from "express";
import {
  register,
  login,
  firebaseLogin,
  forgotPassword,
  forgotPasswordOtp,
  resetPassword,
  resetPasswordWithOtp,
  validateResetToken,
  verifyEmail,
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
import {
  firebaseLoginLimiter,
  forgotPasswordEmailLimiter,
  forgotPasswordIpLimiter,
  loginEmailLimiter,
  loginIpLimiter,
  registerEmailLimiter,
  registerIpLimiter,
  resetPasswordLimiter,
} from "../middleware/rateLimiters.js";

const Router = express.Router();

// Public routes
Router.post("/register", registerIpLimiter, registerEmailLimiter, register);
Router.post("/login", loginIpLimiter, loginEmailLimiter, login);
Router.post("/firebase-login", firebaseLoginLimiter, firebaseLogin);
Router.post(
  "/forgot-password",
  forgotPasswordIpLimiter,
  forgotPasswordEmailLimiter,
  forgotPassword
);
Router.post(
  "/forgot-password-otp",
  forgotPasswordIpLimiter,
  forgotPasswordEmailLimiter,
  forgotPasswordOtp
);
Router.get("/reset-password/:token", resetPasswordLimiter, validateResetToken);
Router.post("/reset-password/:token", resetPasswordLimiter, resetPassword);
Router.post("/reset-password-otp", resetPasswordLimiter, resetPasswordWithOtp);
Router.get("/verify-email/:token", verifyEmail);

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
