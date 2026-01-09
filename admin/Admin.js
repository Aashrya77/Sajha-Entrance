import AdminJS from "adminjs";
import express from "express";
import AdminJSExpress from "@adminjs/express";
import * as AdminJSMongoose from "@adminjs/mongoose";
import session from "express-session";
import { default as MongoDBSession } from "connect-mongodb-session";
import dotenv from "dotenv";
import componentLoader from "./ComponentLoader.js";

dotenv.config();

const MongoStore = MongoDBSession(session);

import Notice from "../models/Notice.js";
import { CollegeFileModel } from "../models/College.js";
import Course from "../models/Course.js";
import { AdvertisementFileModel } from "../models/Advertisement.js";
import { BlogFileModel } from "../models/Blog.js";
import NewsletterModel from "../models/Newsletter.js";
import { PopupFileModel } from "../models/Popup.js";
import ContactModel from "../models/Contact.js";
import Student from "../models/Student.js";
import OnlineClass from "../models/OnlineClass.js";

const Router = express.Router();

AdminJS.registerAdapter({
  Resource: AdminJSMongoose.Resource,
  Database: AdminJSMongoose.Database,
});

const startAdminPanel = async () => {
  const DEFAULT_ADMIN = {
    email: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
  };

  const authenticate = async (email, password) => {
    if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
      return Promise.resolve(DEFAULT_ADMIN);
    }
    return null;
  };

  const courseResource = {
    resource: Course,
    options: {
      properties: {
        descriptionFormatted: {
          type: "richtext",
        },
        scholarshipDescription: {
          type: "richtext",
        },
        universityName: {
          type: "string",
          isVisible: {
            list: true,
            show: true,
            edit: true,
            filter: true,
          },
        },
        duration: {
          type: "string",
          isVisible: {
            list: true,
            show: true,
            edit: true,
            filter: true,
          },
        },
        aboutTab: {
          type: "textarea",
          isVisible: {
            list: false,
            show: true,
            edit: true,
            filter: false,
          },
        },
        eligibilityTab: {
          type: "textarea",
          isVisible: {
            list: false,
            show: true,
            edit: true,
            filter: false,
          },
        },
        curricularStructureTab: {
          type: "richtext",
          isVisible: {
            list: false,
            show: true,
            edit: true,
            filter: false,
          },
        },
        jobProspectsTab: {
          type: "textarea",
          isVisible: {
            list: false,
            show: true,
            edit: true,
            filter: false,
          },
        },
      },
    },
  };

  const adminOptions = {
    resources: [
      BlogFileModel,
      Notice,
      AdvertisementFileModel,
      CollegeFileModel,
      courseResource,
      NewsletterModel,
      ContactModel,
      PopupFileModel,
      Student,
      OnlineClass
    ],
    rootPath: "/admin",
    componentLoader,
  };

  const admin = new AdminJS(adminOptions);

  const sessionStore = new MongoStore({
    uri: process.env.MONGO_URI,
    collection: "session",

  });

  sessionStore.on('error', function(error) {
      console.error("Session Store Error Details:", error);
    });

  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate,
      cookieName: "adminjs",
      cookiePassword: "sessionsecret",
    },
    null,
    {
      // Temporarily disable session store to avoid SSL issues
      // store: sessionStore,
      resave: true,
      saveUninitialized: true,
      secret: "sessionsecret",
      cookie: {
        httpOnly: process.env.STATE === "production",
        secure: process.env.STATE === "production",
      },
      name: "adminjs",
    }
  );

  Router.use(admin.options.rootPath, adminRouter);
};

    

startAdminPanel();

export { Router as adminRouter };
