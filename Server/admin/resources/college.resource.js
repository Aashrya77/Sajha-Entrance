import CollegeModel from "../../models/College.js";
import {
  createMultipleImageUpload,
  createPrefixedUploadPath,
  createSingleImageUpload,
} from "./helpers/single-image-upload.js";

const logoUpload = createSingleImageUpload({
  keyProperty: "collegeLogo",
  propertyBase: "collegeLogo",
  label: "College logo",
  entityName: "college logo",
  storageFolder: "college",
  publicBaseUrl: "/media/college",
  uploadPathLabel: "/public/media/college",
  uploadPath: createPrefixedUploadPath("logo"),
  description: "Upload the logo shown on cards, listings, and college detail pages.",
});

const coverUpload = createSingleImageUpload({
  keyProperty: "collegeCover",
  propertyBase: "collegeCover",
  label: "Cover image",
  entityName: "cover image",
  storageFolder: "college",
  publicBaseUrl: "/media/college",
  uploadPathLabel: "/public/media/college",
  uploadPath: createPrefixedUploadPath("cover"),
  description: "Upload the hero image used at the top of the college detail page.",
});

const chairmanUpload = createSingleImageUpload({
  keyProperty: "chairmanImage",
  propertyBase: "chairmanImage",
  label: "Chairman image",
  entityName: "chairman image",
  storageFolder: "college",
  publicBaseUrl: "/media/college",
  uploadPathLabel: "/public/media/college",
  uploadPath: createPrefixedUploadPath("chairman"),
  description: "Upload the portrait displayed alongside the chairman message.",
});

const viceChancellorUpload = createSingleImageUpload({
  keyProperty: "viceChancellorImage",
  propertyBase: "viceChancellorImage",
  label: "Vice Chancellor image",
  entityName: "vice chancellor image",
  storageFolder: "college",
  publicBaseUrl: "/media/college",
  uploadPathLabel: "/public/media/college",
  uploadPath: createPrefixedUploadPath("vice-chancellor"),
  description: "Upload the portrait displayed with the vice chancellor information.",
});

const galleryUpload = createMultipleImageUpload({
  keyProperty: "gallery",
  propertyBase: "gallery",
  label: "Gallery",
  entityName: "gallery image",
  storageFolder: "college",
  publicBaseUrl: "/media/college",
  uploadPathLabel: "/public/media/college",
  uploadPath: createPrefixedUploadPath("gallery"),
  description:
    "Upload multiple campus images. Thumbnails can be previewed, removed, and reordered before saving.",
});

const CollegeAdminResource = {
  resource: CollegeModel,
  features: [
    logoUpload.feature,
    coverUpload.feature,
    chairmanUpload.feature,
    viceChancellorUpload.feature,
    galleryUpload.feature,
  ],
  options: {
    id: "College",
    listProperties: [
      "collegeName",
      "collegeAddress",
      "universityName",
      logoUpload.fields.fileProperty,
      "establishedYear",
    ],
    editProperties: [
      "collegeName",
      "collegeAddress",
      "collegePhone",
      "collegeEmail",
      "universityName",
      "establishedYear",
      "website",
      logoUpload.fields.fileProperty,
      coverUpload.fields.fileProperty,
      "admissionNotice",
      "admissionCloseDate",
      "overview",
      "admissionGuidelines",
      "scholarshipInfo",
      "messageFromChairman",
      "chairmanName",
      "chairmanMessage",
      chairmanUpload.fields.fileProperty,
      "viceChancellorName",
      "viceChancellorMessage",
      viceChancellorUpload.fields.fileProperty,
      "keyFeatures",
      galleryUpload.fields.fileProperty,
      "googleMapUrl",
      "videos",
      "coursesOffered",
    ],
    showProperties: [
      "collegeName",
      "collegeAddress",
      "collegePhone",
      "collegeEmail",
      "universityName",
      "establishedYear",
      "website",
      logoUpload.fields.fileProperty,
      coverUpload.fields.fileProperty,
      "admissionNotice",
      "admissionCloseDate",
      "overview",
      "admissionGuidelines",
      "scholarshipInfo",
      "messageFromChairman",
      "chairmanName",
      "chairmanMessage",
      chairmanUpload.fields.fileProperty,
      "viceChancellorName",
      "viceChancellorMessage",
      viceChancellorUpload.fields.fileProperty,
      "keyFeatures",
      galleryUpload.fields.fileProperty,
      "googleMapUrl",
      "videos",
      "coursesOffered",
      "createdAt",
      "updatedAt",
    ],
    filterProperties: ["collegeName", "collegeAddress", "universityName", "establishedYear"],
    actions: {
      ...galleryUpload.actionHooks,
    },
    properties: {
      collegeName: {
        type: "string",
        isTitle: true,
      },
      collegeAddress: {
        type: "string",
      },
      collegePhone: {
        type: "string",
      },
      collegeEmail: {
        type: "string",
      },
      universityName: {
        type: "string",
      },
      establishedYear: {
        type: "number",
      },
      website: {
        type: "string",
      },
      admissionNotice: {
        type: "textarea",
      },
      admissionCloseDate: {
        type: "date",
      },
      overview: {
        type: "richtext",
      },
      admissionGuidelines: {
        type: "richtext",
      },
      scholarshipInfo: {
        type: "richtext",
      },
      messageFromChairman: {
        type: "richtext",
      },
      chairmanName: {
        type: "string",
      },
      chairmanMessage: {
        type: "richtext",
      },
      viceChancellorName: {
        type: "string",
        label: "Vice Chancellor name",
      },
      viceChancellorMessage: {
        type: "richtext",
        label: "Vice Chancellor message",
      },
      keyFeatures: {
        type: "textarea",
      },
      googleMapUrl: {
        type: "string",
      },
      videos: {
        type: "textarea",
      },
      coursesOffered: {
        type: "reference",
      },
      createdAt: {
        isVisible: { list: false, filter: false, show: true, edit: false },
      },
      updatedAt: {
        isVisible: { list: false, filter: false, show: true, edit: false },
      },
      ...logoUpload.propertyOptions,
      ...coverUpload.propertyOptions,
      ...chairmanUpload.propertyOptions,
      ...viceChancellorUpload.propertyOptions,
      ...galleryUpload.propertyOptions,
    },
  },
};

export default CollegeAdminResource;
