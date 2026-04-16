export const NEB_PREPARATION_COURSE = "NEB Preparation";

export const STUDENT_COURSE_VALUES = Object.freeze([
  "BSc.CSIT",
  "BIT",
  "BCA",
  "CMAT",
  "IOT",
  NEB_PREPARATION_COURSE,
]);

const normalizeStudentCourseLookupValue = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const STUDENT_COURSE_LOOKUP = STUDENT_COURSE_VALUES.reduce((lookup, course) => {
  lookup.set(normalizeStudentCourseLookupValue(course), course);
  return lookup;
}, new Map());

export const normalizeStudentCourse = (value = "") =>
  STUDENT_COURSE_LOOKUP.get(normalizeStudentCourseLookupValue(value)) || "";

export const canSwitchStudentCourse = (value = "") =>
  normalizeStudentCourse(value) === NEB_PREPARATION_COURSE;

export const STUDENT_COURSE_OPTIONS = Object.freeze(
  STUDENT_COURSE_VALUES.map((course) => ({
    value: course,
    label: course,
  }))
);
