import XLSX from "xlsx";
import StudentResult, {
  normalizeSymbolNumber as normalizeStoredSymbolNumber,
} from "../models/StudentResult.js";
import ResultExam from "../models/ResultExam.js";
import {
  RESULT_COURSES,
  buildCourseTemplateExampleRow,
  buildCourseTemplateHeaders,
  formatCourseName,
  getResultCourse,
  normalizeCourseCode,
  normalizeLookupValue,
} from "../constants/resultCourses.js";

const PREVIEW_ROW_LIMIT = 12;
const SAMPLE_ROW_LIMIT = 5;
const DEFAULT_TOPPER_LIMIT = 10;
const LEGACY_EXAM_TITLE_PREFIX = "Legacy Result";
const RESULT_EXAM_STATUSES = new Set(["draft", "scheduled", "published"]);
const SUPPORTED_TEMPLATE_FORMATS = new Set(["csv", "xlsx"]);

const FIELD_ALIASES = {
  symbolNumber: [
    "symbol_number",
    "symbol_no",
    "symbolno",
    "symbol",
    "roll_number",
    "roll_no",
    "rollno",
    "roll",
  ],
  studentName: ["student_name", "name", "student", "full_name"],
  course: ["course", "course_name", "course_code"],
  examDate: ["exam_date", "date", "test_date", "mock_test_date"],
  remarks: ["remarks", "remark", "comment", "comments", "note", "notes"],
};

const SUBJECT_GROUP_PATTERN =
  /^subject_?(\d+)_?(name|fullmarks|full_marks|passmarks|pass_marks|obtainedmarks|obtained_marks|marks_obtained|obtained|score)(?:_(.+))?$/;

const SUBJECT_MARK_PATTERN =
  /^(.*)_(fullmarks|full_marks|passmarks|pass_marks|obtainedmarks|obtained_marks|marks_obtained|obtained|score)$/;

const SUBJECT_FIELD_LABELS = {
  name: "Subject Name",
  fullMarks: "Full Marks",
  passMarks: "Pass Marks",
  obtainedMarks: "Obtained Marks",
};

function matchesFieldAlias(value, fieldName) {
  const normalizedValue = normalizeHeaderKey(value);
  if (!normalizedValue) {
    return false;
  }

  const aliases = FIELD_ALIASES[fieldName] || [];
  return [fieldName, ...aliases].some(
    (alias) => normalizeHeaderKey(alias) === normalizedValue
  );
}

function normalizeHeaderKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const BASE_FIELD_KEYS = new Set(
  Object.values(FIELD_ALIASES).flat().map((value) => normalizeHeaderKey(value))
);

function normalizeSubjectName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function formatSubjectLabel(value) {
  const normalizedValue = normalizeSubjectName(value);
  if (!normalizedValue) {
    return "";
  }

  return normalizedValue
    .split(" ")
    .map((chunk) => {
      if (chunk.length <= 3 || /^[A-Z0-9]+$/.test(chunk)) {
        return chunk.toUpperCase();
      }

      return chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase();
    })
    .join(" ");
}

function canonicalSubjectField(rawField) {
  const normalizedField = normalizeHeaderKey(rawField).replace(/_/g, "");
  if (normalizedField === "name") {
    return "name";
  }
  if (normalizedField === "fullmarks") {
    return "fullMarks";
  }
  if (normalizedField === "passmarks") {
    return "passMarks";
  }
  if (["obtainedmarks", "marksobtained", "obtained", "score"].includes(normalizedField)) {
    return "obtainedMarks";
  }
  return "";
}

function getFieldValue(row, fieldName) {
  const aliases = FIELD_ALIASES[fieldName] || [];

  for (const alias of [fieldName, ...aliases]) {
    const normalizedAlias = normalizeHeaderKey(alias);
    if (
      row[normalizedAlias] !== undefined &&
      row[normalizedAlias] !== null &&
      `${row[normalizedAlias]}`.trim() !== ""
    ) {
      return row[normalizedAlias];
    }
  }

  return "";
}

