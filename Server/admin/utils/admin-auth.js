import AdminUserModel from "../../models/AdminUser.js";
import { ADMIN_ROLE_LABELS, buildPermissionSet } from "../constants/roles.js";

const normalizeEmail = (value = "") => value.trim().toLowerCase();

const toCurrentAdmin = (adminUser) => ({
  id: adminUser._id.toString(),
  email: adminUser.email,
  title: adminUser.fullName,
  fullName: adminUser.fullName,
  role: adminUser.role,
  roleLabel: ADMIN_ROLE_LABELS[adminUser.role] || adminUser.role,
  permissions: buildPermissionSet(adminUser.role, adminUser.permissions?.toObject?.() || adminUser.permissions),
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
      permissions: buildPermissionSet("super_admin"),
      isActive: true,
    });
  }

  return adminUser;
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

  adminUser.lastLoginAt = new Date();
  await adminUser.save();

  return {
    adminUser,
    currentAdmin: toCurrentAdmin(adminUser),
  };
};

const hasPermission = (currentAdmin, permissionKey) => {
  if (!currentAdmin) {
    return false;
  }

  if (currentAdmin.role === "super_admin") {
    return true;
  }

  return Boolean(currentAdmin.permissions?.[permissionKey]);
};

const hasAnyAdminAccess = (currentAdmin) => hasPermission(currentAdmin, "read");

export {
  authenticateAdminUser,
  ensureAdminUserSeed,
  hasAnyAdminAccess,
  hasPermission,
  normalizeEmail,
  toCurrentAdmin,
};
