import AdminUserModel from "../../models/AdminUser.js";
import { ADMIN_ROLE_LABELS, normalizeStoredPermissionSet } from "../constants/roles.js";

const normalizeEmail = (value = "") => value.trim().toLowerCase();

const getNormalizedPermissionSnapshot = (role, permissions) =>
  normalizeStoredPermissionSet(role, permissions?.toObject?.() || permissions);

const syncAdminUserPermissions = (adminUser) => {
  const normalizedPermissions = getNormalizedPermissionSnapshot(adminUser.role, adminUser.permissions);
  const currentPermissions = adminUser.permissions?.toObject?.() || adminUser.permissions || {};

  if (JSON.stringify(currentPermissions) === JSON.stringify(normalizedPermissions)) {
    return false;
  }

  adminUser.permissions = normalizedPermissions;
  adminUser.markModified("permissions");
  return true;
};

const toCurrentAdmin = (adminUser) => ({
  id: adminUser._id.toString(),
  email: adminUser.email,
  title: adminUser.fullName,
  fullName: adminUser.fullName,
  role: adminUser.role,
  roleLabel: ADMIN_ROLE_LABELS[adminUser.role] || adminUser.role,
  permissions: getNormalizedPermissionSnapshot(adminUser.role, adminUser.permissions),
  isActive: adminUser.isActive,
});

const ensureAdminUserSeed = async () => {
  const email = normalizeEmail(process.env.ADMIN_USERNAME);
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    return null;
  }

  let adminUser = await AdminUserModel.findOne({ email });

  if (!adminUser) {
    adminUser = await AdminUserModel.create({
      fullName: process.env.ADMIN_FULL_NAME || "Super Admin",
      email,
      password,
      role: "super_admin",
      isActive: true,
    });

    return adminUser;
  }

  let hasChanges = false;

  if (adminUser.role !== "super_admin") {
    adminUser.role = "super_admin";
    hasChanges = true;
  }

  if (!adminUser.isActive) {
    adminUser.isActive = true;
    hasChanges = true;
  }

  hasChanges = syncAdminUserPermissions(adminUser) || hasChanges;

  if (hasChanges) {
    await adminUser.save();
  }

  return adminUser;
};

const syncAllAdminUserPermissions = async () => {
  const adminUsers = await AdminUserModel.find();
  let updatedCount = 0;

  for (const adminUser of adminUsers) {
    if (!syncAdminUserPermissions(adminUser)) {
      continue;
    }

    await adminUser.save();
    updatedCount += 1;
  }

  return updatedCount;
};

const authenticateAdminUser = async (email, password) => {
  const normalizedEmail = normalizeEmail(email);
  const adminUser = await AdminUserModel.findOne({ email: normalizedEmail });

  if (!adminUser || !adminUser.isActive) {
    return null;
  }

  const isMatch = await adminUser.comparePassword(password);

  if (!isMatch) {
    return null;
  }

  syncAdminUserPermissions(adminUser);
  adminUser.lastLoginAt = new Date();
  await adminUser.save();

  return {
    adminUser,
    currentAdmin: toCurrentAdmin(adminUser),
  };
};

const resolvePermissionTarget = (resourceOrPermission, action) => {
  if (action) {
    return {
      resourceKey: resourceOrPermission,
      actionKey: action,
    };
  }

  if (typeof resourceOrPermission === "string" && resourceOrPermission.includes(".")) {
    const [resourceKey, actionKey] = resourceOrPermission.split(".");
    return { resourceKey, actionKey };
  }

  return {
    resourceKey: resourceOrPermission,
    actionKey: "view",
  };
};

const getCurrentAdminPermissions = (currentAdmin) =>
  getNormalizedPermissionSnapshot(currentAdmin?.role, currentAdmin?.permissions);

const hasPermission = (currentAdmin, resourceOrPermission, action) => {
  if (!currentAdmin) {
    return false;
  }

  if (currentAdmin.role === "super_admin") {
    return true;
  }

  const { resourceKey, actionKey } = resolvePermissionTarget(resourceOrPermission, action);
  const permissions = getCurrentAdminPermissions(currentAdmin);

  return Boolean(permissions?.[resourceKey]?.[actionKey]);
};

const hasAnyAdminAccess = (currentAdmin) => {
  if (!currentAdmin) {
    return false;
  }

  if (currentAdmin.role === "super_admin") {
    return true;
  }

  return Object.values(getCurrentAdminPermissions(currentAdmin) || {}).some((resourcePermissions) =>
    Object.values(resourcePermissions || {}).some(Boolean)
  );
};

const requireAdminPermission = (resourceKey, action = "view") => (req, res, next) => {
  const currentAdmin = req.session?.adminUser;

  if (!currentAdmin) {
    return res.status(401).json({
      success: false,
      error: "Authentication required.",
    });
  }

  if (!hasPermission(currentAdmin, resourceKey, action)) {
    return res.status(403).json({
      success: false,
      error: `Missing permission: ${resourceKey}.${action}`,
    });
  }

  return next();
};

export {
  authenticateAdminUser,
  ensureAdminUserSeed,
  getCurrentAdminPermissions,
  hasAnyAdminAccess,
  hasPermission,
  normalizeEmail,
  requireAdminPermission,
  syncAdminUserPermissions,
  syncAllAdminUserPermissions,
  toCurrentAdmin,
};