function parseNumericValue(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const normalizedValue = String(value).replace(/,/g, "").trim();
  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function toUtcStartOfDay(value) {
  const date = new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function parseDateValue(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toUtcStartOfDay(value);
  }

  if (typeof value === "number") {
    const parsedDate = XLSX.SSF.parse_date_code(value);
    if (!parsedDate) {
      return null;
    }

    return new Date(
      Date.UTC(parsedDate.y, (parsedDate.m || 1) - 1, parsedDate.d || 1)
    );
  }

  const normalizedValue = String(value).trim();
  if (!normalizedValue) {
    return null;
  }

  const parsedDate = new Date(normalizedValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return toUtcStartOfDay(parsedDate);
}

function parseDateTimeValue(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value);
  }

  if (typeof value === "number") {
    const parsedDate = XLSX.SSF.parse_date_code(value);
    if (!parsedDate) {
      return null;
    }

    return new Date(
      Date.UTC(
        parsedDate.y,
        (parsedDate.m || 1) - 1,
        parsedDate.d || 1,
        parsedDate.H || 0,
        parsedDate.M || 0,
        parsedDate.S || 0
      )
    );
  }

  const normalizedValue = String(value).trim();
  if (!normalizedValue) {
    return null;
  }

  const parsedDate = new Date(normalizedValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function normalizeStatusValue(value) {
  const normalizedValue = String(value || "").trim().toLowerCase();
  return RESULT_EXAM_STATUSES.has(normalizedValue) ? normalizedValue : "draft";
}

function buildVisibleResultExamQuery(extraQuery = {}) {
  return {
    ...extraQuery,
    $or: [
      { status: "published" },
      {
        status: "scheduled",
        publishDate: { $lte: new Date() },
      },
    ],
  };
}

function sameCalendarDate(left, right) {
  if (!left || !right) {
    return false;
  }

  return toUtcStartOfDay(left).getTime() === toUtcStartOfDay(right).getTime();
}

function convertRawRows(rows) {
  return rows.map((rawRow) => {
    const normalizedRow = {};

    Object.entries(rawRow || {}).forEach(([key, value]) => {
      const normalizedKey = normalizeHeaderKey(key);
      if (!normalizedKey) {
        return;
      }

      normalizedRow[normalizedKey] = value;
    });

    return { rawRow, normalizedRow };
  });
}

function getSheetHeaderValue(cell) {
  if (!cell) {
    return "";
  }

  if (cell.w !== undefined && cell.w !== null && String(cell.w).trim() !== "") {
    return String(cell.w).trim();
  }

  if (cell.v === undefined || cell.v === null) {
    return "";
  }

  return String(cell.v).trim();
}

function getSymbolCellText(cell) {
  if (!cell) {
    return "";
  }

  if (typeof cell.v === "string") {
    return cell.v.trim();
  }

  if (cell.w !== undefined && cell.w !== null && String(cell.w).trim() !== "") {
    return String(cell.w).trim();
  }

  if (cell.v === undefined || cell.v === null) {
    return "";
  }

  return String(cell.v).trim();
}

function getSheetCellValue(cell) {
  if (!cell) {
    return "";
  }

  if (cell.v === undefined || cell.v === null) {
    return "";
  }

  return cell.v;
}

function resolveBaseFieldLabel(headerKey) {
  const normalizedHeader = normalizeHeaderKey(headerKey);
  const matchedField = Object.entries(FIELD_ALIASES).find(([, aliases]) =>
    aliases.some((alias) => normalizeHeaderKey(alias) === normalizedHeader)
  );

  if (!matchedField) {
    return "";
  }

  const fieldLabels = {
    symbolNumber: "Symbol Number",
    studentName: "Student Name",
    course: "Course",
    examDate: "Exam Date",
    remarks: "Remarks",
  };

  return fieldLabels[matchedField[0]] || "";
}

function describeDetectedColumns(parsedRows = []) {
  const orderedHeaders = [];
  const seenHeaders = new Set();

  parsedRows.forEach(({ rawRow }) => {
    Object.keys(rawRow || {}).forEach((header) => {
      if (seenHeaders.has(header)) {
        return;
      }

      seenHeaders.add(header);
      orderedHeaders.push(header);
    });
  });

  return orderedHeaders.map((header) => {
    const normalizedHeader = normalizeHeaderKey(header);
    const baseFieldLabel = resolveBaseFieldLabel(normalizedHeader);
    if (baseFieldLabel) {
      return {
        header,
        normalizedHeader,
        mappedTo: baseFieldLabel,
        kind: "base",
      };
    }

    const groupedMatch = normalizedHeader.match(SUBJECT_GROUP_PATTERN);
    if (groupedMatch) {
      const [, subjectIndex, rawFieldName] = groupedMatch;
      const canonicalField = canonicalSubjectField(rawFieldName);
      return {
        header,
        normalizedHeader,
        mappedTo: canonicalField
          ? `Subject ${subjectIndex} ${SUBJECT_FIELD_LABELS[canonicalField]}`
          : "Subject Field",
        kind: "subject",
      };
    }

    const namedMatch = normalizedHeader.match(SUBJECT_MARK_PATTERN);
    if (namedMatch) {
      const [, rawSubjectName, rawFieldName] = namedMatch;
      const canonicalField = canonicalSubjectField(rawFieldName);
      return {
        header,
        normalizedHeader,
        mappedTo: canonicalField
          ? `${formatSubjectLabel(rawSubjectName.replace(/_/g, " "))} ${
              SUBJECT_FIELD_LABELS[canonicalField]
            }`
          : "Subject Field",
        kind: "subject",
      };
    }

    return {
      header,
      normalizedHeader,
      mappedTo: "Not mapped",
      kind: "unknown",
    };
  });
}

function buildSampleRows(parsedRows = []) {
  return parsedRows.slice(0, SAMPLE_ROW_LIMIT).map((row, index) => ({
    rowNumber: index + 2,
    data: row.rawRow,
  }));
}

function isEmptyUploadRow(row) {
  return !Object.values(row || {}).some((value) => {
    if (value === undefined || value === null) {
      return false;
    }

    if (typeof value === "string") {
      return value.trim() !== "";
    }

    return true;
  });
}

function extractSubjectsFromGroupedColumns(normalizedRow) {
  const groups = new Map();

  Object.entries(normalizedRow).forEach(([key, value]) => {
    const match = key.match(SUBJECT_GROUP_PATTERN);
    if (!match) {
      return;
    }

    const [, index, field, suffix] = match;
    const canonicalField = canonicalSubjectField(field);
    if (!canonicalField) {
      return;
    }

    const group = groups.get(index) || {};
    group[canonicalField] = value;
    if (suffix) {
      group.headerSubject = formatSubjectLabel(suffix.replace(/_/g, " "));
    }
    groups.set(index, group);
  });

  return Array.from(groups.entries())
    .sort((left, right) => Number(left[0]) - Number(right[0]))
    .map(([, group]) => {
      const subjectName = normalizeSubjectName(group.name || group.headerSubject || "");
      const fullMarks = parseNumericValue(group.fullMarks);
      const passMarks = parseNumericValue(group.passMarks);
      const obtainedMarks = parseNumericValue(group.obtainedMarks);
      const hasValue = [subjectName, fullMarks, passMarks, obtainedMarks].some(
        (value) => value !== null && value !== ""
      );

      if (!hasValue) {
        return null;
      }

      return {
        subjectName,
        fullMarks,
        passMarks,
        obtainedMarks,
      };
    })
    .filter(Boolean);
}

function extractSubjectsFromNamedColumns(normalizedRow) {
  const groups = new Map();

  Object.entries(normalizedRow).forEach(([key, value]) => {
    if (BASE_FIELD_KEYS.has(key)) {
      return;
    }

    const match = key.match(SUBJECT_MARK_PATTERN);
    if (!match) {
      return;
    }

    const [, rawSubjectName, field] = match;
    const canonicalField = canonicalSubjectField(field);
    if (!canonicalField) {
      return;
    }

    const subjectName = formatSubjectLabel(rawSubjectName.replace(/_/g, " "));
    if (!subjectName) {
      return;
    }

    const group = groups.get(subjectName) || { subjectName };
    group[canonicalField] = value;
    groups.set(subjectName, group);
  });

  return Array.from(groups.values()).map((group) => ({
    subjectName: normalizeSubjectName(group.subjectName),
    fullMarks: parseNumericValue(group.fullMarks),
    passMarks: parseNumericValue(group.passMarks),
    obtainedMarks: parseNumericValue(group.obtainedMarks),
  }));
}

function extractSubjectsFromRow(normalizedRow) {
  const groupedSubjects = extractSubjectsFromGroupedColumns(normalizedRow);
  if (groupedSubjects.length > 0) {
    return groupedSubjects;
  }

  return extractSubjectsFromNamedColumns(normalizedRow);
}

function calculateResultMetrics(subjects = []) {
  const preparedSubjects = subjects.map((subject) => {
    const fullMarks = Number(subject.fullMarks || 0);
    const passMarks = Number(subject.passMarks || 0);
    const obtainedMarks = Number(subject.obtainedMarks || 0);
    const status = obtainedMarks >= passMarks ? "Pass" : "Fail";

    return {
      subjectName: normalizeSubjectName(subject.subjectName),
      fullMarks,
      passMarks,
      obtainedMarks,
      status,
    };
  });

  const totalFullMarks = preparedSubjects.reduce(
    (sum, subject) => sum + subject.fullMarks,
    0
  );
  const totalPassMarks = preparedSubjects.reduce(
    (sum, subject) => sum + subject.passMarks,
    0
  );
  const totalObtainedMarks = preparedSubjects.reduce(
    (sum, subject) => sum + subject.obtainedMarks,
    0
  );
  const percentage =
    totalFullMarks > 0
      ? Number(((totalObtainedMarks / totalFullMarks) * 100).toFixed(2))
      : 0;
  const resultStatus = preparedSubjects.every((subject) => subject.status === "Pass")
    ? "Pass"
    : "Fail";

  return {
    subjects: preparedSubjects,
    totalFullMarks,
    totalPassMarks,
    totalObtainedMarks,
    percentage,
    resultStatus,
    result: resultStatus,
  };
}

function buildExamTemplateSubjects(subjects = []) {
  return subjects.map((subject, index) => ({
    name: normalizeSubjectName(subject.subjectName || subject.name),
    code: normalizeLookupValue(subject.subjectName || subject.name).replace(/\s+/g, "_"),
    fullMarks: Number(subject.fullMarks || 0),
    passMarks: Number(subject.passMarks || 0),
    displayOrder: index,
  }));
}

function mapSubjectByNormalizedName(subjects = []) {
  return subjects.reduce((map, subject) => {
    const normalizedName = normalizeLookupValue(subject.subjectName || subject.name);
    if (normalizedName) {
      map.set(normalizedName, subject);
    }
    return map;
  }, new Map());
}

function alignSubjectsToTemplate(subjects, templateSubjects) {
  const subjectMap = mapSubjectByNormalizedName(subjects);
  const alignedSubjects = [];
  const errors = [];

  templateSubjects.forEach((templateSubject) => {
    const normalizedTemplateName = normalizeLookupValue(templateSubject.name);
    const matchedSubject = subjectMap.get(normalizedTemplateName);

    if (!matchedSubject) {
      errors.push(`Missing subject "${templateSubject.name}".`);
      return;
    }

    const fullMarks = Number(matchedSubject.fullMarks || 0);
    const passMarks = Number(matchedSubject.passMarks || 0);
    if (
      fullMarks !== Number(templateSubject.fullMarks || 0) ||
      passMarks !== Number(templateSubject.passMarks || 0)
    ) {
      errors.push(
        `Subject "${templateSubject.name}" marks do not match the selected exam template.`
      );
      return;
    }

    alignedSubjects.push({
      subjectName: templateSubject.name,
      fullMarks,
      passMarks,
      obtainedMarks: Number(matchedSubject.obtainedMarks || 0),
    });
  });

  const templateSubjectNames = new Set(
    templateSubjects.map((subject) => normalizeLookupValue(subject.name))
  );
  const extraSubjects = subjects.filter(
    (subject) =>
      !templateSubjectNames.has(
        normalizeLookupValue(subject.subjectName || subject.name)
      )
  );

  if (extraSubjects.length > 0) {
    errors.push(
      `Unexpected subject(s): ${extraSubjects
        .map((subject) => `"${subject.subjectName || subject.name}"`)
        .join(", ")}.`
    );
  }

  return { alignedSubjects, errors };
}

function buildPreviewRow(importRow) {
  return {
    rowNumber: importRow.rowNumber,
    symbolNumber: importRow.data.symbolNumber,
    studentName: importRow.data.studentName,
    totalObtainedMarks: importRow.data.totalObtainedMarks,
    totalFullMarks: importRow.data.totalFullMarks,
    percentage: importRow.data.percentage,
    resultStatus: importRow.data.resultStatus,
  };
}

function buildCoursePayload(courseCode, fallbackName = "") {
  const course = getResultCourse(courseCode, { name: fallbackName });
  return {
    code: course?.code || courseCode,
    name: course?.name || fallbackName || formatCourseName(courseCode) || courseCode,
    fullName:
      course?.fullName || fallbackName || formatCourseName(courseCode) || courseCode,
    templateSubjects: course?.templateSubjects || [],
  };
}

function sanitizeResultExamRecord(exam = {}) {
  const normalizedCourseCode = normalizeCourseCode(exam.course);
  const courseCode = normalizedCourseCode || String(exam.course || "").trim();
  const course = buildCoursePayload(courseCode, exam.courseName || courseCode);

  return {
    ...exam,
    title: String(exam.title || "Untitled Result Set").trim() || "Untitled Result Set",
    course: courseCode,
    courseName: course.name || courseCode || "Unknown Course",
    examDate: parseDateValue(exam.examDate),
    publishDate: parseDateTimeValue(exam.publishDate),
    description: String(exam.description || "").trim(),
    status: normalizeStatusValue(exam.status),
    subjects: Array.isArray(exam.subjects) ? exam.subjects : [],
    resultCount: Math.max(0, Number(exam.resultCount || 0)),
    lastImportedAt: parseDateTimeValue(exam.lastImportedAt),
    createdAt: parseDateTimeValue(exam.createdAt),
    updatedAt: parseDateTimeValue(exam.updatedAt),
  };
}

function resolveExamPublicationState(payload = {}, existingExam = null) {
  const requestedStatus = normalizeStatusValue(payload.status || existingExam?.status);
  const requestedPublishDate =
    payload.publishDate !== undefined
      ? parseDateTimeValue(payload.publishDate)
      : existingExam?.publishDate || null;

  if (requestedStatus === "published") {
    return {
      status: "published",
      publishDate: requestedPublishDate || new Date(),
    };
  }

  if (requestedStatus === "scheduled") {
    if (!requestedPublishDate) {
      throw new Error("A publish date and time is required for scheduled results.");
    }

    return {
      status: "scheduled",
      publishDate: requestedPublishDate,
    };
  }

  return {
    status: "draft",
    publishDate: requestedPublishDate,
  };
}

function buildEditableExamSubjects(payload = {}) {
  if (!Array.isArray(payload.subjects)) {
    return [];
  }

  const suppliedSubjects = payload.subjects.filter((subject) =>
    normalizeSubjectName(subject?.name || subject?.subjectName)
  );

  if (!suppliedSubjects.length) {
    return [];
  }

  return buildExamTemplateSubjects(suppliedSubjects);
}

async function listAdminResultCourses() {
  const storedCourses = await ResultExam.find({}, { course: 1, courseName: 1, _id: 0 })
    .sort({ course: 1 })
    .lean();

  const courseMap = new Map(
    RESULT_COURSES.map((course) => [course.code, buildCoursePayload(course.code, course.name)])
  );

  storedCourses.forEach((courseEntry) => {
    const normalizedCourseCode = normalizeCourseCode(courseEntry.course);
    if (!normalizedCourseCode) {
      return;
    }

    courseMap.set(
      normalizedCourseCode,
      buildCoursePayload(normalizedCourseCode, courseEntry.courseName || normalizedCourseCode)
    );
  });

  return Array.from(courseMap.values()).sort((left, right) =>
    String(left.name || left.code).localeCompare(String(right.name || right.code))
  );
}

async function listAdminResultExams(filters = {}) {
  const query = {};
  const normalizedCourseCode = normalizeCourseCode(filters.course);

  if (normalizedCourseCode) {
    query.course = normalizedCourseCode;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  const exams = await ResultExam.find(query)
    .sort({ examDate: -1, createdAt: -1 })
    .lean();

  return exams.map((exam) => sanitizeResultExamRecord(exam));
}

async function createResultExam(payload = {}) {
  const normalizedCourseCode = normalizeCourseCode(payload.course);
  if (!normalizedCourseCode) {
    throw new Error("A valid course is required.");
  }

  const examDate = parseDateValue(payload.examDate);
  if (!examDate) {
    throw new Error("A valid exam date is required.");
  }

  const title = String(payload.title || "").trim();
  if (!title) {
    throw new Error("Exam title is required.");
  }

  const { status, publishDate } = resolveExamPublicationState(payload);
  const subjects = buildEditableExamSubjects(payload);
  const course = buildCoursePayload(
    normalizedCourseCode,
    String(payload.courseName || payload.customCourseName || "").trim()
  );

  const exam = await ResultExam.create({
    title,
    course: normalizedCourseCode,
    courseName: course.name || normalizedCourseCode,
    examDate,
    publishDate,
    description: String(payload.description || "").trim(),
    status,
    subjects,
  });

  return sanitizeResultExamRecord(exam.toObject());
}

async function updateResultExam(examId, payload = {}) {
  const exam = await ResultExam.findById(examId);
  if (!exam) {
    throw new Error("Selected exam could not be found.");
  }

  const normalizedCourseCode = normalizeCourseCode(payload.course || exam.course);
  if (!normalizedCourseCode) {
    throw new Error("A valid course is required.");
  }

  if (exam.resultCount > 0 && normalizedCourseCode !== exam.course) {
    throw new Error("Course cannot be changed after results have been imported.");
  }

  const title = String(payload.title || exam.title || "").trim();
  if (!title) {
    throw new Error("Exam title is required.");
  }

  const examDate =
    payload.examDate !== undefined ? parseDateValue(payload.examDate) : exam.examDate;
  if (!examDate) {
    throw new Error("A valid exam date is required.");
  }

  const { status, publishDate } = resolveExamPublicationState(payload, exam);
  const subjects =
    Array.isArray(payload.subjects) && payload.subjects.length > 0
      ? buildEditableExamSubjects(payload)
      : exam.subjects || [];
  const course = buildCoursePayload(
    normalizedCourseCode,
    String(payload.courseName || payload.customCourseName || exam.courseName || "").trim()
  );

  exam.title = title;
  exam.course = normalizedCourseCode;
  exam.courseName = course.name || normalizedCourseCode;
  exam.examDate = examDate;
  exam.publishDate = publishDate;
  exam.description =
    payload.description !== undefined
      ? String(payload.description || "").trim()
      : exam.description;
  exam.status = status;
  exam.subjects = subjects;
  await exam.save();

  await StudentResult.updateMany(
    { exam: exam._id },
    {
      $set: {
        course: exam.course,
        courseName: exam.courseName,
        examDate: exam.examDate,
        publishedAt: exam.status === "draft" ? null : exam.publishDate || null,
      },
    }
  );

  if (exam.resultCount > 0) {
    await recalculateExamRanks(exam._id);
  }

  return sanitizeResultExamRecord(exam.toObject());
}

function parseUploadSheet(fileBuffer) {
  const workbook = XLSX.read(fileBuffer, {
    type: "buffer",
    cellDates: true,
    raw: true,
  });
  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];

  if (!firstSheet) {
    throw new Error("The uploaded file does not contain any sheets.");
  }

  const sheetRangeRef = firstSheet["!ref"];
  if (!sheetRangeRef) {
    throw new Error("The uploaded file does not contain any data rows.");
  }

  const range = XLSX.utils.decode_range(sheetRangeRef);
  const headerRowIndex = range.s.r;
  const headers = [];
  const symbolColumnIndexes = new Set();

  for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
    const headerCell = firstSheet[
      XLSX.utils.encode_cell({ r: headerRowIndex, c: columnIndex })
    ];
    const headerValue = getSheetHeaderValue(headerCell);
    headers.push(headerValue);

    if (matchesFieldAlias(headerValue, "symbolNumber")) {
      symbolColumnIndexes.add(columnIndex);
    }
  }

  const rows = [];
  for (let rowIndex = headerRowIndex + 1; rowIndex <= range.e.r; rowIndex += 1) {
    const rawRow = {};
    let hasValue = false;

    for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
      const headerValue = headers[columnIndex - range.s.c];
      if (!headerValue) {
        continue;
      }

      const cell = firstSheet[XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })];
      const cellValue = symbolColumnIndexes.has(columnIndex)
        ? getSymbolCellText(cell)
        : getSheetCellValue(cell);
      const normalizedCellValue =
        cellValue === undefined || cellValue === null ? "" : cellValue;

      rawRow[headerValue] = normalizedCellValue;

      if (!hasValue) {
        if (normalizedCellValue instanceof Date) {
          hasValue = !Number.isNaN(normalizedCellValue.getTime());
        } else if (typeof normalizedCellValue === "string") {
          hasValue = normalizedCellValue.trim() !== "";
        } else {
          hasValue = normalizedCellValue !== "";
        }
      }
    }

    if (hasValue) {
      rows.push(rawRow);
    }
  }

  if (!rows.length) {
    throw new Error("The uploaded file does not contain any data rows.");
  }

  return convertRawRows(rows);
}

