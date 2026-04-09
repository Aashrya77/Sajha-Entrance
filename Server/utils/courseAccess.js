import { getResultCourse, normalizeCourseCode } from "../constants/resultCourses.js";

const escapeRegExp = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeExactValue = (value = "") => String(value || "").trim();

export const getCourseMatchValues = (value = "") => {
  const exactValue = normalizeExactValue(value);
  if (!exactValue) {
    return [];
  }

  const knownCourse = getResultCourse(exactValue);
  const normalizedCode = normalizeCourseCode(exactValue);
  const values = new Set([exactValue]);

  if (normalizedCode) {
    values.add(normalizedCode);
  }

  if (knownCourse) {
    [knownCourse.code, knownCourse.name, knownCourse.fullName, ...(knownCourse.aliases || [])]
      .map((entry) => normalizeExactValue(entry))
      .filter(Boolean)
      .forEach((entry) => values.add(entry));
  }

  return Array.from(values);
};

export const getCourseRegexMatchers = (value = "") =>
  getCourseMatchValues(value).map((entry) => new RegExp(`^${escapeRegExp(entry)}$`, "i"));

const normalizeComparableCourseValue = (value = "") =>
  normalizeCourseCode(value) || normalizeExactValue(value).toUpperCase();

export const hasCourseAccess = (studentCourse = "", allowedCourses = []) => {
  const allowedValueSet = new Set(
    (Array.isArray(allowedCourses) ? allowedCourses : [allowedCourses])
      .flatMap((course) => getCourseMatchValues(course))
      .map((course) => normalizeComparableCourseValue(course))
      .filter(Boolean)
  );

  return getCourseMatchValues(studentCourse)
    .map((course) => normalizeComparableCourseValue(course))
    .some((course) => allowedValueSet.has(course));
};
