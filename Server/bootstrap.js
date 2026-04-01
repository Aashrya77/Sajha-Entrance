process.env.NODE_ENV =
  process.env.NODE_ENV || (process.env.ADMINJS_WATCH === "true" ? "development" : "production");

await import("./server.js");
