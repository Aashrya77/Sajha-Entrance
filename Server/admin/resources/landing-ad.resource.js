import LandingAdModel from "../../models/LandingAd.js";
import { createSingleImageUpload } from "./helpers/single-image-upload.js";

const {
  feature,
  fields,
  propertyOptions,
} = createSingleImageUpload({
  keyProperty: "adImage",
  propertyBase: "landingAdImage",
  label: "Landing ad image",
  entityName: "landing ad image",
  storageFolder: "landing",
  publicBaseUrl: "/media/landing",
  description: "Upload the image displayed in the landing-page ad slots.",
});

const LandingAdAdminResource = {
  resource: LandingAdModel,
  features: [feature],
  options: {
    id: "LandingAd",
    navigation: { name: "Content", icon: "Image" },
    listProperties: ["title", fields.fileProperty, "position", "isActive"],
    editProperties: ["title", fields.fileProperty, "adLink", "position", "isActive"],
    showProperties: [
      "title",
      fields.fileProperty,
      "adLink",
      "position",
      "isActive",
      "createdAt",
      "updatedAt",
    ],
    filterProperties: ["title", "position", "isActive"],
    properties: {
      title: {
        label: "Title",
        isTitle: true,
      },
      adLink: {
        label: "Target link",
      },
      position: {
        type: "number",
        availableValues: [
          { value: 1, label: "Ad Slot 1 (Top)" },
          { value: 2, label: "Ad Slot 2" },
          { value: 3, label: "Ad Slot 3" },
          { value: 4, label: "Ad Slot 4 (Bottom)" },
        ],
      },
      isActive: {
        type: "boolean",
      },
      ...propertyOptions,
    },
  },
};

export default LandingAdAdminResource;
