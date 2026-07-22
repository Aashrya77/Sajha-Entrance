import SeoHashtagModel from "../../models/SeoHashtag.js";

export const normalizeSeoHashtag = (value) => {
  const normalized = String(value ?? "")
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}_-]/gu, "")
    .toLowerCase();

  return normalized ? `#${normalized}` : "";
};

const normalizeSeoHashtagPayload = async (request) => {
  if (request.method !== "post" || !request.payload) return request;

  return {
    ...request,
    payload: {
      ...request.payload,
      ...(request.payload.hashtag !== undefined
        ? { hashtag: normalizeSeoHashtag(request.payload.hashtag) }
        : {}),
    },
  };
};

export default {
  resource: SeoHashtagModel,
  options: {
    id: "SeoHashtag",
    navigation: { name: "SEO", icon: "Search" },
    sort: { sortBy: "hashtag", direction: "asc" },
    listProperties: ["hashtag", "isActive", "updatedAt"],
    editProperties: ["hashtag", "isActive"],
    showProperties: ["hashtag", "isActive", "createdAt", "updatedAt"],
    filterProperties: ["hashtag", "isActive"],
    actions: {
      new: { before: [normalizeSeoHashtagPayload] },
      edit: { before: [normalizeSeoHashtagPayload] },
    },
    properties: {
      hashtag: {
        isTitle: true,
        description: "Enter a keyword or hashtag. A leading # is added automatically.",
      },
      isActive: { type: "boolean" },
      createdAt: { isVisible: { list: false, show: true, edit: false, filter: false } },
      updatedAt: { isVisible: { list: true, show: true, edit: false, filter: false } },
    },
  },
};
