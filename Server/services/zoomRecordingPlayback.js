import {
  fetchZoomRecordingFile,
  getZoomRecordingAccessToken,
  ZoomRecordingApiError,
  zoomRecordingApiRequest,
} from "./zoomRecordingClient.js";

const DOWNLOAD_URL_MAX_AGE_MS = 5 * 60 * 1000;
const RETRYABLE_ZOOM_STATUSES = new Set([401, 403]);
const ACCEPTED_STREAM_STATUSES = new Set([200, 206]);
const OCTET_STREAM_CONTENT_TYPE = "application/octet-stream";
const MP4_SIGNATURE_LENGTH = 8;
const MP4_PREFIX_PROBE_RANGE = "bytes=0-63";

export class ZoomRecordingPlaybackError extends Error {
  constructor(message, { status = 502, code = "ZOOM_PLAYBACK_ERROR", upstreamStatus } = {}) {
    super(message);
    this.name = "ZoomRecordingPlaybackError";
    this.status = status;
    this.code = code;
    this.upstreamStatus = upstreamStatus;
  }
}

const encodeMeetingIdentifier = (value) => {
  const identifier = String(value || "").trim();

  if (!identifier) {
    throw new ZoomRecordingPlaybackError("Zoom meeting identifier is missing.", {
      code: "MISSING_MEETING_IDENTIFIER",
    });
  }

  const encoded = encodeURIComponent(identifier);
  return identifier.startsWith("/") || identifier.includes("//")
    ? encodeURIComponent(encoded)
    : encoded;
};

const findThumbnailFile = (files) =>
  files.find(
    (file) =>
      file?.download_url &&
      (file.recording_type === "thumbnail" ||
        file.file_extension === "JPG" ||
        file.file_type === "JPG")
  );

const findRecordingFile = (files, recording) =>
  files.find((file) => String(file?.id || "") === String(recording.zoomFileId || ""));

const isRetryableAuthorizationFailure = (value) =>
  RETRYABLE_ZOOM_STATUSES.has(value?.status) ||
  RETRYABLE_ZOOM_STATUSES.has(value?.upstreamStatus);

const getContentType = (response) =>
  String(response.headers.get("content-type") || "")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();

const parseRequestedRangeStart = (range) => {
  if (!range) {
    return 0;
  }

  const match = /^bytes=(\d+)-(?:\d+)?$/i.exec(String(range).trim());
  return match ? Number(match[1]) : null;
};

const parseContentRange = (value) => {
  const match = /^bytes\s+(\d+)-(\d+)\/(\d+|\*)$/i.exec(String(value || "").trim());

  if (!match) {
    return null;
  }

  const start = Number(match[1]);
  const end = Number(match[2]);
  const total = match[3] === "*" ? null : Number(match[3]);

  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    end < start ||
    (total !== null &&
      (!Number.isSafeInteger(total) || total <= 0 || end >= total))
  ) {
    return null;
  }

  return { start, end, total };
};

const assertValidPartialContentRange = (response, { expectedStart } = {}) => {
  if (response.status !== 206) {
    return null;
  }

  const contentRange = parseContentRange(response.headers.get("content-range"));

  if (
    !contentRange ||
    (Number.isSafeInteger(expectedStart) && contentRange.start !== expectedStart)
  ) {
    throw new ZoomRecordingPlaybackError("Zoom returned an invalid partial media range.", {
      code: "ZOOM_INVALID_CONTENT_RANGE",
      upstreamStatus: response.status,
    });
  }

  return contentRange;
};

const hasMp4FileTypeSignature = (prefix) => {
  if (prefix.length < MP4_SIGNATURE_LENGTH) {
    return false;
  }

  const boxSize = prefix.readUInt32BE(0);
  return (
    (boxSize === 1 || boxSize >= MP4_SIGNATURE_LENGTH) &&
    prefix.subarray(4, 8).toString("ascii") === "ftyp"
  );
};

