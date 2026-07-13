import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));

// AdminJS bundles are runtime artifacts. Keep them separate from the legacy
// tracked .adminjs files so deployments cannot accidentally serve a stale
// committed bundle and local startup does not dirty the working tree.
process.env.ADMIN_JS_TMP_DIR ||= path.join(serverDirectory, ".adminjs-runtime");

const npmLifecycleEvent = process.env.npm_lifecycle_event;
const configuredNodeEnv = process.env.NODE_ENV || process.env.STATE;
const isPm2Runtime =
  typeof process.env.pm_id !== "undefined" || Boolean(process.env.PM2_HOME);
const defaultNodeEnv =
  npmLifecycleEvent === "start" || isPm2Runtime ? "production" : "development";

process.env.NODE_ENV = configuredNodeEnv || defaultNodeEnv;

await import("./server.js");