async function analyzeResultUpload({
  examId,
  course,
  fileBuffer,
  duplicateStrategy = "block",
}) {
  const normalizedCourseCode = normalizeCourseCode(course);
  if (!normalizedCourseCode) {
    throw new Error("Please select a valid course before uploading results.");
  }

  const exam = await ResultExam.findById(examId).lean();
  if (!exam) {
    throw new Error("Selected exam could not be found.");
  }

  if (exam.course !== normalizedCourseCode) {
    throw new Error("Selected exam does not belong to the selected course.");
  }

  const parsedRows = parseUploadSheet(fileBuffer);
  const templateFromExam =
    Array.isArray(exam.subjects) && exam.subjects.length > 0
      ? buildExamTemplateSubjects(exam.subjects)
      : null;
  let inferredTemplate = templateFromExam ? [...templateFromExam] : null;
  const seenSymbols = new Set();
  const emptyRows = [];
  const errors = [];
  const validRows = [];

  for (let index = 0; index < parsedRows.length; index += 1) {
    const { rawRow, normalizedRow } = parsedRows[index];
    const rowNumber = index + 2;

    if (isEmptyUploadRow(normalizedRow)) {
      emptyRows.push(rowNumber);
      continue;
    }

    const rowErrors = [];
    const symbolNumber = normalizeStoredSymbolNumber(
      getFieldValue(normalizedRow, "symbolNumber")
    );
    const studentName = String(getFieldValue(normalizedRow, "studentName") || "").trim();
    const rowCourseCode = normalizeCourseCode(getFieldValue(normalizedRow, "course"));
    const remarks = String(getFieldValue(normalizedRow, "remarks") || "").trim();
    const rowExamDate = parseDateValue(getFieldValue(normalizedRow, "examDate"));

    if (!symbolNumber) {
      rowErrors.push("Symbol number is required.");
    }

    if (!studentName) {
      rowErrors.push("Student name is required.");
    }

    if (rowCourseCode && rowCourseCode !== normalizedCourseCode) {
      rowErrors.push(
        `Row course "${getFieldValue(normalizedRow, "course")}" does not match the selected course "${normalizedCourseCode}".`
      );
    }

    if (rowExamDate && !sameCalendarDate(rowExamDate, exam.examDate)) {
      rowErrors.push("Exam date in the row does not match the selected exam.");
    }

    const rawSubjects = extractSubjectsFromRow(normalizedRow);
    if (!rawSubjects.length) {
      rowErrors.push("No subject columns were detected in this row.");
    }

    rawSubjects.forEach((subject, subjectIndex) => {
      const subjectLabel = subject.subjectName || `Subject ${subjectIndex + 1}`;

      if (!subject.subjectName) {
        rowErrors.push(`Subject name is required for subject group ${subjectIndex + 1}.`);
      }

      if (subject.fullMarks === null || Number.isNaN(subject.fullMarks)) {
        rowErrors.push(`Full marks are required for "${subjectLabel}".`);
      }

      if (subject.passMarks === null || Number.isNaN(subject.passMarks)) {
        rowErrors.push(`Pass marks are required for "${subjectLabel}".`);
      }

      if (subject.obtainedMarks === null || Number.isNaN(subject.obtainedMarks)) {
        rowErrors.push(`Obtained marks are required for "${subjectLabel}".`);
      }

      if (subject.fullMarks !== null && subject.fullMarks < 0) {
        rowErrors.push(`Full marks cannot be negative for "${subjectLabel}".`);
      }

      if (subject.passMarks !== null && subject.passMarks < 0) {
        rowErrors.push(`Pass marks cannot be negative for "${subjectLabel}".`);
      }

      if (subject.obtainedMarks !== null && subject.obtainedMarks < 0) {
        rowErrors.push(`Obtained marks cannot be negative for "${subjectLabel}".`);
      }

      if (
        subject.fullMarks !== null &&
        subject.passMarks !== null &&
        subject.passMarks > subject.fullMarks
      ) {
        rowErrors.push(`Pass marks cannot exceed full marks for "${subjectLabel}".`);
      }

      if (
        subject.fullMarks !== null &&
        subject.obtainedMarks !== null &&
        subject.obtainedMarks > subject.fullMarks
      ) {
        rowErrors.push(`Obtained marks cannot exceed full marks for "${subjectLabel}".`);
      }
    });

    if (symbolNumber) {
      if (seenSymbols.has(symbolNumber)) {
        rowErrors.push(
          `Duplicate symbol number "${symbolNumber}" found in the uploaded file for this exam.`
        );
      } else {
        seenSymbols.add(symbolNumber);
      }
    }

    const currentTemplate = inferredTemplate;
    if (currentTemplate && rawSubjects.length > 0) {
      const { alignedSubjects, errors: alignmentErrors } = alignSubjectsToTemplate(
        rawSubjects,
        currentTemplate
      );
      if (alignmentErrors.length > 0) {
        rowErrors.push(...alignmentErrors);
      } else {
        rawSubjects.length = 0;
        alignedSubjects.forEach((subject) => rawSubjects.push(subject));
      }
    }

    if (!inferredTemplate && rawSubjects.length > 0 && rowErrors.length === 0) {
      inferredTemplate = buildExamTemplateSubjects(rawSubjects);
    }

    if (rowErrors.length > 0) {
      errors.push({
        rowNumber,
        symbolNumber,
        messages: rowErrors,
        rowData: rawRow,
      });
      continue;
    }

    const metrics = calculateResultMetrics(rawSubjects);
    validRows.push({
      rowNumber,
      rawRow,
      data: {
        symbolNumber,
        studentName,
        course: normalizedCourseCode,
        courseName: buildCoursePayload(normalizedCourseCode, exam.courseName).name,
        exam: exam._id,
        examDate: exam.examDate,
        remarks,
        ...metrics,
      },
    });
  }

  const existingResults = validRows.length
    ? await StudentResult.find({
        exam: exam._id,
        course: normalizedCourseCode,
        symbolNumber: {
          $in: validRows.map((row) => row.data.symbolNumber),
        },
      })
        .select("_id symbolNumber studentName")
        .lean()
    : [];

  const existingResultMap = existingResults.reduce((map, result) => {
    map.set(result.symbolNumber, result);
    return map;
  }, new Map());

  const importableRows = [];
  const duplicateRows = [];

  validRows.forEach((row) => {
    const existingResult = existingResultMap.get(row.data.symbolNumber);
    if (!existingResult) {
      importableRows.push({ ...row, mode: "insert" });
      return;
    }

    if (duplicateStrategy === "upsert") {
      importableRows.push({
        ...row,
        mode: "update",
        existingResultId: existingResult._id,
      });
      duplicateRows.push({
        rowNumber: row.rowNumber,
        symbolNumber: row.data.symbolNumber,
        studentName: existingResult.studentName,
        action: "update",
      });
      return;
    }

    errors.push({
      rowNumber: row.rowNumber,
      symbolNumber: row.data.symbolNumber,
      messages: [
        `Result already exists for symbol number "${row.data.symbolNumber}" in the selected exam.`,
      ],
      rowData: row.rawRow,
    });
    duplicateRows.push({
      rowNumber: row.rowNumber,
      symbolNumber: row.data.symbolNumber,
      studentName: existingResult.studentName,
      action: "blocked",
    });
  });

  return {
    exam,
    course: buildCoursePayload(normalizedCourseCode, exam.courseName),
    totalRows: parsedRows.length,
    emptyRows,
    errors,
    duplicateRows,
    importableRows,
    inferredTemplate: inferredTemplate || [],
    detectedColumns: describeDetectedColumns(parsedRows),
    sampleRows: buildSampleRows(parsedRows),
    summary: {
      totalRows: parsedRows.length,
      emptyRows: emptyRows.length,
      validRows: validRows.length,
      invalidRows: errors.length,
      importableRows: importableRows.length,
      blockedDuplicates: duplicateRows.filter((row) => row.action === "blocked").length,
      rowsToUpdate: duplicateRows.filter((row) => row.action === "update").length,
      rowsToInsert: importableRows.filter((row) => row.mode === "insert").length,
    },
    previewRows: importableRows.slice(0, PREVIEW_ROW_LIMIT).map(buildPreviewRow),
  };
}

