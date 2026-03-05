import MockTestModel, { MockTestAttemptModel } from "../models/MockTest.js";
import mongoose from "mongoose";

// Get all active mock tests (list view - no questions sent)
const GetMockTests = async (req, res) => {
  try {
    const search = req.query.search;
    const course = req.query.course;

    let query = { isActive: true };

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }
    if (course) {
      query.course = { $regex: course, $options: "i" };
    }

    const mockTests = await MockTestModel.find(query)
      .select("-questions.correctOption -questions.explanation")
      .sort({ createdAt: -1 })
      .exec();

    // Add question count to each test
    const testsWithCount = mockTests.map((test) => ({
      _id: test._id,
      title: test.title,
      description: test.description,
      admissionTest: test.admissionTest,
      course: test.course,
      totalMarks: test.totalMarks,
      duration: test.duration,
      totalQuestions: test.questions ? test.questions.length : 0,
      isActive: test.isActive,
      createdAt: test.createdAt,
    }));

    res.json({
      success: true,
      data: { mockTests: testsWithCount },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get a single mock test for taking the exam (questions without answers)
const GetMockTestForExam = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, error: "Invalid test ID" });
    }

    const mockTest = await MockTestModel.findOne({
      _id: req.params.id,
      isActive: true,
    }).exec();

    if (!mockTest) {
      return res.status(404).json({ success: false, error: "Mock test not found" });
    }

    // Strip correct answers and explanations for exam mode
    const sanitizedQuestions = mockTest.questions.map((q, index) => ({
      index,
      questionText: q.questionText,
      questionImage: q.questionImage,
      options: q.options.map((opt) => ({
        text: opt.text,
        image: opt.image,
      })),
      marks: q.marks,
      negativeMarks: q.negativeMarks,
    }));

    res.json({
      success: true,
      data: {
        _id: mockTest._id,
        title: mockTest.title,
        description: mockTest.description,
        admissionTest: mockTest.admissionTest,
        course: mockTest.course,
        totalMarks: mockTest.totalMarks,
        duration: mockTest.duration,
        totalQuestions: sanitizedQuestions.length,
        questions: sanitizedQuestions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Submit mock test answers and get instant result
const SubmitMockTest = async (req, res) => {
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

    // Grade the test
    let totalScore = 0;
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalUnanswered = 0;

    const gradedAnswers = mockTest.questions.map((question, index) => {
      const studentAnswer = answers ? answers.find((a) => a.questionIndex === index) : null;

      if (!studentAnswer || studentAnswer.selectedOption === null || studentAnswer.selectedOption === undefined || studentAnswer.selectedOption === -1) {
        totalUnanswered++;
        return {
          questionIndex: index,
          selectedOption: -1,
          isCorrect: false,
          marksObtained: 0,
        };
      }

      const isCorrect = studentAnswer.selectedOption === question.correctOption;

      if (isCorrect) {
        totalCorrect++;
        totalScore += question.marks || 1;
        return {
          questionIndex: index,
          selectedOption: studentAnswer.selectedOption,
          isCorrect: true,
          marksObtained: question.marks || 1,
        };
      } else {
        totalWrong++;
        totalScore -= question.negativeMarks || 0;
        return {
          questionIndex: index,
          selectedOption: studentAnswer.selectedOption,
          isCorrect: false,
          marksObtained: -(question.negativeMarks || 0),
        };
      }
    });

    const percentage =
      mockTest.totalMarks > 0
        ? Math.round((Math.max(0, totalScore) / mockTest.totalMarks) * 100 * 100) / 100
        : 0;

    // Save the attempt
    const attempt = await MockTestAttemptModel.create({
      student: studentId,
      mockTest: id,
      answers: gradedAnswers,
      totalScore: Math.max(0, totalScore),
      totalCorrect,
      totalWrong,
      totalUnanswered,
      percentage,
      timeTaken: timeTaken || 0,
    });

    // Build result with correct answers and explanations
    const resultQuestions = mockTest.questions.map((q, index) => {
      const graded = gradedAnswers[index];
      return {
        index,
        questionText: q.questionText,
        questionImage: q.questionImage,
        options: q.options,
        correctOption: q.correctOption,
        explanation: q.explanation,
        marks: q.marks,
        selectedOption: graded.selectedOption,
        isCorrect: graded.isCorrect,
        marksObtained: graded.marksObtained,
      };
    });

    res.json({
      success: true,
      data: {
        attemptId: attempt._id,
        testTitle: mockTest.title,
        totalMarks: mockTest.totalMarks,
        totalScore: Math.max(0, totalScore),
        totalCorrect,
        totalWrong,
        totalUnanswered,
        totalQuestions: mockTest.questions.length,
        percentage,
        timeTaken: timeTaken || 0,
        duration: mockTest.duration,
        questions: resultQuestions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get student's past attempts
const GetMyAttempts = async (req, res) => {
  try {
    const studentId = req.student.id;

    const attempts = await MockTestAttemptModel.find({ student: studentId })
      .populate("mockTest", "title admissionTest course totalMarks duration")
      .sort({ completedAt: -1 })
      .exec();

    res.json({
      success: true,
      data: { attempts },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get a specific attempt result
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
      .exec();

    if (!attempt) {
      return res.status(404).json({ success: false, error: "Attempt not found" });
    }

    const mockTest = attempt.mockTest;

    const resultQuestions = mockTest.questions.map((q, index) => {
      const answer = attempt.answers.find((a) => a.questionIndex === index);
      return {
        index,
        questionText: q.questionText,
        questionImage: q.questionImage,
        options: q.options,
        correctOption: q.correctOption,
        explanation: q.explanation,
        marks: q.marks,
        selectedOption: answer ? answer.selectedOption : -1,
        isCorrect: answer ? answer.isCorrect : false,
        marksObtained: answer ? answer.marksObtained : 0,
      };
    });

    res.json({
      success: true,
      data: {
        attemptId: attempt._id,
        testTitle: mockTest.title,
        totalMarks: mockTest.totalMarks,
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

export { GetMockTests, GetMockTestForExam, SubmitMockTest, GetMyAttempts, GetAttemptResult };
