import { normalizeStudentCourse } from "../constants/studentCourses.js";
import { getCourseRegexMatchers, hasCourseAccess } from "./courseAccess.js";

const splitCourseValue = (value) =>
  typeof value === "string" ? value.split(",") : [value];

const toCourseArray = (value) =>
  (Array.isArray(value) ? value : value == null ? [] : [value]).flatMap(splitCourseValue);

export const normalizeOnlineClassCourses = (value = []) => {
  const seen = new Set();

  return toCourseArray(value)
    .map((course) => normalizeStudentCourse(course))
    .filter(Boolean)
    .filter((course) => {
      if (seen.has(course)) {
        return false;
      }

      seen.add(course);
      return true;
    });
};

export const resolveOnlineClassCourses = (value = {}) => {
  if (Array.isArray(value) || typeof value === "string") {
    return normalizeOnlineClassCourses(value);
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  return normalizeOnlineClassCourses([
    ...(Array.isArray(value.courses)
      ? value.courses
      : value.courses == null
      ? []
      : [value.courses]),
    value.course,
  ]);
};

export const formatOnlineClassCourseLabel = (value = {}) =>
  resolveOnlineClassCourses(value).join(", ");

export const buildOnlineClassCourseQuery = (studentCourse = "") => {
  const courseMatchers = getCourseRegexMatchers(studentCourse);

  if (!courseMatchers.length) {
    return { _id: null };
  }

  return {
    $or: [{ courses: { $in: courseMatchers } }, { course: { $in: courseMatchers } }],
  };
};

export const hasOnlineClassCourseAccess = (studentCourse = "", onlineClass = {}) =>
  hasCourseAccess(studentCourse, resolveOnlineClassCourses(onlineClass));
