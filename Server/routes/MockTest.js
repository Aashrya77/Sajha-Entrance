import express from "express";
import {
  GetMockTests,
  GetMockTestForExam,
  SubmitMockTest,
  GetMyAttempts,
  GetAttemptResult,
} from "../controllers/MockTest.js";
import { authenticateToken } from "../middleware/auth.js";

const Router = express.Router();

// Public - list all mock tests
Router.get("/mocktests", GetMockTests);

// Public - get test for exam (questions without answers)
Router.get("/mocktest/:id", GetMockTestForExam);

// Protected - submit test answers
Router.post("/mocktest/:id/submit", authenticateToken, SubmitMockTest);

// Protected - get my attempts
Router.get("/mocktest-attempts", authenticateToken, GetMyAttempts);

// Protected - get specific attempt result
Router.get("/mocktest-attempt/:attemptId", authenticateToken, GetAttemptResult);

export default Router;
