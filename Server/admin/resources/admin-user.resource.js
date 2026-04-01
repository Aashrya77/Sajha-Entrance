import { flat } from "adminjs";
import AdminUserModel from "../../models/AdminUser.js";
import { ADMIN_PERMISSION_KEYS, ADMIN_ROLE_OPTIONS, buildPermissionSet } from "../constants/roles.js";

const coerceBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true" || value === "on" || value === "1";
  }

  return Boolean(value);
};

const applyRolePermissions = async (request) => {
  if (request.method !== "post" || !request.payload) {
    return request;
  }

  const payload = { ...request.payload };
  const role = flat.get(payload, "role") || "viewer";
  const hasExplicitPermissions = ADMIN_PERMISSION_KEYS.some(
    (permissionKey) => flat.get(payload, `permissions.${permissionKey}`) !== undefined
  );

  if (!hasExplicitPermissions) {
    const defaults = buildPermissionSet(role);
    ADMIN_PERMISSION_KEYS.forEach((permissionKey) => {
      payload[`permissions.${permissionKey}`] = defaults[permissionKey];
    });
  } else {
    ADMIN_PERMISSION_KEYS.forEach((permissionKey) => {
      const payloadKey = `permissions.${permissionKey}`;
      if (flat.get(payload, payloadKey) !== undefined) {
        payload[payloadKey] = coerceBoolean(flat.get(payload, payloadKey));
      }
    });
  }

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

const AdminUserAdminResource = {
  resource: AdminUserModel,
  options: {
    id: "AdminUser",
    navigation: { name: "Administration", icon: "User" },
    listProperties: ["fullName", "email", "role", "isActive", "lastLoginAt"],
    editProperties: [
      "fullName",
      "email",
      "role",
      "isActive",
      "permissions.read",
      "permissions.write",
      "permissions.delete",
      "permissions.manageUsers",
      "password",
    ],
    showProperties: [
      "fullName",
      "email",
      "role",
      "isActive",
      "permissions.read",
      "permissions.write",
      "permissions.delete",
      "permissions.manageUsers",
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
      "permissions.read": {
        label: "Read access",
      },
      "permissions.write": {
        label: "Write access",
      },
      "permissions.delete": {
        label: "Delete access",
      },
      "permissions.manageUsers": {
        label: "Manage users",
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
    },
  },
};

export default AdminUserAdminResource;
