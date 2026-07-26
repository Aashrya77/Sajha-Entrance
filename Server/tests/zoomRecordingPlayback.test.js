import assert from "node:assert/strict";
import test from "node:test";

import {
  isZoomRecordingDownloadUrlStale,
  openZoomRecordingStream,
} from "../services/zoomRecordingPlayback.js";
import { fetchZoomRecordingFile } from "../services/zoomRecordingClient.js";
import { buildZoomRecordingShareUrl } from "../utils/zoomRecordingUrl.js";

const zoomDownloadUrl = (name) => `https://zoom.us/rec/download/${name}`;
const validMp4Bytes = new Uint8Array([
  0x00, 0x00, 0x00, 0x18,
  0x66, 0x74, 0x79, 0x70,
  0x69, 0x73, 0x6f, 0x6d,
  0x00, 0x00, 0x00, 0x00,
]);

const response = (status, contentType) =>
  new Response(status === 206 || status === 200 ? new Uint8Array([1, 2, 3]) : null, {
    status,
    headers: {
      "Content-Type": contentType,
      ...(status === 206 ? { "Content-Range": "bytes 0-2/3" } : {}),
    },
  });

const binaryResponse = (
  body,
  {
    status = 206,
    start = 0,
    contentType = "application/octet-stream",
    contentRange = true,
  } = {}
) => {
  const bytes = body instanceof Uint8Array ? body : new TextEncoder().encode(body);
  const end = start + bytes.byteLength - 1;
  const headers = {
    "Content-Type": contentType,
    "Content-Length": String(bytes.byteLength),
    "Accept-Ranges": "bytes",
  };

  if (status === 206 && contentRange) {
    headers["Content-Range"] = `bytes ${start}-${end}/${end + 100}`;
  }

  return new Response(bytes, { status, headers });
};

const chunkedBinaryResponse = (chunks, options = {}) => {
  const normalizedChunks = chunks.map((chunk) =>
    chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk)
  );
  const length = normalizedChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const start = options.start || 0;
  const end = start + length - 1;
  const headers = {
    "Content-Type": options.contentType || "application/octet-stream",
    "Content-Length": String(length),
    "Accept-Ranges": "bytes",
    "Content-Range": `bytes ${start}-${end}/${end + 100}`,
  };

  let index = 0;
  const body = new ReadableStream({
    pull(controller) {
      if (index >= normalizedChunks.length) {
        controller.close();
        return;
      }

      controller.enqueue(normalizedChunks[index]);
      index += 1;
    },
  });

  return new Response(body, {
    status: options.status || 206,
    headers,
  });
};

const recording = (overrides = {}) => ({
  _id: "internal-recording-1",
  zoomFileId: "file-1",
  zoomMeetingUuid: "meeting-uuid",
  fileType: "MP4",
  downloadUrl: zoomDownloadUrl("stored"),
  syncedAt: new Date(),
  ...overrides,
});

test("buildZoomRecordingShareUrl prefers share_url and appends the passcode", () => {
  const result = buildZoomRecordingShareUrl({
    shareUrl: "https://zoom.us/rec/share/share-id",
    playUrl: "https://zoom.us/rec/play/play-id",
    passcode: "class passcode",
  });
  const url = new URL(result);

  assert.equal(url.pathname, "/rec/share/share-id");
  assert.equal(url.searchParams.get("pwd"), "class passcode");
});

test("buildZoomRecordingShareUrl preserves existing query parameters and replaces pwd", () => {
  const result = buildZoomRecordingShareUrl({
    shareUrl: "https://zoom.us/rec/share/share-id?from=portal&pwd=old",
    passcode: "new-code",
  });
  const url = new URL(result);

  assert.equal(url.searchParams.get("from"), "portal");
  assert.equal(url.searchParams.get("pwd"), "new-code");
});

test("buildZoomRecordingShareUrl falls back to play_url without exposing a separate value", () => {
  const result = buildZoomRecordingShareUrl({
    playUrl: "https://zoom.us/rec/play/play-id?continue=true",
    passcode: "fallback-code",
  });
  const url = new URL(result);

  assert.equal(url.pathname, "/rec/play/play-id");
  assert.equal(url.searchParams.get("continue"), "true");
  assert.equal(url.searchParams.get("pwd"), "fallback-code");
});

