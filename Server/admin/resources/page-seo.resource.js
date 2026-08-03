import PageSeoModel from "../../models/PageSeo.js";

const normalizePageSeoPayload = async (request) => {
  if (request.method !== "post" || !request.payload) return request;

  const payload = { ...request.payload };

  if (payload.pagePath !== undefined) {
    payload.pagePath = String(payload.pagePath || "").trim();
    if (!payload.pagePath.startsWith("/")) {
      payload.pagePath = `/${payload.pagePath}`;
    }
    payload.pagePath = payload.pagePath.replace(/\/+$/, "") || "/";
  }

  return {
    ...request,
    payload,
  };
};

export default {
  resource: PageSeoModel,
  options: {
    id: "PageSeo",
    navigation: { name: "SEO", icon: "Search" },
    sort: { sortBy: "pagePath", direction: "asc" },
    listProperties: ["pagePath", "title", "isActive", "updatedAt"],
    editProperties: ["pagePath", "title", "description", "keywords", "robots", "canonicalUrl", "ogTitle", "ogDescription", "ogImage", "twitterCard", "isActive"],
    showProperties: ["pagePath", "title", "description", "keywords", "robots", "canonicalUrl", "ogTitle", "ogDescription", "ogImage", "twitterCard", "isActive", "createdAt", "updatedAt"],
    filterProperties: ["pagePath", "title", "isActive"],
    actions: {
      new: { before: [normalizePageSeoPayload] },
      edit: { before: [normalizePageSeoPayload] },
    },
    properties: {
      pagePath: {
        isTitle: true,
        description: "Use a route like /about or /contact. The path will be normalized automatically.",
      },
      title: {
        label: "Page title",
        description: "Recommended: 50-60 characters.",
      },
      description: {
        label: "Meta description",
        type: "textarea",
        description: "Recommended: 140-160 characters.",
      },
      keywords: {
        label: "Meta keywords",
        type: "textarea",
      },
      robots: {
        label: "Robots directive",
        description: "Example: index,follow or noindex,nofollow",
      },
      canonicalUrl: {
        label: "Canonical URL",
        description: "Optional absolute canonical URL.",
      },
      ogTitle: {
        label: "Social share title",
        description: "Optional. Falls back to the page title.",
      },
      ogDescription: {
        label: "Social share description",
        type: "textarea",
        description: "Optional. Falls back to the meta description.",
      },
      ogImage: {
        label: "Social share image URL",
        description: "Use an absolute URL for reliable social previews.",
      },
      twitterCard: {
        label: "Twitter card",
        availableValues: [
          { value: "summary_large_image", label: "Large image" },
          { value: "summary", label: "Summary" },
        ],
      },
      isActive: {
        type: "boolean",
      },
      createdAt: { isVisible: { list: false, show: true, edit: false, filter: false } },
      updatedAt: { isVisible: { list: true, show: true, edit: false, filter: false } },
    },
  },
};
