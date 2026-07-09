import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCourseTemplateHeaders,
  normalizeCourseCode,
} from "../constants/resultCourses.js";
import { normalizeExamDate } from "../services/resultService.js";

test("normalizes ISO date-only and ISO datetime to the same exam date", () => {
  assert.equal(normalizeExamDate("2026-07-03"), "2026-07-03");
  assert.equal(normalizeExamDate("2026-07-03T00:00:00.000Z"), "2026-07-03");
  assert.equal(normalizeExamDate("2026/07/03"), "2026-07-03");
  assert.equal(normalizeExamDate("2026.07.03"), "2026-07-03");
});

test("normalizes day-first slash dates", () => {
  assert.equal(normalizeExamDate("03/07/2026"), "2026-07-03");
});

test("normalizes day-first dash dates", () => {
  assert.equal(normalizeExamDate("03-07-2026"), "2026-07-03");
  assert.equal(normalizeExamDate("03.07.2026"), "2026-07-03");
});

test("normalizes Excel serial dates", () => {
  assert.equal(normalizeExamDate(46206), "2026-07-03");
});

test("normalizes JavaScript Date objects without shifting selected calendar date", () => {
  assert.equal(normalizeExamDate(new Date("2026-07-03T00:00:00.000Z")), "2026-07-03");
});

test("rejects invalid exam dates", () => {
  assert.equal(normalizeExamDate("not-a-date"), "");
  assert.equal(normalizeExamDate("31/02/2026"), "");
});

test("keeps genuinely different dates different", () => {
  assert.notEqual(normalizeExamDate("2026-07-04"), normalizeExamDate("2026-07-03"));
});

test("does not shift timezone-bearing ISO datetimes away from their date prefix", () => {
  assert.equal(normalizeExamDate("2026-07-03T00:00:00.000+05:45"), "2026-07-03");
});

test("keeps existing course normalization behavior", () => {
  assert.equal(normalizeCourseCode("CMAT"), "CMAT");
  assert.equal(normalizeCourseCode("Bachelor of Information Technology"), "BIT");
  assert.equal(normalizeCourseCode(""), "");
});

test("keeps result template headers unchanged", () => {
  assert.deepEqual(buildCourseTemplateHeaders("CSIT"), [
    "Symbol No.",
    "Student Name",
    "Course",
    "Exam Date",
    "Subject 1 Name",
    "Subject 1 Full Marks",
    "Subject 1 Obtained Marks",
    "Subject 2 Name",
    "Subject 2 Full Marks",
    "Subject 2 Obtained Marks",
    "Subject 3 Name",
    "Subject 3 Full Marks",
    "Subject 3 Obtained Marks",
    "Subject 4 Name",
    "Subject 4 Full Marks",
    "Subject 4 Obtained Marks",
    "Remarks",
  ]);
});
