import {
  ADMIN_PERMISSION_RESOURCES,
  buildEmptyPermissionSet,
  buildFullPermissionSet,
  clonePermissionSet,
  coercePermissionBoolean,
  isLegacyPermissionShape,
  mergePermissionSets,
} from "./permissions.js";

export const ADMIN_ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "viewer", label: "Viewer" },
];

export const ADMIN_ROLE_LABELS = ADMIN_ROLE_OPTIONS.reduce((labels, option) => {
  labels[option.value] = option.label;
  return labels;
}, {});

const NON_SUPER_ADMIN_RESOURCE_KEYS = ADMIN_PERMISSION_RESOURCES
  .map((resource) => resource.key)
  .filter((resourceKey) => !["dashboard", "admin_users"].includes(resourceKey));

const grantPermissionActions = (permissions, resourceKeys, actions) => {
  resourceKeys.forEach((resourceKey) => {
    const resourcePermissions = permissions[resourceKey];

    if (!resourcePermissions) {
      return;
    }

    actions.forEach((action) => {
      if (resourcePermissions[action] === undefined) {
        return;
      }

      resourcePermissions[action] = true;
    });
  });
};

const enforcePermissionDependencies = (permissions) => {
  ADMIN_PERMISSION_RESOURCES.forEach((resource) => {
    const resourcePermissions = permissions[resource.key];

    if (!resourcePermissions || resourcePermissions.view === undefined) {
      return;
    }

    const hasMutationPermission = resource.actions.some(
      (action) => action !== "view" && resourcePermissions[action]
    );

    if (hasMutationPermission) {
      resourcePermissions.view = true;
    }
  });

  return permissions;
};

const applyRoleConstraints = (role, permissions) => {
  const constrainedPermissions = enforcePermissionDependencies(clonePermissionSet(permissions));

  if (role !== "super_admin") {
    constrainedPermissions.admin_users.add = false;
    constrainedPermissions.admin_users.edit = false;
    constrainedPermissions.admin_users.delete = false;
  }

  return constrainedPermissions;
};

const createDefaultRolePermissionSet = (role = "viewer") => {
  if (role === "super_admin") {
    return buildFullPermissionSet();
  }

  const permissions = buildEmptyPermissionSet();
  permissions.dashboard.view = true;

  if (role === "admin") {
    grantPermissionActions(permissions, NON_SUPER_ADMIN_RESOURCE_KEYS, ["view", "add", "edit", "delete"]);
  } else if (role === "manager") {
    grantPermissionActions(permissions, NON_SUPER_ADMIN_RESOURCE_KEYS, ["view", "add", "edit"]);
  } else {
    grantPermissionActions(permissions, NON_SUPER_ADMIN_RESOURCE_KEYS, ["view"]);
  }

  return applyRoleConstraints(role, permissions);
};

export const DEFAULT_ROLE_PERMISSIONS = {
  super_admin: createDefaultRolePermissionSet("super_admin"),
  admin: createDefaultRolePermissionSet("admin"),
  manager: createDefaultRolePermissionSet("manager"),
  viewer: createDefaultRolePermissionSet("viewer"),
};

const buildLegacyPermissionSet = (role = "viewer", legacyPermissions = {}) => {
  if (role === "super_admin") {
    return buildFullPermissionSet();
  }

  const permissions = buildEmptyPermissionSet();
  const read = coercePermissionBoolean(legacyPermissions.read);
  const write = coercePermissionBoolean(legacyPermissions.write);
  const canDelete = coercePermissionBoolean(legacyPermissions.delete);
  const manageUsers = coercePermissionBoolean(legacyPermissions.manageUsers);

  permissions.dashboard.view = read;

  NON_SUPER_ADMIN_RESOURCE_KEYS.forEach((resourceKey) => {
    const resourcePermissions = permissions[resourceKey];

    if (resourcePermissions.view !== undefined) {
      resourcePermissions.view = read;
    }

    if (resourcePermissions.add !== undefined) {
      resourcePermissions.add = write;
    }

    if (resourcePermissions.edit !== undefined) {
      resourcePermissions.edit = write;
    }

    if (resourcePermissions.delete !== undefined) {
      resourcePermissions.delete = canDelete;
    }
  });

  permissions.admin_users.view = manageUsers;

  return applyRoleConstraints(role, permissions);
};

const hasExplicitPermissions = (permissions = {}) =>
  Object.keys(permissions || {}).some((resourceKey) => {
    const resourcePermissions = permissions[resourceKey];
    return resourcePermissions && typeof resourcePermissions === "object" && Object.keys(resourcePermissions).length > 0;
  });

export const buildPermissionSet = (role = "viewer", overrides = {}) => {
  if (role === "super_admin") {
    return buildFullPermissionSet();
  }

  const basePermissions =
    DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.viewer;
  const mergedPermissions = mergePermissionSets(basePermissions, overrides);

  return applyRoleConstraints(role, mergedPermissions);
};

export const normalizeStoredPermissionSet = (role = "viewer", rawPermissions = {}) => {
  if (role === "super_admin") {
    return buildFullPermissionSet();
  }

  if (isLegacyPermissionShape(rawPermissions)) {
    return buildLegacyPermissionSet(role, rawPermissions);
  }

  if (!rawPermissions || !hasExplicitPermissions(rawPermissions)) {
    return buildPermissionSet(role);
  }

  return buildPermissionSet(role, rawPermissions);
};
