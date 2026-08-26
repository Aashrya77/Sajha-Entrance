import EventModel from "../models/Event.js";
import { MEDIA_TYPES, getMediaPublicPath } from "../utils/media.js";

const DEFAULT_EVENT_LIMIT = 9;
const MAX_EVENT_LIMIT = 30;

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePositiveInteger = (value, fallback, max = Number.MAX_SAFE_INTEGER) => {
  const parsedValue = Number.parseInt(value, 10);
  if (!Number.isFinite(parsedValue) || parsedValue < 1) return fallback;
  return Math.min(parsedValue, max);
};

const normalizeQueryText = (value = "", maxLength = 100) =>
  String(value || "").trim().slice(0, maxLength);

const deriveEventState = (startAt, endAt, now = new Date()) => {
  const startTime = new Date(startAt).getTime();
  const endTime = new Date(endAt).getTime();
  const nowTime = now.getTime();

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return "unknown";
  if (nowTime < startTime) return "upcoming";
  if (nowTime > endTime) return "completed";
  return "ongoing";
};

const buildEventPublicQuery = ({ search = "", category = "", now = new Date() } = {}) => {
  const filters = [EventModel.buildPublicFilter(now)];
  const normalizedSearch = normalizeQueryText(search, 100);
  const normalizedCategory = normalizeQueryText(category, 80);

  if (normalizedSearch) {
    const searchRegex = new RegExp(escapeRegex(normalizedSearch), "i");
    filters.push({
      $or: [
        { title: searchRegex },
        { excerpt: searchRegex },
        { category: searchRegex },
        { venue: searchRegex },
        { address: searchRegex },
        { organizer: searchRegex },
      ],
    });
  }

  if (normalizedCategory && normalizedCategory !== "all") {
    filters.push({ category: normalizedCategory });
  }

  return filters.length === 1 ? filters[0] : { $and: filters };
};

const serializeEvent = (record = {}, now = new Date()) => ({
  slug: record.slug,
  legacyId: record.legacyId || "",
  title: record.title,
  excerpt: record.excerpt,
  content: record.content,
  featuredImage: record.featuredImage
    ? getMediaPublicPath(MEDIA_TYPES.event, record.featuredImage)
    : null,
  featuredImageUrl: record.featuredImage
    ? getMediaPublicPath(MEDIA_TYPES.event, record.featuredImage)
    : null,
  imageAlt: record.imageAlt || record.title,
  category: record.category || "General",
  startAt: record.startAt,
  endAt: record.endAt,
  eventState: deriveEventState(record.startAt, record.endAt, now),
  venue: record.venue || "",
  address: record.address || "",
  organizer: record.organizer || "",
  contact: record.contact || "",
  registrationUrl: record.registrationUrl || "",
  externalUrl: record.externalUrl || "",
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

const getEventList = async (req, res) => {
  try {
    const now = new Date();
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, DEFAULT_EVENT_LIMIT, MAX_EVENT_LIMIT);
    const skip = (page - 1) * limit;
    const search = normalizeQueryText(req.query.search || req.query.searchEvent, 100);
    const category = normalizeQueryText(req.query.category, 80);
    const filter = buildEventPublicQuery({ search, category, now });

    const [totalItems, records, categories] = await Promise.all([
      EventModel.countDocuments(filter),
      EventModel.find(filter)
        .select(
          "title slug legacyId excerpt featuredImage imageAlt category startAt endAt venue address organizer contact registrationUrl externalUrl featured publishAt publishedAt seoTitle metaDescription canonicalUrl ogTitle ogDescription ogImage createdAt updatedAt"
        )
        .sort({ startAt: 1, featured: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EventModel.distinct("category", EventModel.buildPublicFilter(now)),
    ]);

    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    return res.json({
      success: true,
      data: {
        events: records.map((record) => serializeEvent(record, now)),
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
    return res.status(500).json({ success: false, error: "Failed to fetch events." });
  }
};

const getEventDetail = async (req, res) => {
  try {
    const now = new Date();
    const identifier = normalizeQueryText(req.params.identifier, 160).toLowerCase();

    if (!identifier) {
      return res.status(404).json({ success: false, error: "Event not found." });
    }

    const record = await EventModel.findOne({
      $and: [
        EventModel.buildPublicFilter(now),
        { $or: [{ slug: identifier }, { legacyId: identifier }] },
      ],
    })
      .select(
        "title slug legacyId excerpt content featuredImage imageAlt category startAt endAt venue address organizer contact registrationUrl externalUrl featured publishAt publishedAt seoTitle metaDescription canonicalUrl ogTitle ogDescription ogImage createdAt updatedAt"
      )
      .lean();

    if (!record) {
      return res.status(404).json({ success: false, error: "Event not found." });
    }

    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    return res.json({ success: true, data: { event: serializeEvent(record, now) } });
  } catch (_error) {
    return res.status(500).json({ success: false, error: "Failed to fetch event." });
  }
};

export { buildEventPublicQuery, deriveEventState, getEventDetail, getEventList, serializeEvent };
