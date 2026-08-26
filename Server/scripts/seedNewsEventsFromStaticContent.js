import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import connectDB from "../db/connectDB.js";
import EventModel from "../models/Event.js";
import NewsModel from "../models/News.js";
import { sanitizeRichHtml } from "../utils/htmlSanitizer.js";
import { mediaRootDirectory } from "../utils/media.js";
import { slugify } from "../utils/slug.js";
import {
  STATIC_EVENTS,
  STATIC_NEWS_ITEMS,
} from "../../App/src/data/staticNewsEvents.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repositoryRoot = path.resolve(__dirname, "../..");
const appPublicDirectory = path.join(repositoryRoot, "App", "public");

const args = new Set(process.argv.slice(2));
const shouldApply = args.has("--apply");
const productionConfirmed = args.has("--confirm-production");
const isProduction = process.env.NODE_ENV === "production";

const toParagraphHtml = (paragraphs = []) =>
  sanitizeRichHtml(
    paragraphs
      .filter(Boolean)
      .map((paragraph) => `<p>${String(paragraph)}</p>`)
      .join("\n")
  );

const toEventHtml = (event) => {
  const sections = [...(event.content || []).map((paragraph) => `<p>${paragraph}</p>`)];

  if (Array.isArray(event.highlights) && event.highlights.length) {
    sections.push("<h2>What this event includes</h2>");
    sections.push(`<ul>${event.highlights.map((item) => `<li>${item}</li>`).join("")}</ul>`);
  }

  if (Array.isArray(event.audience) && event.audience.length) {
    sections.push("<h2>Who should attend</h2>");
    sections.push(`<ul>${event.audience.map((item) => `<li>${item}</li>`).join("")}</ul>`);
  }

  return sanitizeRichHtml(sections.join("\n"));
};

const resolveStaticAsset = (publicPath = "") => {
  const normalizedPath = String(publicPath || "").replace(/^\/+/, "");
  return normalizedPath ? path.join(appPublicDirectory, ...normalizedPath.split("/")) : "";
};

const copyStaticAsset = async ({ publicPath, legacyId, mediaType }) => {
  const sourcePath = resolveStaticAsset(publicPath);
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    return { key: "", copied: false, missing: Boolean(publicPath), sourcePath };
  }

  const extension = path.extname(sourcePath).toLowerCase() || ".jpg";
  const key = `${slugify(legacyId)}${extension}`;
  const targetDirectory = path.join(mediaRootDirectory, mediaType);
  const targetPath = path.join(targetDirectory, key);
  const exists = fs.existsSync(targetPath);

  if (shouldApply && !exists) {
    await fs.promises.mkdir(targetDirectory, { recursive: true });
    await fs.promises.copyFile(sourcePath, targetPath);
  }

  return { key, copied: shouldApply && !exists, missing: false, sourcePath, targetPath };
};

const buildNewsPayload = async (item) => {
  const image = await copyStaticAsset({
    publicPath: item.image,
    legacyId: item.id,
    mediaType: "news",
  });

  return {
    title: item.title,
    slug: slugify(item.id || item.title),
    legacyId: item.id,
    excerpt: item.excerpt,
    content: toParagraphHtml(item.content),
    featuredImage: image.key,
    imageAlt: item.title,
    category: item.category || "General",
    status: "published",
    featured: false,
    publishAt: new Date(item.createdAt),
    publishedAt: new Date(item.createdAt),
  };
};

const buildEventPayload = async (item) => {
  const image = await copyStaticAsset({
    publicPath: item.image,
    legacyId: item.id,
    mediaType: "event",
  });

  return {
    title: item.title,
    slug: slugify(item.id || item.title),
    legacyId: item.id,
    excerpt: item.summary,
    content: toEventHtml(item),
    featuredImage: image.key,
    imageAlt: item.title,
    category: item.category || item.label || "General",
    startAt: new Date(item.startAt),
    endAt: new Date(item.endAt),
    venue: item.venue || "",
    organizer: item.organizer || "",
    status: "published",
    featured: false,
    publishAt: null,
    publishedAt: new Date("2026-04-26T00:00:00.000Z"),
  };
};

const seedCollection = async ({ label, model, items, buildPayload }) => {
  const summary = {
    label,
    totalStatic: items.length,
    wouldCreate: 0,
    created: 0,
    skippedExisting: 0,
    errors: [],
  };

  for (const item of items) {
    const slug = slugify(item.id || item.title);
    const existingRecord = await model
      .findOne({ $or: [{ legacyId: item.id }, { slug }] })
      .select("_id title slug legacyId")
      .lean();

    if (existingRecord) {
      summary.skippedExisting += 1;
      continue;
    }

    summary.wouldCreate += 1;

    if (!shouldApply) {
      continue;
    }

    try {
      await model.create(await buildPayload(item));
      summary.created += 1;
    } catch (error) {
      summary.errors.push({
        legacyId: item.id,
        message: error.message,
      });
    }
  }

  return summary;
};

const run = async () => {
  if (isProduction && shouldApply && !productionConfirmed) {
    throw new Error(
      "Production import requires both --apply and --confirm-production after reviewing dry-run output."
    );
  }

  await connectDB();

  const summaries = [
    await seedCollection({
      label: "News",
      model: NewsModel,
      items: STATIC_NEWS_ITEMS,
      buildPayload: buildNewsPayload,
    }),
    await seedCollection({
      label: "Events",
      model: EventModel,
      items: STATIC_EVENTS,
      buildPayload: buildEventPayload,
    }),
  ];

  console.log(
    JSON.stringify(
      {
        mode: shouldApply ? "apply" : "dry-run",
        production: isProduction,
        summaries,
        note: shouldApply
          ? "Import finished. Existing records were not overwritten."
          : "Dry-run only. Re-run with --apply after reviewing this summary.",
      },
      null,
      2
    )
  );
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}

export { buildEventPayload, buildNewsPayload, seedCollection, toEventHtml, toParagraphHtml };
