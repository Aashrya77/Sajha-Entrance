import { createLogger } from "../utils/logger.js";
import {
  getSchedulerConfigSnapshot,
  syncYouTubeLibrary,
} from "./youtubeLibraryService.js";

const logger = createLogger("youtube-library-scheduler");

let schedulerTimer = null;
let activeConfigId = "";
let isSyncRunning = false;

const clearCurrentSchedule = () => {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
};

export const refreshYouTubeLibrarySchedule = async () => {
  clearCurrentSchedule();

  const config = await getSchedulerConfigSnapshot();
  if (!config?.id || !config.isActive || config.syncMode !== "interval") {
    activeConfigId = "";
    return null;
  }

  const intervalMs = Math.max(Number(config.syncIntervalMinutes || 60), 5) * 60 * 1000;
  activeConfigId = config.id;

  schedulerTimer = setInterval(async () => {
    if (isSyncRunning) {
      logger.warn("Skipping scheduled YouTube sync because the previous sync is still running.");
      return;
    }

    isSyncRunning = true;
    try {
      await syncYouTubeLibrary({
        configId: activeConfigId,
        trigger: "interval",
      });
    } catch (error) {
      logger.error("Scheduled YouTube sync failed:", error.message);
    } finally {
      isSyncRunning = false;
    }
  }, intervalMs);

  logger.info(`YouTube library auto-sync scheduled every ${config.syncIntervalMinutes} minute(s).`);

  return {
    configId: activeConfigId,
    intervalMs,
  };
};

export const stopYouTubeLibrarySchedule = () => {
  clearCurrentSchedule();
  activeConfigId = "";
};

