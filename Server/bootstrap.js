const npmLifecycleEvent = process.env.npm_lifecycle_event;
const defaultNodeEnv = npmLifecycleEvent === "start" ? "production" : "development";

process.env.NODE_ENV = process.env.NODE_ENV || defaultNodeEnv;

await import("./server.js");
