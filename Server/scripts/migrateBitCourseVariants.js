import mongoose from "mongoose";
import connectDB from "../db/connectDB.js";
import ResultExam from "../models/ResultExam.js";
import StudentResult from "../models/StudentResult.js";
import MockTestCourseModel from "../models/MockTestCourse.js";
import MockTestSubjectModel from "../models/MockTestSubject.js";
import MockQuestionModel from "../models/MockQuestion.js";
import MockTestModel from "../models/MockTest.js";
import { normalizeCourseCode } from "../constants/resultCourses.js";
import { recalculateExamRanks } from "../services/resultService.js";
import { slugifyText } from "../utils/slug.js";

const TARGET_COURSE_CODE = "BIT";
const TARGET_COURSE_NAME = "BIT";
const VARIANT_COURSE_CODES = ["BIT_COMPUTER", "BIT_MATH"];
const VARIANT_COURSE_NAMES = ["BIT Computer", "BIT Math"];
const VARIANT_COURSE_SLUGS = ["bit-computer", "bit-math"];
const VARIANT_COURSE_VALUES = [
  ...VARIANT_COURSE_CODES,
  ...VARIANT_COURSE_NAMES,
  ...VARIANT_COURSE_SLUGS,
];

const parseArgs = (argv = []) =>
  argv.reduce(
    (options, arg) => {
      if (arg === "--apply") {
        options.apply = true;
      }

      if (arg === "--dry-run") {
        options.apply = false;
      }

      return options;
    },
    { apply: false }
  );

const buildVariantTextQuery = (field) => ({
  [field]: {
    $in: VARIANT_COURSE_VALUES,
  },
});

const buildResultVariantQuery = () => ({
  $or: [
    buildVariantTextQuery("course"),
    buildVariantTextQuery("courseName"),
  ],
});

const getVariantResultExamDocs = () =>
  ResultExam.find(buildResultVariantQuery(), {
    _id: 1,
    course: 1,
    courseName: 1,
    title: 1,
    examDate: 1,
    status: 1,
  }).lean();

const getVariantStudentResultDocs = () =>
  StudentResult.find(buildResultVariantQuery(), {
    _id: 1,
    exam: 1,
    course: 1,
    courseName: 1,
    symbolNumber: 1,
  }).lean();

const getTargetMockTestCourse = async () => {
  const existingCourse = await MockTestCourseModel.findOne({
    $or: [
      { name: TARGET_COURSE_NAME },
      { slug: slugifyText(TARGET_COURSE_NAME) },
    ],
  });

  if (existingCourse) {
    if (existingCourse.status !== "active") {
      existingCourse.status = "active";
      await existingCourse.save();
    }

    return existingCourse;
  }

  return MockTestCourseModel.create({
    name: TARGET_COURSE_NAME,
    slug: slugifyText(TARGET_COURSE_NAME),
    status: "active",
  });
};

const getVariantMockTestCourses = () =>
  MockTestCourseModel.find({
    $or: [
      { name: { $in: VARIANT_COURSE_NAMES } },
      { slug: { $in: VARIANT_COURSE_SLUGS } },
    ],
  });

const buildResultExamConflictReport = async (variantExams = []) => {
  const conflicts = [];

  for (const exam of variantExams) {
    const existingBitExam = await ResultExam.findOne({
      _id: { $ne: exam._id },
      course: TARGET_COURSE_CODE,
      title: exam.title,
      examDate: exam.examDate,
    })
      .select("_id course title examDate")
      .lean();

    if (existingBitExam) {
      conflicts.push({
        variantExamId: String(exam._id),
        existingBitExamId: String(existingBitExam._id),
        title: exam.title,
        examDate: exam.examDate,
      });
    }
  }

  return conflicts;
};

const removeUniqueResultSetIndexIfNeeded = async () => {
  const indexes = await ResultExam.collection.indexes();
  const uniqueCourseTitleDateIndex = indexes.find((index) => {
    const key = index.key || {};
    return (
      index.unique === true &&
      key.course === 1 &&
      key.title === 1 &&
      key.examDate === 1
    );
  });

  if (!uniqueCourseTitleDateIndex) {
    return "";
  }

  await ResultExam.collection.dropIndex(uniqueCourseTitleDateIndex.name);
  await ResultExam.collection.createIndex({
    course: 1,
    title: 1,
    examDate: 1,
  });

  return uniqueCourseTitleDateIndex.name;
};

