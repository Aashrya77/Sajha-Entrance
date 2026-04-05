import mongoose from "mongoose";
import { normalizeLookupValue } from "../constants/resultCourses.js";
import ResultExam from "./ResultExam.js";

const normalizeSymbolNumber = (value) => String(value || "").trim().toUpperCase();
const normalizeDateValue = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};
const SUBJECT_UPDATE_FIELD_PATTERN =
  /^subjects\.(\d+)\.(subjectName|fullMarks|passMarks|obtainedMarks)$/;

const normalizeSubjectName = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ");

const toFiniteNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") {
    const parsedFallback = Number(fallback);
    return Number.isFinite(parsedFallback) ? parsedFallback : 0;
  }

  const parsedValue = Number(value);
  if (Number.isFinite(parsedValue)) {
    return parsedValue;
  }

  const parsedFallback = Number(fallback);
  return Number.isFinite(parsedFallback) ? parsedFallback : 0;
};

const normalizeSubjectRecord = (subject = {}) => {
  const normalizedSubject = subject?.toObject ? subject.toObject() : { ...subject };
  normalizedSubject.subjectName = normalizeSubjectName(normalizedSubject.subjectName);
  normalizedSubject.fullMarks = toFiniteNumber(normalizedSubject.fullMarks);
  normalizedSubject.passMarks = toFiniteNumber(normalizedSubject.passMarks);
  normalizedSubject.obtainedMarks = toFiniteNumber(normalizedSubject.obtainedMarks);
  normalizedSubject.status =
    normalizedSubject.obtainedMarks >= normalizedSubject.passMarks ? "Pass" : "Fail";

  return normalizedSubject;
};

const calculateResultMetricsFromSubjects = (subjects = []) => {
  const preparedSubjects = Array.isArray(subjects)
    ? subjects
        .map((subject) => normalizeSubjectRecord(subject))
        .filter(
          (subject) =>
            subject.subjectName ||
            subject.fullMarks > 0 ||
            subject.passMarks > 0 ||
            subject.obtainedMarks > 0
        )
    : [];

  const totalFullMarks = preparedSubjects.reduce(
    (sum, subject) => sum + Number(subject.fullMarks || 0),
    0
  );
  const totalPassMarks = preparedSubjects.reduce(
    (sum, subject) => sum + Number(subject.passMarks || 0),
    0
  );
  const totalObtainedMarks = preparedSubjects.reduce(
    (sum, subject) => sum + Number(subject.obtainedMarks || 0),
    0
  );
  const percentage =
    totalFullMarks > 0
      ? Number(((totalObtainedMarks / totalFullMarks) * 100).toFixed(2))
      : 0;

  const finalStatus =
    preparedSubjects.length > 0 && preparedSubjects.every((subject) => subject.status === "Pass")
      ? "Pass"
      : "Fail";

  return {
    subjects: preparedSubjects,
    totalFullMarks,
    totalPassMarks,
    totalObtainedMarks,
    percentage,
    resultStatus: finalStatus,
    result: finalStatus,
    lastCalculatedAt: new Date(),
  };
};

const applyCalculatedMetricsToTarget = (target, subjects = []) => {
  const metrics = calculateResultMetricsFromSubjects(subjects);

  target.subjects = metrics.subjects;
  target.totalFullMarks = metrics.totalFullMarks;
  target.totalPassMarks = metrics.totalPassMarks;
  target.totalObtainedMarks = metrics.totalObtainedMarks;
  target.percentage = metrics.percentage;
  target.resultStatus = metrics.resultStatus;
  target.result = metrics.result;
  target.lastCalculatedAt = metrics.lastCalculatedAt;

  return metrics;
};

const getSubjectUpdateByIndex = (subjectsValue, index) => {
  if (Array.isArray(subjectsValue)) {
    return subjectsValue[index] || null;
  }

  if (subjectsValue && typeof subjectsValue === "object") {
    return subjectsValue[index] || subjectsValue[String(index)] || null;
  }

  return null;
};

