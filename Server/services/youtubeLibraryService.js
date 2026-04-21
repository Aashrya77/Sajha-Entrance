import mongoose from "mongoose";
import YouTubeChannelConfig from "../models/YouTubeChannelConfig.js";
import YouTubePlaylist from "../models/YouTubePlaylist.js";
import YouTubeVideo from "../models/YouTubeVideo.js";
import Student from "../models/Student.js";
import {
  getYouTubeLibraryCourseMatchValues,
  hasYouTubeLibraryCourseAccess,
  normalizeYouTubeLibraryCourse,
  normalizeYouTubeLibraryCourseList,
  YOUTUBE_LIBRARY_ALL_COURSES,
} from "../constants/youtubeLibrary.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("youtube-library");
const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_SYNC_SOURCE = "youtube-data-api-v3";
const MAX_API_RESULTS = 50;
const MAX_LIBRARY_LIMIT = 48;
const DEFAULT_LIBRARY_LIMIT = 12;
const MAX_PLAYLIST_SCAN_PAGES = 5;
const REQUEST_TIMEOUT_MS = 15000;
const DEFAULT_LIVE_REFRESH_MINUTES = 2;
const MIN_LIVE_REFRESH_MINUTES = 1;
const MAX_LIVE_REFRESH_MINUTES = 60;
const YOUTUBE_WATCH_BASE_URL = "https://www.youtube.com/watch";
const YOUTUBE_LIVE_STATUS_OPTIONS = Object.freeze(["unknown", "live", "offline", "error"]);

const activeSyncState = {
  promise: null,
  configId: "",
};

const liveStatusState = {
  cache: new Map(),
  promises: new Map(),
};

const YOUTUBE_HANDLE_PATTERN = /^[A-Za-z0-9._-]+$/;

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toTrimmedString = (value = "") => String(value || "").trim();

const hasYouTubeApiKey = () => Boolean(toTrimmedString(process.env.YOUTUBE_API_KEY));

const isYouTubeHostname = (hostname = "") => {
  const normalizedHostname = toTrimmedString(hostname)
    .replace(/^www\./i, "")
    .toLowerCase();

  return (
    normalizedHostname === "youtube.com" ||
    normalizedHostname.endsWith(".youtube.com") ||
    normalizedHostname === "youtube-nocookie.com" ||
    normalizedHostname.endsWith(".youtube-nocookie.com")
  );
};

const buildYouTubeLibraryError = ({
  message = "YouTube library request failed.",
  status = 400,
  code = "youtube_library_error",
  adminMessageKey = "",
  adminMessageOptions = {},
  validationFields = [],
  validationMessageKey = "",
  cause = null,
} = {}) => {
  const error = new Error(message);
  error.status = status;
  error.code = code;

  if (adminMessageKey) {
    error.adminMessageKey = adminMessageKey;
  }

  if (adminMessageOptions && Object.keys(adminMessageOptions).length > 0) {
    error.adminMessageOptions = adminMessageOptions;
  }

  if (validationMessageKey) {
    error.validationMessageKey = validationMessageKey;
  }

  if (Array.isArray(validationFields) && validationFields.length > 0) {
    error.validationFields = validationFields;
  }

  if (cause) {
    error.cause = cause;
  }

  return error;
};

const buildChannelConfigError = ({
  message = "Channel configuration is invalid.",
  validationFields = ["channelUrl", "channelId"],
  validationMessageKey = "youtubeSettings.validation.configInvalid",
  cause = null,
} = {}) =>
  buildYouTubeLibraryError({
    message,
    status: 400,
    code: "youtube_channel_config_invalid",
    adminMessageKey: "youtubeSettings.notice.channelConfigInvalid",
    validationFields,
    validationMessageKey,
    cause,
  });

const buildYouTubeApiRequestError = ({
  reason = "Unknown error.",
  status = 502,
  cause = null,
} = {}) =>
  buildYouTubeLibraryError({
    message: `YouTube API request failed: ${reason}`,
    status,
    code: "youtube_api_request_failed",
    adminMessageKey: "youtubeSettings.notice.youtubeApiFailedReason",
    adminMessageOptions: { reason },
    validationFields: ["channelUrl", "channelId"],
    validationMessageKey: "youtubeSettings.validation.channelLookupFailed",
    cause,
  });

const toNonNegativeInteger = (value, fallback, options = {}) => {
  const min = options.min ?? 0;
  const max = options.max ?? Number.MAX_SAFE_INTEGER;
  const parsedValue = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return Math.min(Math.max(parsedValue, min), max);
};

const normalizeSubjectTags = (value = []) =>
  (Array.isArray(value) ? value : value == null ? [] : [value])
    .flatMap((entry) => (typeof entry === "string" ? entry.split(",") : [entry]))
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);

const normalizeBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();

    if (["true", "1", "yes", "on"].includes(normalizedValue)) {
      return true;
    }

    if (["false", "0", "no", "off"].includes(normalizedValue)) {
      return false;
    }
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return fallback;
};

const buildVideoUrl = (videoId = "") =>
  videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : "";

const buildEmbedUrl = (videoId = "") =>
  videoId
    ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1`
    : "";

const buildPlaylistUrl = (playlistId = "") =>
  playlistId ? `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}` : "";

const extractVideoIdFromUrl = (value = "") => {
  const rawValue = toTrimmedString(value);
  if (!rawValue) {
    return "";
  }

  try {
    const parsedUrl = new URL(rawValue);
    if (parsedUrl.hostname.includes("youtu.be")) {
      return toTrimmedString(parsedUrl.pathname.split("/").filter(Boolean)[0]);
    }

    const queryVideoId = toTrimmedString(parsedUrl.searchParams.get("v"));
    if (queryVideoId) {
      return queryVideoId;
    }

    const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
    const embedVideoId = pathSegments[pathSegments.length - 1];
    if (["embed", "live", "shorts"].includes(pathSegments[0])) {
      return toTrimmedString(embedVideoId);
    }
  } catch (_error) {
    return "";
  }

  return "";
};

const pickBestThumbnailFromList = (entries = []) => {
  const thumbnailEntries = Array.isArray(entries) ? entries : [];
  return (
    thumbnailEntries
      .slice()
      .sort((left, right) => Number(right?.width || 0) - Number(left?.width || 0))
      .map((entry) => toTrimmedString(entry?.url))
      .find(Boolean) || ""
  );
};

const resolveRendererText = (value = null) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return toTrimmedString(value);
  }

  if (typeof value?.simpleText === "string") {
    return toTrimmedString(value.simpleText);
  }

  if (Array.isArray(value?.runs)) {
    return value.runs.map((entry) => toTrimmedString(entry?.text)).filter(Boolean).join("");
  }

  return "";
};

const pickBestThumbnail = (thumbnails = {}) => {
  const orderedKeys = ["maxres", "standard", "high", "medium", "default"];

  for (const key of orderedKeys) {
    const url = toTrimmedString(thumbnails?.[key]?.url);
    if (url) {
      return url;
    }
  }

  return "";
};

const buildYouTubeApiUrl = (endpoint = "", params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    query.set(key, String(value));
  });

  return `${YOUTUBE_API_BASE_URL}/${endpoint}?${query.toString()}`;
};

const fetchJsonWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "sajha-entrance/1.0",
        ...(options.headers || {}),
      },
    });

    const responseText = await response.text();
    let data = {};

    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch (_error) {
        data = {
          raw: responseText,
        };
      }
    }

    if (!response.ok) {
      const apiMessage =
        data?.error?.message || data?.error_description || `YouTube request failed with status ${response.status}`;
      const error = new Error(apiMessage);
      error.status = response.status;
      error.payload = data;
      throw error;
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
};

const fetchTextResponseWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent": "sajha-entrance/1.0",
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Channel lookup request failed with status ${response.status}`);
    }

    return {
      html: await response.text(),
      finalUrl: toTrimmedString(response.url),
      status: response.status,
    };
  } finally {
    clearTimeout(timeout);
  }
};

const fetchTextWithTimeout = async (url, options = {}) => {
  const response = await fetchTextResponseWithTimeout(url, options);
  return response.html;
};

