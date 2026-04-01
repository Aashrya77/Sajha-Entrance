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

export const DEFAULT_ROLE_PERMISSIONS = {
  super_admin: {
    read: true,
    write: true,
    delete: true,
    manageUsers: true,
  },
  admin: {
    read: true,
    write: true,
    delete: true,
    manageUsers: false,
  },
  manager: {
    read: true,
    write: true,
    delete: false,
    manageUsers: false,
  },
  viewer: {
    read: true,
    write: false,
    delete: false,
    manageUsers: false,
  },
};

export const ADMIN_PERMISSION_KEYS = ["read", "write", "delete", "manageUsers"];

export const buildPermissionSet = (role = "viewer", overrides = {}) => ({
  ...(DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.viewer),
  ...overrides,
});
