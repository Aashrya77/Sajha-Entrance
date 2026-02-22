import mongoose from "mongoose";

const BlogSchema = new mongoose.Schema({
  blogTitle: String,
  blogDescriptionUnformatted: String,
  blogDescriptionFormatted: String,
  blogImage: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const BlogModel = mongoose.model("Blog", BlogSchema);

export const BlogFileModel = {
  resource: BlogModel,
  options: {
    properties: {
      blogDescriptionFormatted: {
        type: "richtext",
      },
      blogImage: {
        type: "string",
        isVisible: {
          list: true,
          filter: false,
          show: true,
          edit: true,
        },
      },
    },
  },
};

export default BlogModel;
