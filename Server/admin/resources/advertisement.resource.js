import AdvertisementModel from "../../models/Advertisement.js";
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
  description: "Upload the creative shown across the public pages.",
});

const AdvertisementAdminResource = {
  resource: AdvertisementModel,
  features: [feature],
  options: {
    id: "Advertisement",
    navigation: { name: "Content", icon: "Image" },
    listProperties: ["advertisementName", fields.fileProperty, "advertisementLink"],
    editProperties: ["advertisementName", fields.fileProperty, "advertisementLink"],
    showProperties: ["advertisementName", fields.fileProperty, "advertisementLink"],
    filterProperties: ["advertisementName"],
    properties: {
      advertisementName: {
        label: "Name",
        isTitle: true,
      },
      advertisementLink: {
        label: "Target link",
      },
      ...propertyOptions,
    },
  },
};

export default AdvertisementAdminResource;
