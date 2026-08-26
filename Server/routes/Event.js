import express from "express";
import { getEventDetail, getEventList } from "../controllers/Event.js";

const Router = express.Router();

Router.get("/events", getEventList);
Router.get("/events/:identifier", getEventDetail);

export default Router;