const buildUpdatedSubjectsFromQuery = (existingSubjects = [], updatePayload = {}) => {
  const subjectIndexes = new Set(
    Array.isArray(existingSubjects)
      ? existingSubjects.map((_, index) => index)
      : []
  );

  let hasSubjectUpdate = false;
  const directSubjects = updatePayload.subjects;

  if (Array.isArray(directSubjects)) {
    hasSubjectUpdate = true;
    directSubjects.forEach((_, index) => subjectIndexes.add(index));
  } else if (directSubjects && typeof directSubjects === "object") {
    const numericKeys = Object.keys(directSubjects).filter((key) => /^\d+$/.test(key));
    if (numericKeys.length > 0) {
      hasSubjectUpdate = true;
      numericKeys.forEach((key) => subjectIndexes.add(Number(key)));
    }
  }

  Object.keys(updatePayload).forEach((key) => {
    const match = key.match(SUBJECT_UPDATE_FIELD_PATTERN);
    if (!match) {
      return;
    }

    hasSubjectUpdate = true;
    subjectIndexes.add(Number(match[1]));
  });

  if (!hasSubjectUpdate) {
    return null;
  }

  return Array.from(subjectIndexes)
    .sort((left, right) => left - right)
    .map((index) => {
      const existingSubject = existingSubjects[index] || {};
      const directSubject = getSubjectUpdateByIndex(directSubjects, index) || {};

      return {
        subjectName: normalizeSubjectName(
          directSubject.subjectName ??
            updatePayload[`subjects.${index}.subjectName`] ??
            existingSubject.subjectName
        ),
        fullMarks: toFiniteNumber(
          directSubject.fullMarks ??
            updatePayload[`subjects.${index}.fullMarks`] ??
            existingSubject.fullMarks
        ),
        passMarks: toFiniteNumber(
          directSubject.passMarks ??
            updatePayload[`subjects.${index}.passMarks`] ??
            existingSubject.passMarks
        ),
        obtainedMarks: toFiniteNumber(
          directSubject.obtainedMarks ??
            updatePayload[`subjects.${index}.obtainedMarks`] ??
            existingSubject.obtainedMarks
        ),
      };
    })
    .filter(
      (subject) =>
        subject.subjectName ||
        subject.fullMarks > 0 ||
        subject.passMarks > 0 ||
        subject.obtainedMarks > 0
    );
};

const mapSubjectByNormalizedName = (subjects = []) =>
  subjects.reduce((subjectMap, subject) => {
    const normalizedName = normalizeLookupValue(subject.subjectName);
    if (normalizedName) {
      subjectMap.set(normalizedName, subject);
    }

    return subjectMap;
  }, new Map());

const buildSubjectScoreVector = (result, subjectOrder = []) => {
  const resultSubjectMap = mapSubjectByNormalizedName(result.subjects || []);

  return subjectOrder.map((subjectName) => {
    const matchedSubject = resultSubjectMap.get(normalizeLookupValue(subjectName));
    return Number(matchedSubject?.obtainedMarks || 0);
  });
};

const compareScoreVectors = (leftVector = [], rightVector = []) => {
  for (let index = 0; index < Math.max(leftVector.length, rightVector.length); index += 1) {
    const leftValue = Number(leftVector[index] || 0);
    const rightValue = Number(rightVector[index] || 0);

    if (leftValue !== rightValue) {
      return rightValue - leftValue;
    }
  }

  return 0;
};

const haveSameRankingScore = (left, right, subjectOrder = []) => {
  if (!left || !right) {
    return false;
  }

  if (left.resultStatus !== right.resultStatus) {
    return false;
  }

  if (left.totalObtainedMarks !== right.totalObtainedMarks) {
    return false;
  }

  if (left.percentage !== right.percentage) {
    return false;
  }

  const leftVector = buildSubjectScoreVector(left, subjectOrder);
  const rightVector = buildSubjectScoreVector(right, subjectOrder);
  return compareScoreVectors(leftVector, rightVector) === 0;
};

