const parseInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseBoolean = (value, fallback) => {
  if (value === undefined || String(value).trim() === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const firstConfigured = (...values) =>
  values.find((value) => String(value || "").trim()) || "";

export const zoomRecordingEnv = {
  accountId: process.env.ZOOM_ACCOUNT_ID || "",
  clientId: process.env.ZOOM_CLIENT_ID || "",
  clientSecret: process.env.ZOOM_CLIENT_SECRET || "",
  userId: process.env.ZOOM_USER_ID || "me",
  userIds: process.env.ZOOM_USER_IDS || "",
  syncLookbackDays: clamp(
    parseInteger(
      firstConfigured(process.env.ZOOM_RECORDING_SYNC_LOOKBACK_DAYS, process.env.ZOOM_SYNC_LOOKBACK_DAYS),
      30
    ),
    1,
    365
  ),
  syncPageSize: clamp(
    parseInteger(
      firstConfigured(process.env.ZOOM_RECORDING_SYNC_PAGE_SIZE, process.env.ZOOM_SYNC_PAGE_SIZE),
      100
    ),
    1,
    300
  ),
  syncIntervalMinutes: clamp(
    parseInteger(
      firstConfigured(process.env.ZOOM_RECORDING_SYNC_INTERVAL_MINUTES, process.env.SYNC_INTERVAL_MINUTES),
      15
    ),
    0,
    1440
  ),
  syncOnStart: parseBoolean(
    firstConfigured(process.env.ZOOM_RECORDING_SYNC_ON_START, process.env.SYNC_ON_START),
    true
  ),
  defaultCategory:
    firstConfigured(process.env.ZOOM_RECORDING_DEFAULT_CATEGORY, process.env.DEFAULT_CATEGORY) ||
    "General",
  categoryRules: firstConfigured(process.env.ZOOM_RECORDING_CATEGORY_RULES, process.env.CATEGORY_RULES),
};

export const getZoomRecordingUserIds = () => {
  const configuredUsers = zoomRecordingEnv.userIds || zoomRecordingEnv.userId;

  return configuredUsers
    .split(",")
    .map((userId) => userId.trim())
    .filter(Boolean);
};

export const hasZoomRecordingConfig = () =>
  Boolean(
    zoomRecordingEnv.accountId &&
      zoomRecordingEnv.clientId &&
      zoomRecordingEnv.clientSecret &&
      getZoomRecordingUserIds().length > 0
  );