const callYouTubeApi = async (endpoint, params = {}, apiKey = "") => {
  const resolvedApiKey = apiKey || readYouTubeApiKey();

  const url = buildYouTubeApiUrl(endpoint, {
    ...params,
    key: resolvedApiKey,
  });

  try {
    return await fetchJsonWithTimeout(url);
  } catch (error) {
    const primaryApiReason = toTrimmedString(
      error?.payload?.error?.errors?.[0]?.reason || error?.payload?.error?.status
    );
    const normalizedMessage =
      toTrimmedString(error?.message) ||
      (error?.status ? `status ${error.status}` : "Unknown error.");

    if (error?.name === "AbortError") {
      throw buildYouTubeApiRequestError({
        reason: "Request timed out. Try again in a moment.",
        status: 504,
        cause: error,
      });
    }

    if (["quotaExceeded", "dailyLimitExceeded", "rateLimitExceeded"].includes(primaryApiReason)) {
      throw buildYouTubeApiRequestError({
        reason: "Quota exceeded. Try again later.",
        status: 429,
        cause: error,
      });
    }

    throw buildYouTubeApiRequestError({
      reason: normalizedMessage,
      status: Number(error?.status) || 502,
      cause: error,
    });
  }
};

const collectAllYouTubeItems = async (endpoint, params = {}, apiKey = "") => {
  const items = [];
  let pageToken = "";

  do {
    const response = await callYouTubeApi(
      endpoint,
      {
        ...params,
        maxResults: params.maxResults || MAX_API_RESULTS,
        pageToken,
      },
      apiKey
    );

    items.push(...(Array.isArray(response.items) ? response.items : []));
    pageToken = toTrimmedString(response.nextPageToken);
  } while (pageToken);

  return items;
};

const chunkArray = (values = [], chunkSize = 50) => {
  const chunks = [];

  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }

  return chunks;
};

const readYouTubeApiKey = () => {
  const apiKey = toTrimmedString(process.env.YOUTUBE_API_KEY);

  if (!apiKey) {
    throw buildYouTubeLibraryError({
      message: "YOUTUBE_API_KEY is missing in server environment",
      status: 500,
      code: "youtube_api_key_missing",
      adminMessageKey: "youtubeSettings.notice.apiKeyMissing",
    });
  }

  return apiKey;
};

const normalizeChannelIdentifier = (value = "") => {
  const normalizedValue = toTrimmedString(value);
  return /^UC[a-zA-Z0-9_-]{20,}$/.test(normalizedValue) ? normalizedValue : "";
};

const parseChannelInput = (value = "") => {
  const rawValue = toTrimmedString(value);
  const directChannelId = normalizeChannelIdentifier(rawValue);

  if (directChannelId) {
    return {
      rawValue,
      channelId: directChannelId,
      handle: "",
      username: "",
      customPath: "",
      url: "",
      isValid: true,
      isYouTubeUrl: true,
      isSupportedChannelUrl: true,
    };
  }

  if (!rawValue) {
    return {
      rawValue,
      channelId: "",
      handle: "",
      username: "",
      customPath: "",
      url: "",
      hostname: "",
      isValid: true,
      isYouTubeUrl: true,
      isSupportedChannelUrl: false,
    };
  }

  if (!/^https?:\/\//i.test(rawValue)) {
    const normalizedHandle = rawValue.replace(/^@/, "");
    const isValidHandle = YOUTUBE_HANDLE_PATTERN.test(normalizedHandle);

    return {
      rawValue,
      channelId: "",
      handle: isValidHandle ? normalizedHandle : "",
      username: "",
      customPath: "",
      url: isValidHandle ? `https://www.youtube.com/@${normalizedHandle}` : "",
      hostname: "youtube.com",
      isValid: isValidHandle,
      isYouTubeUrl: true,
      isSupportedChannelUrl: isValidHandle,
    };
  }

  let parsedUrl = null;
  try {
    parsedUrl = new URL(rawValue);
  } catch (_error) {
    return {
      rawValue,
      channelId: "",
      handle: "",
      username: "",
      customPath: "",
      url: rawValue,
      hostname: "",
      isValid: false,
      isYouTubeUrl: false,
      isSupportedChannelUrl: false,
    };
  }

  const hostname = toTrimmedString(parsedUrl.hostname).replace(/^www\./i, "").toLowerCase();
  const pathSegments = parsedUrl.pathname
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  const [firstSegment = "", secondSegment = ""] = pathSegments;
  const handle = firstSegment.startsWith("@") ? firstSegment.slice(1) : "";
  const isYouTubeUrl = isYouTubeHostname(hostname);
  const isSupportedChannelUrl = Boolean(
    handle || firstSegment === "channel" || firstSegment === "user" || firstSegment === "c"
  );

  return {
    rawValue,
    channelId: firstSegment === "channel" ? normalizeChannelIdentifier(secondSegment) : "",
    handle,
    username: firstSegment === "user" ? secondSegment : "",
    customPath: firstSegment === "c" ? secondSegment : "",
    url: rawValue,
    hostname,
    isValid: isYouTubeUrl && isSupportedChannelUrl,
    isYouTubeUrl,
    isSupportedChannelUrl,
  };
};

const clampLiveRefreshMinutes = (value, fallback = DEFAULT_LIVE_REFRESH_MINUTES) =>
  toNonNegativeInteger(value, fallback, {
    min: MIN_LIVE_REFRESH_MINUTES,
    max: MAX_LIVE_REFRESH_MINUTES,
  });

const buildChannelLiveUrl = (config = {}) => {
  const normalizedHandle = toTrimmedString(config?.channelHandle).replace(/^@/, "");
  if (normalizedHandle) {
    return `https://www.youtube.com/@${normalizedHandle}/live`;
  }

  const parsedChannelInput = parseChannelInput(config?.channelUrl || "");
  if (parsedChannelInput.handle) {
    return `https://www.youtube.com/@${parsedChannelInput.handle.replace(/^@/, "")}/live`;
  }

  const normalizedChannelId = normalizeChannelIdentifier(config?.channelId || parsedChannelInput.channelId);
  if (normalizedChannelId) {
    return `https://www.youtube.com/channel/${normalizedChannelId}/live`;
  }

  if (!parsedChannelInput.url) {
    return "";
  }

  try {
    const liveUrl = new URL(parsedChannelInput.url);
    const pathname = liveUrl.pathname.replace(/\/+$/, "");
    liveUrl.pathname = pathname.endsWith("/live") ? pathname : `${pathname}/live`;
    liveUrl.search = "";
    liveUrl.hash = "";
    return liveUrl.toString();
  } catch (_error) {
    return "";
  }
};

const extractCanonicalUrl = (html = "") =>
  toTrimmedString(
    html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1] ||
      html.match(/"canonical":"([^"]+)"/i)?.[1]
  );

const extractAssignedJson = (html = "", markers = []) => {
  for (const marker of markers) {
    const markerIndex = html.indexOf(marker);
    if (markerIndex < 0) {
      continue;
    }

    const jsonStart = html.indexOf("{", markerIndex + marker.length);
    if (jsonStart < 0) {
      continue;
    }

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = jsonStart; index < html.length; index += 1) {
      const character = html[index];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (character === "\\") {
          escaped = true;
        } else if (character === "\"") {
          inString = false;
        }
        continue;
      }

      if (character === "\"") {
        inString = true;
        continue;
      }

      if (character === "{") {
        depth += 1;
      } else if (character === "}") {
        depth -= 1;

        if (depth === 0) {
          const payload = html.slice(jsonStart, index + 1);
          try {
            return JSON.parse(payload);
          } catch (_error) {
            break;
          }
        }
      }
    }
  }

  return null;
};

const extractInitialPlayerResponse = (html = "") =>
  extractAssignedJson(html, [
    "var ytInitialPlayerResponse = ",
    "ytInitialPlayerResponse = ",
  ]);

const inferCourseFromLibraryText = (...values) => {
  const searchText = values
    .map((entry) => toTrimmedString(entry).toLowerCase())
    .filter(Boolean)
    .join(" ");

  if (!searchText) {
    return "";
  }

  const courseMatchers = [
    { course: "BSc.CSIT", pattern: /\bbsc\.?\s*csit\b|\bcsit\b/i },
    { course: "BIT", pattern: /\bbit\b/i },
    { course: "BCA", pattern: /\bbca\b/i },
    { course: "CMAT", pattern: /\bcmat\b/i },
    { course: "IOE", pattern: /\bioe\b|\bengineering entrance\b/i },
    { course: "NEB Preparation", pattern: /\bneb\b/i },
  ];

  return (
    courseMatchers.find((entry) => entry.pattern.test(searchText))?.course || ""
  );
};

