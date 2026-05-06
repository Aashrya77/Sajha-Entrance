import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import { isProduction } from "../../utils/logger.js";

const adminSessionMaxAgeMs = 1000 * 60 * 60 * 12;

const assertAdminSessionEnvironment = () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required for the admin session store.");
  }

  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required for the admin session store.");
  }

  if (mongoose.connection.readyState === 0) {
    throw new Error("MongoDB connection must be established before admin sessions are initialized.");
  }
};

export const buildAdminSessionConfig = () => {
  assertAdminSessionEnvironment();

  return {
    store: MongoStore.create({
      client: mongoose.connection.getClient(),
      collectionName: "adminSessions",
      touchAfter: 24 * 3600,
    }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
    proxy: isProduction,
    cookie: {
      httpOnly: true,
      // Keep the admin session available to protected backend routes outside the AdminJS mount.
      path: "/",
      secure: isProduction,
      sameSite: "lax",
      maxAge: adminSessionMaxAgeMs,
    },
    name: "adminjs",
  };
};

let sharedAdminSessionMiddleware = null;

export const getAdminSessionMiddleware = () => {
  if (!sharedAdminSessionMiddleware) {
    sharedAdminSessionMiddleware = session(buildAdminSessionConfig());
  }

  return sharedAdminSessionMiddleware;
};

