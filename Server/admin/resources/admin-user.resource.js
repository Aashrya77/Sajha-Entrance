import { flat } from "adminjs";
import AdminUserModel from "../../models/AdminUser.js";
import {
  ADMIN_PERMISSION_PROPERTY_DESCRIPTORS,
} from "../constants/permissions.js";
import {
  ADMIN_ROLE_OPTIONS,
  buildPermissionSet,
  normalizeStoredPermissionSet,
} from "../constants/roles.js";

const buildPermissionOverridesFromSource = (source = {}) =>
  ADMIN_PERMISSION_PROPERTY_DESCRIPTORS.reduce((permissions, descriptor) => {
    const rawValue = flat.get(source, descriptor.path);

    if (rawValue === undefined) {
      return permissions;
    }

    return flat.set(
      permissions,
      descriptor.path.replace(/^permissions\./, ""),
      rawValue
    );
  }, {});

const applyPermissionPayload = (payload, permissions) => {
  ADMIN_PERMISSION_PROPERTY_DESCRIPTORS.forEach((descriptor) => {
    payload[descriptor.path] = permissions[descriptor.resourceKey][descriptor.action];
  });
};

const hasExplicitPermissionUpdates = (payload) =>
  ADMIN_PERMISSION_PROPERTY_DESCRIPTORS.some(
    (descriptor) => flat.get(payload, descriptor.path) !== undefined
  );

const hasGrantedPermission = (permissions) =>
  ADMIN_PERMISSION_PROPERTY_DESCRIPTORS.some(
    (descriptor) => permissions?.[descriptor.resourceKey]?.[descriptor.action]
  );

const buildPermissionSelectionFromPayload = (payload, role) => {
  const selectedPermissions = ADMIN_PERMISSION_PROPERTY_DESCRIPTORS.reduce((permissions, descriptor) => {
    return flat.set(
      permissions,
      descriptor.path.replace(/^permissions\./, ""),
      flat.get(payload, descriptor.path) ?? false
    );
  }, {});

  return buildPermissionSet(role, selectedPermissions);
};

const applyRolePermissions = async (request, context) => {
  if (request.method !== "post" || !request.payload) {
    return request;
  }

  const payload = { ...request.payload };
  const currentRole = flat.get(context?.record?.params || {}, "role") || "viewer";
  const nextRole = flat.get(payload, "role") || currentRole;
  const currentPermissionOverrides = buildPermissionOverridesFromSource(context?.record?.params || {});
  const currentPermissions = normalizeStoredPermissionSet(currentRole, currentPermissionOverrides);
  const roleChanged = !context?.record || nextRole !== currentRole;
  const nextPermissions = hasExplicitPermissionUpdates(payload)
    ? buildPermissionSelectionFromPayload(payload, nextRole)
    : context?.record && hasGrantedPermission(currentPermissions)
      ? buildPermissionSelectionFromPayload({}, nextRole)
      : roleChanged
        ? buildPermissionSet(nextRole)
        : currentPermissions;

  applyPermissionPayload(payload, nextPermissions);

  return {
    ...request,
    payload,
  };
};

const stripBlankPassword = async (request) => {
  if (request.method !== "post" || !request.payload) {
    return request;
  }

  if (request.payload.password === "") {
    return {
      ...request,
      payload: flat.filterOutParams(request.payload, "password"),
    };
  }

  return request;
};

const preventSelfDelete = ({ currentAdmin, record }) =>
  currentAdmin?.id && record?.params?._id && currentAdmin.id !== record.params._id;

const permissionEditProperties = ADMIN_PERMISSION_PROPERTY_DESCRIPTORS.map(
  (descriptor) => descriptor.path
);

const permissionShowProperties = [...permissionEditProperties];

const permissionPropertyOptions = ADMIN_PERMISSION_PROPERTY_DESCRIPTORS.reduce(
  (properties, descriptor) => {
    properties[descriptor.path] = {
      label: descriptor.label,
      position: descriptor.position,
      isVisible: { list: false, show: true, edit: true, filter: false },
    };
    return properties;
  },
  {}
);

const AdminUserAdminResource = {
  resource: AdminUserModel,
  options: {
    id: "AdminUser",
    navigation: { name: "Administration", icon: "User" },
    listProperties: ["fullName", "email", "role", "isActive", "lastLoginAt"],
    editProperties: ["fullName", "email", "role", "isActive", ...permissionEditProperties, "password"],
    showProperties: [
      "fullName",
      "email",
      "role",
      "isActive",
      ...permissionShowProperties,
      "lastLoginAt",
      "createdAt",
      "updatedAt",
    ],
    filterProperties: ["fullName", "email", "role", "isActive"],
    actions: {
      new: {
        before: [applyRolePermissions],
      },
      edit: {
        before: [stripBlankPassword, applyRolePermissions],
      },
      delete: {
        isAccessible: preventSelfDelete,
      },
    },
    properties: {
      fullName: {
        isTitle: true,
      },
      role: {
        availableValues: ADMIN_ROLE_OPTIONS,
      },
      password: {
        type: "password",
        isVisible: { list: false, show: false, edit: true, filter: false },
      },
      lastLoginAt: {
        isVisible: { list: true, show: true, edit: false, filter: true },
      },
      createdAt: {
        isVisible: { list: false, show: true, edit: false, filter: false },
      },
      updatedAt: {
        isVisible: { list: false, show: true, edit: false, filter: false },
      },
      ...permissionPropertyOptions,
    },
  },
};

export default AdminUserAdminResource;