const readStreamPrefix = async (response, { reconstruct = false } = {}) => {
  if (!response.body) {
    return { prefix: Buffer.alloc(0), response };
  }

  const reader = response.body.getReader();
  const chunks = [];
  let length = 0;

  try {
    while (length < MP4_SIGNATURE_LENGTH) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = value instanceof Uint8Array ? value : new Uint8Array(value);
      chunks.push(chunk);
      length += chunk.byteLength;
    }
  } catch (error) {
    await reader.cancel(error).catch(() => {});
    throw error;
  }

  const prefix = Buffer.concat(
    chunks.map((chunk) => Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength)),
    length
  ).subarray(0, MP4_SIGNATURE_LENGTH);

  if (!reconstruct) {
    await reader.cancel().catch(() => {});
    return { prefix, response };
  }

  let bufferedChunkIndex = 0;
  const reconstructedBody = new ReadableStream({
    async pull(controller) {
      if (bufferedChunkIndex < chunks.length) {
        controller.enqueue(chunks[bufferedChunkIndex]);
        bufferedChunkIndex += 1;
        return;
      }

      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      } catch (error) {
        controller.error(error);
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
  const headers = new Headers(response.headers);
  headers.set("content-type", "video/mp4");

  return {
    prefix,
    response: new Response(reconstructedBody, {
      status: response.status,
      statusText: response.statusText,
      headers,
    }),
  };
};

const safeInternalRecordingId = (recording) => {
  const value = String(recording?._id || "").trim();
  return /^[a-z0-9_-]{1,64}$/i.test(value) ? value : "unknown";
};

const defaultDiagnosticLogger = (details) => {
  console.info("Zoom recording MP4 validation:", details);
};

const validateOctetStreamResponse = async (
  response,
  {
    recording,
    range,
    fetchPrefix,
    logDiagnostic = defaultDiagnosticLogger,
  }
) => {
  const requestedRangeStart = parseRequestedRangeStart(range);
  const diagnostic = {
    recordingId: safeInternalRecordingId(recording),
    upstreamStatus: response.status,
    upstreamContentType: getContentType(response),
    requestedRangeStart,
    mp4SignatureValid: false,
    separatePrefixProbeRequired: false,
    cachedValidationUsed: false,
  };
  const writeDiagnostic = () => {
    try {
      logDiagnostic({ ...diagnostic });
    } catch (_error) {
      // Diagnostics must never interrupt or weaken playback validation.
    }
  };

  try {
    const contentRange = assertValidPartialContentRange(response, {
      expectedStart: response.status === 206 ? requestedRangeStart : undefined,
    });
    const responseStartsAtZero = response.status === 200 || contentRange?.start === 0;
    diagnostic.separatePrefixProbeRequired = !responseStartsAtZero;

    if (String(recording?.fileType || "").toUpperCase() !== "MP4") {
      throw new ZoomRecordingPlaybackError("The recording type is not supported for playback.", {
        code: "UNSUPPORTED_RECORDING_TYPE",
        upstreamStatus: response.status,
      });
    }

    let validatedResponse = response;
    let prefix;

    if (diagnostic.separatePrefixProbeRequired) {
      const probeResponse = await fetchPrefix();

      if (!ACCEPTED_STREAM_STATUSES.has(probeResponse.status)) {
        await probeResponse.body?.cancel().catch(() => {});
        throw new ZoomRecordingPlaybackError("Zoom did not return a valid MP4 prefix.", {
          code: "ZOOM_MP4_PREFIX_PROBE_FAILED",
          upstreamStatus: probeResponse.status,
        });
      }

      const probeContentType = getContentType(probeResponse);
      if (
        probeContentType !== OCTET_STREAM_CONTENT_TYPE &&
        !probeContentType.startsWith("video/")
      ) {
        await probeResponse.body?.cancel().catch(() => {});
        throw new ZoomRecordingPlaybackError("Zoom returned a non-media MP4 prefix.", {
          code: "ZOOM_NON_MEDIA_RESPONSE",
          upstreamStatus: probeResponse.status,
        });
      }

      assertValidPartialContentRange(probeResponse, {
        expectedStart: probeResponse.status === 206 ? 0 : undefined,
      });
      ({ prefix } = await readStreamPrefix(probeResponse));
      const normalizedHeaders = new Headers(response.headers);
      normalizedHeaders.set("content-type", "video/mp4");
      validatedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: normalizedHeaders,
      });
    } else {
      ({ prefix, response: validatedResponse } = await readStreamPrefix(response, {
        reconstruct: true,
      }));
    }

    if (!hasMp4FileTypeSignature(prefix)) {
      await validatedResponse.body?.cancel().catch(() => {});
      throw new ZoomRecordingPlaybackError("Zoom returned invalid MP4 media content.", {
        code: "ZOOM_INVALID_MP4_SIGNATURE",
        upstreamStatus: response.status,
      });
    }

    diagnostic.mp4SignatureValid = true;
    writeDiagnostic();
    return validatedResponse;
  } catch (error) {
    await response.body?.cancel().catch(() => {});
    writeDiagnostic();
    throw error;
  }
};

export const isZoomRecordingDownloadUrlStale = (
  recording,
  { now = Date.now(), maxAgeMs = DOWNLOAD_URL_MAX_AGE_MS } = {}
) => {
  if (!recording?.downloadUrl) {
    return true;
  }

  const syncedAt = new Date(recording.syncedAt || 0).getTime();
  return !Number.isFinite(syncedAt) || syncedAt <= 0 || now - syncedAt >= maxAgeMs;
};

