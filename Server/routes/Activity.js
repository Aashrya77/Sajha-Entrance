import express from "express";
import { recordActiveUser } from "../utils/activeUsers.js";

const Router = express.Router();

Router.post("/activity/heartbeat", (req, res) => {
  const snapshot = recordActiveUser(req);

  res.json({
    success: true,
    data: {
      activeUsers: snapshot.count,
      activeWindowSeconds: snapshot.activeWindowSeconds,
      serverTime: snapshot.generatedAt,
    },
  });
});

export default Router;
