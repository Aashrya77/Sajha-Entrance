import React, { useState, useEffect } from "react";

export default function RecordedClassEditComponent(props) {
  const [youtubeUrl, setYoutubeUrl] = useState(props.record.params.youtubeUrl || "");
  const [videoId, setVideoId] = useState(props.record.params.videoId || "");
  const [error, setError] = useState("");

  // Function to extract video ID from YouTube URL
  const extractVideoId = (url) => {
    let videoIdExtracted = "";

    // Handle different YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /(?:youtube\.com\/watch\?.*v=)([^&\n?#]+)/,
      /(?:youtu\.be\/)([^?&\n]+)/,
    ];

    for (let pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        videoIdExtracted = match[1];
        break;
      }
    }

    return videoIdExtracted;
  };

  // Handle URL change
  const handleUrlChange = (e) => {
    const url = e.target.value;
    setYoutubeUrl(url);
    setError("");

    if (url.trim()) {
      const extracted = extractVideoId(url);
      if (extracted) {
        setVideoId(extracted);
        props.onChange({
          ...props.record.params,
          youtubeUrl: url,
          videoId: extracted,
        });
      } else {
        setError("Invalid YouTube URL. Please provide a valid YouTube link.");
        props.onChange({
          ...props.record.params,
          youtubeUrl: url,
          videoId: "",
        });
      }
    }
  };

  return (
    <div style={{ padding: "16px 0" }}>
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
          YouTube URL
        </label>
        <input
          type="text"
          value={youtubeUrl}
          onChange={handleUrlChange}
          placeholder="https://www.youtube.com/watch?v=..."
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontFamily: "monospace",
          }}
        />
        <small style={{ display: "block", marginTop: "4px", color: "#666" }}>
          Paste the full YouTube URL. Video ID will be extracted automatically.
        </small>
      </div>

      {error && (
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: "#ffebee",
            color: "#c62828",
            borderRadius: "4px",
            marginBottom: "16px",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      <div>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
          Video ID (Auto-generated)
        </label>
        <input
          type="text"
          value={videoId}
          readOnly
          placeholder="Video ID will appear here"
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            backgroundColor: "#f5f5f5",
            fontFamily: "monospace",
          }}
        />
      </div>

      {videoId && (
        <div style={{ marginTop: "16px" }}>
          <p style={{ fontWeight: "500", marginBottom: "8px" }}>Preview:</p>
          <img
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
            alt="Video thumbnail"
            style={{
              maxWidth: "200px",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
            onError={() => setError("Could not load thumbnail. Check if the video ID is correct.")}
          />
        </div>
      )}
    </div>
  );
}
