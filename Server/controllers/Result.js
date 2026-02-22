import StudentResult from "../models/StudentResult.js";
import multer from "multer";
import XLSX from "xlsx";

const COURSE_SUBJECTS = {
  BIT: ["English", "Computer", "Math"],
  BCA: ["English", "GK", "Math"],
  CMAT: ["English", "GK", "Math", "Logical Reasoning"],
  CSIT: ["Physics", "English", "Math", "Chemistry"],
};

const VALID_COURSES = Object.keys(COURSE_SUBJECTS);

// Multer config — store file in memory
const upload = multer({ storage: multer.memoryStorage() });

const BulkUploadResults = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded." });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, error: "Excel file is empty or has no data rows." });
    }

    const errors = [];
    const toInsert = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row (1-indexed header + 1)

      const symbolNumber = String(row.symbolNumber || "").trim();
      const studentName = String(row.studentName || "").trim();
      const course = String(row.course || "").trim();
      const examDateRaw = row.examDate;
      const remarks = String(row.remarks || "").trim();

      // Validate required fields
      if (!symbolNumber) {
        errors.push({ row: rowNum, message: "Missing symbolNumber." });
        continue;
      }
      if (!studentName) {
        errors.push({ row: rowNum, message: "Missing studentName." });
        continue;
      }
      if (!VALID_COURSES.includes(course)) {
        errors.push({ row: rowNum, message: `Invalid course "${course}". Must be one of: ${VALID_COURSES.join(", ")}` });
        continue;
      }

      // Parse exam date
      let examDate;
      if (typeof examDateRaw === "number") {
        // Excel serial date number
        examDate = new Date(Math.round((examDateRaw - 25569) * 86400 * 1000));
      } else {
        examDate = new Date(examDateRaw);
      }
      if (isNaN(examDate.getTime())) {
        errors.push({ row: rowNum, message: `Invalid examDate "${examDateRaw}". Use YYYY-MM-DD format.` });
        continue;
      }

      // Parse subject columns dynamically
      // Expected pattern: subject1_name, subject1_fullMarks, subject1_passMarks, subject1_obtainedMarks, subject2_name, ...
      const subjects = [];
      let subIdx = 1;
      while (true) {
        const nameKey = `subject${subIdx}_name`;
        const fullKey = `subject${subIdx}_fullMarks`;
        const passKey = `subject${subIdx}_passMarks`;
        const obtKey = `subject${subIdx}_obtainedMarks`;

        if (row[nameKey] === undefined && row[fullKey] === undefined) {
          break;
        }

        const subjectName = String(row[nameKey] || "").trim();
        const fullMarks = Number(row[fullKey]);
        const passMarks = Number(row[passKey]);
        const obtainedMarks = Number(row[obtKey]);

        if (!subjectName) {
          errors.push({ row: rowNum, message: `subject${subIdx}_name is empty.` });
          break;
        }
        if (isNaN(fullMarks) || isNaN(passMarks) || isNaN(obtainedMarks)) {
          errors.push({ row: rowNum, message: `Invalid marks for subject ${subjectName}. Ensure fullMarks, passMarks, obtainedMarks are numbers.` });
          break;
        }

        subjects.push({ subjectName, fullMarks, passMarks, obtainedMarks });
        subIdx++;
      }

      if (subjects.length === 0) {
        errors.push({ row: rowNum, message: "No subject data found. Use columns: subject1_name, subject1_fullMarks, subject1_passMarks, subject1_obtainedMarks, subject2_name, ..." });
        continue;
      }

      // Validate subject count matches course
      const expectedSubjects = COURSE_SUBJECTS[course];
      if (subjects.length !== expectedSubjects.length) {
        errors.push({
          row: rowNum,
          message: `Course ${course} expects ${expectedSubjects.length} subjects (${expectedSubjects.join(", ")}), but got ${subjects.length}.`,
        });
        continue;
      }

      toInsert.push({
        symbolNumber,
        studentName,
        course,
        examDate,
        subjects,
        remarks,
      });
    }

    // Save valid results
    let inserted = 0;
    for (const data of toInsert) {
      try {
        const doc = new StudentResult(data);
        await doc.save(); // triggers pre-save hook for totals/percentage/result
        inserted++;
      } catch (saveErr) {
        errors.push({
          row: "N/A",
          message: `Failed to save ${data.symbolNumber}: ${saveErr.message}`,
        });
      }
    }

    return res.json({
      success: true,
      inserted,
      skipped: rows.length - inserted,
      total: rows.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const SearchResult = async (req, res) => {
  try {
    const { symbolNumber, course } = req.query;

    if (!course || !course.trim()) {
      return res.status(400).json({
        success: false,
        error: "Course is required",
      });
    }

    if (!symbolNumber || !symbolNumber.trim()) {
      return res.status(400).json({
        success: false,
        error: "Symbol number is required",
      });
    }

    const result = await StudentResult.findOne({
      symbolNumber: symbolNumber.trim(),
      course: course.trim(),
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "No result found for this symbol number",
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const GetTopResults = async (req, res) => {
  try {
    const courses = ["BIT", "BCA", "CMAT", "CSIT"];
    const topResults = {};

    for (const course of courses) {
      topResults[course] = await StudentResult.find(
        { course, result: "Pass" }
      )
        .sort({ percentage: -1 })
        .limit(10)
        .select("symbolNumber studentName course totalObtainedMarks totalFullMarks percentage result")
        .lean();
    }

    res.json({
      success: true,
      data: topResults,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export { SearchResult, GetTopResults, BulkUploadResults, upload };
