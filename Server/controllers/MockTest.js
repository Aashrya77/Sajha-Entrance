import mongoose from "mongoose";
import MockTestModel, { MockTestAttemptModel } from "../models/MockTest.js";
import {
  buildStudentMockTestSummary,
  resolveMockTestLifecycle,
  serializeQuestionForReview,
  serializeQuestionForStudent,
} from "../services/mockTestService.js";

const buildSubjectLookupFromMockTest = (mockTest) =>
  (mockTest?.subjectRefs || []).reduce((lookup, subjectRef, index) => {
    const subjectId =
      subjectRef && typeof subjectRef === "object" && subjectRef.toString
        ? subjectRef.toString()
        : String(subjectRef || "");
    const subjectName = String(mockTest?.subjectNames?.[index] || "").trim();

    if (subjectId && subjectName) {
      lookup[subjectId] = subjectName;
    }

    return lookup;
  }, {});

const buildQuestionSubjectOverrides = async (mockTest) => {
  const questions = Array.isArray(mockTest?.questions) ? mockTest.questions : [];
  const subjectLookup = buildSubjectLookupFromMockTest(mockTest);
  const unresolvedSourceIds = [
    ...new Set(
      questions
        .filter(
          (question) =>
            !question?.subject &&
            question?.sourceQuestionId &&
            mongoose.Types.ObjectId.isValid(question.sourceQuestionId)
        )
        .map((question) => String(question.sourceQuestionId))
    ),
  ];

  if (!unresolvedSourceIds.length) {
    return {
      subjectLookup,
      questionOverrides: {},
    };
  }

  const sourceQuestions = await mongoose
    .model("MockQuestion")
    .find(
      { _id: { $in: unresolvedSourceIds } },
      { _id: 1, subject: 1 }
    )
    .lean()
    .exec();

  const unresolvedSubjectIds = [
    ...new Set(
      sourceQuestions
        .map((question) => String(question?.subject || ""))
        .filter((subjectId) => mongoose.Types.ObjectId.isValid(subjectId))
        .filter((subjectId) => !subjectLookup[subjectId])
    ),
  ];

  if (unresolvedSubjectIds.length) {
    const subjects = await mongoose
      .model("MockTestSubject")
      .find({ _id: { $in: unresolvedSubjectIds } }, { _id: 1, name: 1 })
      .lean()
      .exec();

    subjects.forEach((subject) => {
      subjectLookup[String(subject._id)] = subject.name;
    });
  }

  const questionOverrides = sourceQuestions.reduce((overrides, question) => {
    const subjectId = String(question?.subject || "").trim();
    const subjectName = subjectLookup[subjectId] || "";

    if (subjectId && subjectName) {
      overrides[String(question._id)] = {
        subject: subjectId,
        subjectName,
      };
    }

    return overrides;
  }, {});

  return {
    subjectLookup,
    questionOverrides,
  };
};

const toPlainQuestionSnapshot = (question) =>
  question?.toObject?.() ? question.toObject() : question;

const matchSearch = (mockTest, search = "") => {
  const normalizedSearch = String(search || "").trim().toLowerCase();
  if (!normalizedSearch) {
    return true;
  }

  return [
    mockTest?.title,
    mockTest?.admissionTest,
    mockTest?.courseName,
    mockTest?.course,
    ...(mockTest?.subjectNames || []),
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalizedSearch);
};

const matchCourse = (mockTest, course = "") => {
  const normalizedCourse = String(course || "").trim().toLowerCase();
  if (!normalizedCourse) {
    return true;
  }

  return [mockTest?.courseName, mockTest?.course]
    .join(" ")
    .toLowerCase()
    .includes(normalizedCourse);
};

const normalizeMaxAttempts = (mockTest = {}) => {
  const parsedMaxAttempts = Number(mockTest?.maxAttempts);

  return Number.isFinite(parsedMaxAttempts)
    ? Math.max(0, Math.floor(parsedMaxAttempts))
    : 1;
};

