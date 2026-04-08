import BlogModel from "../../models/Blog.js";
import { createSingleImageUpload } from "./helpers/single-image-upload.js";

const {
  feature,
  fields,
  propertyOptions,
} = createSingleImageUpload({
  keyProperty: "blogImage",
  propertyBase: "blogImage",
  label: "Featured image",
  entityName: "blog image",
  storageFolder: "blog",
  publicBaseUrl: "/media/blog",
  description: "Upload the cover image used on the blog cards and detail page.",
});

const BlogAdminResource = {
  resource: BlogModel,
  features: [feature],
  options: {
    id: "Blog",
    navigation: { name: "Content", icon: "Document" },
    listProperties: ["blogTitle", fields.fileProperty, "createdAt"],
    editProperties: [
      "blogTitle",
      fields.fileProperty,
      "blogDescriptionUnformatted",
      "blogDescriptionFormatted",
    ],
    showProperties: [
      "blogTitle",
      fields.fileProperty,
      "blogDescriptionUnformatted",
      "blogDescriptionFormatted",
      "createdAt",
    ],
    filterProperties: ["blogTitle", "createdAt"],
    properties: {
      blogTitle: {
        label: "Title",
        isTitle: true,
      },
      blogDescriptionUnformatted: {
        label: "Short description",
        type: "textarea",
      },
      blogDescriptionFormatted: {
        label: "Content",
        type: "richtext",
      },
      ...propertyOptions,
    },
  },
};
export default BlogAdminResource;
