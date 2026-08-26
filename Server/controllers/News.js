import NewsModel from "../models/News.js";
import { MEDIA_TYPES, getMediaPublicPath } from "../utils/media.js";

const DEFAULT_NEWS_LIMIT = 8;
const MAX_NEWS_LIMIT = 24;

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePositiveInteger = (value, fallback, max = Number.MAX_SAFE_INTEGER) => {
  const parsedValue = Number.parseInt(value, 10);
  if (!Number.isFinite(parsedValue) || parsedValue < 1) return fallback;
  return Math.min(parsedValue, max);
};

const normalizeQueryText = (value = "", maxLength = 100) =>
  String(value || "").trim().slice(0, maxLength);

const buildNewsPublicQuery = ({ search = "", category = "", now = new Date() } = {}) => {
  const filters = [NewsModel.buildPublicFilter(now)];
  const normalizedSearch = normalizeQueryText(search, 100);
  const normalizedCategory = normalizeQueryText(category, 80);

  if (normalizedSearch) {
    const searchRegex = new RegExp(escapeRegex(normalizedSearch), "i");
    filters.push({
      $or: [
        { title: searchRegex },
        { excerpt: searchRegex },
        { category: searchRegex },
        { tags: searchRegex },
      ],
    });
  }

  if (normalizedCategory && normalizedCategory !== "all") {
    filters.push({ category: normalizedCategory });
  }

  return filters.length === 1 ? filters[0] : { $and: filters };
};

const serializeNews = (record = {}) => ({
  slug: record.slug,
  legacyId: record.legacyId || "",
  title: record.title,
  excerpt: record.excerpt,
  content: record.content,
  featuredImage: record.featuredImage
    ? getMediaPublicPath(MEDIA_TYPES.news, record.featuredImage)
    : null,
  featuredImageUrl: record.featuredImage
    ? getMediaPublicPath(MEDIA_TYPES.news, record.featuredImage)
    : null,
  imageAlt: record.imageAlt || record.title,
  category: record.category || "General",
  tags: Array.isArray(record.tags) ? record.tags : [],
  author: record.author || "",
  sourceName: record.sourceName || "",
  sourceUrl: record.sourceUrl || "",
  featured: Boolean(record.featured),
  publishedAt: record.publishedAt || record.publishAt,
  seo: {
    title: record.seoTitle || record.title,
    description: record.metaDescription || record.excerpt,
    canonicalUrl: record.canonicalUrl || "",
    ogTitle: record.ogTitle || record.seoTitle || record.title,
    ogDescription: record.ogDescription || record.metaDescription || record.excerpt,
    ogImage: record.ogImage || "",
  },
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

const getNewsList = async (req, res) => {
  try {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, DEFAULT_NEWS_LIMIT, MAX_NEWS_LIMIT);
    const skip = (page - 1) * limit;
    const search = normalizeQueryText(req.query.search || req.query.searchNews, 100);
    const category = normalizeQueryText(req.query.category, 80);
    const filter = buildNewsPublicQuery({ search, category });

    const [totalItems, records, categories] = await Promise.all([
      NewsModel.countDocuments(filter),
      NewsModel.find(filter)
        .select(
          "title slug legacyId excerpt featuredImage imageAlt category tags author sourceName sourceUrl featured publishAt publishedAt seoTitle metaDescription canonicalUrl ogTitle ogDescription ogImage createdAt updatedAt"
        )
        .sort({ featured: -1, publishedAt: -1, publishAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      NewsModel.distinct("category", NewsModel.buildPublicFilter()),
    ]);

    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    return res.json({
      success: true,
      data: {
        news: records.map(serializeNews),
        categories: categories.filter(Boolean).sort((left, right) => left.localeCompare(right)),
        search,
        category,
        pagination: {
          currentPage: page,
          limit,
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
          previousPage: page > 1 ? page - 1 : 0,
          nextPage: skip + records.length < totalItems ? page + 1 : 0,
        },
      },
    });
  } catch (_error) {
    return res.status(500).json({ success: false, error: "Failed to fetch news." });
  }
};

const getNewsDetail = async (req, res) => {
  try {
    const identifier = normalizeQueryText(req.params.identifier, 160).toLowerCase();

    if (!identifier) {
      return res.status(404).json({ success: false, error: "News not found." });
    }

    const record = await NewsModel.findOne({
      $and: [
        NewsModel.buildPublicFilter(),
        { $or: [{ slug: identifier }, { legacyId: identifier }] },
      ],
    })
      .select(
        "title slug legacyId excerpt content featuredImage imageAlt category tags author sourceName sourceUrl featured publishAt publishedAt seoTitle metaDescription canonicalUrl ogTitle ogDescription ogImage createdAt updatedAt"
      )
      .lean();

    if (!record) {
      return res.status(404).json({ success: false, error: "News not found." });
    }

    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    return res.json({ success: true, data: { news: serializeNews(record) } });
  } catch (_error) {
    return res.status(500).json({ success: false, error: "Failed to fetch news." });
  }
};

export { buildNewsPublicQuery, getNewsDetail, getNewsList, serializeNews };
