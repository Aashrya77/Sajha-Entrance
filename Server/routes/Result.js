import express from "express";
import {
  GetPublicResultMockTestDates,
  GetPublicResultMockTests,
  GetPublishedExams,
  GetResultCourses,
  PublicSearchResult,
  SearchResult,
} from "../controllers/Result.js";

const Router = express.Router();

Router.get("/results/courses", GetResultCourses);
Router.get("/results/mock-tests", GetPublicResultMockTests);
Router.get("/results/mock-test-dates", GetPublicResultMockTestDates);
Router.post("/results/search", PublicSearchResult);
Router.get("/results/exams", GetPublishedExams);
Router.get("/results", SearchResult);

export default Router;
