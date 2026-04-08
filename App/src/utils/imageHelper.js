import { resolveBackendPath } from "../api/config";

const trimSlashes = (value = "") => value.replace(/^\/+|\/+$/g, "");
const appendVersion = (url, record) => {
  if (!url || !record || /^data:/i.test(url)) {
    return url;
  }

  const version = record.updatedAt || record.createdAt;
  if (!version) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${encodeURIComponent(version)}`;
};

const mediaFolderMap = {
  blog: "blog",
  blogs: "blog",
  advertisement: "advertisement",
  advertisements: "advertisement",
  popup: "popup",
  popups: "popup",
  landing: "landing",
  landingads: "landing",
  college: "college",
  colleges: "college",
  university: "university",
  universities: "university",
};

export const getImageUrl = (imagePath, folder = "") => {
  if (!imagePath) return null;

  if (/^(?:https?:)?\/\//i.test(imagePath) || imagePath.startsWith("data:")) {
    return imagePath;
  }

  const cleanPath = trimSlashes(imagePath);
  const cleanFolder = trimSlashes(folder);
  if (imagePath.startsWith("/")) {
    return resolveBackendPath(imagePath);
  }

  const resolvedFolder = mediaFolderMap[cleanFolder] || cleanFolder;
  if (resolvedFolder) {
    return resolveBackendPath(`/media/${resolvedFolder}/${cleanPath.split("/").pop()}`);
  }

  return resolveBackendPath(cleanPath.startsWith("media/") ? `/${cleanPath}` : `/media/${cleanPath}`);
};

export const getImageFieldUrl = (record, fieldName, folder = "") => {
  if (!record || !fieldName) {
    return null;
  }

  return appendVersion(
    record[`${fieldName}Url`] || getImageUrl(record[fieldName], folder),
    record
  );
};

export const getImageList = (record, fieldName, folder = "") => {
  if (!record || !fieldName) {
    return [];
  }

  if (Array.isArray(record[`${fieldName}Urls`])) {
    return record[`${fieldName}Urls`]
      .filter(Boolean)
      .map((url) => appendVersion(url, record));
  }

  if (Array.isArray(record[fieldName])) {
    return record[fieldName]
      .map((imagePath) => appendVersion(getImageUrl(imagePath, folder), record))
      .filter(Boolean);
  }

  return [];
};
