import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import express from "express";

import { isIndexablePath } from "../../App/src/components/Seo/routeIndexing.js";
import {
  PUBLIC_BOOK_IDS,
} from "../constants/publicSeoContent.js";
import { createSeoRouter, ROBOTS_TXT } from "../routes/Seo.js";
import {
  createSitemapEntry,
  createSitemapXml,
  deduplicateSitemapEntries,
  DYNAMIC_SITEMAP_SOURCES,
  getStaticSitemapEntries,
  SITEMAP_ORIGIN,
  STATIC_PUBLIC_PATHS,
} from "../services/sitemapService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(__dirname, "../..");

const listen = (app) =>
  new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });

const close = (server) =>
  new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

const request = async (server, pathname) => {
  const address = server.address();
  return fetch(`http://127.0.0.1:${address.port}${pathname}`);
};

const extractLocValues = (xml) =>
  [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);

test("robots.txt matches the Vite public asset without hiding noindex HTML routes", () => {
  const publicRobotsPath = path.join(repositoryRoot, "App/public/robots.txt");
  const publicRobots = fs.readFileSync(publicRobotsPath, "utf8").replace(/\r\n/g, "\n");

  assert.equal(publicRobots, ROBOTS_TXT);
  assert.match(ROBOTS_TXT, /^User-agent: \*$/m);
  assert.match(ROBOTS_TXT, /^Allow: \/$/m);
  assert.match(ROBOTS_TXT, /^Disallow: \/api\/$/m);
  assert.match(ROBOTS_TXT, /^Disallow: \/sajha-admin$/m);
  assert.doesNotMatch(ROBOTS_TXT, /^Disallow: \/payment\/$/m);
  assert.doesNotMatch(ROBOTS_TXT, /^Disallow: \/student\/$/m);
  assert.doesNotMatch(ROBOTS_TXT, /^Disallow: \/mocktest\/$/m);
  assert.doesNotMatch(ROBOTS_TXT, /^Disallow: \/results$/m);
  assert.match(
    ROBOTS_TXT,
    /^Sitemap: https:\/\/sajhaentrance\.org\/sitemap\.xml$/m
  );
});

test("static sitemap entries include public pages without hardcoded CMS detail records", () => {
  const entries = getStaticSitemapEntries(new Date("2026-07-17T00:00:00.000Z"));
  const paths = new Set(entries.map((entry) => entry.path));

  assert(paths.has("/"));
  assert(paths.has("/mocktests"));
  assert(paths.has("/past-questions"));
  assert(paths.has("/news"));
  assert(paths.has("/events"));
  assert(![...paths].some((value) => value.startsWith("/news/")));
  assert(![...paths].some((value) => value.startsWith("/events/")));
  assert(!paths.has("/results"));
  assert(!paths.has("/dashboard"));
  assert(![...paths].some((value) => value.startsWith("/student/")));
  assert(![...paths].some((value) => value.startsWith("/mocktest/")));
});

test("published past-question sitemap source excludes drafts", () => {
  const pastQuestionSource = DYNAMIC_SITEMAP_SOURCES.find(
    (source) => source.name === "past questions"
  );

  assert.deepEqual(pastQuestionSource?.filter, {
    isPublished: true,
    $or: [
      { resourceType: "PDF", pdfUrl: { $nin: ["", null] } },
      { resourceType: "Images", "imageUrls.0": { $exists: true } },
    ],
  });
  assert.equal(
    pastQuestionSource.toEntry({
      slug: "public-question",
      createdAt: "2026-07-01T00:00:00.000Z",
    }).path,
    "/past-questions/public-question"
  );
});

test("News and Event sitemap sources include only public published records", () => {
  const newsSource = DYNAMIC_SITEMAP_SOURCES.find((source) => source.name === "news");
  const eventSource = DYNAMIC_SITEMAP_SOURCES.find((source) => source.name === "events");

  assert.equal(newsSource?.filter()?.status, "published");
  assert.match(JSON.stringify(newsSource?.filter()), /publishedAt|publishAt/);
  assert.equal(newsSource.toEntry({ slug: "public-news", updatedAt: "2026-08-01" }).path, "/news/public-news");

  assert.equal(eventSource?.filter()?.status, "published");
  assert.match(JSON.stringify(eventSource?.filter()), /publishedAt|publishAt/);
  assert.equal(eventSource.toEntry({ slug: "public-event", startAt: "2026-09-01" }).path, "/events/public-event");
});

