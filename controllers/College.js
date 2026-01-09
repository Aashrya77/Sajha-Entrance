import Notice from "../models/Notice.js";
import College from "../models/College.js";
import Course from "../models/Course.js";
import Advertisement from "../models/Advertisement.js";
import Popup from "../models/Popup.js";
import mongoose from "mongoose";

const CollegeDetail = async (req, res) => {
  const notice = await Notice.findOne().sort({ _id: -1 }).exec();
  const advertisement = await Advertisement.findOne().sort({ _id: -1 }).exec();
  const popup = await Popup.findOne({ isActive: true }).exec();
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.render("404");
  }
  try {
    const collegeData = await College.findOne({ _id: req.params.id })
      .populate("coursesOffered")
      .exec();
    const courses = collegeData.coursesOffered;
    res.render("college", {
      parentGroup: "College",
      pageName: collegeData.collegeName,
      notice,
      collegeData,
      courses,
      advertisement,
      popup,
    });
  } catch (error) {
    res.render("404", { pageName: "404 Not Found", notice });
  }
};

const GetColleges = async (req, res) => {
  const collegesLength = (await College.find().exec()).length;
  var noResult;
  const limit = 9;
  var page = parseInt(req.query.page) || 1;
  var startIndex = (page - 1) * limit;
  var endIndex = page * limit;
  var previousPage = 0,
    nextPage = 0;

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
  if (!req.query.searchCollege && !req.query.location) {
    const colleges = await College.find()
      .skip(startIndex)
      .limit(limit)
      .populate("coursesOffered")
      .exec();
    res.render("colleges", {
      parentGroup: "College",
      pageName: "Colleges",
      notice,
      advertisement,
      colleges,
      noResult,
      courses,
      previousPage,
      nextPage,
      search,
      location,
      popup,
    });
  } else if (req.query.location && req.query.searchCollege) {
    const colleges = await College.find({
      collegeName: { $regex: req.query.searchCollege, $options: "i" },
      collegeAddress: { $regex: req.query.location, $options: "i" },
    })
      .populate("coursesOffered")
      .exec();
    if (colleges.length === 0) {
      noResult = true;
    } else {
      noResult = false;
    }
    nextPage = 0;
    res.render("colleges", {
      parentGroup: "College",
      pageName: "Colleges",
      notice,
      advertisement,
      colleges,
      noResult,
      courses,
      previousPage,
      nextPage,
      search,
      location,
      popup,
    });
  } else {
    if (req.query.searchCollege) {
      const colleges = await College.find({
        collegeName: { $regex: req.query.searchCollege, $options: "i" },
      })
        .populate("coursesOffered")
        .exec();
      if (colleges.length === 0) {
        noResult = true;
      } else {
        noResult = false;
      }
      nextPage = 0;
      return res.render("colleges", {
        parentGroup: "College",
        pageName: "Colleges",
        notice,
        advertisement,
        colleges,
        noResult,
        courses,
        previousPage,
        nextPage,
      search,
      location,
      popup,
    });
    } else {
      const colleges = await College.find({
        collegeAddress: { $regex: req.query.location, $options: "i" },
      })
        .populate("coursesOffered")
        .exec();
      if (colleges.length === 0) {
        noResult = true;
      } else {
        noResult = false;
      }
      nextPage = 0;
      return res.render("colleges", {
        parentGroup: "College",
        pageName: "Colleges",
        notice,
        advertisement,
        colleges,
        noResult,
        courses,
        previousPage,
        nextPage,
      search,
      location,
      popup,
    });
    }
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
