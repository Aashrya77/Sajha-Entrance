import { createRequire } from "module";

const require = createRequire(import.meta.url);
const adminJsEnTranslations = require("../../node_modules/adminjs/lib/locale/en/translation.json");

const adminNavigationLabels = Object.freeze({
  Administration: "Administration",
  Content: "Content",
  Students: "Students",
  Classes: "Classes",
  Payments: "Payments",
  "Exam Results": "Exam Results",
  "Mock Test Management": "Mock Test Management",
  "Book Orders": "Book Orders",
  Inquiries: "Inquiries",
});

const adminResourceLabels = Object.freeze({
  AdminUser: "Admin Users",
  AdminNotification: "Notifications",
  Blog: "Blogs",
  Notice: "Notices",
  Advertisement: "Advertisements",
  College: "Colleges",
  University: "Universities",
  LandingAd: "Landing Ads",
  MockTestCourse: "Mock Test Courses",
  MockTestSubject: "Mock Test Subjects",
  MockQuestion: "Mock Questions",
  MockTest: "Mock Tests",
  MockTestAttempt: "Mock Test Attempts",
  Course: "Courses",
  Newsletter: "Newsletter Subscribers",
  Contact: "Contact Messages",
  Popup: "Popups",
  Student: "Students",
  OnlineClass: "Online Classes",
  RecordedClass: "Recorded Classes",
  ResultExam: "Result Sets",
  StudentResult: "Imported Results",
  Payment: "Payments",
  BookOrder: "Book Orders",
  Inquiry: "Inquiries",
});

const adminActionLabelOverrides = Object.freeze({
  markAsRead: "Mark as read",
});

const adminMessageTranslations = Object.freeze({
  "This will remove the exam and all imported results under it. Do you want to continue?":
    "This will remove the exam and all imported results under it. Do you want to continue?",
  "Exam record could not be resolved.": "Exam record could not be resolved.",
  "Exam and related result set deleted successfully.":
    "Exam and related result set deleted successfully.",
  "Mark this notification as read?": "Mark this notification as read?",
  "Notification record not found.": "Notification record not found.",
  "Notification marked as read.": "Notification marked as read.",
  "Delete this mock test? Existing student attempts will remain for audit history.":
    "Delete this mock test? Existing student attempts will remain for audit history.",
  "Enter the course name. The slug will be generated automatically.":
    "Enter the course name. The slug will be generated automatically.",
  "Enter the subject name. The slug will be generated automatically.":
    "Enter the subject name. The slug will be generated automatically.",
});

const adminLabelTranslations = Object.freeze({
  "sajha-web": "Sajha Web",
  "course.BSc.CSIT": "BSc.CSIT",
  "course.CSIT": "CSIT",
  "course.BIT": "BIT",
  "course.BCA": "BCA",
  "course.CMAT": "CMAT",
  "course.IOT": "IOT",
  "course.IOE": "IOE",
  "course.NEB Preparation": "NEB Preparation",
  "accountStatus.Paid": "Paid",
  "accountStatus.Unpaid": "Unpaid",
  "resultStatus.Pass": "Pass",
  "resultStatus.Fail": "Fail",
  "status.active": "Active",
  "status.inactive": "Inactive",
  "status.draft": "Draft",
  "status.scheduled": "Scheduled",
  "status.published": "Published",
  "status.live": "Live",
  "status.completed": "Completed",
  "status.archived": "Archived",
  "status.pending": "Pending",
  "status.failed": "Failed",
  "status.refunded": "Refunded",
  "status.canceled": "Canceled",
  "status.processing": "Processing",
  "status.shipped": "Shipped",
  "status.delivered": "Delivered",
  "status.contacted": "Contacted",
  "status.resolved": "Resolved",
  "status.closed": "Closed",
  "deliveryStatus.pending": "Pending",
  "deliveryStatus.processing": "Processing",
  "deliveryStatus.shipped": "Shipped",
  "deliveryStatus.delivered": "Delivered",
  "inquiryType.college": "College",
  "inquiryType.university": "University",
  "popupType.image": "Image Popup",
  "popupType.text": "Text Popup",
  "contentType.video": "Single Video",
  "contentType.playlist": "Playlist",
  "type.Public": "Public",
  "type.Private": "Private",
  "type.Deemed": "Deemed",
  "type.Autonomous": "Autonomous",
  "role.super_admin": "Super Admin",
  "role.admin": "Admin",
  "role.manager": "Manager",
  "role.viewer": "Viewer",
  "isActive.true": "Yes",
  "isActive.false": "No",
  "isRead.true": "Yes",
  "isRead.false": "No",
});

