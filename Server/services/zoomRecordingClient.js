import { zoomRecordingEnv, hasZoomRecordingConfig } from "../utils/zoomRecordingEnv.js";

const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token";
const ZOOM_API_BASE_URL = "https://api.zoom.us/v2";
const MAX_RECORDING_REDIRECTS = 5;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

let cachedToken = {
  accessToken: "",
  expiresAt: 0,
};

export class ZoomRecordingApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ZoomRecordingApiError";
    this.status = status;
    this.details = details;
  }
}

const readResponseBody = async (response) => {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (_error) {
    return text;
  }
};

export const getZoomRecordingAccessToken = async ({ forceRefresh = false } = {}) => {
  if (!hasZoomRecordingConfig()) {
    throw new ZoomRecordingApiError("Zoom credentials are not configured.", 500);
  }

  const now = Date.now();
  if (!forceRefresh && cachedToken.accessToken && cachedToken.expiresAt - 60_000 > now) {
    return cachedToken.accessToken;
  }

  const credentials = Buffer.from(
    `${zoomRecordingEnv.clientId}:${zoomRecordingEnv.clientSecret}`
  ).toString("base64");
  const params = new URLSearchParams({
    grant_type: "account_credentials",
    account_id: zoomRecordingEnv.accountId,
  });

  const response = await fetch(`${ZOOM_TOKEN_URL}?${params.toString()}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new ZoomRecordingApiError("Unable to get Zoom access token.", response.status, body);
  }

  cachedToken = {
    accessToken: body.access_token,
    expiresAt: now + Number(body.expires_in || 3600) * 1000,
  };

  return cachedToken.accessToken;
};

export const zoomRecordingApiRequest = async (
  path,
  params = {},
  { accessToken: providedAccessToken, forceRefreshToken = false } = {}
) => {
  const accessToken =
    providedAccessToken ||
    (await getZoomRecordingAccessToken({ forceRefresh: forceRefreshToken }));
  const url = new URL(`${ZOOM_API_BASE_URL}${path}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new ZoomRecordingApiError(
      `Zoom API request failed: ${path}`,
      response.status,
      body
    );
  }

  return body;
};

export const listZoomUserRecordings = ({ userId, from, to, nextPageToken }) =>
  zoomRecordingApiRequest(`/users/${encodeURIComponent(userId)}/recordings`, {
    from,
    to,
    page_size: zoomRecordingEnv.syncPageSize,
    next_page_token: nextPageToken,
  });

const isAllowedZoomDownloadHost = (hostname) => {
  const normalizedHostname = String(hostname || "").toLowerCase();
  return (
    normalizedHostname === "zoom.us" ||
    normalizedHostname.endsWith(".zoom.us") ||
    normalizedHostname === "zoom.com" ||
    normalizedHostname.endsWith(".zoom.com")
  );
};

const isZoomAccessPage = (url) => {
  const pathname = url.pathname.toLowerCase();
  const search = url.search.toLowerCase();

  return (
    pathname.includes("/signin") ||
    pathname.includes("/login") ||
    pathname.includes("/rec/share") ||
    pathname.includes("/rec/play") ||
    pathname.includes("/recording/register") ||
    pathname.includes("/oauth/authorize") ||
    pathname.includes("passcode") ||
    search.includes("passcode=")
  );
};

const parseDownloadUrl = (value, { requireZoomHost = false } = {}) => {
  let url;

  try {
    url = new URL(value);
  } catch (_error) {
    throw new ZoomRecordingApiError("Zoom recording download URL is invalid.", 502, {
      code: "INVALID_DOWNLOAD_URL",
    });
  }

  if (url.protocol !== "https:") {
    throw new ZoomRecordingApiError("Zoom recording download URL must use HTTPS.", 502, {
      code: "UNSAFE_DOWNLOAD_URL",
    });
  }

  if (requireZoomHost && !isAllowedZoomDownloadHost(url.hostname)) {
    throw new ZoomRecordingApiError("Zoom recording download URL has an unexpected host.", 502, {
      code: "UNEXPECTED_DOWNLOAD_HOST",
    });
  }

  if (isZoomAccessPage(url)) {
    throw new ZoomRecordingApiError("Zoom redirected the recording to an access page.", 502, {
      code: "ZOOM_ACCESS_PAGE",
    });
  }

  return url;
};

export const fetchZoomRecordingFile = async (
  downloadUrl,
  {
    range,
    accessToken: providedAccessToken,
    forceRefreshToken = false,
    fetchImpl = fetch,
  } = {}
) => {
  const accessToken =
    providedAccessToken ||
    (await getZoomRecordingAccessToken({ forceRefresh: forceRefreshToken }));
  const initialUrl = parseDownloadUrl(downloadUrl, { requireZoomHost: true });
  let currentUrl = initialUrl;
  let redirectCount = 0;

  while (redirectCount <= MAX_RECORDING_REDIRECTS) {
    const headers = {};
    const isZoomRequest = isAllowedZoomDownloadHost(currentUrl.hostname);

    if (isZoomRequest) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    if (range) {
      headers.Range = range;
    }

    const response = await fetchImpl(currentUrl, {
      headers,
      redirect: "manual",
    });

    if (!REDIRECT_STATUSES.has(response.status)) {
      if (isZoomAccessPage(parseDownloadUrl(response.url || currentUrl.toString()))) {
        throw new ZoomRecordingApiError("Zoom returned an access page instead of media.", 502, {
          code: "ZOOM_ACCESS_PAGE",
        });
      }

      return response;
    }

    const location = response.headers.get("location");
    if (!location) {
      throw new ZoomRecordingApiError("Zoom returned a redirect without a location.", 502, {
        code: "INVALID_ZOOM_REDIRECT",
      });
    }

    redirectCount += 1;
    if (redirectCount > MAX_RECORDING_REDIRECTS) {
      break;
    }

    currentUrl = parseDownloadUrl(new URL(location, currentUrl).toString());
  }

  throw new ZoomRecordingApiError("Zoom recording download redirected too many times.", 502, {
    code: "TOO_MANY_ZOOM_REDIRECTS",
  });
};
