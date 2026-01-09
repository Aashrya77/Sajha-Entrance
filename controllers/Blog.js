import BlogModel from "../models/Blog.js";
import Notice from "../models/Notice.js";
import Advertisement from "../models/Advertisement.js";
import Popup from "../models/Popup.js";
import mongoose from "mongoose";

const GetBlogs = async (req, res) => {
  const advertisement = await Advertisement.findOne().sort({ _id: -1 }).exec();
  const blogsLength = (await BlogModel.find().exec()).length;
  const limit = 8;
  var page = parseInt(req.query.page) || 1;
  var startIndex = (page - 1) * limit;
  var endIndex = page * limit;
  var previousPage = 0,
    nextPage = 0;
  if (endIndex < blogsLength) {
    nextPage = page + 1;
  }

  if (startIndex > 0) {
    previousPage = page - 1;
  }

  const search = req.query.searchBlog;

  const notice = await Notice.findOne().sort({ _id: -1 }).exec();
  const popup = await Popup.findOne({ isActive: true }).exec();
  if (search) {
    const blogs = await BlogModel.find({
      blogTitle: { $regex: search, $options: "i" },
    }).exec();
    previousPage = 0;
    nextPage = 0;
    res.render("blogs", {
      pageName: "Blogs",
      parentGroup: "Blogs",
      blogs,
      notice,
      previousPage,
      nextPage,
      search,
      advertisement,
      popup,
    });
  } else {
    const blogs = await BlogModel.find()
      .skip(startIndex)
      .limit(limit)
      .sort({ _id: -1 })
      .exec();
    res.render("blogs", {
      pageName: "Blogs",
      parentGroup: "Blogs",
      blogs,
      notice,
      previousPage,
      nextPage,
      search,
      advertisement,
      popup,
    });
  }
};

const GetBlogData = async (req, res) => {
  const notice = await Notice.findOne().sort({ _id: -1 }).exec();
  const popup = await Popup.findOne({ isActive: true }).exec();
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.render("404");
  }
  const blogData = await BlogModel.findOne({ _id: req.params.id }).exec();
  const blogs = await BlogModel.find().limit(6).exec();
  const advertisement = await Advertisement.findOne().sort({ _id: -1 }).exec();
  res.render("blog", {
    pageName: "Blogs",
    parentGroup: "Blogs",
    notice,
    blogData,
    blogs,
    advertisement,
    popup,
  });
};

const SearchBlog = async (req, res) => {
  res.redirect("/blogs?searchBlog=" + req.body.blogName);
};

export { GetBlogs, SearchBlog, GetBlogData };
