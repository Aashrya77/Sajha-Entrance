import mongoose from "mongoose";
import connectDB from "../db/connectDB.js";
import StudentResult from "../models/StudentResult.js";
import {
  calculateResultMetrics,
  recalculateExamRanks,
} from "../services/resultService.js";

const parseArgs = (argv = []) =>
  argv.reduce((options, arg) => {
    if (arg === "--dry-run") {
      options.dryRun = true;
      return options;
    }

    if (arg.startsWith("--examId=")) {
      options.examId = arg.slice("--examId=".length).trim();
      return options;
    }

    if (arg.startsWith("--course=")) {
      options.course = arg.slice("--course=".length).trim();
      return options;
    }

    return options;
  }, {
    dryRun: false,
    examId: "",
    course: "",
  });

const buildQuery = ({ examId, course }) => {
  const query = {};

  if (examId) {
    query.exam = examId;
  }

  if (course) {
    query.course = course;
  }

  return query;
};

const metricsDiffer = (result, metrics) =>
  JSON.stringify(result.subjects || []) !== JSON.stringify(metrics.subjects || []) ||
  Number(result.totalFullMarks || 0) !== Number(metrics.totalFullMarks || 0) ||
  Number(result.totalPassMarks || 0) !== Number(metrics.totalPassMarks || 0) ||
  Number(result.totalObtainedMarks || 0) !== Number(metrics.totalObtainedMarks || 0) ||
  Number(result.percentage || 0) !== Number(metrics.percentage || 0) ||
  String(result.resultStatus || result.result || "") !== String(metrics.resultStatus || "") ||
  String(result.result || result.resultStatus || "") !== String(metrics.result || "");

const run = async () => {
  const options = parseArgs(process.argv.slice(2));
  const query = buildQuery(options);

  await connectDB();

  try {
    const results = await StudentResult.find(query).lean();
    const bulkOperations = [];
    const examIdsToRefresh = new Set();

    results.forEach((result) => {
      const metrics = calculateResultMetrics(result.subjects || []);
      if (!metricsDiffer(result, metrics)) {
        return;
      }

      bulkOperations.push({
        updateOne: {
          filter: { _id: result._id },
          update: {
            $set: {
              subjects: metrics.subjects,
              totalFullMarks: metrics.totalFullMarks,
              totalPassMarks: metrics.totalPassMarks,
              totalObtainedMarks: metrics.totalObtainedMarks,
              percentage: metrics.percentage,
              resultStatus: metrics.resultStatus,
              result: metrics.result,
              lastCalculatedAt: new Date(),
              updatedAt: new Date(),
            },
          },
        },
      });

      if (result.exam) {
        examIdsToRefresh.add(String(result.exam));
      }
    });

    console.log(
      JSON.stringify(
        {
          scannedResults: results.length,
          staleResults: bulkOperations.length,
          affectedExamSets: examIdsToRefresh.size,
          dryRun: options.dryRun,
          filters: query,
        },
        null,
        2
      )
    );

    if (!bulkOperations.length || options.dryRun) {
      return;
    }

    await StudentResult.bulkWrite(bulkOperations, { ordered: false });

    for (const examId of examIdsToRefresh) {
      await recalculateExamRanks(examId);
    }

    console.log(
      JSON.stringify(
        {
          updatedResults: bulkOperations.length,
          rerankedExamSets: examIdsToRefresh.size,
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