const sortResultsForRanking = (results = [], subjectOrder = []) =>
  [...results].sort((left, right) => {
    if (left.resultStatus !== right.resultStatus) {
      return left.resultStatus === "Pass" ? -1 : 1;
    }

    if (left.totalObtainedMarks !== right.totalObtainedMarks) {
      return right.totalObtainedMarks - left.totalObtainedMarks;
    }

    if (left.percentage !== right.percentage) {
      return right.percentage - left.percentage;
    }

    const vectorComparison = compareScoreVectors(
      buildSubjectScoreVector(left, subjectOrder),
      buildSubjectScoreVector(right, subjectOrder)
    );
    if (vectorComparison !== 0) {
      return vectorComparison;
    }

    const nameComparison = String(left.studentName || "").localeCompare(
      String(right.studentName || ""),
      undefined,
      { sensitivity: "base" }
    );
    if (nameComparison !== 0) {
      return nameComparison;
    }

    return String(left.symbolNumber || "").localeCompare(String(right.symbolNumber || ""));
  });

async function recalculateRanksForExamIds(examIds = []) {
  const uniqueExamIds = Array.from(
    new Set(
      examIds
        .map((examId) => String(examId || "").trim())
        .filter(Boolean)
    )
  );

  for (const examId of uniqueExamIds) {
    const exam = await ResultExam.findById(examId).lean();
    if (!exam) {
      continue;
    }

    const results = await StudentResultModel.find({ exam: exam._id }).lean();
    const subjectOrder =
      Array.isArray(exam.subjects) && exam.subjects.length > 0
        ? [...exam.subjects]
            .sort((left, right) => (left.displayOrder || 0) - (right.displayOrder || 0))
            .map((subject) => subject.name)
        : Array.from(
            new Set(
              results.flatMap((result) =>
                (result.subjects || []).map((subject) => subject.subjectName)
              )
            )
          );

    const rankedResults = sortResultsForRanking(results, subjectOrder);
    const operations = [];
    let previousResult = null;
    let previousRank = 0;

    rankedResults.forEach((result, index) => {
      const nextRank = haveSameRankingScore(result, previousResult, subjectOrder)
        ? previousRank
        : index + 1;

      operations.push({
        updateOne: {
          filter: { _id: result._id },
          update: { $set: { rank: nextRank } },
        },
      });

      previousResult = result;
      previousRank = nextRank;
    });

    if (operations.length > 0) {
      await StudentResultModel.bulkWrite(operations, { ordered: false });
    }

    await ResultExam.findByIdAndUpdate(exam._id, {
      $set: {
        resultCount: rankedResults.length,
        updatedAt: new Date(),
      },
    });
  }
}

const SubjectSchema = new mongoose.Schema(
  {
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    fullMarks: {
      type: Number,
      required: true,
      min: 0,
    },
    passMarks: {
      type: Number,
      required: true,
      min: 0,
    },
    obtainedMarks: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Pass", "Fail"],
      default: "Fail",
    },
  },
  { _id: false }
);

