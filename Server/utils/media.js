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
