import BlogModel from "../models/Blog.js";
import Notice from "../models/Notice.js";
import Advertisement from "../models/Advertisement.js";
import Popup from "../models/Popup.js";
import mongoose from "mongoose";

const GetBlogs = async (req, res) => {
  try {
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
    
    let blogs;
    if (search) {
      blogs = await BlogModel.find({
        blogTitle: { $regex: search, $options: "i" },
      }).exec();
      previousPage = 0;
      nextPage = 0;
    } else {
      blogs = await BlogModel.find()
        .skip(startIndex)
        .limit(limit)
        .sort({ _id: -1 })
        .exec();
    }
    
    res.json({
      success: true,
      data: {
        blogs,
        notice,
        previousPage,
        nextPage,
        search,
        advertisement,
        popup,
        totalBlogs: blogsLength,
        currentPage: page
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const GetBlogData = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, error: "Invalid blog ID" });
    }
    
    const notice = await Notice.findOne().sort({ _id: -1 }).exec();
    const popup = await Popup.findOne({ isActive: true }).exec();
    const blogData = await BlogModel.findOne({ _id: req.params.id }).exec();
    
    if (!blogData) {
      return res.status(404).json({ success: false, error: "Blog not found" });
    }
    
    const blogs = await BlogModel.find().limit(6).exec();
    const advertisement = await Advertisement.findOne().sort({ _id: -1 }).exec();
    
    res.json({
      success: true,
      data: {
        blogData,
        relatedBlogs: blogs,
        notice,
        advertisement,
        popup
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const SearchBlog = async (req, res) => {
  try {
    const searchTerm = req.body.blogName || req.query.blogName;
    const blogs = await BlogModel.find({
      blogTitle: { $regex: searchTerm, $options: "i" },
    }).exec();
    
    res.json({
      success: true,
      data: {
        blogs,
        searchTerm
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export { GetBlogs, SearchBlog, GetBlogData };
