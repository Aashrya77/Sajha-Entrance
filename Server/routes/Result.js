import express from "express";
import {
  GetPublishedExams,
  GetResultCourses,
  GetTopResults,
  SearchResult,
} from "../controllers/Result.js";

const Router = express.Router();

Router.get("/results/courses", GetResultCourses);
Router.get("/results/exams", GetPublishedExams);
Router.get("/results/top", GetTopResults);
Router.get("/results", SearchResult);

export default Router;
