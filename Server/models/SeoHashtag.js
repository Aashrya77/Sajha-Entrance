import mongoose from "mongoose";

const SeoHashtagSchema = new mongoose.Schema(
  {
    hashtag: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 80,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

SeoHashtagSchema.index({ isActive: 1, hashtag: 1 });

export default mongoose.model("SeoHashtag", SeoHashtagSchema);