const buildEmptyLiveStatus = (config = null, overrides = {}) => {
  const plainConfig = config ? toPlainConfig(config) : null;

  return {
    enabled: Boolean(plainConfig?.isActive && plainConfig?.enableLiveDetection),
    status: "offline",
    isLive: false,
    videoId: "",
    title: "",
    thumbnail: "",
    startedAt: null,
    watchUrl: "",
    embedUrl: "",
    channelTitle: toTrimmedString(plainConfig?.channelTitle),
    allowedCourses: normalizeYouTubeLibraryCourseList(plainConfig?.allowedCourses || []),
    inferredCourse: "",
    liveSectionLabel: toTrimmedString(plainConfig?.liveSectionLabel) || "Currently Live",
    showEmbeddedLivePlayer: plainConfig?.showEmbeddedLivePlayer !== false,
    refreshIntervalMinutes: clampLiveRefreshMinutes(plainConfig?.liveStatusRefreshMinutes),
    checkedAt: new Date(),
    detectionMethod: "youtube-live-page",
    error: "",
    ...overrides,
  };
};

const readCachedLiveStatus = (cacheKey = "") => {
  const cachedEntry = liveStatusState.cache.get(cacheKey);
  if (!cachedEntry) {
    return null;
  }

  if (cachedEntry.expiresAt <= Date.now()) {
    liveStatusState.cache.delete(cacheKey);
    return null;
  }

  return cachedEntry.value;
};

const writeCachedLiveStatus = (cacheKey = "", value = null, ttlMs = 0) => {
  if (!cacheKey || !ttlMs) {
    return;
  }

  liveStatusState.cache.set(cacheKey, {
    expiresAt: Date.now() + ttlMs,
    value,
  });
};

const normalizeLiveStatusValue = (value = "") =>
  YOUTUBE_LIVE_STATUS_OPTIONS.includes(toTrimmedString(value)) ? toTrimmedString(value) : "unknown";

const persistLiveDetectionSnapshot = async ({
  config = null,
  checkedAt = new Date(),
  lastLiveStatus = "unknown",
} = {}) => {
  const configId = config?._id || null;
  if (!configId) {
    return;
  }

  try {
    await YouTubeChannelConfig.collection.updateOne(
      { _id: configId },
      {
        $set: {
          lastLiveCheckedAt: checkedAt,
          lastLiveStatus: normalizeLiveStatusValue(lastLiveStatus),
        },
      }
    );
  } catch (error) {
    logger.warn("Failed to persist YouTube live status snapshot:", error.message);
  }
};

const logLiveDetectionOutcome = ({
  config = null,
  liveStatus = null,
  fallbackUsed = false,
  finalUrl = "",
} = {}) => {
  const logPayload = {
    channelId: toTrimmedString(config?.channelId),
    channelTitle: toTrimmedString(config?.channelTitle),
    status: toTrimmedString(liveStatus?.status) || "unknown",
    videoId: toTrimmedString(liveStatus?.videoId),
    finalUrl: toTrimmedString(finalUrl),
    fallbackUsed,
    detectionMethod: toTrimmedString(liveStatus?.detectionMethod),
  };

  if (liveStatus?.status === "live") {
    logger.info("YouTube live detected", logPayload);
    return;
  }

  if (liveStatus?.status === "error") {
    logger.error("YouTube live detection failed", {
      ...logPayload,
      error: toTrimmedString(liveStatus?.error),
    });
    return;
  }

  if (liveStatus?.status === "unknown") {
    logger.warn("YouTube live check returned an unknown status", logPayload);
    return;
  }

  logger.info("YouTube live check completed with no active stream", logPayload);
};

const extractChannelMetadataFromHtml = (html = "") => {
  const channelIdPatterns = [
    /"channelId":"(UC[a-zA-Z0-9_-]+)"/i,
    /"externalId":"(UC[a-zA-Z0-9_-]+)"/i,
    /itemprop="channelId"\s+content="(UC[a-zA-Z0-9_-]+)"/i,
  ];

  const handlePatterns = [
    /"canonicalBaseUrl":"\/@([^"]+)"/i,
    /<link[^>]+rel="canonical"[^>]+href="https:\/\/www\.youtube\.com\/@([^"\/?#]+)"/i,
  ];

  return {
    channelId:
      channelIdPatterns
        .map((pattern) => html.match(pattern)?.[1])
        .find(Boolean) || "",
    handle:
      handlePatterns
        .map((pattern) => html.match(pattern)?.[1])
        .find(Boolean) || "",
  };
};

const fetchChannelById = async (channelId, apiKey) => {
  const response = await callYouTubeApi(
    "channels",
    {
      part: "snippet,contentDetails,brandingSettings",
      id: channelId,
      maxResults: 1,
    },
    apiKey
  );

  return response.items?.[0] || null;
};

const fetchChannelByHandle = async (handle, apiKey) => {
  if (!handle) {
    return null;
  }

  const response = await callYouTubeApi(
    "channels",
    {
      part: "snippet,contentDetails,brandingSettings",
      forHandle: handle.replace(/^@/, ""),
      maxResults: 1,
    },
    apiKey
  );

  return response.items?.[0] || null;
};

const fetchChannelByUsername = async (username, apiKey) => {
  if (!username) {
    return null;
  }

  const response = await callYouTubeApi(
    "channels",
    {
      part: "snippet,contentDetails,brandingSettings",
      forUsername: username,
      maxResults: 1,
    },
    apiKey
  );

  return response.items?.[0] || null;
};

const resolveChannelFromHtml = async (url, apiKey) => {
  if (!url) {
    return null;
  }

  try {
    const html = await fetchTextWithTimeout(url);
    const extractedMetadata = extractChannelMetadataFromHtml(html);

    if (extractedMetadata.channelId) {
      return fetchChannelById(extractedMetadata.channelId, apiKey);
    }

    if (extractedMetadata.handle) {
      return fetchChannelByHandle(extractedMetadata.handle, apiKey);
    }
  } catch (error) {
    logger.warn("Channel HTML lookup failed:", error.message);
  }

  return null;
};

const resolveChannelRecord = async ({ channelUrl = "", channelId = "" } = {}) => {
  const normalizedChannelUrl = toTrimmedString(channelUrl);
  const normalizedChannelId = toTrimmedString(channelId);

  if (!normalizedChannelUrl && !normalizedChannelId) {
    throw buildYouTubeLibraryError({
      message: "Channel ID or URL is required before syncing.",
      status: 400,
      code: "youtube_channel_input_required",
      adminMessageKey: "youtubeSettings.notice.channelRequiredBeforeSync",
      validationFields: ["channelUrl", "channelId"],
      validationMessageKey: "youtubeSettings.validation.channelRequired",
    });
  }

  if (normalizedChannelId && !normalizeChannelIdentifier(normalizedChannelId) && !normalizedChannelUrl) {
    throw buildChannelConfigError({
      message: "Enter a valid YouTube channel ID that starts with UC.",
      validationFields: ["channelId"],
      validationMessageKey: "youtubeSettings.validation.channelIdInvalid",
    });
  }

  const apiKey = readYouTubeApiKey();
  const directChannelId = normalizeChannelIdentifier(normalizedChannelId);

  if (directChannelId) {
    const directChannel = await fetchChannelById(directChannelId, apiKey);
    if (!directChannel) {
      throw buildChannelConfigError({
        message: "The provided YouTube channel ID could not be found.",
        validationFields: ["channelId"],
        validationMessageKey: "youtubeSettings.validation.channelLookupFailed",
      });
    }

    return directChannel;
  }

  const parsedInput = parseChannelInput(normalizedChannelUrl);

  if (!parsedInput.isValid) {
    if (/^https?:\/\//i.test(normalizedChannelUrl) && !parsedInput.isYouTubeUrl) {
      throw buildChannelConfigError({
        message: "Enter a valid YouTube channel URL. Use a /channel/ URL or an @handle URL.",
        validationFields: ["channelUrl"],
        validationMessageKey: "youtubeSettings.validation.channelUrlInvalid",
      });
    }

    throw buildChannelConfigError({
      message: "Enter a valid YouTube channel URL or @handle.",
      validationFields: ["channelUrl"],
      validationMessageKey: "youtubeSettings.validation.channelUrlInvalid",
    });
  }

  if (parsedInput.channelId) {
    const channel = await fetchChannelById(parsedInput.channelId, apiKey);
    if (channel) {
      return channel;
    }
  }

  if (parsedInput.handle) {
    const channel = await fetchChannelByHandle(parsedInput.handle, apiKey);
    if (channel) {
      return channel;
    }
  }

  if (parsedInput.username) {
    const channel = await fetchChannelByUsername(parsedInput.username, apiKey);
    if (channel) {
      return channel;
    }
  }

  if (parsedInput.customPath || parsedInput.url) {
    const channel = await resolveChannelFromHtml(parsedInput.url, apiKey);
    if (channel) {
      return channel;
    }
  }

  throw buildChannelConfigError({
    message:
      "We could not resolve that YouTube channel. Use a /channel/ URL, an @handle URL, or a valid channel ID.",
    validationFields: normalizedChannelUrl ? ["channelUrl"] : ["channelUrl", "channelId"],
    validationMessageKey: "youtubeSettings.validation.channelLookupFailed",
  });
};