test("openZoomRecordingStream preserves a successful 206 media response and Range header", async () => {
  const ranges = [];
  let tokenRequests = 0;

  const result = await openZoomRecordingStream(recording(), {
    range: "bytes=0-1023",
    getAccessToken: async ({ forceRefresh }) => {
      assert.equal(forceRefresh, true);
      tokenRequests += 1;
      return "fresh-token";
    },
    getFreshMetadata: async () => {
      throw new Error("Fresh metadata should not be requested for a current URL.");
    },
    fetchFile: async (_url, options) => {
      ranges.push(options.range);
      assert.equal(options.accessToken, "fresh-token");
      return response(206, "video/mp4");
    },
  });

  assert.equal(result.response.status, 206);
  assert.equal(result.response.headers.get("content-type"), "video/mp4");
  assert.deepEqual(ranges, ["bytes=0-1023"]);
  assert.equal(tokenRequests, 1);
});

test("HTTP 206 application/octet-stream with a valid ftyp signature becomes video/mp4", async () => {
  const result = await openZoomRecordingStream(recording(), {
    range: "bytes=0-15",
    getAccessToken: async () => "fresh-token",
    fetchFile: async () => binaryResponse(validMp4Bytes),
    logDiagnostic: () => {},
  });

  assert.equal(result.response.status, 206);
  assert.equal(result.response.headers.get("content-type"), "video/mp4");
  assert.equal(result.response.headers.get("content-range"), "bytes 0-15/115");
  assert.equal(result.response.headers.get("accept-ranges"), "bytes");
});

test("HTTP 200 application/octet-stream with a valid ftyp signature becomes video/mp4", async () => {
  const result = await openZoomRecordingStream(recording(), {
    getAccessToken: async () => "fresh-token",
    fetchFile: async () => binaryResponse(validMp4Bytes, { status: 200 }),
    logDiagnostic: () => {},
  });

  assert.equal(result.response.status, 200);
  assert.equal(result.response.headers.get("content-type"), "video/mp4");
  assert.deepEqual(
    new Uint8Array(await result.response.arrayBuffer()),
    validMp4Bytes
  );
});

test("MP4 prefix inspection reconstructs the stream without losing inspected bytes", async () => {
  const chunks = [
    validMp4Bytes.subarray(0, 3),
    validMp4Bytes.subarray(3, 7),
    validMp4Bytes.subarray(7),
    new Uint8Array([0xaa, 0xbb, 0xcc]),
  ];
  const expected = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let offset = 0;
  chunks.forEach((chunk) => {
    expected.set(chunk, offset);
    offset += chunk.length;
  });

  const result = await openZoomRecordingStream(recording(), {
    range: `bytes=0-${expected.length - 1}`,
    getAccessToken: async () => "fresh-token",
    fetchFile: async () => chunkedBinaryResponse(chunks),
    logDiagnostic: () => {},
  });

  assert.deepEqual(
    new Uint8Array(await result.response.arrayBuffer()),
    expected
  );
  assert.equal(result.response.headers.get("content-length"), String(expected.length));
});

test("a non-zero browser range uses a byte-zero signature probe and preserves seeking headers", async () => {
  const requestedRanges = [];
  const seekBytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);

  const result = await openZoomRecordingStream(recording(), {
    range: "bytes=100-103",
    getAccessToken: async () => "fresh-token",
    fetchFile: async (_url, options) => {
      requestedRanges.push(options.range);
      return options.range === "bytes=0-63"
        ? binaryResponse(validMp4Bytes)
        : binaryResponse(seekBytes, { start: 100 });
    },
    logDiagnostic: () => {},
  });

  assert.deepEqual(requestedRanges, ["bytes=100-103", "bytes=0-63"]);
  assert.equal(result.response.status, 206);
  assert.equal(result.response.headers.get("content-type"), "video/mp4");
  assert.equal(result.response.headers.get("content-range"), "bytes 100-103/203");
  assert.equal(result.response.headers.get("content-length"), "4");
  assert.equal(result.response.headers.get("accept-ranges"), "bytes");
  assert.deepEqual(new Uint8Array(await result.response.arrayBuffer()), seekBytes);
});

test("a non-zero browser range is rejected when the byte-zero probe has an invalid signature", async () => {
  await assert.rejects(
    openZoomRecordingStream(recording(), {
      range: "bytes=100-103",
      getAccessToken: async () => "fresh-token",
      fetchFile: async (_url, options) =>
        options.range === "bytes=0-63"
          ? binaryResponse(new Uint8Array(16))
          : binaryResponse(new Uint8Array([1, 2, 3, 4]), { start: 100 }),
      logDiagnostic: () => {},
    }),
    (error) => {
      assert.equal(error.code, "ZOOM_INVALID_MP4_SIGNATURE");
      return true;
    }
  );
});

