const INDEXABLE_STATIC_PATHS = new Set([
  "/",
  "/about",
  "/courses",
  "/colleges",
  "/universities",
  "/mocktests",
  "/past-questions",
  "/blogs",
  "/contact",
  "/services",
  "/admission",
  "/news",
  "/events",
  "/scholarships",
  "/books",
  "/terms-and-conditions",
  "/privacy-policy",
]);

const INDEXABLE_DETAIL_PATTERNS = [
  /^\/course\/[a-f\d]{24}$/i,
  /^\/college\/[a-f\d]{24}$/i,
  /^\/university\/[a-f\d]{24}$/i,
  /^\/blog\/[a-f\d]{24}$/i,
  /^\/past-questions\/[^/]+$/,
  /^\/news\/[^/]+$/,
  /^\/events\/[^/]+$/,
  /^\/book\/\d+$/,
];

const normalizePath = (pathname = "/") => {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.replace(/\/+$/g, "") || "/";
};

export const isIndexablePath = (pathname) => {
  const normalizedPath = normalizePath(pathname);
  return (
    INDEXABLE_STATIC_PATHS.has(normalizedPath) ||
    INDEXABLE_DETAIL_PATTERNS.some((pattern) => pattern.test(normalizedPath))
  );
};
