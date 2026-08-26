import express from "express";
import { getNewsDetail, getNewsList } from "../controllers/News.js";

const Router = express.Router();

Router.get("/news", getNewsList);
Router.get("/news/:identifier", getNewsDetail);

export default Router;
