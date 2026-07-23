const GOOGLE_MAP_HOST_PATTERN =
  /(^|\.)google\.[a-z.]+$|(^|\.)googleusercontent\.com$/i;

export const resolveGoogleMapEmbedUrl = (value = "") => {
  const input = String(value || "").trim();
  if (!input) return "";

  const iframeSource = input.match(
    /<iframe[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i
  );
  const candidate = (iframeSource?.[1] || iframeSource?.[2] || iframeSource?.[3] || input)
    .replace(/&amp;/gi, "&")
    .trim();

  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || !GOOGLE_MAP_HOST_PATTERN.test(url.hostname)) {
      return "";
    }

    return url.toString();
  } catch (_error) {
    return "";
  }
};
