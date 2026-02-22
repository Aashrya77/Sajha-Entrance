import Notice from "../models/Notice.js";
import Course from "../models/Course.js";
import College from "../models/College.js";
import Advertisement from "../models/Advertisement.js";
import Popup from "../models/Popup.js";
import mongoose from "mongoose";

// Helper function to format plain text content
function formatContent(text) {
  if (!text) return '<p>Information will be updated soon.</p>';

  // Split by double line breaks to create paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());

  return paragraphs.map(paragraph => {
    let formatted = paragraph.trim();

    // Handle bullet points (lines starting with - or *)
    if (formatted.includes('\n-') || formatted.includes('\n*')) {
      const lines = formatted.split('\n');
      const hasBullets = lines.some(line => line.trim().startsWith('-') || line.trim().startsWith('*'));

      if (hasBullets) {
        const listItems = lines
          .filter(line => line.trim())
          .map(line => {
            const cleanLine = line.trim().replace(/^[-*]\s*/, '');
            return `<li>${cleanLine}</li>`;
          })
          .join('');

        return `<ul>${listItems}</ul>`;
      }
    }

    // Handle numbered lists (lines starting with numbers)
    if (formatted.includes('\n1.') || formatted.includes('\n2.') || formatted.includes('\n3.')) {
      const lines = formatted.split('\n');
      const hasNumbers = lines.some(line => /^\d+\./.test(line.trim()));

      if (hasNumbers) {
        const listItems = lines
          .filter(line => line.trim())
          .map(line => {
            const cleanLine = line.trim().replace(/^\d+\.\s*/, '');
            return `<li>${cleanLine}</li>`;
          })
          .join('');

        return `<ol>${listItems}</ol>`;
      }
    }

    // Convert single line breaks to <br> tags for regular paragraphs
    formatted = formatted.replace(/\n/g, '<br>');

    // If it looks like a heading (short line, all caps, or ends with colon)
    if (formatted.length < 100 && (formatted === formatted.toUpperCase() || formatted.endsWith(':'))) {
      return `<h3>${formatted.replace(':', '')}</h3>`;
    }

    return `<p>${formatted}</p>`;
  }).join('');
}

const CourseDetail = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, error: "Invalid course ID" });
    }
    
    const notice = await Notice.findOne().sort({ _id: -1 }).exec();
    const advertisement = await Advertisement.findOne().sort({ _id: -1 }).exec();
    const popup = await Popup.findOne({ isActive: true }).exec();
    
    const courseData = await Course.findOne(
      { _id: req.params.id },
      { colleges: { $slice: -6 } }
    )
      .populate("colleges.collegeDetails")
      .exec();
      
    if (!courseData) {
      return res.status(404).json({ success: false, error: "Course not found" });
    }
    
    const courses = await Course.find().exec();
    const colleges = courseData.colleges;
    
    res.json({
      success: true,
      data: {
        courseData,
        courses,
        colleges,
        notice,
        advertisement,
        popup
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const GetCourses = async (req, res) => {
  try {
    const notice = await Notice.findOne().sort({ _id: -1 }).exec();
    const courses = await Course.find().limit(6).exec();
    const advertisement = await Advertisement.findOne().sort({ _id: -1 }).exec();
    const popup = await Popup.findOne({ isActive: true }).exec();
    const colleges = await College.aggregate([{ $sample: { size: 6 } }]).exec();
    
    res.json({
      success: true,
      data: {
        courses,
        colleges,
        notice,
        advertisement,
        popup
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export { CourseDetail, GetCourses };