async function previewResultUpload(payload) {
  const analysis = await analyzeResultUpload(payload);

  return {
    success: true,
    exam: sanitizeResultExamRecord(analysis.exam),
    course: analysis.course,
    summary: analysis.summary,
    templateSubjects: analysis.inferredTemplate,
    detectedColumns: analysis.detectedColumns,
    sampleRows: analysis.sampleRows,
    previewRows: analysis.previewRows,
    errors: analysis.errors,
    duplicateRows: analysis.duplicateRows,
    skippedEmptyRows: analysis.emptyRows,
  };
}

function buildResultBulkOperation(row, exam) {
  const basePayload = {
    symbolNumber: row.data.symbolNumber,
    studentName: row.data.studentName,
    course: row.data.course,
    courseName: row.data.courseName,
    exam: exam._id,
    examDate: exam.examDate,
    subjects: row.data.subjects,
    totalFullMarks: row.data.totalFullMarks,
    totalPassMarks: row.data.totalPassMarks,
    totalObtainedMarks: row.data.totalObtainedMarks,
    percentage: row.data.percentage,
    resultStatus: row.data.resultStatus,
    result: row.data.result,
    remarks: row.data.remarks,
    publishedAt: exam.status === "draft" ? null : exam.publishDate || new Date(),
    lastCalculatedAt: new Date(),
    updatedAt: new Date(),
  };

  if (row.mode === "update" && row.existingResultId) {
    return {
      updateOne: {
        filter: { _id: row.existingResultId },
        update: {
          $set: basePayload,
        },
      },
    };
  }

  return {
    insertOne: {
      document: {
        ...basePayload,
        rank: null,
        createdAt: new Date(),
      },
    },
  };
}

