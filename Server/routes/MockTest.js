  import express from "express";
  import { authenticateAny, optionalAuthenticateAny } from "../middleware/auth_combined.js";
  import {
    GetMockTests,
    GetMockTestForExam,
    SaveMockTestAnswers,
    StartMockTestAttempt,
    SubmitMockTest,
    GetMyAttempts,
    GetAttemptResult,
  } from "../controllers/MockTest.js";

  const Router = express.Router();

  // Public - list all mock tests
  Router.get("/mocktests", optionalAuthenticateAny, GetMockTests);

  // Public - get test for exam (questions without answers)
  Router.get("/mocktest/:id", optionalAuthenticateAny, GetMockTestForExam);

  // Protected - submit test answers
  Router.post("/mocktest/:id/submit", authenticateAny, SubmitMockTest);

  // Protected - persist answer selections before the individual deadline
  Router.put("/mocktest/:id/answers", authenticateAny, SaveMockTestAnswers);

  // Protected - start a server-timed attempt before the client timer begins
  Router.post("/mocktest/:id/start", authenticateAny, StartMockTestAttempt);

  // Protected - get my attempts
  Router.get("/mocktest-attempts", authenticateAny, GetMyAttempts);

  // Protected - get specific attempt result
  Router.get("/mocktest-attempt/:attemptId", authenticateAny, GetAttemptResult);

  export default Router;