const migrateResultCourses = async ({ apply }) => {
  const variantExams = await getVariantResultExamDocs();
  const variantResults = await getVariantStudentResultDocs();
  const resultExamConflicts = await buildResultExamConflictReport(variantExams);
  const migratableExamIds = variantExams.map((exam) => exam._id);
  const migratedExamIds = new Set(migratableExamIds.map((examId) => String(examId)));
  const migratableResultIds = variantResults
    .filter((result) => !result.exam || migratedExamIds.has(String(result.exam)))
    .map((result) => result._id);

  const summary = {
    variantResultSetsFound: variantExams.length,
    variantStudentResultsFound: variantResults.length,
    duplicateResultSetConflicts: resultExamConflicts.length,
    migratableResultSets: migratableExamIds.length,
    migratableStudentResults: migratableResultIds.length,
    migratedResultSets: 0,
    migratedStudentResults: 0,
    rerankedResultSets: 0,
    droppedUniqueResultSetIndex: "",
    resultSetConflicts: resultExamConflicts,
  };

  if (!apply) {
    return summary;
  }

  if (resultExamConflicts.length > 0) {
    summary.droppedUniqueResultSetIndex = await removeUniqueResultSetIndexIfNeeded();
  }

  if (migratableExamIds.length > 0) {
    const result = await ResultExam.updateMany(
      { _id: { $in: migratableExamIds } },
      {
        $set: {
          course: TARGET_COURSE_CODE,
          courseName: TARGET_COURSE_NAME,
          updatedAt: new Date(),
        },
      }
    );
    summary.migratedResultSets = result.modifiedCount || 0;
  }

  if (migratableResultIds.length > 0) {
    const result = await StudentResult.updateMany(
      { _id: { $in: migratableResultIds } },
      {
        $set: {
          course: TARGET_COURSE_CODE,
          courseName: TARGET_COURSE_NAME,
          updatedAt: new Date(),
        },
      }
    );
    summary.migratedStudentResults = result.modifiedCount || 0;
  }

  for (const examId of migratableExamIds) {
    await recalculateExamRanks(examId);
    summary.rerankedResultSets += 1;
  }

  return summary;
};

const replaceMockTestSubjectReference = async ({
  oldSubjectId,
  targetSubjectId,
  targetCourseId,
}) => {
  await MockQuestionModel.updateMany(
    { subject: oldSubjectId },
    {
      $set: {
        subject: targetSubjectId,
        course: targetCourseId,
        updatedAt: new Date(),
      },
    }
  );

  await MockTestModel.updateMany(
    { subjectRefs: oldSubjectId },
    { $addToSet: { subjectRefs: targetSubjectId } }
  );
  await MockTestModel.updateMany(
    { subjectRefs: oldSubjectId },
    { $pull: { subjectRefs: oldSubjectId } }
  );
  await MockTestModel.updateMany(
    { "questions.subject": oldSubjectId },
    {
      $set: {
        "questions.$[question].subject": targetSubjectId,
        "questions.$[question].course": targetCourseId,
        updatedAt: new Date(),
      },
    },
    {
      arrayFilters: [{ "question.subject": oldSubjectId }],
    }
  );
};

