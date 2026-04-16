import XLSX from "xlsx";
import Student from "../../models/Student.js";

const STUDENT_EXPORT_COLUMNS = Object.freeze([
  { key: "studentId", header: "Student ID", width: 16 },
  { key: "name", header: "Name", width: 24 },
  { key: "email", header: "Email", width: 30 },
  { key: "phone", header: "Phone", width: 18 },
  { key: "course", header: "Course", width: 18 },
  { key: "accountStatus", header: "Account Status", width: 16 },
  { key: "collegeName", header: "College Name", width: 24 },
  { key: "address", header: "Address", width: 28 },
  { key: "createdAt", header: "Created At", width: 22 },
]);

const EXCEL_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const formatDateForExport = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (part) => String(part).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const sanitizeExcelValue = (value) => {
  const normalizedValue = String(value ?? "").trim();
  return /^[=+\-@]/.test(normalizedValue) ? `'${normalizedValue}` : normalizedValue;
};

const buildStudentExportFilename = (exportedAt = new Date()) => {
  const date = new Date(exportedAt);
  const safeDate = Number.isNaN(date.getTime())
    ? new Date().toISOString().slice(0, 10)
    : date.toISOString().slice(0, 10);

  return `students-export-${safeDate}.xlsx`;
};

const buildStudentExportRows = (students = []) =>
  students.map((student) => ({
    "Student ID": sanitizeExcelValue(student.studentId),
    Name: sanitizeExcelValue(student.name),
    Email: sanitizeExcelValue(student.email),
    Phone: sanitizeExcelValue(student.phone),
    Course: sanitizeExcelValue(student.course),
    "Account Status": sanitizeExcelValue(student.accountStatus),
    "College Name": sanitizeExcelValue(student.collegeName),
    Address: sanitizeExcelValue(student.address),
    "Created At": formatDateForExport(student.createdAt),
  }));

const createStudentExportWorkbook = (students = []) => {
  const worksheet = XLSX.utils.json_to_sheet(buildStudentExportRows(students), {
    header: STUDENT_EXPORT_COLUMNS.map((column) => column.header),
  });

  worksheet["!cols"] = STUDENT_EXPORT_COLUMNS.map((column) => ({ wch: column.width }));

  if (worksheet["!ref"]) {
    worksheet["!autofilter"] = {
      ref: worksheet["!ref"],
    };
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });
};

const exportStudentsWorkbook = async (_req, res) => {
  try {
    // The route keeps the current AdminJS list query string so filtered export can be
    // added later without changing the frontend action flow.
    const students = await Student.find(
      {},
      "studentId name email phone course accountStatus collegeName address createdAt"
    )
      .sort({ createdAt: -1, studentId: 1 })
      .lean();

    const buffer = createStudentExportWorkbook(students);
    const filename = buildStudentExportFilename();

    res.setHeader("Content-Type", EXCEL_MIME_TYPE);
    res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Cache-Control", "no-store");
    return res.send(buffer);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to export students.",
      details: error.message,
    });
  }
};

export {
  buildStudentExportFilename,
  createStudentExportWorkbook,
  exportStudentsWorkbook,
  EXCEL_MIME_TYPE,
};
