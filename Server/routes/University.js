import express from "express";
import {
  UniversityDetail,
  GetUniversities,
} from "../controllers/University.js";

const Router = express.Router();

Router.get("/university/:id", UniversityDetail);

Router.get("/universities", GetUniversities);

export default Router;
