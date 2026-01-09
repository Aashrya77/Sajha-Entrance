import express from "express";
import {
  CollegeDetail,
  GetColleges,
  SearchCollege,
} from "../controllers/College.js";

const Router = express.Router();

Router.get("/college/:id", CollegeDetail);

Router.get("/colleges", GetColleges);

Router.post("/college/search", SearchCollege);

export default Router;