const adminComponentTranslations = Object.freeze({
  Login: {
    welcomeHeader: "Welcome back",
    welcomeMessage:
      "Use your admin credentials to continue to the Sajha Entrance dashboard.",
    properties: {
      email: "Work email",
      password: "Password",
    },
    loginButton: "Continue to dashboard",
  },
});

const adminTokenOverrides = Object.freeze({
  api: "API",
  bca: "BCA",
  bit: "BIT",
  cmat: "CMAT",
  csit: "CSIT",
  css: "CSS",
  esewa: "eSewa",
  gk: "GK",
  html: "HTML",
  id: "ID",
  ids: "IDs",
  ioe: "IOE",
  iot: "IOT",
  neb: "NEB",
  otp: "OTP",
  pdf: "PDF",
  seo: "SEO",
  sms: "SMS",
  ui: "UI",
  url: "URL",
  urls: "URLs",
  uuid: "UUID",
  ux: "UX",
  youtube: "YouTube",
});

const isPlainObject = (value) =>
  Boolean(value) && Object.prototype.toString.call(value) === "[object Object]";

const mergeDeep = (target = {}, source = {}) => {
  const merged = { ...target };

  Object.entries(source).forEach(([key, value]) => {
    if (isPlainObject(value) && isPlainObject(merged[key])) {
      merged[key] = mergeDeep(merged[key], value);
      return;
    }

    if (isPlainObject(value)) {
      merged[key] = mergeDeep({}, value);
      return;
    }

    merged[key] = value;
  });

  return merged;
};

const mergeMany = (...sources) =>
  sources.reduce((merged, source) => mergeDeep(merged, source || {}), {});

const setTranslationIfMissing = (translations, key, value) => {
  if (!translations || !key || value === undefined || value === null || value === "") {
    return;
  }

  if (!(key in translations)) {
    translations[key] = value;
  }
};

const addMirroredTranslation = (resourceTranslations, globalTranslations, key, value) => {
  setTranslationIfMissing(resourceTranslations, key, value);
  setTranslationIfMissing(globalTranslations, key, value);
};

const normalizeResourceEntry = (resourceEntry) =>
  resourceEntry?.resource
    ? {
        ...resourceEntry,
        options: {
          ...(resourceEntry.options || {}),
        },
      }
    : {
        resource: resourceEntry,
        options: {},
      };

const resourceIdOf = (resourceEntry) =>
  resourceEntry.options?.id ||
  resourceEntry.resource?.modelName ||
  resourceEntry.resource?.name ||
  "Resource";

const humanizeTranslationKey = (value = "") => {
  const normalizedValue = String(value || "")
    .replace(/\./g, " ")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalizedValue) {
    return "";
  }

  return normalizedValue
    .split(" ")
    .map((token) => {
      const overriddenToken = adminTokenOverrides[token.toLowerCase()];
      if (overriddenToken) {
        return overriddenToken;
      }

      if (token === token.toUpperCase()) {
        return token;
      }

      return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
    })
    .join(" ");
};

const collectSchemaMetadata = (schema, prefix = "", metadata = {}) => {
  if (!schema?.paths) {
    return metadata;
  }

  Object.entries(schema.paths).forEach(([pathKey, schemaPath]) => {
    if (pathKey === "__v" || pathKey === "_id") {
      return;
    }

    const fullPath = prefix ? `${prefix}.${pathKey}` : pathKey;
    const enumValues =
      Array.isArray(schemaPath?.enumValues) && schemaPath.enumValues.length > 0
        ? schemaPath.enumValues
        : Array.isArray(schemaPath?.$embeddedSchemaType?.enumValues) &&
            schemaPath.$embeddedSchemaType.enumValues.length > 0
          ? schemaPath.$embeddedSchemaType.enumValues
          : null;

    metadata[fullPath] = {
      type: schemaPath?.instance || schemaPath?.$embeddedSchemaType?.instance || "",
      enumValues,
    };

    if (schemaPath?.schema) {
      collectSchemaMetadata(schemaPath.schema, fullPath, metadata);
    }
  });

  return metadata;
};

const extractPropertyPath = (property) => {
  if (!property) {
    return "";
  }

  if (typeof property === "string") {
    return property;
  }

  return property.propertyPath || property.path || property.name || "";
};