const formatChannelUrl = (channel = {}) => {
  const handle = toTrimmedString(channel?.snippet?.customUrl || "").replace(/^@/, "");
  const channelId = toTrimmedString(channel?.id);

  if (handle) {
    return `https://www.youtube.com/@${handle}`;
  }

  if (channelId) {
    return `https://www.youtube.com/channel/${channelId}`;
  }

  return "";
};

const formatChannelPayload = (channel = {}) => ({
  channelId: toTrimmedString(channel?.id),
  channelTitle: toTrimmedString(channel?.snippet?.title),
  channelThumbnail: pickBestThumbnail(channel?.snippet?.thumbnails),
  channelHandle: toTrimmedString(channel?.snippet?.customUrl || "").replace(/^@/, ""),
  channelUrl: formatChannelUrl(channel),
  uploadsPlaylistId: toTrimmedString(channel?.contentDetails?.relatedPlaylists?.uploads),
});

const fetchChannelPlaylists = async ({ channelId, apiKey }) => {
  const playlistItems = await collectAllYouTubeItems(
    "playlists",
    {
      part: "snippet,contentDetails,status",
      channelId,
      maxResults: MAX_API_RESULTS,
    },
    apiKey
  );

  return playlistItems.map((playlist) => ({
    youtubePlaylistId: toTrimmedString(playlist?.id),
    title: toTrimmedString(playlist?.snippet?.title) || "Untitled Playlist",
    description: toTrimmedString(playlist?.snippet?.description),
    thumbnail: pickBestThumbnail(playlist?.snippet?.thumbnails),
    publishedAt: playlist?.snippet?.publishedAt ? new Date(playlist.snippet.publishedAt) : null,
    videoCount: Number(playlist?.contentDetails?.itemCount || 0),
    playlistUrl: buildPlaylistUrl(playlist?.id),
    channelId,
    rawData: playlist,
  }));
};

const fetchLatestUploadedVideos = async ({ uploadsPlaylistId, apiKey, maxVideos }) => {
  const uniqueVideos = new Map();
  let pageToken = "";

  while (uniqueVideos.size < maxVideos) {
    const response = await callYouTubeApi(
      "playlistItems",
      {
        part: "snippet,contentDetails,status",
        playlistId: uploadsPlaylistId,
        maxResults: Math.min(MAX_API_RESULTS, maxVideos),
        pageToken,
      },
      apiKey
    );

    const items = Array.isArray(response.items) ? response.items : [];
    items.forEach((item) => {
      const videoId =
        toTrimmedString(item?.contentDetails?.videoId) ||
        toTrimmedString(item?.snippet?.resourceId?.videoId);

      if (!videoId || uniqueVideos.has(videoId) || uniqueVideos.size >= maxVideos) {
        return;
      }

      uniqueVideos.set(videoId, item);
    });

    pageToken = toTrimmedString(response.nextPageToken);
    if (!pageToken || !items.length) {
      break;
    }
  }

  return Array.from(uniqueVideos.entries()).map(([videoId, item]) => ({
    videoId,
    title: toTrimmedString(item?.snippet?.title) || "Untitled Video",
    description: toTrimmedString(item?.snippet?.description),
    thumbnail: pickBestThumbnail(item?.snippet?.thumbnails),
    publishedAt: item?.contentDetails?.videoPublishedAt || item?.snippet?.publishedAt || null,
    rawData: item,
  }));
};

const fetchVideoDetails = async ({ videoIds, apiKey }) => {
  const detailsLookup = new Map();

  for (const chunk of chunkArray(videoIds, MAX_API_RESULTS)) {
    const response = await callYouTubeApi(
      "videos",
      {
        part: "snippet,contentDetails,liveStreamingDetails,status",
        id: chunk.join(","),
        maxResults: MAX_API_RESULTS,
      },
      apiKey
    );

    (Array.isArray(response.items) ? response.items : []).forEach((item) => {
      detailsLookup.set(toTrimmedString(item?.id), item);
    });
  }

  return detailsLookup;
};

const fetchPlaylistMembership = async ({ playlists, targetVideoIds, apiKey }) => {
  const targetVideoSet = new Set(targetVideoIds);
  const membershipLookup = new Map();
  const firstVideoLookup = new Map();

  if (!playlists.length) {
    return { membershipLookup, firstVideoLookup };
  }

  for (const playlist of playlists) {
    let pageToken = "";
    let pageCount = 0;

    do {
      const response = await callYouTubeApi(
        "playlistItems",
        {
          part: "snippet,contentDetails,status",
          playlistId: playlist.youtubePlaylistId,
          maxResults: MAX_API_RESULTS,
          pageToken,
        },
        apiKey
      );

      const items = Array.isArray(response.items) ? response.items : [];
      items.forEach((item, index) => {
        const videoId =
          toTrimmedString(item?.contentDetails?.videoId) ||
          toTrimmedString(item?.snippet?.resourceId?.videoId);

        if (!videoId) {
          return;
        }

        if (!firstVideoLookup.has(playlist.youtubePlaylistId) && index === 0) {
          firstVideoLookup.set(playlist.youtubePlaylistId, videoId);
        }

        if (!targetVideoSet.has(videoId)) {
          return;
        }

        if (!membershipLookup.has(videoId)) {
          membershipLookup.set(videoId, new Set());
        }

        membershipLookup.get(videoId).add(playlist.youtubePlaylistId);
      });

      pageToken = toTrimmedString(response.nextPageToken);
      pageCount += 1;
    } while (pageToken && pageCount < MAX_PLAYLIST_SCAN_PAGES);
  }

  return { membershipLookup, firstVideoLookup };
};

const preservePlaylistOverrides = (existingPlaylist, allowedCourses, nextPlaylist) => ({
  ...nextPlaylist,
  isVisible: existingPlaylist?.isVisible ?? true,
  subjectTag: toTrimmedString(existingPlaylist?.subjectTag),
  allowedCourses,
  firstVideoId: toTrimmedString(existingPlaylist?.firstVideoId) || toTrimmedString(nextPlaylist.firstVideoId),
});

const preserveVideoOverrides = (existingVideo, allowedCourses, nextVideo) => ({
  ...nextVideo,
  isVisible: existingVideo?.isVisible ?? true,
  subjectTag: toTrimmedString(existingVideo?.subjectTag),
  allowedCourses,
  playlistIds: Array.from(
    new Set([
      ...(Array.isArray(existingVideo?.playlistIds) ? existingVideo.playlistIds : []),
      ...(Array.isArray(nextVideo.playlistIds) ? nextVideo.playlistIds : []),
    ])
  ),
});

const buildPlaylistSearchFilter = (search = "") => {
  const normalizedSearch = toTrimmedString(search);
  if (!normalizedSearch) {
    return {};
  }

  return {
    $or: [
      { title: { $regex: escapeRegex(normalizedSearch), $options: "i" } },
      { description: { $regex: escapeRegex(normalizedSearch), $options: "i" } },
      { subjectTag: { $regex: escapeRegex(normalizedSearch), $options: "i" } },
    ],
  };
};