function buildSubjectScoreVector(result, subjectOrder) {
  const resultSubjectMap = mapSubjectByNormalizedName(result.subjects || []);

  return subjectOrder.map((subjectName) => {
    const matchedSubject = resultSubjectMap.get(normalizeLookupValue(subjectName));
    return Number(matchedSubject?.obtainedMarks || 0);
  });
}

function compareScoreVectors(leftVector, rightVector) {
  for (let index = 0; index < Math.max(leftVector.length, rightVector.length); index += 1) {
    const leftValue = Number(leftVector[index] || 0);
    const rightValue = Number(rightVector[index] || 0);

    if (leftValue !== rightValue) {
      return rightValue - leftValue;
    }
  }

  return 0;
}

function haveSameRankingScore(left, right, subjectOrder) {
  if (!left || !right) {
    return false;
  }

  if (left.resultStatus !== right.resultStatus) {
    return false;
  }

  if (left.totalObtainedMarks !== right.totalObtainedMarks) {
    return false;
  }

  if (left.percentage !== right.percentage) {
    return false;
  }

  const leftVector = buildSubjectScoreVector(left, subjectOrder);
  const rightVector = buildSubjectScoreVector(right, subjectOrder);
  return compareScoreVectors(leftVector, rightVector) === 0;
}

