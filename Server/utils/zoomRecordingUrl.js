const firstUrl = (...values) =>
  values.find((value) => typeof value === "string" && value.trim())?.trim() || "";

export const buildZoomRecordingShareUrl = ({ shareUrl, playUrl, passcode } = {}) => {
  const sourceUrl = firstUrl(shareUrl, playUrl);

  if (!sourceUrl) {
    return "";
  }

  try {
    const url = new URL(sourceUrl);
    const normalizedPasscode = String(passcode || "").trim();

    if (normalizedPasscode) {
      url.searchParams.set("pwd", normalizedPasscode);
    }

    return url.toString();
  } catch (_error) {
    return "";
  }
};