const buildLibraryAccessQuery = (studentCourse = "") => {
  const matchValues = getYouTubeLibraryCourseMatchValues(studentCourse);

  if (!matchValues.length) {
    return {
      $or: [
        { allowedCourses: { $exists: false } },
        { allowedCourses: { $size: 0 } },
        { allowedCourses: YOUTUBE_LIBRARY_ALL_COURSES },
      ],
    };
  }

  return {
    $or: [
      { allowedCourses: { $exists: false } },
      { allowedCourses: { $size: 0 } },
      { allowedCourses: YOUTUBE_LIBRARY_ALL_COURSES },
      { allowedCourses: { $in: matchValues } },
    ],
  };
};

const resolveConfigPayload = (payload = {}, existingConfig = null, currentAdmin = null) => {
  const nextAllowedCourses = normalizeYouTubeLibraryCourseList(payload.allowedCourses);
  const nextSubjectTags = normalizeSubjectTags(payload.subjectTags);
  const nextChannelUrl = toTrimmedString(payload.channelUrl);
  const nextChannelId = toTrimmedString(payload.channelId);

  if (!nextChannelUrl && !nextChannelId) {
    throw buildYouTubeLibraryError({
      message: "Channel ID or URL is required before syncing.",
      status: 400,
      code: "youtube_channel_input_required",
      adminMessageKey: "youtubeSettings.notice.channelRequiredBeforeSync",
      validationFields: ["channelUrl", "channelId"],
      validationMessageKey: "youtubeSettings.validation.channelRequired",
    });
  }

  return {
    channelUrl: nextChannelUrl,
    channelId: nextChannelId,
    channelTitle: toTrimmedString(payload.channelTitle) || existingConfig?.channelTitle || "",
    channelThumbnail:
      toTrimmedString(payload.channelThumbnail) || existingConfig?.channelThumbnail || "",
    channelHandle: toTrimmedString(payload.channelHandle) || existingConfig?.channelHandle || "",
    isActive: normalizeBoolean(payload.isActive, existingConfig?.isActive ?? false),
    allowedCourses: nextAllowedCourses.length ? nextAllowedCourses : [YOUTUBE_LIBRARY_ALL_COURSES],
    subjectTags: nextSubjectTags,
    showPlaylists: normalizeBoolean(payload.showPlaylists, existingConfig?.showPlaylists ?? true),
    showVideos: normalizeBoolean(payload.showVideos, existingConfig?.showVideos ?? true),
    maxVideos: toNonNegativeInteger(payload.maxVideos, existingConfig?.maxVideos ?? 24, {
      min: 1,
      max: 250,
    }),
    syncMode: ["interval", "manual"].includes(toTrimmedString(payload.syncMode))
      ? toTrimmedString(payload.syncMode)
      : existingConfig?.syncMode || "manual",
    syncIntervalMinutes: toNonNegativeInteger(
      payload.syncIntervalMinutes,
      existingConfig?.syncIntervalMinutes ?? 60,
      {
        min: 5,
        max: 1440,
      }
    ),
    showPlaylistsFirst: normalizeBoolean(
      payload.showPlaylistsFirst,
      existingConfig?.showPlaylistsFirst ?? true
    ),
    enableLiveDetection: normalizeBoolean(
      payload.enableLiveDetection,
      existingConfig?.enableLiveDetection ?? true
    ),
    liveStatusRefreshMinutes: clampLiveRefreshMinutes(
      payload.liveStatusRefreshMinutes,
      existingConfig?.liveStatusRefreshMinutes ?? DEFAULT_LIVE_REFRESH_MINUTES
    ),
    showEmbeddedLivePlayer: normalizeBoolean(
      payload.showEmbeddedLivePlayer,
      existingConfig?.showEmbeddedLivePlayer ?? true
    ),
    liveSectionLabel:
      toTrimmedString(payload.liveSectionLabel) ||
      toTrimmedString(existingConfig?.liveSectionLabel) ||
      "Currently Live",
    updatedBy: currentAdmin?.id || existingConfig?.updatedBy || null,
    ...(existingConfig ? {} : { createdBy: currentAdmin?.id || null }),
  };
};

