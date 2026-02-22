import Notice from "../models/Notice.js";
import College from "../models/College.js";
import Course from "../models/Course.js";
import Advertisement from "../models/Advertisement.js";
import Popup from "../models/Popup.js";
import mongoose from "mongoose";

const CollegeDetail = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, error: "Invalid college ID" });
    }
    
    const notice = await Notice.findOne().sort({ _id: -1 }).exec();
    const advertisement = await Advertisement.findOne().sort({ _id: -1 }).exec();
    const popup = await Popup.findOne({ isActive: true }).exec();
    
    const collegeData = await College.findOne({ _id: req.params.id })
      .populate("coursesOffered")
      .exec();
      
    if (!collegeData) {
      return res.status(404).json({ success: false, error: "College not found" });
    }
    
    const courses = collegeData.coursesOffered;
    
    res.json({
      success: true,
      data: {
        collegeData,
        courses,
        notice,
        advertisement,
        popup
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const GetColleges = async (req, res) => {
  try {
    const collegesLength = (await College.find().exec()).length;
    const limit = 9;
    const page = parseInt(req.query.page) || 1;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    let previousPage = 0;
    let nextPage = 0;

    if (endIndex < collegesLength) {
      nextPage = page + 1;
    }

    if (startIndex > 0) {
      previousPage = page - 1;
    }

    const search = req.query.searchCollege;
    const location = req.query.location;

    const courses = await Course.find().limit(6).exec();
    const notice = await Notice.findOne().sort({ _id: -1 }).exec();
    const advertisement = await Advertisement.findOne().sort({ _id: -1 }).exec();
    const popup = await Popup.findOne({ isActive: true }).exec();

    let colleges = [];
    let noResult = false;

    if (!search && !location) {
      colleges = await College.find()
        .skip(startIndex)
        .limit(limit)
        .populate("coursesOffered")
        .exec();
    } else if (location && search) {
      colleges = await College.find({
        collegeName: { $regex: search, $options: "i" },
        collegeAddress: { $regex: location, $options: "i" },
      })
        .populate("coursesOffered")
        .exec();
      nextPage = 0;
      noResult = colleges.length === 0;
    } else if (search) {
      colleges = await College.find({
        collegeName: { $regex: search, $options: "i" },
      })
        .populate("coursesOffered")
        .exec();
      nextPage = 0;
      noResult = colleges.length === 0;
    } else if (location) {
      colleges = await College.find({
        collegeAddress: { $regex: location, $options: "i" },
      })
        .populate("coursesOffered")
        .exec();
      nextPage = 0;
      noResult = colleges.length === 0;
    }

    res.json({
      success: true,
      data: {
        colleges,
        notice,
        advertisement,
        courses,
        previousPage,
        nextPage,
        search,
        location,
        popup,
        noResult,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const SearchCollege = async (req, res) => {
  if (req.body.location) {
    return res.redirect(
      "/colleges?searchCollege=" +
        req.body.collegeName +
        "&location=" +
        req.body.location
    );
  }
  res.redirect("/colleges?searchCollege=" + req.body.collegeName);
};

export { CollegeDetail, GetColleges, SearchCollege };
