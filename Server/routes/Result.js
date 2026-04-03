import express from "express";
import { SearchResult, GetTopResults } from "../controllers/Result.js";

const Router = express.Router();

Router.get("/results/top", GetTopResults);
Router.get("/results", SearchResult);

export default Router;
