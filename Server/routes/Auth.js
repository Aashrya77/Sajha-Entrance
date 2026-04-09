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
Router.post("/logout", authenticateToken, logout);

export default Router;