const buildAttemptLimitState = ({ mockTest, lifecycle, attempts = [] }) => {
  const maxAttempts = normalizeMaxAttempts(mockTest);
  const attemptCount = attempts.length;
  const hasCompletedAttempt = attemptCount > 0;
  const latestAttempt = hasCompletedAttempt
    ? [...attempts].sort(
        (left, right) =>
          new Date(right.completedAt || 0).getTime() -
          new Date(left.completedAt || 0).getTime()
      )[0]
    : null;
  const isUnlimited = maxAttempts === 0;
  const attemptsRemaining = isUnlimited
    ? null
    : Math.max(0, maxAttempts - attemptCount);
  const canRetake =
    Boolean(mockTest?.allowRetake) &&
    Boolean(lifecycle?.isAccessible) &&
    (isUnlimited || attemptsRemaining > 0);
  const canStartAttempt =
    Boolean(lifecycle?.isAccessible) &&
    (!hasCompletedAttempt || canRetake);

  return {
    hasCompletedAttempt,
    attemptCount,
    latestAttempt: latestAttempt
      ? {
          id: latestAttempt._id,
          attemptNumber: latestAttempt.attemptNumber || attemptCount,
          completedAt: latestAttempt.completedAt,
          totalScore: latestAttempt.totalScore,
          percentage: latestAttempt.percentage,
        }
      : null,
    canRetake,
    canStartAttempt,
    attemptsRemaining,
    maxAttempts,
    isUnlimited,
  };
};

const fetchStudentAttemptsForTest = async (studentId, mockTestId) => {
  if (!studentId || !mongoose.Types.ObjectId.isValid(mockTestId)) {
    return [];
  }

  return MockTestAttemptModel.find({
    student: studentId,
    mockTest: mockTestId,
  })
    .sort({ completedAt: -1 })
    .lean()
    .exec();
};

const getRetakeLimitMessage = (attemptState) => {
  if (attemptState?.hasCompletedAttempt) {
    return "You have already completed this mock test and no retake attempts are available.";
  }

  return "No attempts are available for this mock test.";
};

const attachDisplayAttemptNumbers = (attempts = []) => {
  const fallbackAttemptNumberById = new Map();
  const attemptsByTestId = attempts.reduce((lookup, attempt) => {
    const testId = String(attempt.mockTest?._id || attempt.mockTest || "");
    if (!lookup.has(testId)) {
      lookup.set(testId, []);
    }

    lookup.get(testId).push(attempt);
    return lookup;
  }, new Map());

  attemptsByTestId.forEach((testAttempts) => {
    [...testAttempts]
      .sort(
        (left, right) =>
          new Date(left.completedAt || 0).getTime() -
          new Date(right.completedAt || 0).getTime()
      )
      .forEach((attempt, index) => {
        fallbackAttemptNumberById.set(String(attempt._id), index + 1);
      });
  });

  return attempts.map((attempt) => ({
    ...attempt,
    attemptNumber:
      attempt.attemptNumber || fallbackAttemptNumberById.get(String(attempt._id)) || 1,
  }));
};

