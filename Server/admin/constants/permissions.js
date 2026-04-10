const CRUD_PERMISSION_ACTIONS = ["view", "add", "edit", "delete"];

const createPermissionResource = (key, label, actions = CRUD_PERMISSION_ACTIONS) => ({
  key,
  label,
  actions,
});

const createPermissionMatrix = (valueOrResolver = false) =>
  ADMIN_PERMISSION_RESOURCES.reduce((permissions, resource) => {
    permissions[resource.key] = resource.actions.reduce((resourcePermissions, action) => {
      resourcePermissions[action] = Boolean(
        typeof valueOrResolver === "function"
          ? valueOrResolver(resource, action)
          : valueOrResolver
      );
      return resourcePermissions;
    }, {});

    return permissions;
  }, {});

const createSchemaDefinition = () =>
  ADMIN_PERMISSION_RESOURCES.reduce((schemaDefinition, resource) => {
    schemaDefinition[resource.key] = resource.actions.reduce((resourceSchema, action) => {
      resourceSchema[action] = {
        type: Boolean,
        default: false,
      };
      return resourceSchema;
    }, {});

    return schemaDefinition;
  }, {});

const clonePermissionSet = (permissions = {}) => JSON.parse(JSON.stringify(permissions));

const coercePermissionBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["true", "1", "on", "yes"].includes(normalized);
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return Boolean(value);
};

const normalizePermissionSet = (rawPermissions = {}) => {
  const normalized = buildEmptyPermissionSet();

  ADMIN_PERMISSION_RESOURCES.forEach((resource) => {
    const rawResourcePermissions = rawPermissions?.[resource.key] || {};

    resource.actions.forEach((action) => {
      if (rawResourcePermissions?.[action] === undefined) {
        return;
      }

      normalized[resource.key][action] = coercePermissionBoolean(rawResourcePermissions[action]);
    });

    const hasMutationPermission = resource.actions.some(
      (action) =>
        action !== "view" && normalized[resource.key][action]
    );

    if (resource.actions.includes("view") && hasMutationPermission) {
      normalized[resource.key].view = true;
    }
  });

  return normalized;
};

const mergePermissionSets = (basePermissions = {}, overrides = {}) => {
  const merged = clonePermissionSet(basePermissions);

  ADMIN_PERMISSION_RESOURCES.forEach((resource) => {
    resource.actions.forEach((action) => {
      if (overrides?.[resource.key]?.[action] === undefined) {
        return;
      }

      merged[resource.key][action] = coercePermissionBoolean(overrides[resource.key][action]);
    });

    const hasMutationPermission = resource.actions.some(
      (action) =>
        action !== "view" && merged[resource.key][action]
    );

    if (resource.actions.includes("view") && hasMutationPermission) {
      merged[resource.key].view = true;
    }
  });

  return merged;
};

const isLegacyPermissionShape = (permissions = {}) =>
  ["read", "write", "delete", "manageUsers"].some((key) => permissions?.[key] !== undefined);

export const ADMIN_PERMISSION_ACTIONS = [
  { key: "view", label: "View" },
  { key: "add", label: "Add" },
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete" },
];

export const ADMIN_PERMISSION_RESOURCES = [
  createPermissionResource("dashboard", "Dashboard", ["view"]),
  createPermissionResource("admin_users", "Admin Users"),
  createPermissionResource("admin_notifications", "Admin Notifications", ["view", "edit"]),
  createPermissionResource("blogs", "Blogs"),
  createPermissionResource("notices", "Notices"),
  createPermissionResource("advertisements", "Advertisements"),
  createPermissionResource("colleges", "Colleges"),
  createPermissionResource("universities", "Universities"),
  createPermissionResource("landing_ads", "Landing Ads"),
  createPermissionResource("mock_test_courses", "Mock Test Courses"),
  createPermissionResource("mock_test_subjects", "Mock Test Subjects"),
  createPermissionResource("mock_tests", "Mock Tests"),
  createPermissionResource("mock_test_attempts", "Mock Test Attempts"),
  createPermissionResource("courses", "Courses"),
  createPermissionResource("newsletters", "Newsletters"),
  createPermissionResource("contacts", "Contacts"),
  createPermissionResource("popups", "Popups"),
  createPermissionResource("students", "Students"),
  createPermissionResource("online_classes", "Online Classes"),
  createPermissionResource("recorded_classes", "Recorded Classes"),
  createPermissionResource("results", "Results"),
  createPermissionResource("payments", "Payments"),
  createPermissionResource("book_orders", "Book Orders"),
  createPermissionResource("inquiries", "Inquiries"),
];

