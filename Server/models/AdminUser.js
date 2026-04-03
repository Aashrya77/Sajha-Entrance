import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { buildAdminPermissionSchemaDefinition } from "../admin/constants/permissions.js";
import { normalizeStoredPermissionSet } from "../admin/constants/roles.js";

const AdminPermissionsSchema = new mongoose.Schema(buildAdminPermissionSchemaDefinition(), {
  _id: false,
  minimize: false,
});

const AdminUserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["super_admin", "admin", "manager", "viewer"],
      default: "viewer",
    },
    permissions: {
      type: AdminPermissionsSchema,
      default: () => ({}),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

AdminUserSchema.pre("validate", function normalizeAdminPermissions(next) {
  const normalizedPermissions = normalizeStoredPermissionSet(
    this.role,
    this.permissions?.toObject?.() || this.permissions
  );

  if (JSON.stringify(this.permissions?.toObject?.() || this.permissions || {}) !== JSON.stringify(normalizedPermissions)) {
    this.permissions = normalizedPermissions;
    this.markModified("permissions");
  }

  next();
});

AdminUserSchema.pre("save", async function saveAdminUser(next) {
  if (!this.isModified("password")) {
    next();
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

AdminUserSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const AdminUserModel = mongoose.model("AdminUser", AdminUserSchema);

export default AdminUserModel;
