import University from "../models/University.js";
import Course from "../models/Course.js";
import College from "../models/College.js";
import Advertisement from "../models/Advertisement.js";
import Popup from "../models/Popup.js";
import { getPublicNotice } from "../utils/notice.js";
import { buildPublicIdentifierFilter } from "../utils/slug.js";
import {
  mediaFieldMaps,
  normalizeCollectionMedia,
  normalizeMediaFields,
} from "../utils/media.js";

const UniversityDetail = async (req, res) => {
  try {
    const notice = await getPublicNotice();
    const advertisement = await Advertisement.findOne().sort({ _id: -1 }).exec();
    const popup = await Popup.findOne({ isActive: true }).exec();
    
    const universityData = await University.findOne(buildPublicIdentifierFilter(req.params.id))
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
    const limit = 9;
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const startIndex = (page - 1) * limit;
    const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const search = String(req.query.searchUniversity || "").trim().slice(0, 100);
    const location = String(req.query.location || "").trim().slice(0, 100);
    const filter = {
      ...(search ? { universityName: { $regex: escapeRegex(search), $options: "i" } } : {}),
      ...(location ? { universityAddress: { $regex: escapeRegex(location), $options: "i" } } : {}),
    };
    const includeContent = req.query.includeContent === "true";
    const projection = `universityName slug universityAddress type establishedYear universityLogo coursesOffered affiliatedColleges${
      includeContent ? " admissionNotice admissionCloseDate scholarshipInfo createdAt updatedAt" : ""
    }`;
    let universityQuery = University.find(filter)
      .select(projection)
      .sort({ universityName: 1 })
      .skip(startIndex)
      .limit(limit);
    if (includeContent) {
      universityQuery = universityQuery.populate("coursesOffered", "title fullForm");
    }
    const [universitiesLength, universities] = await Promise.all([
      University.countDocuments(filter),
      universityQuery.lean(),
    ]);
    const nextPage = startIndex + universities.length < universitiesLength ? page + 1 : 0;
    const previousPage = page > 1 ? page - 1 : 0;
    const noResult = universities.length === 0;

    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");

    res.json({
      success: true,
      data: {
        universities: normalizeCollectionMedia(universities, mediaFieldMaps.university),
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

export { UniversityDetail, GetUniversities };
