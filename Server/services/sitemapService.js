import BlogModel from "../models/Blog.js";
import CollegeModel from "../models/College.js";
import CourseModel from "../models/Course.js";
import QuestionBankModel from "../models/QuestionBank.js";
import UniversityModel from "../models/University.js";
import {
  PUBLIC_BOOK_IDS,
  PUBLIC_EVENTS,
  PUBLIC_NEWS_ITEMS,
} from "../constants/publicSeoContent.js";

export const SITEMAP_ORIGIN = "https://sajhaentrance.org";

export const STATIC_PUBLIC_PATHS = [
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
];

const normalizePath = (value = "/") => {
  const path = String(value || "/").split(/[?#]/, 1)[0] || "/";
  const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;

  return withLeadingSlash === "/"
    ? "/"
    : withLeadingSlash.replace(/\/+$/g, "");
};

const encodePathSegment = (value) => encodeURIComponent(String(value || ""));

const toIsoDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const escapeXml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export const createSitemapEntry = (path, lastmod) => ({
  path: normalizePath(path),
  lastmod: toIsoDate(lastmod),
});

export const getStaticSitemapEntries = (now = new Date()) => {
  const nowTimestamp = now.getTime();
  const staticEntries = STATIC_PUBLIC_PATHS.map((path) => createSitemapEntry(path));
  const newsEntries = PUBLIC_NEWS_ITEMS.map((item) =>
    createSitemapEntry(`/news/${encodePathSegment(item.id)}`, item.createdAt)
  );
  const activeEventEntries = PUBLIC_EVENTS.filter((event) => {
    const endTimestamp = new Date(event.endAt).getTime();
    return Number.isFinite(endTimestamp) && endTimestamp >= nowTimestamp;
  }).map((event) =>
    createSitemapEntry(`/events/${encodePathSegment(event.id)}`)
  );
  const bookEntries = PUBLIC_BOOK_IDS.map((id) =>
    createSitemapEntry(`/book/${encodePathSegment(id)}`)
  );

  return [...staticEntries, ...newsEntries, ...activeEventEntries, ...bookEntries];
};

export const DYNAMIC_SITEMAP_SOURCES = [
  {
    name: "colleges",
    model: CollegeModel,
    filter: {},
    projection: "_id slug createdAt updatedAt",
    toEntry: (record) =>
      createSitemapEntry(`/college/${encodePathSegment(record.slug || record._id)}`, record.updatedAt || record.createdAt),
  },
  {
    name: "courses",
    model: CourseModel,
    filter: {},
    projection: "_id slug",
    toEntry: (record) => createSitemapEntry(`/course/${encodePathSegment(record.slug || record._id)}`),
  },
  {
    name: "blogs",
    model: BlogModel,
    filter: {},
    projection: "_id slug createdAt",
    toEntry: (record) =>
      createSitemapEntry(`/blog/${encodePathSegment(record.slug || record._id)}`, record.createdAt),
  },
  {
    name: "universities",
    model: UniversityModel,
    filter: {},
    projection: "_id slug createdAt updatedAt",
    toEntry: (record) =>
      createSitemapEntry(
        `/university/${encodePathSegment(record.slug || record._id)}`,
        record.updatedAt || record.createdAt
      ),
  },
  {
    name: "past questions",
    model: QuestionBankModel,
    filter: {
      isPublished: true,
      $or: [
        { resourceType: "PDF", pdfUrl: { $nin: ["", null] } },
        { resourceType: "Images", "imageUrls.0": { $exists: true } },
      ],
    },
    projection: "slug createdAt",
    toEntry: (record) =>
      createSitemapEntry(
        `/past-questions/${encodePathSegment(record.slug)}`,
        record.createdAt
      ),
  },
];

const loadDynamicSource = async (source) => {
  const records = await source.model
    .find(source.filter, source.projection)
    .lean()
    .exec();

  return records.map(source.toEntry);
};

export const loadDynamicSitemapEntries = async ({ logger } = {}) => {
  const results = await Promise.allSettled(
    DYNAMIC_SITEMAP_SOURCES.map(loadDynamicSource)
  );

  return results.flatMap((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    logger?.error?.(
      `Sitemap source failed (${DYNAMIC_SITEMAP_SOURCES[index].name}):`,
      result.reason?.message || result.reason
    );
    return [];
  });
};

export const deduplicateSitemapEntries = (entries = []) => {
  const entriesByUrl = new Map();

  entries.forEach((entry) => {
    const normalizedPath = normalizePath(entry?.path);
    const url = `${SITEMAP_ORIGIN}${normalizedPath === "/" ? "" : normalizedPath}`;
    const currentEntry = entriesByUrl.get(url);
    const nextLastmod = toIsoDate(entry?.lastmod);

    if (!currentEntry || (!currentEntry.lastmod && nextLastmod)) {
      entriesByUrl.set(url, { url, lastmod: nextLastmod });
    }
  });

  return [...entriesByUrl.values()].sort((left, right) =>
    left.url.localeCompare(right.url)
  );
};

export const createSitemapXml = (entries = []) => {
  const urls = deduplicateSitemapEntries(entries)
    .map(({ url, lastmod }) => {
      const lastmodElement = lastmod
        ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>`
        : "";

      return `  <url>\n    <loc>${escapeXml(url)}</loc>${lastmodElement}\n  </url>`;
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n");
};

export const buildSitemapXml = async ({ logger, now = new Date() } = {}) => {
  const dynamicEntries = await loadDynamicSitemapEntries({ logger });
  return createSitemapXml([
    ...getStaticSitemapEntries(now),
    ...dynamicEntries,
  ]);
};
