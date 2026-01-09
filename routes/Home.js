import express from "express";
import {
  HomeDetails,
  ContactPage,
  SendContact,
  GetServices,
  GetAbout,
  PostSubscribe
} from "../controllers/Home.js";

const Router = express.Router();

Router.get("/", HomeDetails);

Router.get("/contact", ContactPage);

Router.post("/contact", SendContact);

Router.get("/services", GetServices);

Router.get("/about", GetAbout);

Router.post("/subscribe", PostSubscribe)

export default Router;
