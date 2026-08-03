import UniversityModel from "../../models/University.js";
import {
  createMultipleImageUpload,
  createPrefixedUploadPath,
  createSingleImageUpload,
} from "./helpers/single-image-upload.js";

const logoUpload = createSingleImageUpload({
  keyProperty: "universityLogo",
  propertyBase: "universityLogo",
  label: "University logo",
  entityName: "university logo",
  storageFolder: "university",
  publicBaseUrl: "/media/university",
  uploadPathLabel: "/public/media/university",
  uploadPath: createPrefixedUploadPath("logo"),
  description: "Upload the logo shown on university listings and the university detail page.",
});

const coverUpload = createSingleImageUpload({
  keyProperty: "universityCover",
  propertyBase: "universityCover",
  label: "Banner / cover image",
  entityName: "university banner",
  storageFolder: "university",
  publicBaseUrl: "/media/university",
  uploadPathLabel: "/public/media/university",
  uploadPath: createPrefixedUploadPath("cover"),
  description: "Upload the banner used at the top of the university detail page.",
});

const chancellorUpload = createSingleImageUpload({
  keyProperty: "chancellorImage",
  propertyBase: "chancellorImage",
  label: "Chancellor image",
  entityName: "chancellor image",
  storageFolder: "university",
  publicBaseUrl: "/media/university",
  uploadPathLabel: "/public/media/university",
  uploadPath: createPrefixedUploadPath("chancellor"),
  description: "Upload the portrait displayed with the chancellor information.",
});

const viceChancellorUpload = createSingleImageUpload({
  keyProperty: "viceChancellorImage",
  propertyBase: "viceChancellorImage",
  label: "Vice Chancellor image",
  entityName: "vice chancellor image",
  storageFolder: "university",
  publicBaseUrl: "/media/university",
  uploadPathLabel: "/public/media/university",
  uploadPath: createPrefixedUploadPath("vice-chancellor"),
  description: "Upload the portrait displayed with the vice chancellor information.",
});

const galleryUpload = createMultipleImageUpload({
  keyProperty: "gallery",
  propertyBase: "gallery",
  label: "University gallery",
  entityName: "university gallery image",
  storageFolder: "university",
  publicBaseUrl: "/media/university",
  uploadPathLabel: "/public/media/university",
  uploadPath: createPrefixedUploadPath("gallery"),
  description:
    "Upload multiple campus images. Preview, remove, and reorder them before saving.",
});

const UniversityAdminResource = {
  resource: UniversityModel,
  features: [
    logoUpload.feature,
    coverUpload.feature,
    chancellorUpload.feature,
    viceChancellorUpload.feature,
    galleryUpload.feature,
  ],
  options: {
    id: "University",
    listProperties: [
      "universityName",
      "universityAddress",
      "type",
      logoUpload.fields.fileProperty,
      "establishedYear",
    ],
    editProperties: [
      "universityName",
      "universityAddress",
      "universityPhone",
      "universityEmail",
      "establishedYear",
      "website",
      "type",
      logoUpload.fields.fileProperty,
      coverUpload.fields.fileProperty,
      "admissionNotice",
      "admissionCloseDate",
      "overview",
      "admissionGuidelines",
      "scholarshipInfo",
      "messageFromChancellor",
      "chancellorName",
      "chancellorMessage",
      chancellorUpload.fields.fileProperty,
      "viceChancellorName",
      "viceChancellorMessage",
      viceChancellorUpload.fields.fileProperty,
      "keyFeatures",
      galleryUpload.fields.fileProperty,
      "googleMapUrl",
      "videos",
      "coursesOffered",
      "affiliatedColleges",
    ],
    showProperties: [
      "universityName",
      "universityAddress",
      "universityPhone",
      "universityEmail",
      "establishedYear",
      "website",
      "type",
      logoUpload.fields.fileProperty,
      coverUpload.fields.fileProperty,
      "admissionNotice",
      "admissionCloseDate",
      "overview",
      "admissionGuidelines",
      "scholarshipInfo",
      "messageFromChancellor",
      "chancellorName",
      "chancellorMessage",
      chancellorUpload.fields.fileProperty,
      "viceChancellorName",
      "viceChancellorMessage",
      viceChancellorUpload.fields.fileProperty,
      "keyFeatures",
      galleryUpload.fields.fileProperty,
      "googleMapUrl",
      "videos",
      "coursesOffered",
      "affiliatedColleges",
      "createdAt",
      "updatedAt",
    ],
    filterProperties: ["universityName", "universityAddress", "type", "establishedYear"],
    actions: {
      ...galleryUpload.actionHooks,
    },
    properties: {
      universityName: {
        type: "string",
        isTitle: true,
      },
      universityAddress: {
        type: "string",
      },
      universityPhone: {
        type: "string",
      },
      universityEmail: {
        type: "string",
      },
      establishedYear: {
        type: "number",
      },
      website: {
        type: "string",
      },
      type: {
        type: "string",
        availableValues: [
          { value: "Public", label: "Public" },
          { value: "Private", label: "Private" },
          { value: "Deemed", label: "Deemed" },
          { value: "Autonomous", label: "Autonomous" },
        ],
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
      messageFromChancellor: {
        type: "richtext",
      },
      chancellorName: {
        type: "string",
      },
      chancellorMessage: {
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
      affiliatedColleges: {
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
      ...chancellorUpload.propertyOptions,
      ...viceChancellorUpload.propertyOptions,
      ...galleryUpload.propertyOptions,
    },
  },
};

export default UniversityAdminResource;