const toPlainConfig = (config = null) => {
  if (!config) {
    return null;
  }

  return {
    id: config._id.toString(),
    channelUrl: toTrimmedString(config.channelUrl),
    channelId: toTrimmedString(config.channelId),
    channelHandle: toTrimmedString(config.channelHandle),
    channelTitle: toTrimmedString(config.channelTitle),
    channelThumbnail: toTrimmedString(config.channelThumbnail),
    isActive: Boolean(config.isActive),
    allowedCourses: normalizeYouTubeLibraryCourseList(config.allowedCourses),
    subjectTags: normalizeSubjectTags(config.subjectTags),
    showPlaylists: Boolean(config.showPlaylists),
    showVideos: Boolean(config.showVideos),
    maxVideos: Number(config.maxVideos || 0),
    syncMode: toTrimmedString(config.syncMode) || "manual",
    syncIntervalMinutes: Number(config.syncIntervalMinutes || 60),
    showPlaylistsFirst: Boolean(config.showPlaylistsFirst),
    enableLiveDetection: normalizeBoolean(config.enableLiveDetection, true),
    liveStatusRefreshMinutes: clampLiveRefreshMinutes(config.liveStatusRefreshMinutes),
    showEmbeddedLivePlayer: normalizeBoolean(config.showEmbeddedLivePlayer, true),
    liveSectionLabel: toTrimmedString(config.liveSectionLabel) || "Currently Live",
    lastLiveCheckedAt: config.lastLiveCheckedAt || null,
    lastLiveStatus: normalizeLiveStatusValue(config.lastLiveStatus),
    lastSyncedAt: config.lastSyncedAt,
    lastSyncStatus: toTrimmedString(config.lastSyncStatus) || "idle",
    lastSyncError: toTrimmedString(config.lastSyncError),
    lastSyncSummary: config.lastSyncSummary || null,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
};

const resolveStudentForLibrary = async (studentPayload = {}) => {
  const studentId = toTrimmedString(studentPayload?.id);
  if (!studentId) {
    return null;
  }

  return Student.findById(studentId).select("_id course accountStatus").lean();
};

const ensureStudentLibraryAccess = async ({ studentPayload = {}, course = "" } = {}) => {
  const student = await resolveStudentForLibrary(studentPayload);
  if (!student) {
    const error = new Error("Student account could not be found.");
    error.status = 401;
    throw error;
  }

  if (student.accountStatus !== "Paid") {
    const error = new Error("Complete payment to access recorded classes.");
    error.status = 403;
    throw error;
  }

  return {
    student,
    effectiveCourse:
      course && hasYouTubeLibraryCourseAccess(course, [student.course]) ? course : student.course,
  };
};

const resolveLiveStatusFromVideoDetails = ({ videoDetails = null, config = null, videoId = "" } = {}) => {
  if (!videoDetails || !toTrimmedString(videoId || videoDetails?.id)) {
    return buildEmptyLiveStatus(config);
  }

  const resolvedVideoId = toTrimmedString(videoId || videoDetails?.id);
  const liveBroadcastContent = toTrimmedString(videoDetails?.snippet?.liveBroadcastContent).toLowerCase();
  const hasStarted = Boolean(videoDetails?.liveStreamingDetails?.actualStartTime);
  const hasEnded = Boolean(videoDetails?.liveStreamingDetails?.actualEndTime);
  const isLive = liveBroadcastContent === "live" || (hasStarted && !hasEnded);

  if (!isLive) {
    return buildEmptyLiveStatus(config, {
      status: "offline",
      detectionMethod: "youtube-video-api-fallback",
    });
  }

  const allowedCourses = normalizeYouTubeLibraryCourseList(config?.allowedCourses || []);
  const singleConfiguredCourse =
    allowedCourses.length === 1 && allowedCourses[0] !== YOUTUBE_LIBRARY_ALL_COURSES
      ? allowedCourses[0]
      : "";

  return buildEmptyLiveStatus(config, {
    status: "live",
    isLive: true,
    videoId: resolvedVideoId,
    title: toTrimmedString(videoDetails?.snippet?.title) || "YouTube Live",
    thumbnail:
      pickBestThumbnail(videoDetails?.snippet?.thumbnails) ||
      pickBestThumbnail(config?.channelThumbnail ? { high: { url: config.channelThumbnail } } : {}),
    startedAt: videoDetails?.liveStreamingDetails?.actualStartTime
      ? new Date(videoDetails.liveStreamingDetails.actualStartTime)
      : null,
    watchUrl: `${YOUTUBE_WATCH_BASE_URL}?v=${encodeURIComponent(resolvedVideoId)}`,
    embedUrl: buildEmbedUrl(resolvedVideoId),
    channelTitle:
      toTrimmedString(videoDetails?.snippet?.channelTitle) || toTrimmedString(config?.channelTitle),
    allowedCourses,
    inferredCourse:
      singleConfiguredCourse ||
      inferCourseFromLibraryText(
        videoDetails?.snippet?.title,
        videoDetails?.snippet?.description,
        videoDetails?.snippet?.channelTitle
      ),
    detectionMethod: "youtube-video-api-fallback",
  });
};

const fetchFallbackLiveVideoDetails = async ({ videoId = "" } = {}) => {
  const normalizedVideoId = toTrimmedString(videoId);
  const apiKey = readYouTubeApiKey();

  if (!normalizedVideoId || !apiKey) {
    return null;
  }

  const response = await callYouTubeApi(
    "videos",
    {
      part: "snippet,liveStreamingDetails,status",
      id: normalizedVideoId,
      maxResults: 1,
    },
    apiKey
  );

  return response.items?.[0] || null;
};

// Live detection prefers the public /live page so routine checks avoid API quota.
// If YouTube changes that markup but still exposes a watch URL, we fall back to
// videos.list for that single candidate video and then cache/persist the outcome.
const resolveLiveStatusFromHtml = ({ html = "", config = null, finalUrl = "" } = {}) => {
  const playerResponse = extractInitialPlayerResponse(html);
  const liveBroadcastDetails =
    playerResponse?.microformat?.playerMicroformatRenderer?.liveBroadcastDetails || {};
  const canonicalUrl = extractCanonicalUrl(html);
  const resolvedWatchUrl = finalUrl || canonicalUrl;
  const videoId =
    toTrimmedString(playerResponse?.videoDetails?.videoId) ||
    extractVideoIdFromUrl(canonicalUrl) ||
    extractVideoIdFromUrl(finalUrl);
  const isLive = Boolean(liveBroadcastDetails?.isLiveNow || playerResponse?.videoDetails?.isLive);

  if (!playerResponse) {
    return buildEmptyLiveStatus(config, {
      status: "unknown",
      videoId,
      watchUrl: resolvedWatchUrl,
      detectionMethod: "youtube-live-page",
    });
  }

  if (!isLive || !videoId) {
    return buildEmptyLiveStatus(config, {
      status: "offline",
      videoId,
      watchUrl: resolvedWatchUrl,
      detectionMethod: "youtube-live-page",
    });
  }

  const title = toTrimmedString(playerResponse?.videoDetails?.title) || "YouTube Live";
  const description =
    resolveRendererText(playerResponse?.microformat?.playerMicroformatRenderer?.description) ||
    toTrimmedString(playerResponse?.videoDetails?.shortDescription);
  const allowedCourses = normalizeYouTubeLibraryCourseList(config?.allowedCourses || []);
  const singleConfiguredCourse =
    allowedCourses.length === 1 && allowedCourses[0] !== YOUTUBE_LIBRARY_ALL_COURSES
      ? allowedCourses[0]
      : "";

  return buildEmptyLiveStatus(config, {
    status: "live",
    isLive: true,
    videoId,
    title,
    thumbnail:
      pickBestThumbnailFromList(playerResponse?.videoDetails?.thumbnail?.thumbnails) ||
      pickBestThumbnail(config?.channelThumbnail ? { high: { url: config.channelThumbnail } } : {}),
    startedAt: liveBroadcastDetails?.startTimestamp
      ? new Date(liveBroadcastDetails.startTimestamp)
      : null,
    watchUrl: `${YOUTUBE_WATCH_BASE_URL}?v=${encodeURIComponent(videoId)}`,
    embedUrl: buildEmbedUrl(videoId),
    channelTitle:
      toTrimmedString(playerResponse?.videoDetails?.author) || toTrimmedString(config?.channelTitle),
    allowedCourses,
    inferredCourse: singleConfiguredCourse || inferCourseFromLibraryText(title, description),
  });
};

const getYouTubeLiveStatusForCourse = async ({
  configDocument = null,
  effectiveCourse = "",
  force = false,
} = {}) => {
  const config =
    configDocument || (await YouTubeChannelConfig.findOne({ configKey: "default" }).lean());
  const baseStatus = buildEmptyLiveStatus(config);

  if (
    !config ||
    !baseStatus.enabled ||
    (!toTrimmedString(config.channelId) &&
      !toTrimmedString(config.channelUrl) &&
      !toTrimmedString(config.channelHandle))
  ) {
    return baseStatus;
  }

  if (!hasYouTubeLibraryCourseAccess(effectiveCourse, config.allowedCourses)) {
    return buildEmptyLiveStatus(config, {
      enabled: false,
      allowedCourses: [],
    });
  }

  const liveUrl = buildChannelLiveUrl(config);
  if (!liveUrl) {
    return buildEmptyLiveStatus(config, {
      error: "A valid YouTube live URL could not be built from the saved channel settings.",
    });
  }

  const cacheKey = toTrimmedString(config?._id || config?.channelId || "default");
  if (!force) {
    const cachedStatus = readCachedLiveStatus(cacheKey);
    if (cachedStatus) {
      return cachedStatus;
    }

    if (liveStatusState.promises.has(cacheKey)) {
      return liveStatusState.promises.get(cacheKey);
    }
  }

  const ttlMs = baseStatus.refreshIntervalMinutes * 60 * 1000;
  const liveStatusPromise = (async () => {
    let finalUrl = "";
    let fallbackUsed = false;
    let liveStatus = null;

    try {
      const liveResponse = await fetchTextResponseWithTimeout(liveUrl);
      finalUrl = liveResponse.finalUrl;
      liveStatus = resolveLiveStatusFromHtml({
        html: liveResponse.html,
        config,
        finalUrl,
      });

      const candidateVideoId =
        toTrimmedString(liveStatus?.videoId) || extractVideoIdFromUrl(finalUrl);

      if (liveStatus?.status !== "live" && candidateVideoId) {
        logger.warn("YouTube live page fallback engaged", {
          channelId: toTrimmedString(config?.channelId),
          channelTitle: toTrimmedString(config?.channelTitle),
          candidateVideoId,
          initialStatus: toTrimmedString(liveStatus?.status) || "unknown",
          finalUrl: toTrimmedString(finalUrl),
        });

        const fallbackVideoDetails = await fetchFallbackLiveVideoDetails({
          videoId: candidateVideoId,
        });

        if (fallbackVideoDetails) {
          fallbackUsed = true;
          liveStatus = resolveLiveStatusFromVideoDetails({
            videoDetails: fallbackVideoDetails,
            config,
            videoId: candidateVideoId,
          });
        }
      }

      const nextStatus = {
        ...liveStatus,
        checkedAt: new Date(),
        error: "",
      };

      await persistLiveDetectionSnapshot({
        config,
        checkedAt: nextStatus.checkedAt,
        lastLiveStatus: nextStatus.status,
      });
      logLiveDetectionOutcome({
        config,
        liveStatus: nextStatus,
        fallbackUsed,
        finalUrl,
      });

      writeCachedLiveStatus(cacheKey, nextStatus, ttlMs);
      return nextStatus;
    } catch (error) {
      const failedStatus = buildEmptyLiveStatus(config, {
        status: "error",
        checkedAt: new Date(),
        error: toTrimmedString(error.message) || "YouTube live status could not be checked.",
      });

      await persistLiveDetectionSnapshot({
        config,
        checkedAt: failedStatus.checkedAt,
        lastLiveStatus: failedStatus.status,
      });
      logLiveDetectionOutcome({
        config,
        liveStatus: failedStatus,
        fallbackUsed,
        finalUrl,
      });

      writeCachedLiveStatus(cacheKey, failedStatus, Math.min(ttlMs, 60 * 1000));
      return failedStatus;
    } finally {
      liveStatusState.promises.delete(cacheKey);
    }
  })();

  liveStatusState.promises.set(cacheKey, liveStatusPromise);
  return liveStatusPromise;
};

export const getYouTubeLibraryConfig = async () => {
  const config = await YouTubeChannelConfig.findOne({ configKey: "default" }).lean();
  return toPlainConfig(config);
};

export const saveYouTubeLibraryConfig = async ({ payload = {}, currentAdmin = null } = {}) => {
  const existingConfig = await YouTubeChannelConfig.findOne({ configKey: "default" });
  const nextPayload = resolveConfigPayload(payload, existingConfig, currentAdmin);

  const config =
    existingConfig ||
    new YouTubeChannelConfig({
      configKey: "default",
      createdBy: currentAdmin?.id || null,
    });

  Object.assign(config, nextPayload);
  await config.save();

  return toPlainConfig(config.toObject());
};

export const validateYouTubeLibraryConfig = async ({ channelUrl = "", channelId = "" } = {}) => {
  const channelRecord = await resolveChannelRecord({ channelUrl, channelId });
  return formatChannelPayload(channelRecord);
};

export const syncYouTubeLibrary = async ({
  configId = "",
  currentAdmin = null,
  trigger = "manual",
  force = false,
} = {}) => {
  if (activeSyncState.promise) {
    logger.info("Reusing active YouTube library sync promise", {
      requestedConfigId: toTrimmedString(configId) || "default",
      activeConfigId: activeSyncState.configId || "default",
      trigger,
      force,
    });
    return activeSyncState.promise;
  }

  activeSyncState.promise = (async () => {
    const normalizedConfigId = toTrimmedString(configId);
    let config = null;

    if (normalizedConfigId) {
      if (!mongoose.Types.ObjectId.isValid(normalizedConfigId)) {
        throw buildChannelConfigError({
          message: "Channel configuration is invalid.",
          validationFields: [],
        });
      }

      config = await YouTubeChannelConfig.findById(normalizedConfigId);
    } else {
      config = await YouTubeChannelConfig.findOne({ configKey: "default" });
    }

    if (!config) {
      throw buildYouTubeLibraryError({
        message: "YouTube library configuration was not found.",
        status: 404,
        code: "youtube_config_not_found",
        adminMessageKey: "youtubeSettings.notice.recordNotResolved",
      });
    }

    logger.info("YouTube library sync requested", {
      requestedConfigId: normalizedConfigId || "default",
      resolvedConfigId: config._id.toString(),
      channelId: toTrimmedString(config.channelId),
      channelUrl: toTrimmedString(config.channelUrl),
      channelHandle: toTrimmedString(config.channelHandle),
      isActive: Boolean(config.isActive),
      apiKeyPresent: hasYouTubeApiKey(),
      trigger,
      force,
      currentAdminId: toTrimmedString(currentAdmin?.id),
    });

    if (!config.isActive && trigger !== "manual") {
      return {
        success: false,
        skipped: true,
        reason: "YouTube sync is disabled.",
        config: toPlainConfig(config.toObject()),
      };
    }

    config.lastSyncStatus = "running";
    config.lastSyncError = "";
    config.lastSyncSummary = {
      trigger,
    };
    if (currentAdmin?.id) {
      config.updatedBy = currentAdmin.id;
    }
    await config.save();

    try {
      const apiKey = readYouTubeApiKey();
      const channelRecord = await resolveChannelRecord({
        channelUrl: config.channelUrl,
        channelId: config.channelId,
      });

      const channelPayload = formatChannelPayload(channelRecord);
      if (!channelPayload.channelId || !channelPayload.uploadsPlaylistId) {
        throw buildChannelConfigError({
          message:
            "Channel configuration is invalid. The selected YouTube channel does not expose a valid uploads playlist.",
          validationFields: [],
        });
      }

      logger.info("YouTube library sync channel resolved", {
        configId: config._id.toString(),
        inputChannelId: toTrimmedString(config.channelId),
        inputChannelUrl: toTrimmedString(config.channelUrl),
        resolvedChannelId: channelPayload.channelId,
        resolvedChannelUrl: channelPayload.channelUrl,
        resolvedChannelHandle: channelPayload.channelHandle,
        uploadsPlaylistIdPresent: Boolean(channelPayload.uploadsPlaylistId),
        apiKeyPresent: Boolean(apiKey),
      });

      const playlists = await fetchChannelPlaylists({
        channelId: channelPayload.channelId,
        apiKey,
      });

      const latestVideoSeeds = await fetchLatestUploadedVideos({
        uploadsPlaylistId: channelPayload.uploadsPlaylistId,
        apiKey,
        maxVideos: config.maxVideos,
      });

      const latestVideoIds = latestVideoSeeds.map((video) => video.videoId);
      const videoDetailsLookup = await fetchVideoDetails({
        videoIds: latestVideoIds,
        apiKey,
      });

      const { membershipLookup, firstVideoLookup } = await fetchPlaylistMembership({
        playlists,
        targetVideoIds: latestVideoIds,
        apiKey,
      });

      const allowedCourses = normalizeYouTubeLibraryCourseList(config.allowedCourses);
      const existingPlaylists = await YouTubePlaylist.find({
        youtubePlaylistId: { $in: playlists.map((playlist) => playlist.youtubePlaylistId) },
      }).lean();
      const existingVideos = await YouTubeVideo.find({
        youtubeVideoId: { $in: latestVideoIds },
      }).lean();

      const existingPlaylistLookup = new Map(
        existingPlaylists.map((playlist) => [playlist.youtubePlaylistId, playlist])
      );
      const existingVideoLookup = new Map(existingVideos.map((video) => [video.youtubeVideoId, video]));

      if (playlists.length > 0) {
        await YouTubePlaylist.bulkWrite(
          playlists.map((playlist) => {
            const preservedPlaylist = preservePlaylistOverrides(
              existingPlaylistLookup.get(playlist.youtubePlaylistId),
              allowedCourses,
              {
                ...playlist,
                firstVideoId: firstVideoLookup.get(playlist.youtubePlaylistId) || "",
                syncSource: YOUTUBE_SYNC_SOURCE,
              }
            );

            return {
              updateOne: {
                filter: { youtubePlaylistId: playlist.youtubePlaylistId },
                update: {
                  $set: preservedPlaylist,
                },
                upsert: true,
              },
            };
          })
        );
      }

      if (latestVideoSeeds.length > 0) {
        await YouTubeVideo.bulkWrite(
          latestVideoSeeds.map((videoSeed) => {
            const videoDetails = videoDetailsLookup.get(videoSeed.videoId);
            const publishedAt =
              videoDetails?.snippet?.publishedAt || videoSeed.publishedAt || videoDetails?.liveStreamingDetails?.actualStartTime || null;
            const isLiveStreamRecording = Boolean(
              videoDetails?.liveStreamingDetails?.actualStartTime ||
                videoDetails?.liveStreamingDetails?.actualEndTime
            );

            const preservedVideo = preserveVideoOverrides(
              existingVideoLookup.get(videoSeed.videoId),
              allowedCourses,
              {
                youtubeVideoId: videoSeed.videoId,
                title: toTrimmedString(videoDetails?.snippet?.title) || videoSeed.title,
                description:
                  toTrimmedString(videoDetails?.snippet?.description) || videoSeed.description,
                thumbnail:
                  pickBestThumbnail(videoDetails?.snippet?.thumbnails) || videoSeed.thumbnail,
                publishedAt: publishedAt ? new Date(publishedAt) : null,
                videoUrl: buildVideoUrl(videoSeed.videoId),
                embedUrl: buildEmbedUrl(videoSeed.videoId),
                channelId: channelPayload.channelId,
                playlistIds: Array.from(membershipLookup.get(videoSeed.videoId) || []),
                isLiveStreamRecording,
                livestreamArchive: isLiveStreamRecording,
                rawData: {
                  seed: videoSeed.rawData,
                  details: videoDetails || null,
                },
                syncSource: YOUTUBE_SYNC_SOURCE,
              }
            );

            return {
              updateOne: {
                filter: { youtubeVideoId: videoSeed.videoId },
                update: {
                  $set: preservedVideo,
                },
                upsert: true,
              },
            };
          })
        );
      }

      config.channelId = channelPayload.channelId;
      config.channelTitle = channelPayload.channelTitle;
      config.channelThumbnail = channelPayload.channelThumbnail;
      config.channelHandle = channelPayload.channelHandle;
      config.channelUrl = channelPayload.channelUrl || config.channelUrl;
      config.lastSyncedAt = new Date();
      config.lastSyncStatus = "success";
      config.lastSyncError = "";
      config.lastSyncSummary = {
        playlistsFetched: playlists.length,
        latestVideosFetched: latestVideoSeeds.length,
        trigger,
      };

      await config.save();

      logger.info("YouTube library sync result", {
        configId: config._id.toString(),
        channelId: config.channelId,
        resolvedChannelUrl: config.channelUrl,
        playlistsFetched: playlists.length,
        latestVideosFetched: latestVideoSeeds.length,
        trigger,
      });

      return {
        success: true,
        config: toPlainConfig(config.toObject()),
        summary: config.lastSyncSummary,
      };
    } catch (error) {
      config.lastSyncStatus = "failed";
      config.lastSyncError = toTrimmedString(error.message) || "YouTube sync failed.";
      config.lastSyncSummary = {
        trigger,
      };
      await config.save();

      logger.error("YouTube library sync failed", {
        configId: config._id.toString(),
        channelId: toTrimmedString(config.channelId),
        channelUrl: toTrimmedString(config.channelUrl),
        channelHandle: toTrimmedString(config.channelHandle),
        apiKeyPresent: hasYouTubeApiKey(),
        trigger,
        force,
        message: toTrimmedString(error?.message),
        code: toTrimmedString(error?.code),
        stack: error?.stack || "",
      });
      throw error;
    }
  })()
    .finally(() => {
      activeSyncState.promise = null;
      activeSyncState.configId = "";
    });

  activeSyncState.configId = toTrimmedString(configId);
  return activeSyncState.promise;
};

export const getYouTubeLibraryForStudent = async ({
  studentPayload = {},
  search = "",
  subject = "",
  page = 1,
  limit = DEFAULT_LIBRARY_LIMIT,
  course = "",
} = {}) => {
  const { effectiveCourse } = await ensureStudentLibraryAccess({
    studentPayload,
    course,
  });

  const configDocument = await YouTubeChannelConfig.findOne({ configKey: "default" }).lean();
  const config = toPlainConfig(configDocument);
  const liveStreamPromise = getYouTubeLiveStatusForCourse({
    configDocument,
    effectiveCourse,
  });

  if (!config?.isActive || !config.channelId) {
    return {
      config,
      studentCourse: effectiveCourse,
      liveStream: await liveStreamPromise,
      playlists: [],
      videos: [],
      counts: {
        playlists: 0,
        videos: 0,
      },
      subjects: [],
      pagination: {
        page,
        limit,
        hasMore: false,
      },
    };
  }

  const normalizedPage = toNonNegativeInteger(page, 1, { min: 1 });
  const normalizedLimit = toNonNegativeInteger(limit, DEFAULT_LIBRARY_LIMIT, {
    min: 1,
    max: MAX_LIBRARY_LIMIT,
  });
  const normalizedSubject = toTrimmedString(subject);

  const baseAccessQuery = {
    channelId: config.channelId,
    isVisible: true,
    ...buildLibraryAccessQuery(effectiveCourse),
  };

  const subjectQuery = normalizedSubject
    ? {
        subjectTag: { $regex: `^${escapeRegex(normalizedSubject)}$`, $options: "i" },
      }
    : {};

  const searchQuery = buildPlaylistSearchFilter(search);

  const playlistQuery = {
    ...baseAccessQuery,
    ...subjectQuery,
    ...searchQuery,
  };

  const videoQuery = {
    ...baseAccessQuery,
    ...subjectQuery,
    ...searchQuery,
  };

  const [playlists, totalPlaylists, videos, totalVideos, playlistSubjects, videoSubjects, liveStream] =
    await Promise.all([
      config.showPlaylists
        ? YouTubePlaylist.find(playlistQuery)
            .sort({ publishedAt: -1, updatedAt: -1 })
            .lean()
        : Promise.resolve([]),
      config.showPlaylists ? YouTubePlaylist.countDocuments(playlistQuery) : Promise.resolve(0),
      config.showVideos
        ? YouTubeVideo.find(videoQuery)
            .sort({ publishedAt: -1, updatedAt: -1 })
            .skip((normalizedPage - 1) * normalizedLimit)
            .limit(normalizedLimit)
            .lean()
        : Promise.resolve([]),
      config.showVideos ? YouTubeVideo.countDocuments(videoQuery) : Promise.resolve(0),
      config.showPlaylists
        ? YouTubePlaylist.distinct("subjectTag", {
            ...baseAccessQuery,
            subjectTag: { $nin: ["", null] },
          })
        : Promise.resolve([]),
      config.showVideos
        ? YouTubeVideo.distinct("subjectTag", {
            ...baseAccessQuery,
            subjectTag: { $nin: ["", null] },
          })
        : Promise.resolve([]),
      liveStreamPromise,
    ]);

  const combinedSubjects = Array.from(
    new Set([...playlistSubjects, ...videoSubjects].map((entry) => toTrimmedString(entry)).filter(Boolean))
  ).sort((left, right) => left.localeCompare(right));

  const visiblePlaylists = playlists.filter((playlist) =>
    hasYouTubeLibraryCourseAccess(effectiveCourse, playlist.allowedCourses)
  );
  const visibleVideos = videos.filter((video) =>
    hasYouTubeLibraryCourseAccess(effectiveCourse, video.allowedCourses)
  );

  return {
    config,
    studentCourse: effectiveCourse,
    liveStream,
    playlists: visiblePlaylists,
    videos: visibleVideos,
    counts: {
      playlists: totalPlaylists,
      videos: totalVideos,
    },
    subjects: combinedSubjects,
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      hasMore: normalizedPage * normalizedLimit < totalVideos,
    },
  };
};

