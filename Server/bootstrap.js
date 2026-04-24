import dotenv from "dotenv";

dotenv.config();

const npmLifecycleEvent = process.env.npm_lifecycle_event;
const configuredNodeEnv = process.env.NODE_ENV || process.env.STATE;
const isPm2Runtime =
  typeof process.env.pm_id !== "undefined" || Boolean(process.env.PM2_HOME);
const defaultNodeEnv =
  npmLifecycleEvent === "start" || isPm2Runtime ? "production" : "development";

process.env.NODE_ENV = configuredNodeEnv || defaultNodeEnv;

await import("./server.js");