function sortResultsForRanking(results, subjectOrder) {
  return [...results].sort((left, right) => {
    if (left.resultStatus !== right.resultStatus) {
      return left.resultStatus === "Pass" ? -1 : 1;
    }

    if (left.totalObtainedMarks !== right.totalObtainedMarks) {
      return right.totalObtainedMarks - left.totalObtainedMarks;
    }

    if (left.percentage !== right.percentage) {
      return right.percentage - left.percentage;
    }

    const vectorComparison = compareScoreVectors(
      buildSubjectScoreVector(left, subjectOrder),
      buildSubjectScoreVector(right, subjectOrder)
    );
    if (vectorComparison !== 0) {
      return vectorComparison;
    }

    const nameComparison = String(left.studentName || "").localeCompare(
      String(right.studentName || ""),
      undefined,
      { sensitivity: "base" }
    );
    if (nameComparison !== 0) {
      return nameComparison;
    }

    return String(left.symbolNumber || "").localeCompare(String(right.symbolNumber || ""));
  });
}

function rankResultRows(results, subjectOrder = []) {
  const rankedResults = sortResultsForRanking(results, subjectOrder);
  let previousResult = null;
  let previousRank = 0;

  return rankedResults.map((result, index) => {
    const rank = haveSameRankingScore(result, previousResult, subjectOrder)
      ? previousRank
      : index + 1;

    previousResult = result;
    previousRank = rank;

    return {
      ...result,
      rank,
    };
  });
}

