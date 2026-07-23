import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import {
  deleteQuestionBankCloudinaryFile,
  isCloudinaryQuestionBankEnabled,
  uploadQuestionBankBuffer,
} from "./cloudinaryQuestionBank.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const questionBankStorageDirectory = path.join(__dirname, "../storage/question-bank");

const RESOURCE_MIME_TYPES_BY_EXTENSION = Object.freeze({
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
});

const normalizeStorageKey = (value = "") =>
  String(value || "")
    .replace(/\\/g, "/")
    .split("/")
    .map((segment) => path.basename(segment))
    .filter((segment) => segment && segment !== "." && segment !== "..")
    .join("/");

const resolveQuestionBankStoragePath = (key = "") => {
  const normalizedKey = normalizeStorageKey(key);
  if (!normalizedKey) {
    return null;
  }

  const resolvedRoot = path.resolve(questionBankStorageDirectory);
  const resolvedPath = path.resolve(questionBankStorageDirectory, ...normalizedKey.split("/"));

  if (resolvedPath !== resolvedRoot && resolvedPath.startsWith(`${resolvedRoot}${path.sep}`)) {
    return resolvedPath;
  }

  return null;
};

const ensureQuestionBankStorage = async () => {
  await fs.promises.mkdir(questionBankStorageDirectory, { recursive: true });
};

const slugifyFilename = (filename = "") =>
  String(filename || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

const getUploadExtension = (file = {}, fallback = ".bin") => {
  const extension = path
    .extname(file.originalname || file.originalFilename || file.name || "")
    .toLowerCase();

  return extension || fallback;
};

const buildQuestionBankUploadKey = (prefix, originalName = "", fallbackExtension = ".bin") => {
  const parsedName = path.parse(originalName || "").name;
  const extension = path.extname(originalName || "").toLowerCase() || fallbackExtension;
  const safeName = slugifyFilename(parsedName) || "question-resource";
  const uniqueSuffix = crypto.randomBytes(4).toString("hex");

  return `${Date.now()}-${uniqueSuffix}-${slugifyFilename(prefix) || "resource"}-${safeName}${extension}`;
};

const getUploadedFileBuffer = async (file = {}) => {
  if (file?.buffer) {
    return file.buffer;
  }

  const temporaryPath = file?.filepath || file?.path || file?.tempFilePath;
  if (!temporaryPath) {
    return null;
  }

  try {
    return await fs.promises.readFile(temporaryPath);
  } finally {
    await fs.promises.unlink(temporaryPath).catch(() => null);
  }
};

const saveQuestionBankResourceFile = async (file, prefix = "resource") => {
  const buffer = await getUploadedFileBuffer(file);
  if (!buffer) {
    return "";
  }

  await ensureQuestionBankStorage();

  const originalName = file.originalname || file.originalFilename || file.name || "";
  const key = buildQuestionBankUploadKey(prefix, originalName, getUploadExtension(file));

  if (isCloudinaryQuestionBankEnabled()) {
    return uploadQuestionBankBuffer(buffer, key);
  }

  const targetPath = resolveQuestionBankStoragePath(key);

  if (!targetPath) {
    throw new Error("Invalid upload filename.");
  }

  await fs.promises.writeFile(targetPath, buffer);
  return key;
};

const deleteQuestionBankResourceFile = async (key = "") => {
  const targetPath = resolveQuestionBankStoragePath(key);

  if (
    isCloudinaryQuestionBankEnabled() &&
    (/^https:\/\/res\.cloudinary\.com\//i.test(key) ||
      !targetPath ||
      !fs.existsSync(targetPath))
  ) {
    await deleteQuestionBankCloudinaryFile(key);
    return;
  }

  if (targetPath && fs.existsSync(targetPath)) {
    await fs.promises.unlink(targetPath);
  }
};

const getQuestionBankResourceMimeType = (key = "") =>
  RESOURCE_MIME_TYPES_BY_EXTENSION[path.extname(key).toLowerCase()] ||
  "application/octet-stream";

const buildSearchFilenameVariants = (value = "") => {
  const filename = path.basename(String(value || "").replace(/\\/g, "/"));
  if (!filename) {
    return [];
  }

  const parsed = path.parse(filename);
  const extension = parsed.ext.toLowerCase();
  const slugifiedName = slugifyFilename(parsed.name);

  return [
    filename,
    filename.toLowerCase(),
    slugifiedName ? `${slugifiedName}${extension}` : "",
  ].filter(Boolean);
};

const findQuestionBankStorageFile = async (
  values = [],
  { extensions = [], size = null, allowSingleMatchFallback = false } = {}
) => {
  const filenames = new Set(
    values
      .flat()
      .flatMap(buildSearchFilenameVariants)
      .map((filename) => filename.toLowerCase())
      .filter(Boolean)
  );

  const allowedExtensions = new Set(
    extensions
      .map((extension) => String(extension || "").toLowerCase())
      .filter(Boolean)
  );
  const expectedSize = Number(size || 0);

  if (!fs.existsSync(questionBankStorageDirectory)) {
    return null;
  }

  const matchesFilename = (filename = "") => {
    const lowerFilename = filename.toLowerCase();
    return Array.from(filenames).some(
      (candidate) =>
        lowerFilename === candidate || lowerFilename.endsWith(`-${candidate}`)
    );
  };

  const matchesExtension = (filename = "") =>
    !allowedExtensions.size ||
    allowedExtensions.has(path.extname(filename).toLowerCase());

  const extensionMatches = [];

  const searchDirectory = async (directory) => {
    const entries = await fs.promises.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isFile() && matchesExtension(entry.name)) {
        extensionMatches.push(fullPath);

        if (filenames.size && matchesFilename(entry.name)) {
          return fullPath;
        }

        if (expectedSize > 0) {
          const stats = await fs.promises.stat(fullPath);
          if (stats.size === expectedSize) {
            return fullPath;
          }
        }
      }

      if (entry.isDirectory()) {
        const nestedMatch = await searchDirectory(fullPath);
        if (nestedMatch) {
          return nestedMatch;
        }
      }
    }

    return null;
  };

  const directMatch = await searchDirectory(questionBankStorageDirectory);
  if (directMatch) {
    return directMatch;
  }

  if (allowSingleMatchFallback && extensionMatches.length === 1) {
    return extensionMatches[0];
  }

  return null;
};

const detectPdfPageCountFromKey = async (key = "") => {
  const filePath = resolveQuestionBankStoragePath(key);
  if (!filePath || !fs.existsSync(filePath)) {
    return 0;
  }

  try {
    const buffer = await fs.promises.readFile(filePath);
    const text = buffer.toString("latin1");
    const matches = text.match(/\/Type\s*\/Page\b/g);

    return matches?.length || 0;
  } catch (_error) {
    return 0;
  }
};

export {
  buildQuestionBankUploadKey,
  deleteQuestionBankResourceFile,
  detectPdfPageCountFromKey,
  findQuestionBankStorageFile,
  getQuestionBankResourceMimeType,
  normalizeStorageKey,
  questionBankStorageDirectory,
  resolveQuestionBankStoragePath,
  saveQuestionBankResourceFile,
};