export const fetchFreshZoomRecordingMetadata = async (
  recording,
  { accessToken, apiRequest = zoomRecordingApiRequest, now = new Date() } = {}
) => {
  const meetingIdentifier = recording.zoomMeetingUuid || recording.zoomMeetingId;
  const response = await apiRequest(
    `/meetings/${encodeMeetingIdentifier(meetingIdentifier)}/recordings`,
    {},
    { accessToken }
  );
  const files = Array.isArray(response.recording_files) ? response.recording_files : [];
  const file = findRecordingFile(files, recording);

  if (!file?.download_url) {
    throw new ZoomRecordingPlaybackError("The Zoom recording file is no longer available.", {
      status: 404,
      code: "ZOOM_RECORDING_FILE_NOT_FOUND",
    });
  }

  const thumbnailFile = findThumbnailFile(files);

  return {
    playUrl: String(file.play_url || ""),
    downloadUrl: String(file.download_url || ""),
    thumbnailDownloadUrl: String(thumbnailFile?.download_url || recording.thumbnailDownloadUrl || ""),
    shareUrl: String(response.share_url || ""),
    passcode: String(response.recording_play_passcode ?? response.password ?? ""),
    syncedAt: now,
  };
};

const assertStreamResponse = async (
  response,
  { recording, range, fetchPrefix, logDiagnostic }
) => {
  if (!ACCEPTED_STREAM_STATUSES.has(response.status)) {
    throw new ZoomRecordingPlaybackError("Zoom did not return a playable recording.", {
      code: "ZOOM_STREAM_REQUEST_FAILED",
      upstreamStatus: response.status,
    });
  }

  const contentType = getContentType(response);

  if (contentType === OCTET_STREAM_CONTENT_TYPE) {
    return validateOctetStreamResponse(response, {
      recording,
      range,
      fetchPrefix,
      logDiagnostic,
    });
  }

  if (!contentType.startsWith("video/") && !contentType.startsWith("audio/")) {
    throw new ZoomRecordingPlaybackError("Zoom returned non-media content for the recording.", {
      code: "ZOOM_NON_MEDIA_RESPONSE",
      upstreamStatus: response.status,
    });
  }

  return response;
};

export const openZoomRecordingStream = async (
  recording,
  {
    range,
    now = Date.now(),
    getAccessToken = getZoomRecordingAccessToken,
    getFreshMetadata = fetchFreshZoomRecordingMetadata,
    persistMetadata = async () => {},
    fetchFile = fetchZoomRecordingFile,
    logDiagnostic = defaultDiagnosticLogger,
  } = {}
) => {
  let currentRecording = recording.toObject ? recording.toObject() : { ...recording };
  let accessToken = await getAccessToken({ forceRefresh: true });
  let authorizationRetried = false;

  const refreshMetadata = async () => {
    const freshMetadata = await getFreshMetadata(currentRecording, { accessToken });
    currentRecording = { ...currentRecording, ...freshMetadata };
    await persistMetadata(freshMetadata);
  };

  if (isZoomRecordingDownloadUrlStale(currentRecording, { now })) {
    try {
      await refreshMetadata();
    } catch (error) {
      if (!isRetryableAuthorizationFailure(error)) {
        throw error;
      }

      authorizationRetried = true;
      accessToken = await getAccessToken({ forceRefresh: true });
      await refreshMetadata();
    }
  }

  let response = await fetchFile(currentRecording.downloadUrl, {
    range,
    accessToken,
  });

  if (RETRYABLE_ZOOM_STATUSES.has(response.status) && !authorizationRetried) {
    authorizationRetried = true;
    accessToken = await getAccessToken({ forceRefresh: true });
    await refreshMetadata();
    response = await fetchFile(currentRecording.downloadUrl, {
      range,
      accessToken,
    });
  }

  response = await assertStreamResponse(response, {
    recording: currentRecording,
    range,
    fetchPrefix: () =>
      fetchFile(currentRecording.downloadUrl, {
        range: MP4_PREFIX_PROBE_RANGE,
        accessToken,
      }),
    logDiagnostic,
  });

  return {
    response,
    recording: currentRecording,
  };
};

export const normalizeZoomPlaybackError = (error) => {
  if (error instanceof ZoomRecordingPlaybackError) {
    return error;
  }

  if (error instanceof ZoomRecordingApiError) {
    return new ZoomRecordingPlaybackError(error.message, {
      code: error.details?.code || "ZOOM_API_ERROR",
      upstreamStatus: error.status,
    });
  }

  return new ZoomRecordingPlaybackError("Unable to stream the Zoom recording.");
};
