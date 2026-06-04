import { zoomRecordingEnv, hasZoomRecordingConfig } from "../utils/zoomRecordingEnv.js";

const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token";
const ZOOM_API_BASE_URL = "https://api.zoom.us/v2";

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

export const getZoomRecordingAccessToken = async () => {
  if (!hasZoomRecordingConfig()) {
    throw new ZoomRecordingApiError("Zoom credentials are not configured.", 500);
  }

  const now = Date.now();
  if (cachedToken.accessToken && cachedToken.expiresAt - 60_000 > now) {
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

export const zoomRecordingApiRequest = async (path, params = {}) => {
  const accessToken = await getZoomRecordingAccessToken();
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
    include_fields: "download_access_token",
  });

export const fetchZoomRecordingFile = async (downloadUrl, { range } = {}) => {
  const accessToken = await getZoomRecordingAccessToken();
  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  if (range) {
    headers.Range = range;
  }

  return fetch(downloadUrl, {
    headers,
    redirect: "follow",
  });
};
