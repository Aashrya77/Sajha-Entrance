import express from "express";

import { CourseDetail, GetCourses } from "../controllers/Course.js";

const Router = express.Router();

Router.get("/course/:id", CourseDetail);

Router.get("/courses", GetCourses)

export default Router;
