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
  description: "Upload the image displayed in the landing-page right sidebar.",
});

const LandingAdAdminResource = {
  resource: LandingAdModel,
  features: [feature],
  options: {
    id: "LandingAd",
    navigation: { name: "Content", icon: "Image" },
    listProperties: ["title", fields.fileProperty, "position", "isActive", "updatedAt"],
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
        description:
          "Optional. Use internal paths like /courses or plain domains like example.com, which will be saved as https://example.com.",
      },
      position: {
        type: "number",
        label: "Display order",
        description:
          "Lower numbers appear first in the landing page sidebar. Leave blank to place a new ad after the current last item.",
      },
      isActive: {
        type: "boolean",
      },
      ...propertyOptions,
    },
  },
};

export default LandingAdAdminResource;