test("arbitrary application/octet-stream content is rejected", async () => {
  await assert.rejects(
    openZoomRecordingStream(recording(), {
      range: "bytes=0-15",
      getAccessToken: async () => "fresh-token",
      fetchFile: async () => binaryResponse(new Uint8Array(16).fill(0xab)),
      logDiagnostic: () => {},
    }),
    (error) => {
      assert.equal(error.code, "ZOOM_INVALID_MP4_SIGNATURE");
      return true;
    }
  );
});

test("application/octet-stream is rejected for a non-MP4 database recording", async () => {
  await assert.rejects(
    openZoomRecordingStream(recording({ fileType: "M4A" }), {
      range: "bytes=0-15",
      getAccessToken: async () => "fresh-token",
      fetchFile: async () => binaryResponse(validMp4Bytes),
      logDiagnostic: () => {},
    }),
    (error) => {
      assert.equal(error.code, "UNSUPPORTED_RECORDING_TYPE");
      return true;
    }
  );
});

for (const [label, body] of [
  ["HTML", "<!doctype html><html>login</html>"],
  ["JSON", '{"error":"unauthorized"}'],
]) {
  test(`application/octet-stream containing ${label} is rejected`, async () => {
    await assert.rejects(
      openZoomRecordingStream(recording(), {
        range: `bytes=0-${new TextEncoder().encode(body).length - 1}`,
        getAccessToken: async () => "fresh-token",
        fetchFile: async () => binaryResponse(body),
        logDiagnostic: () => {},
      }),
      (error) => {
        assert.equal(error.code, "ZOOM_INVALID_MP4_SIGNATURE");
        return true;
      }
    );
  });
}

for (const contentRange of [null, "bytes wrong", "bytes 0-99/50", "bytes 1-16/100"]) {
  test(`HTTP 206 octet-stream rejects ${contentRange || "missing"} Content-Range`, async () => {
    await assert.rejects(
      openZoomRecordingStream(recording(), {
        range: "bytes=0-15",
        getAccessToken: async () => "fresh-token",
        fetchFile: async () => {
          const upstream = binaryResponse(validMp4Bytes, {
            contentRange: contentRange !== null,
          });
          if (contentRange !== null) {
            upstream.headers.set("Content-Range", contentRange);
          }
          return upstream;
        },
        logDiagnostic: () => {},
      }),
      (error) => {
        assert.equal(error.code, "ZOOM_INVALID_CONTENT_RANGE");
        return true;
      }
    );
  });
}

test("existing video/mp4 streaming behavior remains unchanged", async () => {
  const upstream = binaryResponse(new Uint8Array([1, 2, 3]), {
    contentType: "video/mp4",
  });
  const result = await openZoomRecordingStream(recording(), {
    range: "bytes=0-2",
    getAccessToken: async () => "fresh-token",
    fetchFile: async () => upstream,
  });

  assert.equal(result.response, upstream);
  assert.equal(result.response.headers.get("content-type"), "video/mp4");
});

test("existing audio streaming behavior remains unchanged", async () => {
  const upstream = binaryResponse(new Uint8Array([1, 2, 3]), {
    contentType: "audio/mp4",
  });
  const result = await openZoomRecordingStream(recording({ fileType: "M4A" }), {
    range: "bytes=0-2",
    getAccessToken: async () => "fresh-token",
    fetchFile: async () => upstream,
  });

  assert.equal(result.response, upstream);
  assert.equal(result.response.headers.get("content-type"), "audio/mp4");
});

test("redacted MP4 diagnostics contain no token, passcode, cookie, or signed URL", async () => {
  const logs = [];
  const secretValues = [
    "token-value-that-must-not-be-logged",
    "recording-passcode",
    "signed-download-value",
    "student-cookie-value",
  ];

  await openZoomRecordingStream(
    recording({
      downloadUrl: `${zoomDownloadUrl("stored")}?signature=signed-download-value`,
      passcode: "recording-passcode",
    }),
    {
      range: "bytes=0-15",
      getAccessToken: async () => "token-value-that-must-not-be-logged",
      fetchFile: async () => binaryResponse(validMp4Bytes),
      logDiagnostic: (details) => logs.push(JSON.stringify(details)),
    }
  );

  const combinedLogs = logs.join("\n");
  assert.equal(logs.length, 1);
  secretValues.forEach((secret) => assert.equal(combinedLogs.includes(secret), false));
  assert.equal(combinedLogs.includes("authorization"), false);
  assert.equal(combinedLogs.includes("cookie"), false);
});

