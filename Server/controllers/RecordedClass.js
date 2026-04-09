import RecordedClass from "../models/RecordedClass.js";
import Student from "../models/Student.js";
import jwt from "jsonwebtoken";
import { fetchYoutubePlaylistDetails, resolveRecordedClassMedia } from "../utils/youtube.js";
import { getCourseRegexMatchers, hasCourseAccess } from "../utils/courseAccess.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

const formatRecordedClass = (recordedClass, isPaid) => {
  const media = resolveRecordedClassMedia(recordedClass);

  return {
    id: recordedClass._id.toString(),
    subject: recordedClass.subject,
    topicName: recordedClass.topicName,
    contentType: media.contentType,
    videoId: isPaid ? media.videoId : null,
    playlistId: isPaid ? media.playlistId : null,
    youtubeUrl: isPaid ? media.youtubeUrl : null,
    classDate: recordedClass.classDate,
    description: recordedClass.description,
  };
};

// Get all recorded classes for a student's course
export const getRecordedClasses = async (req, res) => {
  try {
    const token = req.cookies?.studentToken;
    if (!token) {
      return res.json({ classes: [] });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const student = await Student.findOne({ studentId: decoded.studentId });

    if (!student) {
      return res.json({ classes: [] });
    }

    const isPaid = student.accountStatus === "Paid";
    const courseMatchers = getCourseRegexMatchers(student.course);

    // Fetch recorded classes where student's course is in courseIds array
    const recordedClasses = await RecordedClass.find({
      courseIds: { $in: courseMatchers }
    }).sort({
      classDate: -1,
    });

    res.json({
      classes: recordedClasses.map((recordedClass) =>
        formatRecordedClass(recordedClass, isPaid)
      ),
    });
  } catch (error) {
    console.error("Get recorded classes error:", error);
    res.json({ classes: [] });
  }
};

// Get single recorded class details
export const getRecordedClassDetails = async (req, res) => {
  try {
    const { classId } = req.params;
    const token = req.cookies?.studentToken;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const student = await Student.findOne({ studentId: decoded.studentId });

    if (!student) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const isPaid = student.accountStatus === "Paid";
    if (!isPaid) {
      return res.status(403).json({ error: "Complete payment to access recorded classes." });
    }

    const recordedClass = await RecordedClass.findById(classId);

    if (!recordedClass) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Verify student has access to this class
    // Check if student's course is in the video's courseIds array
    if (!hasCourseAccess(student.course, recordedClass.courseIds)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const media = resolveRecordedClassMedia(recordedClass);
    let playlist =
      media.contentType === "playlist" && media.playlistId
        ? {
            playlistId: media.playlistId,
            title: recordedClass.topicName,
            videos: [],
          }
        : null;

    if (media.contentType === "playlist" && media.playlistId) {
      try {
        const playlistDetails = await fetchYoutubePlaylistDetails(media.playlistId);
        if (playlistDetails) {
          playlist = playlistDetails;
        }
      } catch (playlistError) {
        console.error("Fetch YouTube playlist details error:", playlistError);
      }
    }

    res.json({
      ...formatRecordedClass(recordedClass, true),
      playlist,
    });
  } catch (error) {
    console.error("Get recorded class details error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
};
