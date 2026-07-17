import express from "express";

import {
  buildSitemapXml,
  createSitemapXml,
  getStaticSitemapEntries,
  SITEMAP_ORIGIN,
} from "../services/sitemapService.js";
import { createLogger } from "../utils/logger.js";

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
} = {}) => {
  const router = express.Router();

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
