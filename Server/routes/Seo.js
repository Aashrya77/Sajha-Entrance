import express from "express";

import {
  buildSitemapXml,
  createSitemapXml,
  getStaticSitemapEntries,
  SITEMAP_ORIGIN,
} from "../services/sitemapService.js";
import { createLogger } from "../utils/logger.js";
import SeoHashtag from "../models/SeoHashtag.js";
import PageSeo from "../models/PageSeo.js";

const normalizePagePath = (value = "") => {
  const rawPath = String(value || "").trim().split(/[?#]/, 1)[0];
  const withLeadingSlash = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  return withLeadingSlash.replace(/\/+$/, "") || "/";
};

export const ROBOTS_TXT = [
  "User-agent: *",
  "Allow: /",
  "",
  "Disallow: /api/",
  "Disallow: /sajha-admin",
  "",
  `Sitemap: ${SITEMAP_ORIGIN}/sitemap.xml`,
  "",
].join("\n");

export const createSeoRouter = ({
  sitemapBuilder = buildSitemapXml,
  routeLogger = createLogger("seo"),
  pageSeoModel = PageSeo,
} = {}) => {
  const router = express.Router();

  router.get("/api/seo/hashtags", async (_req, res) => {
    try {
      const records = await SeoHashtag.find({ isActive: true })
        .sort({ hashtag: 1 })
        .select({ hashtag: 1, _id: 0 })
        .lean();
      const hashtags = records.map((record) => record.hashtag);

      return res
        .set("Cache-Control", "public, max-age=300, stale-if-error=86400")
        .json({ success: true, hashtags });
    } catch (error) {
      routeLogger.error("SEO hashtag loading failed:", error.message);
      return res.status(503).json({ success: false, hashtags: [] });
    }
  });

  router.get("/api/seo/page", async (req, res) => {
    try {
      const pagePath = normalizePagePath(req.query?.path);
      const queryResult = await pageSeoModel.findOne({ pagePath, isActive: true });
      const record = typeof queryResult?.lean === "function" ? await queryResult.lean() : queryResult;

      if (!record) {
        return res
          .set("Cache-Control", "public, max-age=300, stale-if-error=86400")
          .json({ success: true, seo: null });
      }

      return res
        .set("Cache-Control", "public, max-age=300, stale-if-error=86400")
        .json({
          success: true,
          seo: {
            pagePath: record.pagePath,
            title: record.title,
            description: record.description,
            keywords: record.keywords,
            robots: record.robots,
            canonicalUrl: record.canonicalUrl,
            ogTitle: record.ogTitle,
            ogDescription: record.ogDescription,
            ogImage: record.ogImage,
            twitterCard: record.twitterCard,
          },
        });
    } catch (error) {
      routeLogger.error("Page SEO loading failed:", error.message);
      return res.status(503).json({ success: false, seo: null });
    }
  });

  router.get("/robots.txt", (_req, res) => {
    res
      .status(200)
      .set("Content-Type", "text/plain; charset=utf-8")
      .set("Cache-Control", "public, max-age=3600")
      .send(ROBOTS_TXT);
  });

  router.get("/sitemap.xml", async (_req, res) => {
    try {
      const xml = await sitemapBuilder({ logger: routeLogger });

      return res
        .status(200)
        .set("Content-Type", "application/xml; charset=utf-8")
        .set("Cache-Control", "public, max-age=900, stale-if-error=86400")
        .send(xml);
    } catch (error) {
      routeLogger.error("Sitemap generation failed:", error.message);

      return res
        .status(200)
        .set("Content-Type", "application/xml; charset=utf-8")
        .set("Cache-Control", "no-store")
        .send(createSitemapXml(getStaticSitemapEntries()));
    }
  });

  return router;
};

export default createSeoRouter();
