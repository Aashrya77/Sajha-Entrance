const NEB_PREPARATION_COURSE = "NEB Preparation";

const STUDENT_COURSE_VALUES = Object.freeze([
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

const normalizeStudentCourse = (value = "") =>
  STUDENT_COURSE_LOOKUP.get(normalizeStudentCourseLookupValue(value)) || "";

const isValidStudentCourse = (value = "") => Boolean(normalizeStudentCourse(value));

const canSwitchStudentCourse = (value = "") =>
  normalizeStudentCourse(value) === NEB_PREPARATION_COURSE;

const STUDENT_COURSE_AVAILABLE_VALUES = Object.freeze(
  STUDENT_COURSE_VALUES.map((course) => ({
    value: course,
    label: course,
  }))
);

export {
  canSwitchStudentCourse,
  isValidStudentCourse,
  NEB_PREPARATION_COURSE,
  normalizeStudentCourse,
  STUDENT_COURSE_AVAILABLE_VALUES,
  STUDENT_COURSE_VALUES,
};
