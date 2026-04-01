import PopupModel from "../../models/Popup.js";
import { createSingleImageUpload } from "./helpers/single-image-upload.js";

const {
  feature,
  fields,
  propertyOptions,
} = createSingleImageUpload({
  keyProperty: "popupImage",
  propertyBase: "popupImage",
  label: "Popup image",
  entityName: "popup image",
  storageFolder: "popup",
  publicBaseUrl: "/popups",
  description: "Used when the popup type is set to Image.",
});

const PopupAdminResource = {
  resource: PopupModel,
  features: [feature],
  options: {
    id: "Popup",
    navigation: { name: "Content", icon: "Image" },
    listProperties: ["popupTitle", "popupType", fields.fileProperty, "isActive", "updatedAt"],
    editProperties: [
      "popupTitle",
      "popupType",
      fields.fileProperty,
      "popupText",
      "popupHeading",
      "popupDescription",
      "redirectUrl",
      "buttonText",
      "isActive",
      "displayDelay",
      "showOncePerSession",
    ],
    showProperties: [
      "popupTitle",
      "popupType",
      fields.fileProperty,
      "popupText",
      "popupHeading",
      "popupDescription",
      "redirectUrl",
      "buttonText",
      "isActive",
      "displayDelay",
      "showOncePerSession",
      "createdAt",
      "updatedAt",
    ],
    filterProperties: ["popupTitle", "popupType", "isActive"],
    properties: {
      popupTitle: {
        label: "Title",
        isTitle: true,
      },
      popupType: {
        label: "Popup type",
        availableValues: [
          { value: "image", label: "Image Popup" },
          { value: "text", label: "Text Popup" },
        ],
      },
      popupText: {
        label: "Text content",
        type: "textarea",
      },
      popupHeading: {
        label: "Heading",
      },
      popupDescription: {
        label: "Description",
        type: "textarea",
      },
      redirectUrl: {
        label: "Redirect URL",
      },
      buttonText: {
        label: "Button text",
      },
      isActive: {
        type: "boolean",
      },
      displayDelay: {
        type: "number",
        description: "Delay in milliseconds before showing the popup.",
      },
      showOncePerSession: {
        type: "boolean",
        description: "Show the popup only once per browser session.",
      },
      ...propertyOptions,
    },
  },
};

export default PopupAdminResource;
