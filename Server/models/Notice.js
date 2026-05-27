import mongoose from "mongoose";

const NoticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

NoticeSchema.index({ isActive: 1, updatedAt: -1, createdAt: -1 });

const NoticeModel = mongoose.model("Notice", NoticeSchema);

export default NoticeModel;
