import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCourseTemplateExampleRow,
  buildCourseTemplateHeaders,
  normalizeCourseCode,
} from "../constants/resultCourses.js";
import {
  normalizeSubjectName,
  rankResultRows,
  validateCourseSpecificSubjects,
} from "../services/resultService.js";

const makeSubject = (subjectName, obtainedMarks = 70) => ({
  subjectName,
  fullMarks: 100,
  passMarks: 35,
  obtainedMarks,
});

test("normalizes legacy BIT variant courses into the single BIT course", () => {
  assert.equal(normalizeCourseCode("BIT_COMPUTER"), "BIT");
  assert.equal(normalizeCourseCode("BIT Computer"), "BIT");
  assert.equal(normalizeCourseCode("BIT-Math"), "BIT");
  assert.equal(normalizeCourseCode("BIT"), "BIT");
});

test("uses a two-subject BIT template that keeps Course as BIT", () => {
  assert.deepEqual(buildCourseTemplateHeaders("BIT"), [
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
    "Remarks",
  ]);

  assert.equal(buildCourseTemplateExampleRow("BIT").Course, "BIT");
});

test("canonicalizes supported BIT subject aliases", () => {
  assert.equal(normalizeSubjectName("Maths"), "Math");
  assert.equal(normalizeSubjectName("Mathematics"), "Math");
  assert.equal(normalizeSubjectName("Computer Science"), "Computer");
  assert.equal(normalizeSubjectName("English"), "English");
});

test("accepts BIT English plus Math", () => {
  const result = validateCourseSpecificSubjects("BIT", [
    makeSubject("English", 68),
    makeSubject("Maths", 74),
  ]);

  assert.deepEqual(result.errors, []);
  assert.deepEqual(
    result.subjects.map((subject) => subject.subjectName),
    ["English", "Math"]
  );
});

test("accepts BIT English plus Computer", () => {
  const result = validateCourseSpecificSubjects("BIT", [
    makeSubject("Computer Science", 76),
    makeSubject("English", 72),
  ]);

  assert.deepEqual(result.errors, []);
  assert.deepEqual(
    result.subjects.map((subject) => subject.subjectName),
    ["English", "Computer"]
  );
});

test("allows one BIT upload to contain different electives per row", () => {
  const mathRow = validateCourseSpecificSubjects("BIT", [
    makeSubject("English", 67),
    makeSubject("Math", 80),
  ]);
  const computerRow = validateCourseSpecificSubjects("BIT", [
    makeSubject("English", 67),
    makeSubject("Computer", 80),
  ]);

  assert.deepEqual(mathRow.errors, []);
  assert.deepEqual(computerRow.errors, []);
});

test("rejects invalid BIT subject combinations", () => {
  const invalidRows = [
    [makeSubject("English", 60)],
    [makeSubject("Math", 70), makeSubject("Computer", 75)],
    [makeSubject("English", 60), makeSubject("Math", 70), makeSubject("Computer", 75)],
    [makeSubject("English", 60), makeSubject("English", 62)],
    [makeSubject("English", 60), makeSubject("GK", 62)],
  ];

  invalidRows.forEach((subjects) => {
    const result = validateCourseSpecificSubjects("BIT", subjects);
    assert.ok(result.errors.length > 0);
  });
});

test("does not apply BIT subject rules to other courses", () => {
  const subjects = [
    makeSubject("English", 60),
    makeSubject("GK", 62),
    makeSubject("Math", 71),
  ];
  const result = validateCourseSpecificSubjects("BCA", subjects);

  assert.deepEqual(result.errors, []);
  assert.equal(result.subjects, subjects);
});

test("ranks BIT rows together while preserving elective subjects", () => {
  const rankedRows = rankResultRows(
    [
      {
        studentName: "Computer Student",
        symbolNumber: "BIT-002",
        totalObtainedMarks: 155,
        totalFullMarks: 200,
        percentage: 77.5,
        subjects: [makeSubject("English", 75), makeSubject("Computer", 80)],
      },
      {
        studentName: "Math Student",
        symbolNumber: "BIT-001",
        totalObtainedMarks: 150,
        totalFullMarks: 200,
        percentage: 75,
        subjects: [makeSubject("English", 70), makeSubject("Math", 80)],
      },
    ],
    ["English", "Math", "Computer"]
  );

  assert.equal(rankedRows[0].studentName, "Computer Student");
  assert.equal(rankedRows[0].rank, 1);
  assert.equal(rankedRows[1].rank, 2);
  assert.deepEqual(
    rankedRows.flatMap((row) => row.subjects.map((subject) => subject.subjectName)),
    ["English", "Computer", "English", "Math"]
  );
});
