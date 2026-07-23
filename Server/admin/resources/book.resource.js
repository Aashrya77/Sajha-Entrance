import BookModel from "../../models/Book.js";
import { createSingleImageUpload } from "./helpers/single-image-upload.js";

const {
  feature,
  fields,
  propertyOptions,
} = createSingleImageUpload({
  keyProperty: "image",
  propertyBase: "bookImage",
  label: "Book cover",
  entityName: "book cover",
  storageFolder: "book",
  publicBaseUrl: "/media/book",
  description: "Upload the cover displayed on the bookstore and book detail page.",
});

const BookAdminResource = {
  resource: BookModel,
  features: [feature],
  options: {
    id: "Book",
    navigation: { name: "Book Store", icon: "Book" },
    sort: {
      sortBy: "sortOrder",
      direction: "asc",
    },
    listProperties: [
      "title",
      fields.fileProperty,
      "category",
      "price",
      "inStock",
      "isActive",
      "sortOrder",
    ],
    editProperties: [
      "title",
      fields.fileProperty,
      "category",
      "price",
      "originalPrice",
      "discount",
      "rating",
      "reviews",
      "description",
      "features",
      "inStock",
      "isActive",
      "sortOrder",
    ],
    showProperties: [
      "title",
      "slug",
      fields.fileProperty,
      "category",
      "price",
      "originalPrice",
      "discount",
      "rating",
      "reviews",
      "description",
      "features",
      "inStock",
      "isActive",
      "sortOrder",
      "createdAt",
      "updatedAt",
    ],
    filterProperties: ["title", "category", "inStock", "isActive"],
    properties: {
      title: {
        isTitle: true,
      },
      slug: {
        isVisible: { list: false, filter: false, show: true, edit: false },
      },
      description: {
        type: "textarea",
      },
      features: {
        description: "Add each key feature as a separate item.",
      },
      sortOrder: {
        description: "Lower numbers appear first.",
      },
      ...propertyOptions,
    },
  },
};

export default BookAdminResource;