export const ADMIN_PERMISSION_RESOURCES_BY_KEY = ADMIN_PERMISSION_RESOURCES.reduce(
  (resources, resource) => {
    resources[resource.key] = resource;
    return resources;
  },
  {}
);

export const ADMIN_PERMISSION_PROPERTY_DESCRIPTORS = ADMIN_PERMISSION_RESOURCES.flatMap(
  (resource, resourceIndex) =>
    resource.actions.map((action, actionIndex) => ({
      path: `permissions.${resource.key}.${action}`,
      resourceKey: resource.key,
      action,
      label: `${resource.label} - ${
        ADMIN_PERMISSION_ACTIONS.find((permissionAction) => permissionAction.key === action)?.label || action
      }`,
      position: 200 + resourceIndex * 10 + actionIndex,
    }))
);

export const ADMIN_PERMISSION_PATHS = ADMIN_PERMISSION_PROPERTY_DESCRIPTORS.map(
  (descriptor) => descriptor.path
);

export const ADMIN_RESOURCE_ACCESS = {
  AdminUser: {
    permissionResource: "admin_users",
    superAdminOnlyActions: ["new", "edit", "delete", "bulkDelete"],
  },
  AdminNotification: {
    permissionResource: "admin_notifications",
    customActionPermissions: {
      markAsRead: "edit",
    },
  },
  Blog: {
    permissionResource: "blogs",
  },
  Notice: {
    permissionResource: "notices",
  },
  Advertisement: {
    permissionResource: "advertisements",
  },
  College: {
    permissionResource: "colleges",
  },
  University: {
    permissionResource: "universities",
  },
  LandingAd: {
    permissionResource: "landing_ads",
  },
  MockTestCourse: {
    permissionResource: "mock_test_courses",
  },
  MockTestSubject: {
    permissionResource: "mock_test_subjects",
    customActionPermissions: {
      questionStudio: "edit",
    },
  },
  MockTest: {
    permissionResource: "mock_tests",
    customActionPermissions: {
      scheduler: "edit",
    },
  },
  MockTestAttempt: {
    permissionResource: "mock_test_attempts",
  },
  Course: {
    permissionResource: "courses",
  },
  Newsletter: {
    permissionResource: "newsletters",
  },
  Contact: {
    permissionResource: "contacts",
  },
  Popup: {
    permissionResource: "popups",
  },
  Student: {
    permissionResource: "students",
  },
  OnlineClass: {
    permissionResource: "online_classes",
  },
  RecordedClass: {
    permissionResource: "recorded_classes",
  },
  ResultExam: {
    permissionResource: "results",
    customActionPermissions: {
      bulkUpload: "add",
    },
  },
  StudentResult: {
    permissionResource: "results",
  },
  Payment: {
    permissionResource: "payments",
  },
  BookOrder: {
    permissionResource: "book_orders",
  },
  Inquiry: {
    permissionResource: "inquiries",
  },
};

export const ADMINJS_ACTION_PERMISSION_MAP = {
  list: "view",
  show: "view",
  search: "view",
  new: "add",
  edit: "edit",
  delete: "delete",
  bulkDelete: "delete",
};

export const buildAdminPermissionSchemaDefinition = createSchemaDefinition;
export const buildEmptyPermissionSet = () => createPermissionMatrix(false);
export const buildFullPermissionSet = () => createPermissionMatrix(true);
export const getPermissionResource = (resourceKey) => ADMIN_PERMISSION_RESOURCES_BY_KEY[resourceKey] || null;
export const getAdminResourceAccessConfig = (resourceId) => ADMIN_RESOURCE_ACCESS[resourceId] || null;

export {
  clonePermissionSet,
  coercePermissionBoolean,
  isLegacyPermissionShape,
  mergePermissionSets,
  normalizePermissionSet,
};
