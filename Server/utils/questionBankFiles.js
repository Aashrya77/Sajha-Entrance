import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

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
  const targetPath = resolveQuestionBankStoragePath(key);

  if (!targetPath) {
    throw new Error("Invalid upload filename.");
  }

  await fs.promises.writeFile(targetPath, buffer);
  return key;
};

const deleteQuestionBankResourceFile = async (key = "") => {
  const targetPath = resolveQuestionBankStoragePath(key);

  if (targetPath && fs.existsSync(targetPath)) {
    await fs.promises.unlink(targetPath);
  }
};

const getQuestionBankResourceMimeType = (key = "") =>
  RESOURCE_MIME_TYPES_BY_EXTENSION[path.extname(key).toLowerCase()] ||
  "application/octet-stream";

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
  getQuestionBankResourceMimeType,
  normalizeStorageKey,
  questionBankStorageDirectory,
  resolveQuestionBankStoragePath,
  saveQuestionBankResourceFile,
};