const StudentResultSchema = new mongoose.Schema({
  symbolNumber: {
    type: String,
    required: true,
    index: true,
    set: normalizeSymbolNumber,
  },
  studentName: {
    type: String,
    required: true,
    trim: true,
  },
  course: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  courseName: {
    type: String,
    default: "",
    trim: true,
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ResultExam",
    index: true,
    default: null,
  },
  examDate: {
    type: Date,
    required: true,
    index: true,
  },
  subjects: {
    type: [SubjectSchema],
    default: [],
  },
  totalFullMarks: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalPassMarks: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalObtainedMarks: {
    type: Number,
    default: 0,
    min: 0,
    index: true,
  },
  percentage: {
    type: Number,
    default: 0,
    min: 0,
    index: true,
  },
  resultStatus: {
    type: String,
    enum: ["Pass", "Fail"],
    default: "Fail",
    index: true,
  },
  result: {
    type: String,
    enum: ["Pass", "Fail"],
    default: "Fail",
    index: true,
  },
  rank: {
    type: Number,
    default: null,
    min: 1,
    index: true,
  },
  remarks: {
    type: String,
    default: "",
    trim: true,
  },
  publishedAt: {
    type: Date,
    default: null,
  },
  lastCalculatedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

StudentResultSchema.index(
  { exam: 1, course: 1, symbolNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      exam: { $exists: true },
    },
  }
);

StudentResultSchema.index({ course: 1, symbolNumber: 1, examDate: -1 });
StudentResultSchema.index({ exam: 1, course: 1, rank: 1 });

StudentResultSchema.pre("save", function calculateTotals(next) {
  this.updatedAt = new Date();

  if (this.examDate) {
    this.examDate = normalizeDateValue(this.examDate);
  }

  if (Array.isArray(this.subjects) && this.subjects.length > 0) {
    applyCalculatedMetricsToTarget(this, this.subjects);
  }

  next();
});

["findOneAndUpdate", "updateOne"].forEach((hookName) => {
  StudentResultSchema.pre(hookName, async function prepareCalculatedFields(next) {
    const update = this.getUpdate();
    if (!update || typeof update !== "object") {
      return next();
    }

    const setPayload =
      update.$set && typeof update.$set === "object" ? update.$set : update;

    if (!setPayload || typeof setPayload !== "object") {
      return next();
    }

    const existingResult = await this.model.findOne(this.getQuery()).lean();
    if (!existingResult) {
      return next();
    }

    const updatedSubjects = buildUpdatedSubjectsFromQuery(
      existingResult.subjects || [],
      setPayload
    );
    const nextExamId = String(setPayload.exam || existingResult.exam || "").trim();
    const shouldRefreshRanks = Boolean(updatedSubjects || setPayload.exam !== undefined);

    this._resultExamIdsForRankRefresh = shouldRefreshRanks
      ? Array.from(
          new Set([
            String(existingResult.exam || "").trim(),
            nextExamId,
          ])
        ).filter(Boolean)
      : [];

    if (setPayload.examDate) {
      setPayload.examDate = normalizeDateValue(setPayload.examDate);
    }

    if (updatedSubjects) {
      const metrics = applyCalculatedMetricsToTarget(setPayload, updatedSubjects);
      setPayload.subjects = metrics.subjects;
      Object.keys(setPayload).forEach((key) => {
        if (SUBJECT_UPDATE_FIELD_PATTERN.test(key) || key === "subjects") {
          return;
        }

        if (
          [
            "totalFullMarks",
            "totalPassMarks",
            "totalObtainedMarks",
            "percentage",
            "resultStatus",
            "result",
            "rank",
            "lastCalculatedAt",
          ].includes(key)
        ) {
          delete setPayload[key];
        }
      });
      Object.keys(setPayload).forEach((key) => {
        if (SUBJECT_UPDATE_FIELD_PATTERN.test(key)) {
          delete setPayload[key];
        }
      });
      setPayload.totalFullMarks = metrics.totalFullMarks;
      setPayload.totalPassMarks = metrics.totalPassMarks;
      setPayload.totalObtainedMarks = metrics.totalObtainedMarks;
      setPayload.percentage = metrics.percentage;
      setPayload.resultStatus = metrics.resultStatus;
      setPayload.result = metrics.result;
      setPayload.lastCalculatedAt = metrics.lastCalculatedAt;
      setPayload.updatedAt = new Date();
    } else if (setPayload.updatedAt === undefined) {
      setPayload.updatedAt = new Date();
    }

    next();
  });

  StudentResultSchema.post(hookName, async function refreshExamRanks() {
    if (
      Array.isArray(this._resultExamIdsForRankRefresh) &&
      this._resultExamIdsForRankRefresh.length > 0
    ) {
      await recalculateRanksForExamIds(this._resultExamIdsForRankRefresh);
    }
  });
});

const StudentResultModel = mongoose.model("StudentResult", StudentResultSchema);

export { normalizeSymbolNumber };
export default StudentResultModel;
