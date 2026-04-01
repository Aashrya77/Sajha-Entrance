import mongoose from "mongoose";

const AdminActivitySchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },
    actorName: {
      type: String,
      default: "System",
    },
    actorEmail: {
      type: String,
      default: "",
    },
    actorRole: {
      type: String,
      default: "system",
    },
    action: {
      type: String,
      required: true,
    },
    resource: {
      type: String,
      required: true,
    },
    recordId: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      required: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

AdminActivitySchema.index({ createdAt: -1 });
AdminActivitySchema.index({ actor: 1, createdAt: -1 });
AdminActivitySchema.index({ resource: 1, createdAt: -1 });

const AdminActivityModel = mongoose.model("AdminActivity", AdminActivitySchema);

export default AdminActivityModel;