async function recalculateExamRanks(examId) {
  const exam = await ResultExam.findById(examId).lean();
  if (!exam) {
    throw new Error("Exam not found for rank recalculation.");
  }

  const results = await StudentResult.find({ exam: exam._id }).lean();
  const subjectOrder =
    Array.isArray(exam.subjects) && exam.subjects.length > 0
      ? exam.subjects
          .sort((left, right) => (left.displayOrder || 0) - (right.displayOrder || 0))
          .map((subject) => subject.name)
      : Array.from(
          new Set(
            results.flatMap((result) =>
              (result.subjects || []).map((subject) => subject.subjectName)
            )
          )
        );

  const rankedResults = sortResultsForRanking(results, subjectOrder);
  const operations = [];
  let previousResult = null;
  let previousRank = 0;

  rankedResults.forEach((result, index) => {
    const nextRank = haveSameRankingScore(result, previousResult, subjectOrder)
      ? previousRank
      : index + 1;

    operations.push({
      updateOne: {
        filter: { _id: result._id },
        update: { $set: { rank: nextRank } },
      },
    });

    previousResult = result;
    previousRank = nextRank;
  });

  if (operations.length > 0) {
    await StudentResult.bulkWrite(operations, { ordered: false });
  }

  await ResultExam.findByIdAndUpdate(exam._id, {
    $set: {
      resultCount: rankedResults.length,
      updatedAt: new Date(),
    },
  });

  return {
    examId: exam._id,
    updatedRows: rankedResults.length,
  };
}

async function importResultUpload(payload) {
  const analysis = await analyzeResultUpload(payload);
  const exam = await ResultExam.findById(analysis.exam._id);

  if (!exam) {
    throw new Error("Selected exam could not be found.");
  }

  if (
    (!Array.isArray(exam.subjects) || exam.subjects.length === 0) &&
    Array.isArray(analysis.inferredTemplate) &&
    analysis.inferredTemplate.length > 0
  ) {
    exam.subjects = analysis.inferredTemplate;
  }

  exam.lastImportedAt = new Date();
  await exam.save();

  const bulkOperations = analysis.importableRows.map((row) =>
    buildResultBulkOperation(row, exam)
  );

  if (bulkOperations.length > 0) {
    await StudentResult.bulkWrite(bulkOperations, { ordered: false });
  }

  await recalculateExamRanks(exam._id);

  return {
    success: true,
    summary: analysis.summary,
    insertedCount: analysis.importableRows.filter((row) => row.mode === "insert").length,
    updatedCount: analysis.importableRows.filter((row) => row.mode === "update").length,
    skippedCount: analysis.errors.length + analysis.emptyRows.length,
    errors: analysis.errors,
    duplicateRows: analysis.duplicateRows,
    exam: sanitizeResultExamRecord(exam.toObject()),
  };
}

async function listPublishedResultExams(course) {
  const normalizedCourseCode = normalizeCourseCode(course);
  const query = buildVisibleResultExamQuery();

  if (normalizedCourseCode) {
    query.course = normalizedCourseCode;
  }

  return ResultExam.find(query)
    .sort({ examDate: -1, publishDate: -1, createdAt: -1 })
    .lean()
    .then((exams) => exams.map((exam) => sanitizeResultExamRecord(exam)));
}

async function getLatestPublishedExamForCourse(course) {
  const normalizedCourseCode = normalizeCourseCode(course);
  if (!normalizedCourseCode) {
    return null;
  }

  return ResultExam.findOne(
    buildVisibleResultExamQuery({
      course: normalizedCourseCode,
    })
  )
    .sort({ examDate: -1, publishDate: -1, createdAt: -1 })
    .lean()
    .then((exam) => (exam ? sanitizeResultExamRecord(exam) : null));
}

function mapResultForPublic(result, exam) {
  return {
    id: result._id,
    studentName: result.studentName,
    symbolNumber: result.symbolNumber,
    course: result.course,
    courseName:
      result.courseName ||
      buildCoursePayload(result.course, exam?.courseName || result.course).name,
    examId: exam?._id || result.exam,
    examTitle: exam?.title || "",
    examDate: exam?.examDate || result.examDate,
    publishDate: exam?.publishDate || result.publishedAt,
    status: exam?.status || "draft",
    subjects: result.subjects || [],
    totalFullMarks: result.totalFullMarks,
    totalPassMarks: result.totalPassMarks,
    totalObtainedMarks: result.totalObtainedMarks,
    percentage: result.percentage,
    resultStatus: result.resultStatus || result.result,
    result: result.result || result.resultStatus,
    rank: result.rank,
    remarks: result.remarks || "",
    publishedAt: result.publishedAt || exam?.publishDate || null,
  };
}

async function searchPublishedResult({ course, symbolNumber, examId }) {
  const normalizedCourseCode = normalizeCourseCode(course);
  const normalizedSymbolNumber = normalizeStoredSymbolNumber(symbolNumber);

  if (!normalizedCourseCode) {
    throw new Error("Course is required.");
  }

  if (!normalizedSymbolNumber) {
    throw new Error("Symbol number is required.");
  }

  const exam = examId
    ? await ResultExam.findOne(
        buildVisibleResultExamQuery({
          _id: examId,
          course: normalizedCourseCode,
        })
      ).lean()
    : await getLatestPublishedExamForCourse(normalizedCourseCode);

  if (!exam) {
    return null;
  }

  const result = await StudentResult.findOne({
    exam: exam._id,
    course: normalizedCourseCode,
    symbolNumber: normalizedSymbolNumber,
  }).lean();

  if (!result) {
    return null;
  }

  return mapResultForPublic(result, exam);
}

async function getPublishedTopResults({ course, examId, limit = DEFAULT_TOPPER_LIMIT }) {
  const normalizedCourseCode = normalizeCourseCode(course);
  const safeLimit = Math.max(1, Math.min(Number(limit) || DEFAULT_TOPPER_LIMIT, 50));

  if (!normalizedCourseCode) {
    const groupedResults = {};

    const adminCourses = await getPublicResultCourses();

    for (const resultCourse of adminCourses) {
      const courseExam = await getLatestPublishedExamForCourse(resultCourse.code);
      if (!courseExam) {
        groupedResults[resultCourse.code] = {
          exam: null,
          students: [],
        };
        continue;
      }

      const results = await StudentResult.find({
        exam: courseExam._id,
        course: resultCourse.code,
        resultStatus: "Pass",
      })
        .sort({ rank: 1, totalObtainedMarks: -1, percentage: -1 })
        .limit(safeLimit)
        .lean();

      groupedResults[resultCourse.code] = {
        exam: courseExam,
        students: results.map((result) => mapResultForPublic(result, courseExam)),
      };
    }

    return groupedResults;
  }

  const exam = examId
    ? await ResultExam.findOne(
        buildVisibleResultExamQuery({
          _id: examId,
          course: normalizedCourseCode,
        })
      ).lean()
    : await getLatestPublishedExamForCourse(normalizedCourseCode);

  if (!exam) {
    return {
      exam: null,
      students: [],
    };
  }

  const results = await StudentResult.find({
    exam: exam._id,
    course: normalizedCourseCode,
    resultStatus: "Pass",
  })
    .sort({ rank: 1, totalObtainedMarks: -1, percentage: -1 })
    .limit(safeLimit)
    .lean();

  return {
    exam,
    students: results.map((result) => mapResultForPublic(result, exam)),
  };
}

