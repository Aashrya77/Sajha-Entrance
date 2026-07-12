import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const questionRefs = useRef(new Map());

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
            (data.questions || []).map((question, index) => ({
              questionIndex: Number(question?.sourceQuestionIndex ?? index),
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
        // The page already renders its request failure state.
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
      // The page already renders its request failure state.
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
        sourceQuestionIndex: Number(question?.sourceQuestionIndex ?? index),
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

  const answersByQuestion = useMemo(
    () =>
      new Map(
        questions.map((question) => [
          question.index,
          answers.find((answer) => answer.questionIndex === question.sourceQuestionIndex),
        ])
      ),
    [answers, questions]
  );

  const filteredQuestions = useMemo(
    () =>
      questions.filter(
        (question) =>
          (selectedSubject === ALL_SUBJECTS || question.subject === selectedSubject) &&
          (reviewFilter === "all" ||
            (reviewFilter === "flagged" && flaggedQuestions.includes(question.index)) ||
            (reviewFilter === "answered" &&
              answersByQuestion.get(question.index)?.selectedOption !== -1) ||
            (reviewFilter === "unanswered" &&
              (answersByQuestion.get(question.index)?.selectedOption ?? -1) === -1))
      ),
    [answersByQuestion, flaggedQuestions, questions, reviewFilter, selectedSubject]
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

  const answeredCount = answers.filter((answer) => answer.selectedOption !== -1).length;
  const unansweredCount = answers.length - answeredCount;
  const flaggedCount = flaggedQuestions.length;

  const statusMeta = getStatusMeta(testData?.availabilityStatus || "live");
  const introMetrics = [
    { label: "Questions", value: testData?.totalQuestions ?? 0, icon: "fa-list-ol" },
    { label: "Full Marks", value: testData?.totalMarks ?? 0, icon: "fa-award" },
    { label: "Duration", value: `${testData?.duration ?? 0} min`, icon: "fa-clock" },
    { label: "Pass Marks", value: testData?.passMarks ?? 0, icon: "fa-circle-check" },
  ];
  const selectedSubjectLabel =
    selectedSubject === ALL_SUBJECTS ? "All Questions" : selectedSubject;
  const selectedReviewLabel =
    REVIEW_FILTERS.find((filter) => filter.value === reviewFilter)?.label || "All Questions";
  const selectOption = (question, optionIndex) => {
    const sourceOptionIndex = Number(question.options?.[optionIndex]?.sourceOptionIndex ?? optionIndex);
    setCurrentQuestion(question.index);
    setAnswers((previous) =>
      previous.map((answer) =>
        answer.questionIndex === question.sourceQuestionIndex
          ? {
              ...answer,
              selectedOption:
                answer.selectedOption === sourceOptionIndex ? -1 : sourceOptionIndex,
            }
          : answer
      )
    );
  };

  const jumpToQuestion = (questionIndex) => {
    setCurrentQuestion(questionIndex);
    const questionNode = questionRefs.current.get(questionIndex);

    if (questionNode) {
      questionNode.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const toggleQuestionFlag = (questionIndex) => {
    setCurrentQuestion(questionIndex);
    setFlaggedQuestions((previous) =>
      previous.includes(questionIndex)
        ? previous.filter((entry) => entry !== questionIndex)
        : [...previous, questionIndex]
    );
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
              <span className={statusMeta.className}>{statusMeta.label}</span>
              {testData.courseName || testData.course ? (
                <span className="mock-test-exam__intro-course">
                  {testData.courseName || testData.course}
                </span>
              ) : null}
            </div>

            <div className="mock-test-exam__intro-title">
              <h2>{testData.title}</h2>
              {testData.description ? (
                <FormattedContent
                  html={testData.description}
                  className="mock-test-exam__intro-copy"
                />
              ) : (
                <p className="mock-test-exam__intro-copy">
                  Review the overview and instructions below before you begin the mock test.
                </p>
              )}
            </div>

            <div className="mock-test-exam__intro-metrics">
              {introMetrics.map((metric) => (
                <div className="mock-test-exam__intro-metric" key={metric.label}>
                  <i className={`fa-solid ${metric.icon}`} aria-hidden="true"></i>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>

            <div className="mock-test-exam__intro-notice">
              <div className="mock-test-exam__intro-notice-head">
                <strong>Instructions</strong>
                <span>Keep these in mind while you work through the test.</span>
              </div>
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

            <div className="mock-test-exam__intro-actions">
              <p className="mock-test-exam__intro-action-note">
                The timer begins right after you start the test.
              </p>
              <button
                type="button"
                className="mock-test-exam__primary-action mock-test-exam__primary-action--inline"
                onClick={() => setStarted(true)}
              >
                <i className="fa-solid fa-play"></i>
                Start Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mock-test-exam-page">
      <div className="mock-test-exam-page__container">
        <section className="mock-test-exam__header" aria-label="Mock test controls">
          <div className="mock-test-exam__header-main">
            <div className="mock-test-exam__header-copy">
              <div className="mock-test-exam__title-row">
                <span className={statusMeta.className}>{statusMeta.label}</span>
                <h1>{testData.title}</h1>
              </div>
              {testData.courseName || testData.course ? (
                <span className="mock-test-exam__header-course">
                  {testData.courseName || testData.course}
                </span>
              ) : null}
            </div>

            <div className="mock-test-exam__header-actions">
              <div
                className="mock-test-exam__timer"
                role="timer"
                aria-label={`Time remaining ${formatTime(timeLeft)}`}
              >
                <span className="mock-test-exam__timer-label">
                  <i className="fa-regular fa-clock" aria-hidden="true"></i>
                  Timer
                </span>
                <strong
                  className={`mock-test-exam__timer-value ${getTimerToneClass(timeLeft)}`.trim()}
                >
                  {formatTime(timeLeft)}
                </strong>
              </div>

              <button
                type="button"
                className="mock-test-exam__submit-trigger"
                onClick={() => setShowConfirm(true)}
              >
                Submit Test
              </button>
            </div>
          </div>

          <div className="mock-test-exam__header-controls">
            <div className="mock-test-exam__compact-filter">
              <label className="mock-test-exam__select-field">
                <span>Subject</span>
                <select
                  value={selectedSubject}
                  onChange={(event) => setSelectedSubject(event.target.value)}
                  aria-label="Filter questions by subject"
                >
                  {subjectTabs.map((subject) => {
                    const questionCount =
                      subject === ALL_SUBJECTS
                        ? questions.length
                        : questions.filter((question) => question.subject === subject).length;

                    return (
                      <option key={subject} value={subject}>
                        {subject === ALL_SUBJECTS ? "All Questions" : subject} ({questionCount})
                      </option>
                    );
                  })}
                </select>
                <i className="fa-solid fa-chevron-down" aria-hidden="true"></i>
              </label>

              <label className="mock-test-exam__select-field">
                <span>Review</span>
                <select
                  value={reviewFilter}
                  onChange={(event) => setReviewFilter(event.target.value)}
                  aria-label="Filter questions by review status"
                >
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
                      <option key={filter.value} value={filter.value}>
                        {filter.label} ({count})
                      </option>
                    );
                  })}
                </select>
                <i className="fa-solid fa-chevron-down" aria-hidden="true"></i>
              </label>

              <div className="mock-test-exam__filter-summary" aria-live="polite">
                <span>{selectedSubjectLabel}</span>
                <span>{selectedReviewLabel}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mock-test-exam__mobile-panel-nav" aria-label="Question navigation">
          <div className="mock-test-exam__mobile-panel-row">
            {filteredQuestions.map((question) => {
              const answer = answersByQuestion.get(question.index);
              const isAnswered = answer?.selectedOption !== -1;
              const isCurrent = question.index === currentQuestion;
              const isFlagged = flaggedQuestions.includes(question.index);
              const questionState = isAnswered ? "answered" : "unanswered";

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
                  aria-label={`Question ${question.questionNumber}, ${questionState}${
                    isFlagged ? ", marked for review" : ""
                  }${isCurrent ? ", current question" : ""}`}
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
        </section>

        <section className="mock-test-exam__workspace">
          <div className="mock-test-exam__question-stage">
            {filteredQuestions.length ? (
              <div className="mock-test-exam__question-list">
                {filteredQuestions.map((question) => {
                  const questionAnswer = answersByQuestion.get(question.index) || {
                    questionIndex: question.sourceQuestionIndex,
                    selectedOption: -1,
                  };
                  const isCurrentQuestion = question.index === currentQuestion;
                  const isQuestionFlagged = flaggedQuestions.includes(question.index);

                  return (
                    <article
                      key={question.index}
                      ref={(node) => {
                        if (node) {
                          questionRefs.current.set(question.index, node);
                        } else {
                          questionRefs.current.delete(question.index);
                        }
                      }}
                      className={`mock-test-exam__question-card ${
                        isQuestionFlagged ? "mock-test-exam__question-card--flagged" : ""
                      } ${isCurrentQuestion ? "mock-test-exam__question-card--current" : ""}`.trim()}
                    >
                      <header className="mock-test-exam__question-head">
                        <div className="mock-test-exam__question-tags">
                          <span className="mock-test-exam__question-badge">
                            Question {question.questionNumber}
                          </span>
                          <span className="mock-test-exam__question-pill">{question.subject}</span>
                          {isQuestionFlagged ? (
                            <span className="mock-test-exam__question-flag-badge">
                              <i className="fa-regular fa-flag"></i>
                              Marked for Review
                            </span>
                          ) : null}
                        </div>

                        <div className="mock-test-exam__question-meta-wrap">
                          <div className="mock-test-exam__question-meta">
                            <span>{question.marks || 0} marks</span>
                          </div>
                          <button
                            type="button"
                            className={`mock-test-exam__flag-toggle ${
                              isQuestionFlagged ? "mock-test-exam__flag-toggle--active" : ""
                            }`.trim()}
                            onClick={() => toggleQuestionFlag(question.index)}
                            aria-pressed={isQuestionFlagged}
                          >
                            <i
                              className={`${
                                isQuestionFlagged ? "fa-solid" : "fa-regular"
                              } fa-flag`}
                            ></i>
                            {isQuestionFlagged ? "Remove Flag" : "Mark for Review"}
                          </button>
                        </div>
                      </header>

                      <div className="mock-test-exam__question-body">
                        <FormattedContent
                          html={question.questionText}
                          className="mock-test-exam__question-text"
                        />

                        {question.questionImage ? (
                          <img
                            src={resolveBackendPath(question.questionImage)}
                            alt={`Question ${question.questionNumber}`}
                            className="mock-test-exam__question-image"
                          />
                        ) : null}
                      </div>

                      <div
                        className="mock-test-exam__options"
                        role="radiogroup"
                        aria-label={`Options for question ${question.questionNumber}`}
                      >
                        {(question.options || []).map((option, optionIndex) => {
                          const sourceOptionIndex = Number(option.sourceOptionIndex ?? optionIndex);
                          const isSelected = questionAnswer.selectedOption === sourceOptionIndex;
                          const optionLabel = String.fromCharCode(65 + optionIndex);

                          return (
                            <button
                              key={optionIndex}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              className={`mock-test-exam__option ${
                                isSelected ? "mock-test-exam__option--selected" : ""
                              }`.trim()}
                              onClick={() => selectOption(question, optionIndex)}
                            >
                              <div className="mock-test-exam__option-head">
                                <span className="mock-test-exam__option-radio" aria-hidden="true">
                                  <span className="mock-test-exam__option-radio-dot"></span>
                                </span>
                                <span className="mock-test-exam__option-label">{optionLabel}</span>
                                <FormattedContent
                                  html={option.text}
                                  className="mock-test-exam__option-text"
                                />
                              </div>

                              {option.image ? (
                                <img
                                  src={resolveBackendPath(option.image)}
                                  alt={`Option ${optionLabel}`}
                                  className="mock-test-exam__option-image"
                                />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              </div>
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
                <p>{filteredQuestions.length} visible questions</p>
              </div>
            </div>

            <div className="mock-test-exam__panel-grid">
              {filteredQuestions.map((question) => {
                const answer = answersByQuestion.get(question.index);
                const isAnswered = answer?.selectedOption !== -1;
                const isCurrent = question.index === currentQuestion;
                const isFlagged = flaggedQuestions.includes(question.index);
                const questionState = isAnswered ? "answered" : "unanswered";

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
                    aria-label={`Question ${question.questionNumber}, ${questionState}${
                      isFlagged ? ", marked for review" : ""
                    }${isCurrent ? ", current question" : ""}`}
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