const collectPropertyPaths = (resourceEntry, schemaMetadata = {}) => {
  const propertyPaths = new Set(Object.keys(schemaMetadata));
  const resourceOptions = resourceEntry.options || {};

  Object.keys(resourceOptions.properties || {}).forEach((propertyPath) => propertyPaths.add(propertyPath));

  ["listProperties", "editProperties", "showProperties", "filterProperties"].forEach((propertyGroupKey) => {
    (resourceOptions[propertyGroupKey] || [])
      .map(extractPropertyPath)
      .filter(Boolean)
      .forEach((propertyPath) => propertyPaths.add(propertyPath));
  });

  return Array.from(propertyPaths);
};

const normalizeAvailableValues = (availableValues = []) =>
  (Array.isArray(availableValues) ? availableValues : [])
    .map((availableValue) => {
      if (availableValue && typeof availableValue === "object") {
        const value = String(availableValue.value ?? "").trim();
        if (!value) {
          return null;
        }

        return {
          value,
          label: String(availableValue.label ?? humanizeTranslationKey(value)).trim() || value,
        };
      }

      const value = String(availableValue ?? "").trim();
      if (!value) {
        return null;
      }

      return {
        value,
        label: humanizeTranslationKey(value) || value,
      };
    })
    .filter(Boolean);

const resolvePropertyLabel = (propertyPath, propertyOptions = {}) =>
  String(propertyOptions.label || humanizeTranslationKey(propertyPath)).trim() ||
  propertyPath;

const resolveActionLabel = (actionName, actionConfig = {}) =>
  String(
    actionConfig.label ||
      adminActionLabelOverrides[actionName] ||
      humanizeTranslationKey(actionName)
  ).trim() || actionName;

const resolveNavigationName = (navigation) => {
  if (!navigation) {
    return "";
  }

  if (typeof navigation === "string") {
    return navigation;
  }

  return navigation.name || "";
};

const normalizePageTranslations = (pages = []) => {
  if (Array.isArray(pages)) {
    return pages.reduce((translations, pageEntry) => {
      if (typeof pageEntry === "string") {
        setTranslationIfMissing(
          translations,
          pageEntry,
          humanizeTranslationKey(pageEntry) || pageEntry
        );
        return translations;
      }

      if (isPlainObject(pageEntry) && pageEntry.name) {
        setTranslationIfMissing(
          translations,
          pageEntry.name,
          pageEntry.label || humanizeTranslationKey(pageEntry.name) || pageEntry.name
        );
      }

      return translations;
    }, {});
  }

  if (isPlainObject(pages)) {
    return Object.entries(pages).reduce((translations, [pageName, label]) => {
      setTranslationIfMissing(
        translations,
        pageName,
        String(label || humanizeTranslationKey(pageName) || pageName).trim()
      );
      return translations;
    }, {});
  }

  return {};
};