const migrateMockTestCourses = async ({ apply }) => {
  const variantCourses = await getVariantMockTestCourses();
  const variantCourseIds = variantCourses.map((course) => course._id);
  const variantSubjects = variantCourseIds.length
    ? await MockTestSubjectModel.find({ course: { $in: variantCourseIds } }).lean()
    : [];

  const summary = {
    variantMockTestCoursesFound: variantCourses.length,
    variantMockTestSubjectsFound: variantSubjects.length,
    mockTestsUsingVariants: variantCourseIds.length
      ? await MockTestModel.countDocuments({
          $or: [
            { courseRef: { $in: variantCourseIds } },
            buildVariantTextQuery("course"),
            buildVariantTextQuery("courseName"),
          ],
        })
      : 0,
    mockQuestionsUsingVariants: variantCourseIds.length
      ? await MockQuestionModel.countDocuments({ course: { $in: variantCourseIds } })
      : 0,
    subjectsMovedToBit: 0,
    subjectsMergedIntoExistingBitSubjects: 0,
    mockTestCoursesDeactivated: 0,
    mockTestsMigrated: 0,
    mockQuestionsMigrated: 0,
  };

  if (!apply || variantCourses.length === 0) {
    return summary;
  }

  const targetCourse = await getTargetMockTestCourse();

  for (const subject of variantSubjects) {
    const targetSubject = await MockTestSubjectModel.findOne({
      course: targetCourse._id,
      slug: subject.slug,
    }).lean();

    if (targetSubject) {
      await replaceMockTestSubjectReference({
        oldSubjectId: subject._id,
        targetSubjectId: targetSubject._id,
        targetCourseId: targetCourse._id,
      });
      await MockTestSubjectModel.findByIdAndUpdate(subject._id, {
        $set: {
          status: "inactive",
          updatedAt: new Date(),
        },
      });
      summary.subjectsMergedIntoExistingBitSubjects += 1;
      continue;
    }

    await MockTestSubjectModel.findByIdAndUpdate(subject._id, {
      $set: {
        course: targetCourse._id,
        status: "active",
        updatedAt: new Date(),
      },
    });
    summary.subjectsMovedToBit += 1;
  }

  const mockTestUpdate = await MockTestModel.updateMany(
    {
      $or: [
        { courseRef: { $in: variantCourseIds } },
        buildVariantTextQuery("course"),
        buildVariantTextQuery("courseName"),
      ],
    },
    {
      $set: {
        courseRef: targetCourse._id,
        course: TARGET_COURSE_NAME,
        courseName: TARGET_COURSE_NAME,
        updatedAt: new Date(),
      },
    }
  );
  summary.mockTestsMigrated = mockTestUpdate.modifiedCount || 0;

  const embeddedQuestionUpdate = await MockTestModel.updateMany(
    { "questions.course": { $in: variantCourseIds } },
    {
      $set: {
        "questions.$[question].course": targetCourse._id,
        updatedAt: new Date(),
      },
    },
    {
      arrayFilters: [{ "question.course": { $in: variantCourseIds } }],
    }
  );

  const questionUpdate = await MockQuestionModel.updateMany(
    { course: { $in: variantCourseIds } },
    {
      $set: {
        course: targetCourse._id,
        updatedAt: new Date(),
      },
    }
  );
  summary.mockQuestionsMigrated =
    (questionUpdate.modifiedCount || 0) + (embeddedQuestionUpdate.modifiedCount || 0);

  const courseUpdate = await MockTestCourseModel.updateMany(
    { _id: { $in: variantCourseIds } },
    {
      $set: {
        status: "inactive",
        updatedAt: new Date(),
      },
    }
  );
  summary.mockTestCoursesDeactivated = courseUpdate.modifiedCount || 0;

  return summary;
};

const inspectResidualVariantReferences = async () => ({
  resultSets: await ResultExam.countDocuments(buildResultVariantQuery()),
  studentResults: await StudentResult.countDocuments(buildResultVariantQuery()),
  activeMockTestCourses: await MockTestCourseModel.countDocuments({
    $or: [
      { name: { $in: VARIANT_COURSE_NAMES } },
      { slug: { $in: VARIANT_COURSE_SLUGS } },
    ],
    status: "active",
  }),
});

const run = async () => {
  const options = parseArgs(process.argv.slice(2));

  await connectDB();

  try {
    const resultCourseSummary = await migrateResultCourses(options);
    const mockTestSummary = await migrateMockTestCourses(options);
    const residualVariantReferences = await inspectResidualVariantReferences();

    console.log(
      JSON.stringify(
        {
          mode: options.apply ? "apply" : "dry-run",
          targetCourse: TARGET_COURSE_CODE,
          normalizedLegacyCodes: VARIANT_COURSE_CODES.map((code) => ({
            from: code,
            to: normalizeCourseCode(code),
          })),
          resultCourseSummary,
          mockTestSummary,
          residualVariantReferences,
        },
        null,
        2
      )
    );
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
