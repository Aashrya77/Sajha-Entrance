import express from "express";
import {
  HomeDetails,
  ContactPage,
  SendContact,
  GetServices,
  GetAbout,
  PostSubscribe,
  GetNotice,
  GetPageAdvertisements
} from "../controllers/Home.js";

const Router = express.Router();

Router.get("/home", HomeDetails);

Router.get("/contact", ContactPage);

Router.post("/contact", SendContact);

Router.get("/services", GetServices);

Router.get("/about", GetAbout);

Router.post("/subscribe", PostSubscribe)

Router.get("/notice", GetNotice);

Router.get("/advertisements", GetPageAdvertisements);

export default Router;
