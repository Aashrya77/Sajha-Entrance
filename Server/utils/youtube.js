const PLAYLIST_CACHE_TTL_MS = 1000 * 60 * 15;

const YOUTUBE_VIDEO_PATTERNS = [
  /youtu\.be\/([a-zA-Z0-9_-]+)/,
  /youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]+)/,
  /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
  /youtube\.com\/v\/([a-zA-Z0-9_-]+)/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
];

const YOUTUBE_PLAYLIST_PATTERNS = [
  /[?&]list=([a-zA-Z0-9_-]+)/,
  /youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
];

const XML_ENTITY_MAP = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
};

const playlistCache = new Map();

const escapeRegExp = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const decodeXmlEntities = (value = "") =>
  String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&(amp|lt|gt|quot|apos|#39);/g, (match) => XML_ENTITY_MAP[match] || match)
    .trim();

const readTag = (source = "", tagName = "") => {
  if (!source || !tagName) {
    return "";
  }

  const pattern = new RegExp(
    `<${escapeRegExp(tagName)}>([\\s\\S]*?)</${escapeRegExp(tagName)}>`,
    "i"
  );
  const match = source.match(pattern);
  return decodeXmlEntities(match?.[1] || "");
};

const readAttribute = (source = "", tagName = "", attributeName = "") => {
  if (!source || !tagName || !attributeName) {
    return "";
  }

  const pattern = new RegExp(
    `<${escapeRegExp(tagName)}\\b[^>]*\\s${escapeRegExp(attributeName)}="([^"]*)"[^>]*\\/?>`,
    "i"
  );
  const match = source.match(pattern);
  return decodeXmlEntities(match?.[1] || "");
};

const readAlternateLink = (source = "") => {
  if (!source) {
    return "";
  }

  const match = source.match(/<link\b[^>]*rel="alternate"[^>]*href="([^"]+)"/i);
  return decodeXmlEntities(match?.[1] || "");
};

const fetchTextWithTimeout = async (url, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "sajha-entrance/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`YouTube playlist feed request failed with status ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
};

export const extractYoutubeVideoId = (url = "") => {
  const normalizedUrl = String(url || "").trim();

  if (!normalizedUrl) {
    return "";
  }

  for (const pattern of YOUTUBE_VIDEO_PATTERNS) {
    const match = normalizedUrl.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
};

export const extractYoutubePlaylistId = (url = "") => {
  const normalizedUrl = String(url || "").trim();

  if (!normalizedUrl) {
    return "";
  }

  for (const pattern of YOUTUBE_PLAYLIST_PATTERNS) {
    const match = normalizedUrl.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
};

export const resolveRecordedClassMedia = (recordedClass = {}) => {
  const youtubeUrl = String(recordedClass.youtubeUrl || "").trim();
  const parsedVideoId = extractYoutubeVideoId(youtubeUrl);
  const parsedPlaylistId = extractYoutubePlaylistId(youtubeUrl);
  const storedContentType =
    recordedClass.contentType === "playlist"
      ? "playlist"
      : recordedClass.contentType === "video"
        ? "video"
        : "";

  const playlistId = String(recordedClass.playlistId || parsedPlaylistId || "").trim();
  const videoId = String(recordedClass.videoId || parsedVideoId || "").trim();
  const contentType = storedContentType || (playlistId ? "playlist" : "video");

  return {
    contentType,
    youtubeUrl,
    videoId,
    playlistId,
  };
};

export const buildYoutubeEmbedUrl = (media = {}) => {
  const { contentType, videoId, playlistId } = resolveRecordedClassMedia(media);
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
  });

  if (contentType === "playlist" && playlistId) {
    params.set("list", playlistId);

    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
    }

    return `https://www.youtube-nocookie.com/embed/videoseries?${params.toString()}`;
  }

  if (!videoId) {
    return "";
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
};

export const fetchYoutubePlaylistDetails = async (playlistId = "") => {
  const normalizedPlaylistId = String(playlistId || "").trim();

  if (!normalizedPlaylistId) {
    return null;
  }

  const cached = playlistCache.get(normalizedPlaylistId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(
    normalizedPlaylistId
  )}`;
  const xml = await fetchTextWithTimeout(feedUrl);
  const [feedHeader = ""] = xml.split("<entry>");

  const videos = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
    .map((match, index) => {
      const entry = match[1] || "";
      const videoId = readTag(entry, "yt:videoId");

      if (!videoId) {
        return null;
      }

      return {
        id: `${normalizedPlaylistId}:${videoId}:${index}`,
        videoId,
        title: readTag(entry, "title") || `Video ${index + 1}`,
        url: readAlternateLink(entry),
        publishedAt: readTag(entry, "published"),
        updatedAt: readTag(entry, "updated"),
        thumbnailUrl:
          readAttribute(entry, "media:thumbnail", "url") ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        description: readTag(entry, "media:description"),
      };
    })
    .filter(Boolean);

  const data = {
    playlistId: normalizedPlaylistId,
    title: readTag(feedHeader, "title") || "YouTube Playlist",
    channelTitle: readTag(feedHeader, "name"),
    channelUrl: readTag(feedHeader, "uri"),
    publishedAt: readTag(feedHeader, "published"),
    videos,
  };

  playlistCache.set(normalizedPlaylistId, {
    data,
    expiresAt: Date.now() + PLAYLIST_CACHE_TTL_MS,
  });

  return data;
};
