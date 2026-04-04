const RESULT_COURSES = Object.freeze([
  {
    code: "CSIT",
    name: "CSIT",
    fullName: "BSc.CSIT",
    aliases: ["BSC CSIT", "BSC.CSIT", "BSC-CSIT", "CSIT"],
    templateSubjects: ["Physics", "English", "Math", "Chemistry"],
  },
  {
    code: "BIT",
    name: "BIT",
    fullName: "Bachelor of Information Technology",
    aliases: ["BIT", "BACHELOR OF INFORMATION TECHNOLOGY"],
    templateSubjects: ["English", "Computer", "Math"],
  },
  {
    code: "BCA",
    name: "BCA",
    fullName: "Bachelor of Computer Application",
    aliases: ["BCA", "BACHELOR OF COMPUTER APPLICATION"],
    templateSubjects: ["English", "GK", "Math"],
  },
  {
    code: "CMAT",
    name: "CMAT",
    fullName: "CMAT",
    aliases: ["CMAT", "MANAGEMENT APTITUDE TEST"],
    templateSubjects: ["English", "GK", "Math", "Logical Reasoning"],
  },
  {
    code: "IOE",
    name: "IOE",
    fullName: "IOE Entrance",
    aliases: ["IOE", "IOE ENTRANCE", "ENGINEERING"],
    templateSubjects: ["Physics", "Chemistry", "Math", "English"],
  },
]);

const RESULT_COURSE_CODE_SET = new Set(RESULT_COURSES.map((course) => course.code));

const normalizeLookupValue = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const sanitizeCourseCode = (value) =>
  normalizeLookupValue(value)
    .replace(/\s+/g, "_")
    .trim();

const formatCourseName = (value) => {
  const normalizedValue = String(value || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalizedValue) {
    return "";
  }

  return normalizedValue
    .split(" ")
    .map((chunk) => {
      if (chunk.length <= 4 || /^[A-Z0-9]+$/.test(chunk)) {
        return chunk.toUpperCase();
      }

      return chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase();
    })
    .join(" ");
};

const RESULT_COURSE_LOOKUP = RESULT_COURSES.reduce((lookup, course) => {
  const keys = new Set([
    course.code,
    course.name,
    course.fullName,
    ...(course.aliases || []),
  ]);

  keys.forEach((key) => {
    const normalizedKey = normalizeLookupValue(key);
    if (normalizedKey) {
      lookup.set(normalizedKey, course);
    }
  });

  return lookup;
}, new Map());

const buildCustomResultCourse = (value, fallbackName = "") => {
  const code = sanitizeCourseCode(value);
  if (!code) {
    return null;
  }

  const name = String(fallbackName || "").trim() || formatCourseName(code);
  return {
    code,
    name,
    fullName: name,
    aliases: [code],
    templateSubjects: [],
  };
};

const normalizeCourseCode = (value, options = {}) => {
  const normalizedValue = normalizeLookupValue(value);
  if (!normalizedValue) {
    return "";
  }

  const knownCourseCode = RESULT_COURSE_LOOKUP.get(normalizedValue)?.code;
  if (knownCourseCode) {
    return knownCourseCode;
  }

  if (options.allowCustom === false) {
    return "";
  }

  return sanitizeCourseCode(normalizedValue);
};

const getResultCourse = (value, options = {}) => {
  const code = normalizeCourseCode(value, options);
  if (!code) {
    return null;
  }

  return (
    RESULT_COURSES.find((course) => course.code === code) ||
    buildCustomResultCourse(code, options.name)
  );
};

const buildCourseTemplateHeaders = (courseCode, options = {}) => {
  const course = getResultCourse(courseCode, options);
  const subjects =
    course?.templateSubjects?.length > 0
      ? course.templateSubjects
      : ["Subject 1", "Subject 2", "Subject 3"];
  const headers = ["Symbol No.", "Student Name", "Course", "Exam Date"];

  subjects.forEach((_, index) => {
    const subjectNumber = index + 1;
    headers.push(`Subject ${subjectNumber} Name`);
    headers.push(`Subject ${subjectNumber} Full Marks`);
    headers.push(`Subject ${subjectNumber} Pass Marks`);
    headers.push(`Subject ${subjectNumber} Obtained Marks`);
  });

  headers.push("Remarks");
  return headers;
};

const buildCourseTemplateExampleRow = (courseCode, options = {}) => {
  const course = getResultCourse(courseCode, options);
  const subjects =
    course?.templateSubjects?.length > 0
      ? course.templateSubjects
      : ["Subject 1", "Subject 2", "Subject 3"];
  const row = {
    "Symbol No.": "2082-001",
    "Student Name": "Sample Student",
    Course: course?.code || courseCode || "CSIT",
    "Exam Date": "2026-04-01",
  };

  subjects.forEach((subjectName, index) => {
    const subjectNumber = index + 1;
    row[`Subject ${subjectNumber} Name`] = subjectName;
    row[`Subject ${subjectNumber} Full Marks`] = 100;
    row[`Subject ${subjectNumber} Pass Marks`] = 40;
    row[`Subject ${subjectNumber} Obtained Marks`] = 65 + index * 4;
  });

  row.Remarks = "Good performance";
  return row;
};

export {
  buildCustomResultCourse,
  RESULT_COURSES,
  RESULT_COURSE_CODE_SET,
  buildCourseTemplateExampleRow,
  buildCourseTemplateHeaders,
  formatCourseName,
  getResultCourse,
  normalizeCourseCode,
  normalizeLookupValue,
  sanitizeCourseCode,
};
