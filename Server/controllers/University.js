import Notice from "../models/Notice.js";
import University from "../models/University.js";
import Course from "../models/Course.js";
import College from "../models/College.js";
import Advertisement from "../models/Advertisement.js";
import Popup from "../models/Popup.js";
import mongoose from "mongoose";
import {
  mediaFieldMaps,
  normalizeCollectionMedia,
  normalizeMediaFields,
} from "../utils/media.js";

const UniversityDetail = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, error: "Invalid university ID" });
    }
    
    const notice = await Notice.findOne().sort({ _id: -1 }).exec();
    const advertisement = await Advertisement.findOne().sort({ _id: -1 }).exec();
    const popup = await Popup.findOne({ isActive: true }).exec();
    
    const universityData = await University.findOne({ _id: req.params.id })
      .populate("coursesOffered")
      .populate("affiliatedColleges")
      .exec();
      
    if (!universityData) {
      return res.status(404).json({ success: false, error: "University not found" });
    }
    
    const courses = universityData.coursesOffered;
    const colleges = normalizeCollectionMedia(
      universityData.affiliatedColleges,
      mediaFieldMaps.college
    );
    
    res.json({
      success: true,
      data: {
        universityData: normalizeMediaFields(universityData, mediaFieldMaps.university),
        courses,
        colleges,
        notice,
        advertisement: normalizeMediaFields(advertisement, mediaFieldMaps.advertisement),
        popup: normalizeMediaFields(popup, mediaFieldMaps.popup),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const GetUniversities = async (req, res) => {
  try {
    const universitiesLength = (await University.find().exec()).length;
    const limit = 9;
    const page = parseInt(req.query.page) || 1;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    let previousPage = 0;
    let nextPage = 0;

    if (endIndex < universitiesLength) {
      nextPage = page + 1;
    }

    if (startIndex > 0) {
      previousPage = page - 1;
    }

    const search = req.query.searchUniversity;
    const location = req.query.location;

    const notice = await Notice.findOne().sort({ _id: -1 }).exec();
    const advertisement = await Advertisement.findOne().sort({ _id: -1 }).exec();
    const popup = await Popup.findOne({ isActive: true }).exec();

    let universities = [];
    let noResult = false;

    if (!search && !location) {
      universities = await University.find()
        .skip(startIndex)
        .limit(limit)
        .populate("coursesOffered")
        .populate("affiliatedColleges")
        .exec();
    } else if (location && search) {
      universities = await University.find({
        universityName: { $regex: search, $options: "i" },
        universityAddress: { $regex: location, $options: "i" },
      })
        .populate("coursesOffered")
        .populate("affiliatedColleges")
        .exec();
      nextPage = 0;
      noResult = universities.length === 0;
    } else if (search) {
      universities = await University.find({
        universityName: { $regex: search, $options: "i" },
      })
        .populate("coursesOffered")
        .populate("affiliatedColleges")
        .exec();
      nextPage = 0;
      noResult = universities.length === 0;
    } else if (location) {
      universities = await University.find({
        universityAddress: { $regex: location, $options: "i" },
      })
        .populate("coursesOffered")
        .populate("affiliatedColleges")
        .exec();
      nextPage = 0;
      noResult = universities.length === 0;
    }

    res.json({
      success: true,
      data: {
        universities: normalizeCollectionMedia(universities, mediaFieldMaps.university),
        notice,
        advertisement: normalizeMediaFields(advertisement, mediaFieldMaps.advertisement),
        previousPage,
        nextPage,
        search,
        location,
        popup: normalizeMediaFields(popup, mediaFieldMaps.popup),
        noResult,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export { UniversityDetail, GetUniversities };