async function setResultExamStatus(examId, status, publishDate) {
  const exam = await ResultExam.findById(examId);
  if (!exam) {
    throw new Error("Exam not found.");
  }

  const publicationState = resolveExamPublicationState(
    { status, publishDate },
    exam
  );

  exam.status = publicationState.status;
  exam.publishDate = publicationState.publishDate;
  await exam.save();

  await StudentResult.updateMany(
    { exam: exam._id },
    {
      $set: {
        publishedAt: exam.status === "draft" ? null : exam.publishDate,
      },
    }
  );

  return sanitizeResultExamRecord(exam.toObject());
}

async function deleteResultExamSet(examId) {
  const exam = await ResultExam.findById(examId).lean();
  if (!exam) {
    throw new Error("Exam not found.");
  }

  const deletionResult = await StudentResult.deleteMany({ exam: exam._id });
  await ResultExam.deleteOne({ _id: exam._id });

  return {
    exam,
    deletedResults: deletionResult.deletedCount || 0,
  };
}

function buildTemplateFile({ course, format = "csv" }) {
  const normalizedCourseCode = normalizeCourseCode(course);
  if (!normalizedCourseCode) {
    throw new Error("Template course is required.");
  }

  const normalizedFormat = String(format || "csv").trim().toLowerCase();
  if (!SUPPORTED_TEMPLATE_FORMATS.has(normalizedFormat)) {
    throw new Error("Template format must be either csv or xlsx.");
  }

  const headers = buildCourseTemplateHeaders(normalizedCourseCode);
  const exampleRow = buildCourseTemplateExampleRow(normalizedCourseCode);
  const worksheet = XLSX.utils.json_to_sheet([exampleRow], {
    header: headers,
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Results Template");

  if (normalizedFormat === "xlsx") {
    return {
      filename: `${normalizedCourseCode.toLowerCase()}-result-template.xlsx`,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      }),
    };
  }

  return {
    filename: `${normalizedCourseCode.toLowerCase()}-result-template.csv`,
    contentType: "text/csv; charset=utf-8",
    buffer: Buffer.from(XLSX.utils.sheet_to_csv(worksheet), "utf8"),
  };
}

async function getPublicResultCourses() {
  const visibleExams = await ResultExam.find(
    buildVisibleResultExamQuery(),
    { course: 1, courseName: 1, _id: 0 }
  ).lean();
  const courseMap = new Map(
    RESULT_COURSES.map((course) => [course.code, buildCoursePayload(course.code, course.name)])
  );

  visibleExams.forEach((exam) => {
    const normalizedCourseCode = normalizeCourseCode(exam.course);
    if (!normalizedCourseCode) {
      return;
    }

    courseMap.set(
      normalizedCourseCode,
      buildCoursePayload(normalizedCourseCode, exam.courseName || normalizedCourseCode)
    );
  });

  return Array.from(courseMap.values()).sort((left, right) =>
    String(left.name || left.code).localeCompare(String(right.name || right.code))
  );
}

async function backfillLegacyResultExams() {
  const legacyResults = await StudentResult.find({
    $or: [{ exam: { $exists: false } }, { exam: null }],
  }).lean();

  if (!legacyResults.length) {
    return { migratedGroups: 0, migratedResults: 0 };
  }

  const groups = legacyResults.reduce((map, result) => {
    const normalizedCourseCode =
      normalizeCourseCode(result.course) || String(result.course || "").trim();
    const examDate = parseDateValue(result.examDate) || toUtcStartOfDay(new Date());
    const groupKey = `${normalizedCourseCode}::${examDate.toISOString()}`;

    if (!map.has(groupKey)) {
      map.set(groupKey, {
        course: normalizedCourseCode,
        examDate,
        results: [],
      });
    }

    map.get(groupKey).results.push(result);
    return map;
  }, new Map());

  let migratedGroups = 0;
  let migratedResults = 0;

  for (const group of groups.values()) {
    const title = `${LEGACY_EXAM_TITLE_PREFIX} ${group.course} ${group.examDate
      .toISOString()
      .slice(0, 10)}`;
    const firstResult = group.results[0];
    const templateSubjects = buildExamTemplateSubjects(firstResult.subjects || []);
    const publishDate =
      group.results
        .map((result) => result.publishedAt)
        .filter(Boolean)
        .sort()
        .slice(-1)[0] || new Date();

    const exam = await ResultExam.findOneAndUpdate(
      {
        course: group.course,
        title,
        examDate: group.examDate,
      },
      {
        $setOnInsert: {
          title,
          course: group.course,
          courseName: buildCoursePayload(group.course, group.course).name,
          examDate: group.examDate,
          publishDate,
          status: "published",
          subjects: templateSubjects,
          createdAt: new Date(),
        },
        $set: {
          updatedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    const legacyIds = group.results.map((result) => result._id);
    const updateResult = await StudentResult.updateMany(
      { _id: { $in: legacyIds } },
      {
        $set: {
          exam: exam._id,
          course: group.course,
          courseName: buildCoursePayload(group.course, group.course).name,
          examDate: group.examDate,
          publishedAt: publishDate,
        },
      }
    );

    migratedGroups += 1;
    migratedResults += updateResult.modifiedCount || 0;
    await recalculateExamRanks(exam._id);
  }

  return {
    migratedGroups,
    migratedResults,
  };
}

export {
  backfillLegacyResultExams,
  buildTemplateFile,
  calculateResultMetrics,
  createResultExam,
  deleteResultExamSet,
  listAdminResultCourses,
  getPublicResultCourses,
  getPublishedTopResults,
  importResultUpload,
  rankResultRows,
  listAdminResultExams,
  listPublishedResultExams,
  previewResultUpload,
  recalculateExamRanks,
  searchPublishedResult,
  setResultExamStatus,
  updateResultExam,
};
