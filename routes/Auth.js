import express from "express";
import {
  loginPage,
  login,
  profilePage,
  getStudentData,
  logout,
} from "../controllers/Auth.js";
import { joinClass } from "../controllers/Class.js";
import { requireAuth, authenticateToken } from "../middleware/auth.js";

const Router = express.Router();

// Login page
Router.get("/login", loginPage);

// Login action
Router.post("/login", login);

// Profile page (protected)
Router.get("/profile", requireAuth, profilePage);

// Get student data API (protected)
Router.get("/data", authenticateToken, getStudentData);

// Join class (protected)
Router.get("/class/:classId/join", requireAuth, joinClass);

// Logout
Router.post("/logout", logout);
Router.get("/logout", logout);

export default Router;