// Get all student-visible mock tests.
const GetMockTests = async (req, res) => {
  try {
    const mockTests = await MockTestModel.find({
      $or: [
        { status: { $in: ["scheduled", "live"] } },
        { status: { $exists: false }, isActive: true },
      ],
    })
      .sort({ startAt: 1, createdAt: -1 })
      .lean()
      .exec();

    const visibleEntries = mockTests
      .map((mockTest) => {
        const lifecycle = resolveMockTestLifecycle(mockTest);
        return {
          mockTest,
          lifecycle,
          summary: buildStudentMockTestSummary(mockTest, lifecycle),
        };
      })
      .filter(
        ({ lifecycle, summary }) =>
          lifecycle.isStudentVisible &&
          matchSearch(summary, req.query.search) &&
          matchCourse(summary, req.query.course)
      );
    const studentId = req.student?.id;
    const visibleTestIds = visibleEntries.map(({ mockTest }) => mockTest._id);
    const attempts = studentId
      ? await MockTestAttemptModel.find({
          student: studentId,
          mockTest: { $in: visibleTestIds },
        })
          .sort({ completedAt: -1 })
          .lean()
          .exec()
      : [];
    const attemptsByTestId = attempts.reduce((lookup, attempt) => {
      const testId = String(attempt.mockTest || "");
      if (!lookup.has(testId)) {
        lookup.set(testId, []);
      }

      lookup.get(testId).push(attempt);
      return lookup;
    }, new Map());
    const visibleTests = visibleEntries.map(({ mockTest, lifecycle, summary }) => {
      const attemptState = buildAttemptLimitState({
        mockTest,
        lifecycle,
        attempts: attemptsByTestId.get(String(mockTest._id)) || [],
      });

      return {
        ...summary,
        canStart: attemptState.canStartAttempt,
        hasCompletedAttempt: attemptState.hasCompletedAttempt,
        latestAttempt: attemptState.latestAttempt,
        canRetake: attemptState.canRetake,
        attemptsRemaining: attemptState.attemptsRemaining,
        attemptCount: attemptState.attemptCount,
        maxAttempts: attemptState.maxAttempts,
        isUnlimitedAttempts: attemptState.isUnlimited,
      };
    });

    res.json({
      success: true,
      data: {
        mockTests: visibleTests,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get a live/accessible mock test for taking the exam.
const GetMockTestForExam = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, error: "Invalid test ID" });
    }

    const mockTest = await MockTestModel.findById(req.params.id).lean().exec();

    if (!mockTest) {
      return res.status(404).json({ success: false, error: "Mock test not found" });
    }

    const lifecycle = resolveMockTestLifecycle(mockTest);
    const summary = buildStudentMockTestSummary(mockTest, lifecycle);

    if (!lifecycle.isStudentVisible) {
      return res.status(404).json({
        success: false,
        error: "This mock test is not available to students right now.",
      });
    }

    if (lifecycle.isUpcoming) {
      return res.status(403).json({
        success: false,
        error: "This mock test has not started yet.",
        data: summary,
      });
    }

    if (!lifecycle.isAccessible) {
      return res.status(403).json({
        success: false,
        error: "This mock test is no longer accessible.",
        data: summary,
      });
    }

    const studentAttempts = await fetchStudentAttemptsForTest(req.student?.id, mockTest._id);
    const attemptState = buildAttemptLimitState({
      mockTest,
      lifecycle,
      attempts: studentAttempts,
    });

    if (req.student?.id && !attemptState.canStartAttempt) {
      return res.status(403).json({
        success: false,
        error: getRetakeLimitMessage(attemptState),
        data: {
          ...summary,
          canStart: false,
          hasCompletedAttempt: attemptState.hasCompletedAttempt,
          latestAttempt: attemptState.latestAttempt,
          canRetake: false,
          attemptsRemaining: attemptState.attemptsRemaining,
          attemptCount: attemptState.attemptCount,
          maxAttempts: attemptState.maxAttempts,
          isUnlimitedAttempts: attemptState.isUnlimited,
        },
      });
    }

    const { subjectLookup, questionOverrides } = await buildQuestionSubjectOverrides(mockTest);

    const sanitizedQuestions = (mockTest.questions || []).map((question, index) => {
      const plainQuestion = toPlainQuestionSnapshot(question);

      return serializeQuestionForStudent(
        {
          ...plainQuestion,
          subject:
            plainQuestion?.subject ||
            questionOverrides[String(plainQuestion?.sourceQuestionId)]?.subject ||
            null,
          subjectName:
            plainQuestion?.subjectName ||
            questionOverrides[String(plainQuestion?.sourceQuestionId)]?.subjectName ||
            "",
        },
        index,
        subjectLookup
      );
    });

    res.json({
      success: true,
      data: {
        ...summary,
        canStart: req.student?.id ? attemptState.canStartAttempt : summary.canStart,
        hasCompletedAttempt: attemptState.hasCompletedAttempt,
        latestAttempt: attemptState.latestAttempt,
        canRetake: attemptState.canRetake,
        attemptsRemaining: attemptState.attemptsRemaining,
        attemptCount: attemptState.attemptCount,
        maxAttempts: attemptState.maxAttempts,
        isUnlimitedAttempts: attemptState.isUnlimited,
        questions: sanitizedQuestions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Submit mock test answers and get instant result.
const SubmitMockTest = async (req, res) => {
  
 console.log("SUBMIT MOCK TEST HIT");
  try {
    const { id } = req.params;
    const { answers, timeTaken } = req.body;
    const studentId = req.student.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, error: "Invalid test ID" });
    }

    const mockTest = await MockTestModel.findById(id).exec();
    if (!mockTest) {
      return res.status(404).json({ success: false, error: "Mock test not found" });
    }

    const lifecycle = resolveMockTestLifecycle(mockTest);
    if (!lifecycle.isAccessible) {
      return res.status(403).json({
        success: false,
        error: lifecycle.isUpcoming
          ? "This mock test has not started yet."
          : "This mock test is no longer accessible.",
      });
    }

    const previousAttempts = await fetchStudentAttemptsForTest(studentId, mockTest._id);
    const attemptState = buildAttemptLimitState({
      mockTest,
      lifecycle,
      attempts: previousAttempts,
    });

    if (!attemptState.canStartAttempt) {
      return res.status(403).json({
        success: false,
        error: getRetakeLimitMessage(attemptState),
      });
    }

    let totalScore = 0;
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalUnanswered = 0;

    const gradedAnswers = (mockTest.questions || []).map((question, index) => {
      const studentAnswer = Array.isArray(answers)
        ? answers.find((entry) => entry.questionIndex === index)
        : null;

      if (
        !studentAnswer ||
        studentAnswer.selectedOption === null ||
        studentAnswer.selectedOption === undefined ||
        studentAnswer.selectedOption === -1
      ) {
        totalUnanswered += 1;
        return {
          questionIndex: index,
          questionId: question?.sourceQuestionId || null,
          selectedOption: -1,
          isCorrect: false,
          marksObtained: 0,
        };
      }

      const isCorrect = Number(studentAnswer.selectedOption) === Number(question.correctOption);
      if (isCorrect) {
        totalCorrect += 1;
        totalScore += Number(question.marks || 0) || 0;
      } else {
        totalWrong += 1;
        totalScore -= Number(question.negativeMarks || 0) || 0;
      }

      return {
        questionIndex: index,
        questionId: question?.sourceQuestionId || null,
        selectedOption: Number(studentAnswer.selectedOption),
        isCorrect,
        marksObtained: isCorrect
          ? Number(question.marks || 0) || 0
          : -(Number(question.negativeMarks || 0) || 0),
      };
    });

    const safeScore = Math.max(0, totalScore);
    const percentage =
      mockTest.totalMarks > 0
        ? Math.round((safeScore / mockTest.totalMarks) * 100 * 100) / 100
        : 0;

    const attempt = await MockTestAttemptModel.create({
      student: studentId,
      mockTest: id,
      attemptNumber: previousAttempts.length + 1,
      answers: gradedAnswers,
      totalScore: safeScore,
      totalCorrect,
      totalWrong,
      totalUnanswered,
      percentage,
      timeTaken: Number(timeTaken || 0) || 0,
    });

    const { subjectLookup, questionOverrides } = await buildQuestionSubjectOverrides(mockTest);

    const resultQuestions = (mockTest.questions || []).map((question, index) => {
      const plainQuestion = toPlainQuestionSnapshot(question);

      return serializeQuestionForReview(
        {
          ...plainQuestion,
          subject:
            plainQuestion?.subject ||
            questionOverrides[String(plainQuestion?.sourceQuestionId)]?.subject ||
            null,
          subjectName:
            plainQuestion?.subjectName ||
            questionOverrides[String(plainQuestion?.sourceQuestionId)]?.subjectName ||
            "",
        },
        gradedAnswers[index],
        index,
        subjectLookup
      );
    });

    res.json({
      success: true,
      data: {
        attemptId: attempt._id,
        attemptNumber: attempt.attemptNumber,
        testTitle: mockTest.title,
        totalMarks: mockTest.totalMarks,
        passMarks: mockTest.passMarks || 0,
        totalScore: safeScore,
        totalCorrect,
        totalWrong,
        totalUnanswered,
        totalQuestions: mockTest.questions.length,
        percentage,
        timeTaken: Number(timeTaken || 0) || 0,
        duration: mockTest.duration,
        questions: resultQuestions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get student's past attempts.
const GetMyAttempts = async (req, res) => {
  try {
    const studentId = req.student.id;

    const attempts = await MockTestAttemptModel.find({ student: studentId })
      .populate("mockTest", "title courseName course totalMarks duration status startAt endAt")
      .sort({ completedAt: -1 })
      .lean()
      .exec();

    res.json({
      success: true,
      data: {
        attempts: attachDisplayAttemptNumbers(attempts),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get a specific attempt result.
const GetAttemptResult = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const studentId = req.student.id;

    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(404).json({ success: false, error: "Invalid attempt ID" });
    }

    const attempt = await MockTestAttemptModel.findOne({
      _id: attemptId,
      student: studentId,
    })
      .populate("mockTest")
      .lean()
      .exec();

    if (!attempt || !attempt.mockTest) {
      return res.status(404).json({ success: false, error: "Attempt not found" });
    }

    const mockTest = attempt.mockTest;
    const displayAttemptNumber =
      attempt.attemptNumber ||
      (await MockTestAttemptModel.countDocuments({
        student: studentId,
        mockTest: mockTest._id,
        completedAt: { $lte: attempt.completedAt || new Date() },
      }));
    const { subjectLookup, questionOverrides } = await buildQuestionSubjectOverrides(mockTest);

    const resultQuestions = (mockTest.questions || []).map((question, index) => {
      const answer = (attempt.answers || []).find((entry) => entry.questionIndex === index);
      const plainQuestion = toPlainQuestionSnapshot(question);

      return serializeQuestionForReview(
        {
          ...plainQuestion,
          subject:
            plainQuestion?.subject ||
            questionOverrides[String(plainQuestion?.sourceQuestionId)]?.subject ||
            null,
          subjectName:
            plainQuestion?.subjectName ||
            questionOverrides[String(plainQuestion?.sourceQuestionId)]?.subjectName ||
            "",
        },
        answer,
        index,
        subjectLookup
      );
    });

    res.json({
      success: true,
      data: {
        attemptId: attempt._id,
        attemptNumber: displayAttemptNumber || 1,
        testTitle: mockTest.title,
        totalMarks: mockTest.totalMarks,
        passMarks: mockTest.passMarks || 0,
        totalScore: attempt.totalScore,
        totalCorrect: attempt.totalCorrect,
        totalWrong: attempt.totalWrong,
        totalUnanswered: attempt.totalUnanswered,
        totalQuestions: mockTest.questions.length,
        percentage: attempt.percentage,
        timeTaken: attempt.timeTaken,
        duration: mockTest.duration,
        completedAt: attempt.completedAt,
        questions: resultQuestions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export {
  GetAttemptResult,
  GetMockTestForExam,
  GetMockTests,
  GetMyAttempts,
  SubmitMockTest,
};

