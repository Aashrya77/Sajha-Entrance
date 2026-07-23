import Course from "../models/Course.js";
import Advertisement from "../models/Advertisement.js";
import Popup from "../models/Popup.js";
import { getPublicNotice } from "../utils/notice.js";
import { buildPublicIdentifierFilter } from "../utils/slug.js";

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
    const notice = await getPublicNotice();
    const advertisement = await Advertisement.findOne().sort({ _id: -1 }).exec();
    const popup = await Popup.findOne({ isActive: true }).exec();
    
    const courseData = await Course.findOne(buildPublicIdentifierFilter(req.params.id))
      .populate("colleges.collegeDetails")
      .exec();
      
    if (!courseData) {
      return res.status(404).json({ success: false, error: "Course not found" });
    }
    
    const courses = await Course.find().exec();
    // Keep the course settings intact in the response and limit only the
    // related-college list displayed on the detail page.
    const colleges = (courseData.colleges || []).slice(-6);
    
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
    const courses = await Course.find()
      .select("title slug fullForm scholarshipAvailable universityName duration colleges.collegeDetails")
      .sort({ title: 1 })
      .lean();

    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=900");
    
    res.json({
      success: true,
      data: {
        courses,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export { CourseDetail, GetCourses };