export const getYouTubePlaylistsForStudent = async ({
  studentPayload = {},
  search = "",
  subject = "",
  page = 1,
  limit = DEFAULT_LIBRARY_LIMIT,
  course = "",
} = {}) => {
  const library = await getYouTubeLibraryForStudent({
    studentPayload,
    search,
    subject,
    page,
    limit,
    course,
  });

  const normalizedPage = toNonNegativeInteger(page, 1, { min: 1 });
  const normalizedLimit = toNonNegativeInteger(limit, DEFAULT_LIBRARY_LIMIT, {
    min: 1,
    max: MAX_LIBRARY_LIMIT,
  });

  const paginatedPlaylists = library.playlists.slice(
    (normalizedPage - 1) * normalizedLimit,
    normalizedPage * normalizedLimit
  );

  return {
    config: library.config,
    studentCourse: library.studentCourse,
    playlists: paginatedPlaylists,
    counts: {
      playlists: library.counts.playlists,
    },
    subjects: library.subjects,
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      hasMore: normalizedPage * normalizedLimit < library.counts.playlists,
    },
  };
};

export const getYouTubeVideosForStudent = async ({
  studentPayload = {},
  search = "",
  subject = "",
  page = 1,
  limit = DEFAULT_LIBRARY_LIMIT,
  course = "",
} = {}) =>
  getYouTubeLibraryForStudent({
    studentPayload,
    search,
    subject,
    page,
    limit,
    course,
  });

