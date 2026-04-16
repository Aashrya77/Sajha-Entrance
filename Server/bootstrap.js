import dotenv from "dotenv";

dotenv.config();

const npmLifecycleEvent = process.env.npm_lifecycle_event;
const configuredNodeEnv = process.env.NODE_ENV || process.env.STATE;
const defaultNodeEnv = npmLifecycleEvent === "start" ? "production" : "development";

process.env.NODE_ENV = configuredNodeEnv || defaultNodeEnv;

await import("./server.js");
