import AdvertisementModel, { ADVERTISEMENT_PAGES } from "../../models/Advertisement.js";
import { createSingleImageUpload } from "./helpers/single-image-upload.js";

const {
  feature,
  fields,
  propertyOptions,
} = createSingleImageUpload({
  keyProperty: "advertisementFile",
  propertyBase: "advertisementImage",
  label: "Advertisement image",
  entityName: "advertisement image",
  storageFolder: "advertisement",
  publicBaseUrl: "/media/advertisement",
  description: "Upload a small banner shown only on the selected public pages.",
});

const AdvertisementAdminResource = {
  resource: AdvertisementModel,
  features: [feature],
  options: {
    id: "Advertisement",
    navigation: { name: "Content", icon: "Image" },
    listProperties: ["advertisementName", fields.fileProperty, "displayPages", "isActive", "position"],
    editProperties: ["advertisementName", fields.fileProperty, "advertisementLink", "displayPages", "isActive", "position"],
    showProperties: ["advertisementName", fields.fileProperty, "advertisementLink", "displayPages", "isActive", "position"],
    filterProperties: ["advertisementName", "displayPages", "isActive"],
    properties: {
      advertisementName: {
        label: "Name",
        isTitle: true,
      },
      advertisementLink: {
        label: "Target link",
      },
      displayPages: {
        label: "Show on pages",
        availableValues: ADVERTISEMENT_PAGES.map((page) => ({
          value: page,
          label: page === "mock-tests" ? "Mock Tests" : page[0].toUpperCase() + page.slice(1),
        })),
      },
      isActive: {
        label: "Active",
      },
      position: {
        label: "Display order",
        description: "Lower numbers appear first.",
      },
      ...propertyOptions,
    },
  },
};

export default AdvertisementAdminResource;
