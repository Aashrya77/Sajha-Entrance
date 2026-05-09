import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { mockTestAPI } from "../../api/services";
import { resolveBackendPath } from "../../api/config";
import Loader from "../../components/Loader/Loader";
import FormattedContent from "../../components/MockTest/FormattedContent";
import "./MockTestExam.css";

const ALL_SUBJECTS = "All";
const REVIEW_FILTERS = [
  { value: "all", label: "All Questions" },
  { value: "flagged", label: "Flagged" },
  { value: "answered", label: "Answered" },
  { value: "unanswered", label: "Unanswered" },
];

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Not scheduled";

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(
      2,
      "0"
    )}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const normalizeSubjectLabel = (question, subjectNames = []) => {
  const explicitSubject = String(
    question?.subject || question?.subjectName || question?.subjectLabel || ""
  ).trim();

  if (explicitSubject) {
    return explicitSubject;
  }

  if (Array.isArray(subjectNames) && subjectNames.length === 1) {
    return String(subjectNames[0] || "").trim() || "General";
  }

  return "General";
};

const getStatusMeta = (status = "live") => {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  if (normalizedStatus === "upcoming" || normalizedStatus === "scheduled") {
    return {
      label: "Scheduled",
      className: "mock-test-exam__status mock-test-exam__status--scheduled",
    };
  }

  if (normalizedStatus === "completed") {
    return {
      label: "Completed",
      className: "mock-test-exam__status mock-test-exam__status--completed",
    };
  }

  return {
    label: "Live",
    className: "mock-test-exam__status mock-test-exam__status--live",
  };
};

const getTimerToneClass = (timeLeft) => {
  if (timeLeft <= 300) {
    return "mock-test-exam__metric-value--danger";
  }

  if (timeLeft <= 600) {
    return "mock-test-exam__metric-value--warning";
  }

  return "";
};

const MockTestExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [started, setStarted] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(ALL_SUBJECTS);
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const [reviewFilter, setReviewFilter] = useState("all");

  useEffect(() => {
    const fetchTest = async () => {
      setLoading(true);

      try {
        const response = await mockTestAPI.getMockTestForExam(id);

        if (response.data.success) {
          const data = response.data.data;
          setTestData(data);
          setTimeLeft((Number(data.duration || 0) || 0) * 60);
          setAnswers(
            (data.questions || []).map((_, index) => ({
              questionIndex: index,
              selectedOption: -1,
            }))
          );
          setCurrentQuestion(0);
          setSelectedSubject(ALL_SUBJECTS);
          setFlaggedQuestions([]);
          setReviewFilter("all");
          setPageError("");
        }
      } catch (error) {
        console.error("Error fetching test:", error);
        setPageError(
          error.response?.data?.error || "Unable to open this mock test right now."
        );
        setTestData(error.response?.data?.data || null);
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [id]);

  const handleSubmit = useCallback(async () => {
    if (submitting || !testData) {
      return;
    }

    setSubmitting(true);

    try {
      const elapsed = testData.duration * 60 - timeLeft;
      const response = await mockTestAPI.submitMockTest(id, {
        answers,
        timeTaken: elapsed,
      });

      if (response.data.success) {
        navigate(`/mocktest-result/${response.data.data.attemptId}`, {
          state: { result: response.data.data },
        });
      }
    } catch (error) {
      console.error("Error submitting test:", error);
      alert(error.response?.data?.error || "Error submitting test. Please try again.");
      setSubmitting(false);
    }
  }, [answers, id, navigate, submitting, testData, timeLeft]);

  useEffect(() => {
    if (!started || !testData || timeLeft <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleSubmit, started, testData, timeLeft]);

  const questions = useMemo(
    () =>
      (testData?.questions || []).map((question, index) => ({
        ...question,
        index,
        questionNumber: index + 1,
        subject: normalizeSubjectLabel(question, testData?.subjectNames || []),
      })),
    [testData]
  );

  const subjectTabs = useMemo(() => {
    const orderedSubjects = [];
    const seenSubjects = new Set();

    (testData?.subjectNames || []).forEach((subject) => {
      const normalizedSubject = String(subject || "").trim();

      if (!normalizedSubject || seenSubjects.has(normalizedSubject)) {
        return;
      }

      seenSubjects.add(normalizedSubject);
      orderedSubjects.push(normalizedSubject);
    });

    questions.forEach((question) => {
      if (!question.subject || seenSubjects.has(question.subject)) {
        return;
      }

      seenSubjects.add(question.subject);
      orderedSubjects.push(question.subject);
    });

    return [ALL_SUBJECTS, ...orderedSubjects];
  }, [questions, testData?.subjectNames]);

  const filteredQuestions = useMemo(
    () =>
      questions.filter(
        (question) =>
          (selectedSubject === ALL_SUBJECTS || question.subject === selectedSubject) &&
          (reviewFilter === "all" ||
            (reviewFilter === "flagged" && flaggedQuestions.includes(question.index)) ||
            (reviewFilter === "answered" &&
              answers.find((answer) => answer.questionIndex === question.index)?.selectedOption !==
                -1) ||
            (reviewFilter === "unanswered" &&
              (answers.find((answer) => answer.questionIndex === question.index)
                ?.selectedOption ?? -1) === -1))
      ),
    [answers, flaggedQuestions, questions, reviewFilter, selectedSubject]
  );

  useEffect(() => {
    if (!filteredQuestions.length) {
      return;
    }

    const isCurrentQuestionVisible = filteredQuestions.some(
      (question) => question.index === currentQuestion
    );

    if (!isCurrentQuestionVisible) {
      setCurrentQuestion(filteredQuestions[0].index);
    }
  }, [currentQuestion, filteredQuestions]);

  const currentQuestionData = useMemo(
    () => questions.find((question) => question.index === currentQuestion) || null,
    [currentQuestion, questions]
  );
  const isCurrentQuestionVisibleInFilter = filteredQuestions.some(
    (question) => question.index === currentQuestion
  );
  const visibleCurrentQuestionData = isCurrentQuestionVisibleInFilter
    ? currentQuestionData
    : null;

  const currentAnswer = useMemo(
    () =>
      answers.find((answer) => answer.questionIndex === currentQuestion) || {
        questionIndex: currentQuestion,
        selectedOption: -1,
      },
    [answers, currentQuestion]
  );

  const answeredCount = answers.filter((answer) => answer.selectedOption !== -1).length;
  const unansweredCount = answers.length - answeredCount;
  const flaggedCount = flaggedQuestions.length;
  const attemptedMarks = answers.reduce((sum, answer) => {
    if (answer.selectedOption === -1) {
      return sum;
    }

    return sum + (Number(questions[answer.questionIndex]?.marks) || 0);
  }, 0);

  const activeFilteredIndex = filteredQuestions.findIndex(
    (question) => question.index === currentQuestion
  );

  const statusMeta = getStatusMeta(testData?.availabilityStatus || "live");
  const isCurrentQuestionFlagged = flaggedQuestions.includes(currentQuestion);

  const selectOption = (optionIndex) => {
    setAnswers((previous) =>
      previous.map((answer) =>
        answer.questionIndex === currentQuestion
          ? {
              ...answer,
              selectedOption:
                answer.selectedOption === optionIndex ? -1 : optionIndex,
            }
          : answer
      )
    );
  };

  const jumpToQuestion = (questionIndex) => {
    setCurrentQuestion(questionIndex);
  };

  const toggleQuestionFlag = () => {
    setFlaggedQuestions((previous) =>
      previous.includes(currentQuestion)
        ? previous.filter((questionIndex) => questionIndex !== currentQuestion)
        : [...previous, currentQuestion]
    );
  };

  const goToPreviousQuestion = () => {
    if (activeFilteredIndex <= 0) {
      return;
    }

    setCurrentQuestion(filteredQuestions[activeFilteredIndex - 1].index);
  };

  const goToNextQuestion = () => {
    if (
      activeFilteredIndex < 0 ||
      activeFilteredIndex >= filteredQuestions.length - 1
    ) {
      return;
    }

    setCurrentQuestion(filteredQuestions[activeFilteredIndex + 1].index);
  };

  if (loading) {
    return (
      <div className="container mt-5 pt-5 d-flex justify-content-center">
        <Loader />
      </div>
    );
  }

  if (pageError && !testData?.canStart) {
    return (
      <div className="mock-test-exam-page mock-test-exam-page--shell">
        <div className="mock-test-exam-page__container">
          <div className="mock-test-exam__state-card">
            <span className={statusMeta.className}>{statusMeta.label}</span>
            <h2>{testData?.title || "Mock Test"}</h2>
            <p>{pageError}</p>
            {testData?.startAt ? (
              <p className="mock-test-exam__state-meta">
                Scheduled start: {formatDateTime(testData.startAt)}
              </p>
            ) : null}
            {testData?.endAt ? (
              <p className="mock-test-exam__state-meta">
                Scheduled end: {formatDateTime(testData.endAt)}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (!testData || !questions.length) {
    return (
      <div className="container mt-5 pt-5 text-center">
        <h3>Test not found</h3>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="mock-test-exam-page mock-test-exam-page--shell">
        <div className="mock-test-exam-page__container">
          <div className="mock-test-exam__intro-card">
            <div className="mock-test-exam__intro-head">
              <div>
                <span className={statusMeta.className}>{statusMeta.label}</span>
                <h2>{testData.title}</h2>
              </div>
            </div>

            {testData.description ? (
              <FormattedContent
                html={testData.description}
                className="mock-test-exam__intro-copy"
              />
            ) : null}

            <div className="mock-test-exam__intro-metrics">
              <div className="mock-test-exam__intro-metric">
                <span>Questions</span>
                <strong>{testData.totalQuestions}</strong>
              </div>
              <div className="mock-test-exam__intro-metric">
                <span>Full Marks</span>
                <strong>{testData.totalMarks}</strong>
              </div>
              <div className="mock-test-exam__intro-metric">
                <span>Duration</span>
                <strong>{testData.duration} min</strong>
              </div>
              <div className="mock-test-exam__intro-metric">
                <span>Pass Marks</span>
                <strong>{testData.passMarks || 0}</strong>
              </div>
            </div>

            <div className="mock-test-exam__intro-notice">
              <strong>Instructions</strong>
              {testData.instructions ? (
                <FormattedContent
                  html={testData.instructions}
                  className="mock-test-exam__intro-copy"
                />
              ) : (
                <ul>
                  <li>Each question has four options. Select one answer per question.</li>
                  <li>Use the subject tabs and question panel to move quickly.</li>
                  <li>Click a selected option again if you want to deselect it.</li>
                  <li>The exam auto-submits when the timer reaches zero.</li>
                </ul>
              )}
            </div>

            <button
              type="button"
              className="mock-test-exam__primary-action"
              onClick={() => setStarted(true)}
            >
              <i className="fa-solid fa-play"></i>
              Start Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mock-test-exam-page">
      <div className="mock-test-exam-page__container">
        <section className="mock-test-exam__header">
          <div className="mock-test-exam__header-main">
            <div className="mock-test-exam__header-copy">
              <div className="mock-test-exam__header-row">
                <span className={statusMeta.className}>{statusMeta.label}</span>
                <span className="mock-test-exam__header-course">
                  {testData.courseName || testData.course}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="mock-test-exam__submit-trigger"
              onClick={() => setShowConfirm(true)}
            >
              Submit Test
            </button>
          </div>

          <div className="mock-test-exam__metrics">
            <div className="mock-test-exam__metric">
              <span className="mock-test-exam__metric-label">Full Marks</span>
              <strong className="mock-test-exam__metric-value">{testData.totalMarks}</strong>
            </div>
            <div className="mock-test-exam__metric">
              <span className="mock-test-exam__metric-label">Marks Obtained</span>
              <strong className="mock-test-exam__metric-value">{attemptedMarks}</strong>
            </div>
            <div className="mock-test-exam__metric">
              <span className="mock-test-exam__metric-label">Timer</span>
              <strong
                className={`mock-test-exam__metric-value ${getTimerToneClass(timeLeft)}`.trim()}
              >
                {formatTime(timeLeft)}
              </strong>
            </div>
            <div className="mock-test-exam__metric">
              <span className="mock-test-exam__metric-label">Progress</span>
              <strong className="mock-test-exam__metric-value">
                {answeredCount}/{testData.totalQuestions}
              </strong>
            </div>
            <div className="mock-test-exam__metric">
              <span className="mock-test-exam__metric-label">Flagged</span>
              <strong className="mock-test-exam__metric-value">{flaggedCount}</strong>
            </div>
          </div>
        </section>

        <section className="mock-test-exam__subjects">
          <div className="mock-test-exam__subjects-row">
            <div className="mock-test-exam__subjects-heading">
              <h2>Subjects</h2>
              <p>Switch subjects instantly to focus on one section at a time.</p>
            </div>

            <div className="mock-test-exam__subjects-tabs">
              {subjectTabs.map((subject) => {
                const questionCount =
                  subject === ALL_SUBJECTS
                    ? questions.length
                    : questions.filter((question) => question.subject === subject).length;

                return (
                  <button
                    key={subject}
                    type="button"
                    className={`mock-test-exam__subject-tab ${
                      selectedSubject === subject
                        ? "mock-test-exam__subject-tab--active"
                        : ""
                    }`.trim()}
                    onClick={() => setSelectedSubject(subject)}
                  >
                    <span>{subject === ALL_SUBJECTS ? "All Questions" : subject}</span>
                    <small>{questionCount}</small>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mock-test-exam__review-filters">
            <div className="mock-test-exam__review-copy">
              <h3>Review Filter</h3>
              <p>Use this to focus on flagged, answered, or unanswered questions.</p>
            </div>

            <div className="mock-test-exam__review-chips">
              {REVIEW_FILTERS.map((filter) => {
                const count =
                  filter.value === "all"
                    ? questions.length
                    : filter.value === "flagged"
                      ? flaggedCount
                      : filter.value === "answered"
                        ? answeredCount
                        : unansweredCount;

                return (
                  <button
                    key={filter.value}
                    type="button"
                    className={`mock-test-exam__review-chip ${
                      reviewFilter === filter.value
                        ? "mock-test-exam__review-chip--active"
                        : ""
                    }`.trim()}
                    onClick={() => setReviewFilter(filter.value)}
                  >
                    <span>{filter.label}</span>
                    <small>{count}</small>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mock-test-exam__workspace">
          <div className="mock-test-exam__question-stage">
            {visibleCurrentQuestionData ? (
              <article
                className={`mock-test-exam__question-card ${
                  isCurrentQuestionFlagged ? "mock-test-exam__question-card--flagged" : ""
                }`.trim()}
              >
                <header className="mock-test-exam__question-head">
                  <div className="mock-test-exam__question-tags">
                    <span className="mock-test-exam__question-badge">
                      Question {visibleCurrentQuestionData.questionNumber}
                    </span>
                    <span className="mock-test-exam__question-pill">
                      {visibleCurrentQuestionData.subject}
                    </span>
                    {isCurrentQuestionFlagged ? (
                      <span className="mock-test-exam__question-flag-badge">
                        <i className="fa-regular fa-flag"></i>
                        Marked for Review
                      </span>
                    ) : null}
                  </div>

                  <div className="mock-test-exam__question-meta-wrap">
                    <div className="mock-test-exam__question-meta">
                      <span>{filteredQuestions.length} in this view</span>
                      <span>{visibleCurrentQuestionData.marks || 0} marks</span>
                    </div>
                    <button
                      type="button"
                      className={`mock-test-exam__flag-toggle ${
                        isCurrentQuestionFlagged
                          ? "mock-test-exam__flag-toggle--active"
                          : ""
                      }`.trim()}
                      onClick={toggleQuestionFlag}
                    >
                      <i
                        className={`${
                          isCurrentQuestionFlagged ? "fa-solid" : "fa-regular"
                        } fa-flag`}
                      ></i>
                      {isCurrentQuestionFlagged ? "Remove Flag" : "Mark for Review"}
                    </button>
                  </div>
                </header>

                <div className="mock-test-exam__question-body">
                  <FormattedContent
                    html={visibleCurrentQuestionData.questionText}
                    className="mock-test-exam__question-text"
                  />

                  {visibleCurrentQuestionData.questionImage ? (
                    <img
                      src={resolveBackendPath(visibleCurrentQuestionData.questionImage)}
                      alt={`Question ${visibleCurrentQuestionData.questionNumber}`}
                      className="mock-test-exam__question-image"
                    />
                  ) : null}
                </div>

                <div className="mock-test-exam__options">
                  {(visibleCurrentQuestionData.options || []).map((option, optionIndex) => {
                    const isSelected = currentAnswer.selectedOption === optionIndex;

                    return (
                      <button
                        key={optionIndex}
                        type="button"
                        className={`mock-test-exam__option ${
                          isSelected ? "mock-test-exam__option--selected" : ""
                        }`.trim()}
                        onClick={() => selectOption(optionIndex)}
                      >
                        <div className="mock-test-exam__option-top">
                          <span className="mock-test-exam__option-label">
                            {String.fromCharCode(65 + optionIndex)}
                          </span>
                          <FormattedContent
                            html={option.text}
                            className="mock-test-exam__option-text"
                          />
                        </div>

                        {option.image ? (
                          <img
                            src={resolveBackendPath(option.image)}
                            alt={`Option ${String.fromCharCode(65 + optionIndex)}`}
                            className="mock-test-exam__option-image"
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                <footer className="mock-test-exam__actions">
                  <div className="mock-test-exam__actions-hint">
                    {activeFilteredIndex >= 0 ? (
                      <span>
                        Viewing {activeFilteredIndex + 1} of {filteredQuestions.length}{" "}
                        {selectedSubject === ALL_SUBJECTS ? "questions" : selectedSubject}
                      </span>
                    ) : null}
                  </div>

                  <div className="mock-test-exam__actions-group">
                    <button
                      type="button"
                      className="mock-test-exam__ghost-button"
                      onClick={goToPreviousQuestion}
                      disabled={activeFilteredIndex <= 0}
                    >
                      <i className="fa-solid fa-arrow-left"></i>
                      Previous
                    </button>
                    <button
                      type="button"
                      className="mock-test-exam__solid-button"
                      onClick={goToNextQuestion}
                      disabled={
                        activeFilteredIndex < 0 ||
                        activeFilteredIndex >= filteredQuestions.length - 1
                      }
                    >
                      Next
                      <i className="fa-solid fa-arrow-right"></i>
                    </button>
                  </div>
                </footer>
              </article>
            ) : (
              <div className="mock-test-exam__empty-state">
                No questions are available for this filter. Try switching the subject or
                review filter.
              </div>
            )}
          </div>

          <aside className="mock-test-exam__panel">
            <div className="mock-test-exam__panel-head">
              <div>
                <h3>Question Panel</h3>
                <p>
                  Click any question number to jump directly. Answered and unanswered
                  states stay visible.
                </p>
              </div>
            </div>

            <div className="mock-test-exam__panel-grid">
              {filteredQuestions.map((question) => {
                const answer = answers.find(
                  (entry) => entry.questionIndex === question.index
                );
                const isAnswered = answer?.selectedOption !== -1;
                const isCurrent = question.index === currentQuestion;
                const isFlagged = flaggedQuestions.includes(question.index);

                return (
                  <button
                    key={question.index}
                    type="button"
                    className={`mock-test-exam__panel-button ${
                      isCurrent ? "mock-test-exam__panel-button--current" : ""
                    } ${isAnswered ? "mock-test-exam__panel-button--answered" : ""} ${
                      isFlagged ? "mock-test-exam__panel-button--flagged" : ""
                    }`.trim()}
                    onClick={() => jumpToQuestion(question.index)}
                    title={
                      isFlagged
                        ? `Question ${question.questionNumber} is marked for review`
                        : `Question ${question.questionNumber}`
                    }
                  >
                    {question.questionNumber}
                    {isFlagged ? (
                      <span className="mock-test-exam__panel-flag">
                        <i className="fa-solid fa-flag"></i>
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="mock-test-exam__panel-legend">
              <span>
                <i className="mock-test-exam__legend-dot mock-test-exam__legend-dot--current"></i>
                Current
              </span>
              <span>
                <i className="mock-test-exam__legend-dot mock-test-exam__legend-dot--answered"></i>
                Answered
              </span>
              <span>
                <i className="mock-test-exam__legend-dot mock-test-exam__legend-dot--flagged"></i>
                Flagged
              </span>
              <span>
                <i className="mock-test-exam__legend-dot mock-test-exam__legend-dot--idle"></i>
                Unanswered
              </span>
            </div>

            <div className="mock-test-exam__panel-summary">
              <div className="mock-test-exam__panel-summary-row">
                <span>Answered</span>
                <strong>{answeredCount}</strong>
              </div>
              <div className="mock-test-exam__panel-summary-row">
                <span>Unanswered</span>
                <strong>{unansweredCount}</strong>
              </div>
              <div className="mock-test-exam__panel-summary-row">
                <span>Current Subject</span>
                <strong>{selectedSubject === ALL_SUBJECTS ? "All" : selectedSubject}</strong>
              </div>
              <div className="mock-test-exam__panel-summary-row">
                <span>Flagged</span>
                <strong>{flaggedCount}</strong>
              </div>
            </div>
          </aside>
        </section>
      </div>

      {showConfirm ? (
        <div
          className="mock-test-exam__modal"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="mock-test-exam__modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            <span className={statusMeta.className}>{statusMeta.label}</span>
            <h4>Submit Test?</h4>
            <p>
              You have answered <strong>{answeredCount}</strong> out of{" "}
              <strong>{testData.totalQuestions}</strong> questions.
            </p>
            {unansweredCount > 0 ? (
              <p className="mock-test-exam__modal-warning">
                {unansweredCount} question{unansweredCount > 1 ? "s are" : " is"} still
                unanswered.
              </p>
            ) : null}
            {flaggedCount > 0 ? (
              <p className="mock-test-exam__modal-warning mock-test-exam__modal-warning--flagged">
                {flaggedCount} question{flaggedCount > 1 ? "s are" : " is"} marked for
                review.
              </p>
            ) : null}
            <div className="mock-test-exam__modal-actions">
              <button
                type="button"
                className="mock-test-exam__ghost-button"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="mock-test-exam__solid-button"
                onClick={() => {
                  setShowConfirm(false);
                  handleSubmit();
                }}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Now"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MockTestExam;