export const getYouTubeLiveStatusForStudent = async ({
  studentPayload = {},
  course = "",
  force = false,
} = {}) => {
  const { effectiveCourse } = await ensureStudentLibraryAccess({
    studentPayload,
    course,
  });

  return getYouTubeLiveStatusForCourse({
    effectiveCourse,
    force,
  });
};

export const getActiveYouTubeLibraryConfigDocument = async () =>
  YouTubeChannelConfig.findOne({ configKey: "default" });

export const getSchedulerConfigSnapshot = async () => {
  const config = await YouTubeChannelConfig.findOne({ configKey: "default" }).lean();
  if (!config) {
    return null;
  }

  return {
    id: config._id.toString(),
    isActive: Boolean(config.isActive),
    syncMode: toTrimmedString(config.syncMode) || "manual",
    syncIntervalMinutes: toNonNegativeInteger(config.syncIntervalMinutes, 60, {
      min: 5,
      max: 1440,
    }),
  };
};

export const sanitizeYouTubeLibraryQuery = (query = {}) => ({
  search: toTrimmedString(query.search),
  subject: toTrimmedString(query.subject),
  page: toNonNegativeInteger(query.page, 1, { min: 1 }),
  limit: toNonNegativeInteger(query.limit, DEFAULT_LIBRARY_LIMIT, {
    min: 1,
    max: MAX_LIBRARY_LIMIT,
  }),
  course: normalizeYouTubeLibraryCourse(query.course),
});