test("a stale stored URL is refreshed before the first stream request", async () => {
  const requestedUrls = [];
  const persisted = [];
  const staleRecording = recording({
    syncedAt: new Date(Date.now() - 10 * 60 * 1000),
  });

  assert.equal(isZoomRecordingDownloadUrlStale(staleRecording), true);

  const result = await openZoomRecordingStream(staleRecording, {
    getAccessToken: async () => "fresh-token",
    getFreshMetadata: async () => ({
      downloadUrl: zoomDownloadUrl("fresh"),
      syncedAt: new Date(),
    }),
    persistMetadata: async (metadata) => persisted.push(metadata),
    fetchFile: async (url) => {
      requestedUrls.push(url);
      return response(206, "video/mp4");
    },
  });

  assert.deepEqual(requestedUrls, [zoomDownloadUrl("fresh")]);
  assert.equal(persisted.length, 1);
  assert.equal(result.recording.downloadUrl, zoomDownloadUrl("fresh"));
});

test("a 401 stale URL response refreshes token and metadata, then succeeds once", async () => {
  const requestedUrls = [];
  const tokens = [];
  let metadataRequests = 0;

  const result = await openZoomRecordingStream(recording(), {
    range: "bytes=100-200",
    getAccessToken: async () => {
      const token = `token-${tokens.length + 1}`;
      tokens.push(token);
      return token;
    },
    getFreshMetadata: async (_recording, { accessToken }) => {
      metadataRequests += 1;
      assert.equal(accessToken, "token-2");
      return {
        downloadUrl: zoomDownloadUrl("refreshed-after-401"),
        syncedAt: new Date(),
      };
    },
    fetchFile: async (url, options) => {
      requestedUrls.push(url);
      assert.equal(options.range, "bytes=100-200");
      return requestedUrls.length === 1
        ? response(401, "application/json")
        : response(206, "video/mp4");
    },
  });

  assert.equal(result.response.status, 206);
  assert.deepEqual(tokens, ["token-1", "token-2"]);
  assert.equal(metadataRequests, 1);
  assert.deepEqual(requestedUrls, [
    zoomDownloadUrl("stored"),
    zoomDownloadUrl("refreshed-after-401"),
  ]);
});

test("a 200 text/html Zoom response is rejected instead of treated as video", async () => {
  await assert.rejects(
    openZoomRecordingStream(recording(), {
      getAccessToken: async () => "fresh-token",
      fetchFile: async () => response(200, "text/html; charset=utf-8"),
    }),
    (error) => {
      assert.equal(error.code, "ZOOM_NON_MEDIA_RESPONSE");
      assert.equal(error.upstreamStatus, 200);
      return true;
    }
  );
});

test("a 200 application/json Zoom response is rejected instead of treated as media", async () => {
  await assert.rejects(
    openZoomRecordingStream(recording(), {
      getAccessToken: async () => "fresh-token",
      fetchFile: async () => response(200, "application/json"),
    }),
    (error) => {
      assert.equal(error.code, "ZOOM_NON_MEDIA_RESPONSE");
      return true;
    }
  );
});

test("a Zoom redirect to a login page is rejected", async () => {
  await assert.rejects(
    fetchZoomRecordingFile(zoomDownloadUrl("redirect"), {
      accessToken: "fresh-token",
      fetchImpl: async () =>
        new Response(null, {
          status: 302,
          headers: {
            Location: "https://zoom.us/signin?returnUrl=/rec/download/redirect",
          },
        }),
    }),
    (error) => {
      assert.equal(error.details?.code, "ZOOM_ACCESS_PAGE");
      return true;
    }
  );
});

for (const status of [401, 403]) {
  test(`Zoom ${status} is retried once, then returned as a playback failure`, async () => {
    let fetchRequests = 0;
    let tokenRequests = 0;
    let metadataRequests = 0;

    await assert.rejects(
      openZoomRecordingStream(recording(), {
        getAccessToken: async () => {
          tokenRequests += 1;
          return `token-${tokenRequests}`;
        },
        getFreshMetadata: async () => {
          metadataRequests += 1;
          return {
            downloadUrl: zoomDownloadUrl(`fresh-${status}`),
            syncedAt: new Date(),
          };
        },
        fetchFile: async () => {
          fetchRequests += 1;
          return response(status, "application/json");
        },
      }),
      (error) => {
        assert.equal(error.code, "ZOOM_STREAM_REQUEST_FAILED");
        assert.equal(error.upstreamStatus, status);
        return true;
      }
    );

    assert.equal(fetchRequests, 2);
    assert.equal(tokenRequests, 2);
    assert.equal(metadataRequests, 1);
  });
}
