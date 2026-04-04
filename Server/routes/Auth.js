import express from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  getClasses,
  logout,
} from "../controllers/Auth.js";
import { authenticateToken } from "../middleware/auth.js";

const Router = express.Router();

// Public routes
Router.post("/register", register);
Router.post("/login", login);

// Protected routes
Router.get("/profile", authenticateToken, getProfile);
Router.put("/profile", authenticateToken, updateProfile);
Router.get("/classes", authenticateToken, getClasses);
Router.post("/logout", authenticateToken, logout);

export default Router;
