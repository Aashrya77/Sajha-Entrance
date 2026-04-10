import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const publicDirectory = path.join(__dirname, "../public");
export const mediaRootDirectory = path.join(publicDirectory, "media");

export const MEDIA_TYPES = Object.freeze({
  blog: "blog",
  advertisement: "advertisement",
  popup: "popup",
  landing: "landing",
  college: "college",
  university: "university",
  mocktest: "mocktest",
});

export const legacyMediaDirectories = Object.freeze({
  [MEDIA_TYPES.blog]: [
    path.join(publicDirectory, "blogs"),
    path.join(publicDirectory, "uploads", "blog"),
    path.join(publicDirectory, "uploads", "blogs"),
  ],
  [MEDIA_TYPES.advertisement]: [
    path.join(publicDirectory, "advertisements"),
    path.join(publicDirectory, "uploads", "advertisement"),
  ],
  [MEDIA_TYPES.popup]: [
    path.join(publicDirectory, "popups"),
    path.join(publicDirectory, "uploads", "popup"),
  ],
  [MEDIA_TYPES.landing]: [
    path.join(publicDirectory, "landingads"),
    path.join(publicDirectory, "uploads", "landing"),
  ],
  [MEDIA_TYPES.college]: [
    path.join(publicDirectory, "colleges"),
    path.join(publicDirectory, "uploads", "college"),
  ],
  [MEDIA_TYPES.university]: [
    path.join(publicDirectory, "universities"),
    path.join(publicDirectory, "uploads", "university"),
  ],
  [MEDIA_TYPES.mocktest]: [
    path.join(publicDirectory, "mocktest"),
    path.join(publicDirectory, "uploads", "mocktest"),
  ],
});

export const mediaFieldMaps = Object.freeze({
  blog: {
    blogImage: MEDIA_TYPES.blog,
  },
  advertisement: {
    advertisementFile: MEDIA_TYPES.advertisement,
  },
  popup: {
    popupImage: MEDIA_TYPES.popup,
  },
  landingAd: {
    adImage: MEDIA_TYPES.landing,
  },
  college: {
    collegeLogo: MEDIA_TYPES.college,
    collegeCover: MEDIA_TYPES.college,
    chairmanImage: MEDIA_TYPES.college,
    gallery: MEDIA_TYPES.college,
  },
  university: {
    universityLogo: MEDIA_TYPES.university,
    universityCover: MEDIA_TYPES.university,
    chancellorImage: MEDIA_TYPES.university,
    gallery: MEDIA_TYPES.university,
  },
});

export const getMediaPublicPath = (type, value = "") => {
  if (!value || typeof value !== "string") {
    return value || "";
  }

  if (/^(?:https?:)?\/\//i.test(value) || value.startsWith("data:")) {
    return value;
  }

  if (value.startsWith("/media/")) {
    return value;
  }

  const filename = path.basename(value.replace(/\\/g, "/"));
  return `/media/${type}/${filename}`;
};

export const hasMediaAsset = async (type, value = "") => {
  if (!value || typeof value !== "string") {
    return false;
  }

  if (/^(?:https?:)?\/\//i.test(value) || value.startsWith("data:")) {
    return true;
  }

  const filename = path.basename(value.replace(/\\/g, "/"));
  if (!filename) {
    return false;
  }

  const targetPath = path.join(mediaRootDirectory, type, filename);
  if (fs.existsSync(targetPath)) {
    return true;
  }

  const legacyFilePath = await findLegacyMediaFile(type, filename);
  return Boolean(legacyFilePath);
};

const toPlainObject = (record) => {
  if (!record) {
    return record;
  }

  if (typeof record.toObject === "function") {
    return record.toObject();
  }

  if (typeof record.toJSON === "function") {
    return record.toJSON();
  }

  return { ...record };
};

export const normalizeMediaFields = (record, fieldMap = {}) => {
  if (!record) {
    return record;
  }

  const normalizedRecord = toPlainObject(record);

  Object.entries(fieldMap).forEach(([fieldName, mediaType]) => {
    const currentValue = normalizedRecord[fieldName];

    if (Array.isArray(currentValue)) {
      const urls = currentValue.filter(Boolean).map((value) => getMediaPublicPath(mediaType, value));
      normalizedRecord[fieldName] = urls;
      normalizedRecord[`${fieldName}Urls`] = urls;
      return;
    }

    const url = currentValue ? getMediaPublicPath(mediaType, currentValue) : null;
    normalizedRecord[fieldName] = url;
    normalizedRecord[`${fieldName}Url`] = url;
  });

  return normalizedRecord;
};

export const normalizeCollectionMedia = (records, fieldMap = {}) =>
  Array.isArray(records) ? records.map((record) => normalizeMediaFields(record, fieldMap)) : [];

const findFileRecursive = async (directory, filename) => {
  if (!fs.existsSync(directory)) {
    return null;
  }

  const entries = await fs.promises.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isFile() && entry.name === filename) {
      return fullPath;
    }

    if (entry.isDirectory()) {
      const nestedMatch = await findFileRecursive(fullPath, filename);
      if (nestedMatch) {
        return nestedMatch;
      }
    }
  }

  return null;
};

export const findLegacyMediaFile = async (type, filename) => {
  const cleanFilename = path.basename(filename);
  const directories = legacyMediaDirectories[type] || [];

  for (const directory of directories) {
    const match = await findFileRecursive(directory, cleanFilename);
    if (match) {
      return match;
    }
  }

  return null;
};
