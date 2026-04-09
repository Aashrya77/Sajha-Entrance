import React, { memo, useEffect, useState } from "react";
import { Box, FormGroup, FormMessage, Label, Text } from "@adminjs/design-system";

const extractVideoId = (url = "") => {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = String(url || "").match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
};

const extractPlaylistId = (url = "") => {
  const patterns = [
    /[?&]list=([a-zA-Z0-9_-]+)/,
    /youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = String(url || "").match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
};

const resolveInitialContentType = (record = {}, youtubeUrl = "") => {
  if (record?.params?.contentType === "playlist" || record?.params?.playlistId) {
    return "playlist";
  }

  if (record?.params?.contentType === "video") {
    return "video";
  }

  return extractPlaylistId(youtubeUrl) ? "playlist" : "video";
};

const getHelperText = (contentType) =>
  contentType === "playlist"
    ? "Paste a YouTube playlist link. Example: https://www.youtube.com/watch?v=Ab86QAV1QQU&list=..."
    : "Paste a single YouTube video link. The video ID will be extracted automatically.";

const RecordedClassEditComponent = ({ property, record, onChange }) => {
  const propertyPath = property?.path || "youtubeUrl";
  const fieldValue = record?.params?.[propertyPath] || "";
  const propertyError = record?.errors?.[propertyPath];
  const contentTypeError = record?.errors?.contentType;
  const initialContentType = resolveInitialContentType(record, fieldValue);
  const [contentType, setContentType] = useState(initialContentType);
  const [youtubeUrl, setYoutubeUrl] = useState(fieldValue);
  const [videoId, setVideoId] = useState(record?.params?.videoId || "");
  const [playlistId, setPlaylistId] = useState(record?.params?.playlistId || "");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    const nextUrl = record?.params?.[propertyPath] || "";
    setYoutubeUrl(nextUrl);
    setVideoId(record?.params?.videoId || "");
    setPlaylistId(record?.params?.playlistId || "");
    setContentType(resolveInitialContentType(record, nextUrl));
  }, [
    propertyPath,
    record?.params?.contentType,
    record?.params?.playlistId,
    record?.params?.videoId,
    record?.params?.[propertyPath],
  ]);

  const syncFields = (nextContentType, nextUrl) => {
    const trimmedUrl = String(nextUrl || "").trim();
    const nextVideoId = extractVideoId(trimmedUrl);
    const nextPlaylistId = extractPlaylistId(trimmedUrl);

    let nextError = "";
    if (trimmedUrl) {
      if (nextContentType === "playlist" && !nextPlaylistId) {
        nextError = "Paste a playlist link that contains a list id.";
      }

      if (nextContentType === "video" && !nextVideoId) {
        nextError = "Paste a valid YouTube video link.";
      }
    }

    setContentType(nextContentType);
    setYoutubeUrl(nextUrl);
    setVideoId(nextVideoId);
    setPlaylistId(nextContentType === "playlist" ? nextPlaylistId : "");
    setLocalError(nextError);

    onChange("contentType", nextContentType);
    onChange(propertyPath, nextUrl);
    onChange("videoId", nextVideoId || "");
    onChange("playlistId", nextContentType === "playlist" ? nextPlaylistId || "" : "");
  };

  const previewThumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : "";

  return (
    <FormGroup error={Boolean(propertyError || contentTypeError || localError)}>
      <Label>{property.label}</Label>

      <Box style={{ display: "grid", gap: "12px" }}>
        <Box>
          <label
            htmlFor="recorded-class-type"
            style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}
          >
            Media Type
          </label>
          <select
            id="recorded-class-type"
            value={contentType}
            onChange={(event) => syncFields(event.target.value, youtubeUrl)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#fff",
            }}
          >
            <option value="video">Single Video</option>
            <option value="playlist">Playlist</option>
          </select>
        </Box>

        <Box>
          <label
            htmlFor="recorded-class-youtube-url"
            style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}
          >
            YouTube Link
          </label>
          <input
            id="recorded-class-youtube-url"
            type="text"
            value={youtubeUrl}
            onChange={(event) => syncFields(contentType, event.target.value)}
            placeholder={
              contentType === "playlist"
                ? "https://www.youtube.com/watch?v=Ab86QAV1QQU&list=..."
                : "https://www.youtube.com/watch?v=..."
            }
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontFamily: "monospace",
            }}
          />
          <Text mt="xs" color="grey60" fontSize="12px">
            {getHelperText(contentType)}
          </Text>
        </Box>

        <Box style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(2, 1fr)" }}>
          <Box>
            <label
              htmlFor="recorded-class-video-id"
              style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}
            >
              Video ID
            </label>
            <input
              id="recorded-class-video-id"
              type="text"
              value={videoId}
              readOnly
              placeholder="Auto-generated"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
                fontFamily: "monospace",
              }}
            />
          </Box>

          <Box>
            <label
              htmlFor="recorded-class-playlist-id"
              style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}
            >
              Playlist ID
            </label>
            <input
              id="recorded-class-playlist-id"
              type="text"
              value={playlistId}
              readOnly
              placeholder="Auto-generated for playlists"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
                fontFamily: "monospace",
              }}
            />
          </Box>
        </Box>

        {previewThumbnailUrl && (
          <Box>
            <Text mb="sm" fontWeight="600">
              Preview
            </Text>
            <img
              src={previewThumbnailUrl}
              alt="YouTube preview"
              style={{
                width: "100%",
                maxWidth: "260px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
              }}
            />
          </Box>
        )}
      </Box>

      <FormMessage>
        {localError || propertyError?.message || contentTypeError?.message}
      </FormMessage>
    </FormGroup>
  );
};

export default memo(RecordedClassEditComponent);