const buildResourceTranslations = (resources = []) => {
  const globalActions = {
    search: "Search",
  };
  const globalLabels = {
    ...adminNavigationLabels,
    ...adminResourceLabels,
    ...adminLabelTranslations,
  };
  const globalMessages = {
    ...adminMessageTranslations,
  };
  const globalProperties = {
    _id: "Id",
  };
  const resourceTranslations = {};
  const addNewItemLabel = adminJsEnTranslations.buttons?.addNewItem || "Add new item";

  resources.forEach((resource) => {
    const resourceEntry = normalizeResourceEntry(resource);
    const resourceId = resourceIdOf(resourceEntry);
    const resourceOptions = resourceEntry.options || {};
    const schemaMetadata = collectSchemaMetadata(resourceEntry.resource?.schema);
    const resourceTranslation = {
      actions: {},
      labels: {},
      messages: {},
      properties: {
        _id: "Id",
      },
    };

    globalLabels[resourceId] =
      adminResourceLabels[resourceId] || globalLabels[resourceId] || humanizeTranslationKey(resourceId);

    const navigationName = resolveNavigationName(resourceOptions.navigation);
    if (navigationName) {
      globalLabels[navigationName] = adminNavigationLabels[navigationName] || navigationName;
    }

    collectPropertyPaths(resourceEntry, schemaMetadata).forEach((propertyPath) => {
      const propertyOptions = resourceOptions.properties?.[propertyPath] || {};
      const schemaInfo = schemaMetadata[propertyPath] || {};
      const propertyLabel = resolvePropertyLabel(propertyPath, propertyOptions);
      const propertyDescription =
        typeof propertyOptions.description === "string"
          ? propertyOptions.description.trim()
          : "";

      resourceTranslation.properties[propertyPath] = propertyLabel;
      if (!(propertyPath in globalProperties)) {
        globalProperties[propertyPath] = propertyLabel;
      }

      normalizeAvailableValues(propertyOptions.availableValues || schemaInfo.enumValues).forEach(
        ({ value, label }) => {
          addMirroredTranslation(
            resourceTranslation.labels,
            globalLabels,
            `${propertyPath}.${value}`,
            label
          );
          addMirroredTranslation(
            resourceTranslation.labels,
            globalLabels,
            `${propertyPath}.${label}`,
            label
          );
        }
      );

      if (propertyDescription) {
        addMirroredTranslation(
          resourceTranslation.messages,
          globalMessages,
          propertyDescription,
          propertyDescription
        );
      }

      const isBooleanProperty =
        propertyOptions.type === "boolean" || schemaInfo.type === "Boolean";
      const isArrayProperty = propertyOptions.isArray === true || schemaInfo.type === "Array";

      if (isBooleanProperty) {
        addMirroredTranslation(
          resourceTranslation.labels,
          globalLabels,
          `${propertyPath}.true`,
          "Yes"
        );
        addMirroredTranslation(
          resourceTranslation.labels,
          globalLabels,
          `${propertyPath}.false`,
          "No"
        );
      }

      if (isArrayProperty) {
        addMirroredTranslation(
          resourceTranslation.properties,
          globalProperties,
          `${propertyPath}.addNewItem`,
          addNewItemLabel
        );
      }
    });

    Object.entries(resourceOptions.actions || {}).forEach(([actionName, actionConfig]) => {
      const actionLabel = resolveActionLabel(actionName, actionConfig);
      const actionGuard =
        typeof actionConfig?.guard === "string" ? actionConfig.guard.trim() : "";
      const hasBuiltInTranslation = Boolean(adminJsEnTranslations.actions?.[actionName]);
      const shouldAddResourceTranslation = Boolean(actionConfig?.label) || !hasBuiltInTranslation;

      if (shouldAddResourceTranslation) {
        resourceTranslation.actions[actionName] = actionLabel;
      }

      if (!hasBuiltInTranslation && !(actionName in globalActions)) {
        globalActions[actionName] = actionLabel;
      }

      if (actionGuard) {
        addMirroredTranslation(
          resourceTranslation.messages,
          globalMessages,
          actionGuard,
          actionGuard
        );
      }
    });

    if (
      Object.keys(resourceTranslation.actions).length > 0 ||
      Object.keys(resourceTranslation.labels).length > 0 ||
      Object.keys(resourceTranslation.messages).length > 0 ||
      Object.keys(resourceTranslation.properties).length > 0
    ) {
      resourceTranslations[resourceId] = resourceTranslation;
    }
  });

  return {
    actions: globalActions,
    labels: globalLabels,
    messages: globalMessages,
    properties: globalProperties,
    resources: resourceTranslations,
  };
};

const buildAdminTranslations = ({ resources = [], pages = [], components = {} } = {}) => {
  const resourceTranslations = buildResourceTranslations(resources);
  const pageTranslations = normalizePageTranslations(pages);
  const componentTranslations = isPlainObject(components) ? components : {};

  return {
    ...adminJsEnTranslations,
    actions: {
      ...(adminJsEnTranslations.actions || {}),
      ...(resourceTranslations.actions || {}),
    },
    components: mergeMany(
      adminJsEnTranslations.components || {},
      adminComponentTranslations,
      componentTranslations
    ),
    labels: {
      ...(adminJsEnTranslations.labels || {}),
      ...(resourceTranslations.labels || {}),
    },
    messages: {
      ...(adminJsEnTranslations.messages || {}),
      ...(resourceTranslations.messages || {}),
    },
    pages: {
      ...(adminJsEnTranslations.pages || {}),
      ...pageTranslations,
    },
    properties: {
      ...(adminJsEnTranslations.properties || {}),
      ...(resourceTranslations.properties || {}),
    },
    resources: mergeMany(
      adminJsEnTranslations.resources || {},
      resourceTranslations.resources || {}
    ),
  };
};

const buildAdminLocale = ({ resources = [], pages = [], components = {} } = {}) => {
  const enAdminTranslations = buildAdminTranslations({
    resources,
    pages,
    components,
  });

  return {
    language: "en",
    availableLanguages: ["en"],
    localeDetection: false,
    withBackend: false,
    partialBundledLanguages: false,
    resources: {
      en: {
        translation: enAdminTranslations,
      },
    },
    translations: {
      en: enAdminTranslations,
    },
  };
};

export { adminResourceLabels, buildAdminLocale, buildAdminTranslations };
