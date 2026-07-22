import College from "../models/College.js";
import Advertisement from "../models/Advertisement.js";
import Popup from "../models/Popup.js";
import mongoose from "mongoose";
import { getPublicNotice } from "../utils/notice.js";
import {
  mediaFieldMaps,
  normalizeCollectionMedia,
  normalizeMediaFields,
} from "../utils/media.js";

const CollegeDetail = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, error: "Invalid college ID" });
    }
    
    const notice = await getPublicNotice();
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
        collegeData: normalizeMediaFields(collegeData, mediaFieldMaps.college),
        courses,
        notice,
        advertisement: normalizeMediaFields(advertisement, mediaFieldMaps.advertisement),
        popup: normalizeMediaFields(popup, mediaFieldMaps.popup),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const GetColleges = async (req, res) => {
  try {
    const limit = 10;
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const startIndex = (page - 1) * limit;
    const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const search = String(req.query.searchCollege || "").trim().slice(0, 100);
    const location = String(req.query.location || "").trim().slice(0, 100);
    const filter = {
      ...(search ? { collegeName: { $regex: escapeRegex(search), $options: "i" } } : {}),
      ...(location ? { collegeAddress: { $regex: escapeRegex(location), $options: "i" } } : {}),
    };
    const includeContent = req.query.includeContent === "true";
    const projection = `collegeName collegeAddress universityName collegeLogo collegeLogoMimeType collegeLogoFilename coursesOffered${
      includeContent ? " admissionNotice admissionCloseDate scholarshipInfo createdAt updatedAt" : ""
    }`;
    let collegeQuery = College.find(filter)
      .select(projection)
      .sort({ collegeName: 1 })
      .skip(startIndex)
      .limit(limit);
    if (includeContent) {
      collegeQuery = collegeQuery.populate("coursesOffered", "title fullForm");
    }
    const [collegesLength, colleges] = await Promise.all([
      College.countDocuments(filter),
      collegeQuery.lean(),
    ]);
    const nextPage = startIndex + colleges.length < collegesLength ? page + 1 : 0;
    const previousPage = page > 1 ? page - 1 : 0;
    const noResult = colleges.length === 0;

    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");

    res.json({
      success: true,
      data: {
        colleges: normalizeCollectionMedia(colleges, mediaFieldMaps.college),
        previousPage,
        nextPage,
        search,
        location,
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
