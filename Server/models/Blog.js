import mongoose from "mongoose";

const BlogSchema = new mongoose.Schema({
  blogTitle: String,
  blogDescriptionUnformatted: String,
  blogDescriptionFormatted: String,
  blogImage: String,
  blogImageMimeType: String,
  blogImageFilename: String,
  blogImageSize: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const BlogModel = mongoose.model("Blog", BlogSchema);

export default BlogModel;
