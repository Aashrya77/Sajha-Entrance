import xss from "xss";

const { FilterXSS } = xss;

const URL_ATTRIBUTES = new Set(["href", "src"]);
const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const SAFE_IMAGE_DATA_URL = /^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i;

const ALLOWED_TAGS = {
  p: ["align"],
  br: [],
  h2: ["align"],
  h3: ["align"],
  h4: ["align"],
  strong: [],
  b: [],
  em: [],
  i: [],
  u: [],
  s: [],
  strike: [],
  ul: [],
  ol: [],
  li: [],
  blockquote: [],
  a: ["href", "title", "target", "rel"],
  hr: [],
  code: [],
  pre: [],
  table: [],
  thead: [],
  tbody: [],
  tr: [],
  th: ["align", "colspan", "rowspan"],
  td: ["align", "colspan", "rowspan"],
  img: ["src", "alt", "title", "width", "height", "loading"],
};

const isSafeUrl = (value = "", attributeName = "") => {
  const trimmed = String(value || "").trim();
  const lowerValue = trimmed.toLowerCase().replace(/\s+/g, "");

  if (!trimmed || lowerValue.startsWith("javascript:") || lowerValue.startsWith("data:text/html")) {
    return false;
  }

  if (lowerValue.startsWith("data:")) {
    return attributeName === "src" && SAFE_IMAGE_DATA_URL.test(trimmed);
  }

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return true;
  }

  if (trimmed.startsWith("#")) {
    return attributeName === "href";
  }

  try {
    const parsedUrl = new URL(trimmed, "https://sajhaentrance.org");
    return SAFE_PROTOCOLS.has(parsedUrl.protocol);
  } catch (_error) {
    return false;
  }
};

const sanitizeAttributeValue = (tag, name, value) => {
  const attributeName = String(name || "").toLowerCase();

  if (attributeName.startsWith("on")) {
    return "";
  }

  if (URL_ATTRIBUTES.has(attributeName) && !isSafeUrl(value, attributeName)) {
    return "";
  }

  if (attributeName === "target") {
    return value === "_blank" ? "_blank" : "";
  }

  if (attributeName === "rel") {
    return "noopener noreferrer";
  }

  if (attributeName === "align") {
    return ["left", "center", "right", "justify"].includes(String(value).toLowerCase())
      ? value
      : "";
  }

  if (["colspan", "rowspan"].includes(attributeName)) {
    const numericValue = Number.parseInt(value, 10);
    return Number.isInteger(numericValue) && numericValue >= 1 && numericValue <= 12
      ? String(numericValue)
      : "";
  }

  if (["width", "height"].includes(attributeName)) {
    const numericValue = Number.parseInt(value, 10);
    return Number.isInteger(numericValue) && numericValue >= 1 && numericValue <= 4000
      ? String(numericValue)
      : "";
  }

  if (attributeName === "loading") {
    return value === "lazy" ? "lazy" : "";
  }

  return xss.safeAttrValue(tag, name, value);
};

const richTextFilter = new FilterXSS({
  whiteList: ALLOWED_TAGS,
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style", "iframe", "object", "embed"],
  allowCommentTag: false,
  safeAttrValue: sanitizeAttributeValue,
  onTagAttr(tag, name, value) {
    if (tag === "a" && name === "target" && value === "_blank") {
      return 'target="_blank" rel="noopener noreferrer"';
    }
    return undefined;
  },
});

const sanitizeRichHtml = (value = "") => richTextFilter.process(String(value || ""));

const stripHtmlToText = (value = "") =>
  sanitizeRichHtml(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export { ALLOWED_TAGS, isSafeUrl, sanitizeRichHtml, stripHtmlToText };