test("public routes are indexable and private or utility routes are noindex", () => {
  STATIC_PUBLIC_PATHS.forEach((pathname) => {
    assert.equal(isIndexablePath(pathname), true, `${pathname} should be indexable`);
  });

  [
    "/course/507f1f77bcf86cd799439011",
    "/college/507f1f77bcf86cd799439011",
    "/university/507f1f77bcf86cd799439011",
    "/blog/507f1f77bcf86cd799439011",
    "/past-questions/published-question",
    "/news/public-news",
    "/events/public-event",
    "/book/1",
  ].forEach((pathname) => {
    assert.equal(isIndexablePath(pathname), true, `${pathname} should be indexable`);
  });

  [
    "/dashboard",
    "/student/login",
    "/student/profile",
    "/student/recorded-classes",
    "/forgot-password",
    "/reset-password/private-token",
    "/results",
    "/mocktest/507f1f77bcf86cd799439011",
    "/mocktest-result/507f1f77bcf86cd799439011",
    "/mocktest-results",
    "/cart",
    "/payment/success",
    "/payment/failure",
    "/not-a-real-route",
  ].forEach((pathname) => {
    assert.equal(isIndexablePath(pathname), false, `${pathname} should be noindex`);
  });
});

test("sitemap XML escapes values, removes duplicates, and uses only the production origin", () => {
  const entries = [
    createSitemapEntry("/about/"),
    createSitemapEntry("/about"),
    createSitemapEntry("/news/a&b", "2026-04-26"),
  ];
  const deduplicated = deduplicateSitemapEntries(entries);
  const xml = createSitemapXml(entries);
  const locations = extractLocValues(xml);

  assert.equal(deduplicated.length, 2);
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(xml, /https:\/\/sajhaentrance\.org\/news\/a&amp;b/);
  assert.match(xml, /<lastmod>2026-04-26T00:00:00\.000Z<\/lastmod>/);
  assert(locations.every((location) => location.startsWith(SITEMAP_ORIGIN)));
  assert(!locations.some((location) => location.endsWith("/") && location !== `${SITEMAP_ORIGIN}/`));
});

test("page SEO endpoint returns configured metadata for a known path", async () => {
  const pageSeoModel = {
    findOne: async ({ pagePath }) => {
      if (pagePath === "/about") {
        return {
          pagePath: "/about",
          title: "About Sajha Entrance",
          description: "Learn about Sajha Entrance and its entrance preparation programs.",
          keywords: "Sajha Entrance, entrance preparation",
          robots: "index,follow",
          canonicalUrl: "https://sajhaentrance.org/about",
          isActive: true,
        };
      }
      return null;
    },
  };
  const app = express();
  app.use(
    createSeoRouter({
      pageSeoModel,
      routeLogger: { error() {} },
    })
  );

  const server = await listen(app);

  try {
    const response = await request(server, "/api/seo/page?path=/about");
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.seo?.title, "About Sajha Entrance");
    assert.equal(body.seo?.description, "Learn about Sajha Entrance and its entrance preparation programs.");
    assert.equal(body.seo?.robots, "index,follow");
  } finally {
    await close(server);
  }
});

test("SEO endpoints return the expected content types and status codes", async () => {
  const app = express();
  app.use(
    createSeoRouter({
      sitemapBuilder: async () => createSitemapXml(getStaticSitemapEntries()),
      routeLogger: { error() {} },
    })
  );
  app.get("*", (_req, res) => res.type("html").send("<html>SPA fallback</html>"));

  const server = await listen(app);

  try {
    const robotsResponse = await request(server, "/robots.txt");
    const sitemapResponse = await request(server, "/sitemap.xml");
    const sitemapBody = await sitemapResponse.text();

    assert.equal(robotsResponse.status, 200);
    assert.match(robotsResponse.headers.get("content-type"), /^text\/plain; charset=utf-8/i);
    assert.equal(sitemapResponse.status, 200);
    assert.match(sitemapResponse.headers.get("content-type"), /^application\/xml; charset=utf-8/i);
    assert.match(sitemapBody, /^<\?xml/);
    assert(!sitemapBody.includes("SPA fallback"));
  } finally {
    await close(server);
  }
});

test("sitemap endpoint safely returns static XML when dynamic generation fails", async () => {
  const app = express();
  app.use(
    createSeoRouter({
      sitemapBuilder: async () => {
        throw new Error("database unavailable");
      },
      routeLogger: { error() {} },
    })
  );

  const server = await listen(app);

  try {
    const response = await request(server, "/sitemap.xml");
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /^application\/xml; charset=utf-8/i);
    assert.match(body, new RegExp(`<loc>${SITEMAP_ORIGIN}<\\/loc>`));
  } finally {
    await close(server);
  }
});

test("frontend-owned book IDs stay synchronized with the sitemap constants", () => {
  const bookSource = fs.readFileSync(
    path.join(repositoryRoot, "App/src/data/booksData.js"),
    "utf8"
  );

  const bookSlugs = [
    ...bookSource.matchAll(/^\s+slug:\s*["']([^"']+)["'],$/gm),
  ].map((match) => match[1]);

  assert.deepEqual(bookSlugs, PUBLIC_BOOK_IDS);
});
