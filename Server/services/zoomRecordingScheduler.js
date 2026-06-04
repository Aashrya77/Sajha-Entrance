import { createLogger } from "../utils/logger.js";
import { hasZoomRecordingConfig, zoomRecordingEnv } from "../utils/zoomRecordingEnv.js";
import { syncZoomRecordings } from "./zoomRecordingSync.js";

const logger = createLogger("zoom-recordings");

let running = false;
let schedulerTimer = null;
let lastSync = {
  running: false,
  success: null,
  message: "Sync has not run yet.",
  result: null,
  finishedAt: null,
};

export const getZoomRecordingSyncStatus = () => ({
  ...lastSync,
  running,
});

export const runZoomRecordingSync = async () => {
  if (running) {
    return {
      skipped: true,
      message: "A Zoom recording sync is already running.",
    };
  }

  running = true;
  lastSync = {
    ...lastSync,
    running: true,
    message: "Zoom recording sync is running.",
  };

  try {
    const result = await syncZoomRecordings();
    lastSync = {
      running: false,
      success: true,
      message: "Zoom recording sync completed.",
      result,
      finishedAt: new Date(),
    };
    return result;
  } catch (error) {
    lastSync = {
      running: false,
      success: false,
      message: error.message,
      result: null,
      finishedAt: new Date(),
    };
    throw error;
  } finally {
    running = false;
  }
};

export const startZoomRecordingAutoSync = () => {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }

  if (!hasZoomRecordingConfig()) {
    logger.info("Zoom recording sync disabled because credentials are not configured.");
    return;
  }

  if (zoomRecordingEnv.syncOnStart) {
    setTimeout(() => {
      runZoomRecordingSync().catch((error) =>
        logger.error("Startup Zoom recording sync failed:", error.message)
      );
    }, 1000);
  }

  if (zoomRecordingEnv.syncIntervalMinutes > 0) {
    schedulerTimer = setInterval(() => {
      runZoomRecordingSync().catch((error) =>
        logger.error("Scheduled Zoom recording sync failed:", error.message)
      );
    }, zoomRecordingEnv.syncIntervalMinutes * 60 * 1000);

    logger.info(
      `Zoom recording auto-sync scheduled every ${zoomRecordingEnv.syncIntervalMinutes} minute(s).`
    );
  }
};
