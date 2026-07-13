import TopCollegeSectionModel from "../../models/TopCollegeSection.js";
import { createMultipleImageUpload } from "./helpers/single-image-upload.js";

export const TOP_COLLEGE_IMAGE_DIMENSIONS = Object.freeze({ width: 300, height: 120 });

const logoUpload = createMultipleImageUpload({
  keyProperty: "topCollegeImages",
  propertyBase: "topCollegeImage",
  label: "College logos",
  entityName: "college logo",
  storageFolder: "top-college",
  publicBaseUrl: "/media/top-college",
  uploadPathLabel: "/public/media/top-college",
  dimensions: TOP_COLLEGE_IMAGE_DIMENSIONS,
  maxSize: 1024 * 1024,
  description:
    "Upload one or more 300 x 120 px logo images. Preview, remove, or drag the cards to control their homepage order.",
});

const TopCollegeSectionAdminResource = {
  resource: TopCollegeSectionModel,
  features: [logoUpload.feature],
  options: {
    id: "TopCollegeSection",
    navigation: { name: "Content", icon: "Image" },
    listProperties: ["title", logoUpload.fields.fileProperty, "isActive", "updatedAt"],
    editProperties: ["title", logoUpload.fields.fileProperty, "isActive"],
    showProperties: [
      "title",
      logoUpload.fields.fileProperty,
      "isActive",
      "createdAt",
      "updatedAt",
    ],
    actions: {
      ...logoUpload.actionHooks,
    },
    properties: {
      title: {
        isTitle: true,
        description: "Heading displayed above the college logos on the homepage.",
      },
      isActive: {
        type: "boolean",
        description: "Turn this off to hide the complete Top Colleges logo section.",
      },
      sectionKey: {
        isVisible: false,
      },
      ...logoUpload.propertyOptions,
    },
  },
};

export default TopCollegeSectionAdminResource;
