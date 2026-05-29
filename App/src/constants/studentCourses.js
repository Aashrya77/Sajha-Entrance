export const NEB_PREPARATION_COURSE = "NEB Preparation";

export const STUDENT_COURSE_VALUES = Object.freeze([
  "BSc.CSIT",
  "BIT",
  "BCA",
  "CMAT",
  "IOE",
  NEB_PREPARATION_COURSE,
]);

const STUDENT_COURSE_ALIASES = Object.freeze([
  ["IOT", "IOE"],
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

STUDENT_COURSE_ALIASES.forEach(([alias, course]) => {
  STUDENT_COURSE_LOOKUP.set(normalizeStudentCourseLookupValue(alias), course);
});

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
