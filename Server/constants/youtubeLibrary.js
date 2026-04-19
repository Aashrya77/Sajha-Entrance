import { getCourseMatchValues } from "../utils/courseAccess.js";

export const YOUTUBE_LIBRARY_ALL_COURSES = "All Courses";

export const YOUTUBE_LIBRARY_COURSE_OPTIONS = Object.freeze([
  { value: "BSc.CSIT", label: "BSc CSIT" },
  { value: "BIT", label: "BIT" },
  { value: "BCA", label: "BCA" },
  { value: "CMAT", label: "CMAT" },
  { value: "IOE", label: "IOE" },
  { value: "NEB Preparation", label: "NEB Preparation" },
  { value: YOUTUBE_LIBRARY_ALL_COURSES, label: YOUTUBE_LIBRARY_ALL_COURSES },
]);

const COURSE_CANONICAL_LOOKUP = new Map(
  YOUTUBE_LIBRARY_COURSE_OPTIONS.map((option) => [String(option.value || "").trim().toLowerCase(), option.value])
);

const EXTRA_COURSE_ALIASES = new Map([
  ["bsc csit", "BSc.CSIT"],
  ["bsc.csit", "BSc.CSIT"],
  ["csit", "BSc.CSIT"],
  ["ioe", "IOE"],
  ["iot", "IOE"],
  ["ioe entrance", "IOE"],
  ["engineering", "IOE"],
  ["all", YOUTUBE_LIBRARY_ALL_COURSES],
  ["all courses", YOUTUBE_LIBRARY_ALL_COURSES],
]);

const normalizeLookupValue = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

export const normalizeYouTubeLibraryCourse = (value = "") => {
  const normalizedValue = normalizeLookupValue(value);
  if (!normalizedValue) {
    return "";
  }

  return COURSE_CANONICAL_LOOKUP.get(normalizedValue) || EXTRA_COURSE_ALIASES.get(normalizedValue) || "";
};

export const normalizeYouTubeLibraryCourseList = (value = [], options = {}) => {
  const allowAll = options.allowAll !== false;
  const seen = new Set();
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  const normalizedValues = values
    .flatMap((entry) => (typeof entry === "string" ? entry.split(",") : [entry]))
    .map((entry) => normalizeYouTubeLibraryCourse(entry))
    .filter(Boolean)
    .filter((entry) => {
      if (seen.has(entry)) {
        return false;
      }

      seen.add(entry);
      return true;
    });

  if (allowAll && normalizedValues.includes(YOUTUBE_LIBRARY_ALL_COURSES)) {
    return [YOUTUBE_LIBRARY_ALL_COURSES];
  }

  return normalizedValues;
};

export const getYouTubeLibraryCourseMatchValues = (value = "") => {
  const normalizedCourse = normalizeYouTubeLibraryCourse(value);
  if (!normalizedCourse) {
    return [];
  }

  const values = new Set([
    normalizedCourse,
    ...getCourseMatchValues(normalizedCourse),
  ]);

  if (normalizedCourse === "IOE") {
    values.add("IOT");
    values.add("IOE");
  }

  if (normalizedCourse === "BSc.CSIT") {
    values.add("BSc CSIT");
    values.add("BSC CSIT");
    values.add("CSIT");
  }

  return Array.from(values).map((entry) => String(entry || "").trim()).filter(Boolean);
};

export const hasYouTubeLibraryCourseAccess = (studentCourse = "", allowedCourses = []) => {
  const normalizedAllowedCourses = normalizeYouTubeLibraryCourseList(allowedCourses);

  if (!normalizedAllowedCourses.length || normalizedAllowedCourses.includes(YOUTUBE_LIBRARY_ALL_COURSES)) {
    return true;
  }

  const allowedValueSet = new Set(
    normalizedAllowedCourses.flatMap((course) => getYouTubeLibraryCourseMatchValues(course))
  );

  return getYouTubeLibraryCourseMatchValues(studentCourse).some((course) => allowedValueSet.has(course));
};

