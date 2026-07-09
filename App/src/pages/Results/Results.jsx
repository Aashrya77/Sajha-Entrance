import React, { useEffect, useState } from "react";
import { resultAPI } from "../../api/services";
import "./Results.css";

const formatLongDate = (value) => {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
};

const normalizeRollNumber = (value = "") => String(value || "").trim();

const formatResultRank = (rank) => {
  const numericRank = Number(rank);
  return Number.isInteger(numericRank) && numericRank > 0
    ? `#${numericRank}`
    : "Not Available";
};

const isRequestCanceled = (error) =>
  error?.code === "ERR_CANCELED" || error?.name === "CanceledError";

const ResultField = ({ id, label, error, children }) => (
  <div className="result-search-field">
    <label htmlFor={id}>{label}</label>
    {children}
    {error ? <p className="result-field-error">{error}</p> : null}
  </div>
);

const ResultSearchState = ({ icon = "fa-circle-info", title, message }) => (
  <div className="result-search-state">
    <i className={`fa-solid ${icon}`} aria-hidden="true"></i>
    <div>
      <strong>{title}</strong>
      {message ? <p>{message}</p> : null}
    </div>
  </div>
);

const IndividualResultView = ({ result }) => {
  const finalResultStatus = result
    ? Number(result.percentage || 0) < 35
      ? "Fail"
      : "Pass"
    : "";
  const badgeClass =
    finalResultStatus === "Pass" ? "result-badge-pass" : "result-badge-fail";

  if (!result) {
    return null;
  }

  return (
    <section className="results-result-pane" aria-live="polite">
      <div className="result-card">
        <div className="result-card-header">
          <div className="result-header-left">
            <h2 className="result-student-name">{result.studentName}</h2>
            <div className="result-meta">
              <span className="result-meta-item">
                <i className="fa-solid fa-hashtag" aria-hidden="true"></i>
                Roll No.: <strong>{result.symbolNumber}</strong>
              </span>
              <span className="result-meta-item">
                <i className="fa-solid fa-graduation-cap" aria-hidden="true"></i>
                Program: <strong>{result.courseName || result.course}</strong>
              </span>
              <span className="result-meta-item">
                <i className="fa-solid fa-file-lines" aria-hidden="true"></i>
                Mock Test: <strong>{result.examTitle}</strong>
              </span>
              <span className="result-meta-item">
                <i className="fa-solid fa-calendar" aria-hidden="true"></i>
                Date: <strong>{formatLongDate(result.examDate)}</strong>
              </span>
              <span className="result-meta-item">
                <i className="fa-solid fa-ranking-star" aria-hidden="true"></i>
                Mock Test Rank: <strong>{formatResultRank(result.rank)}</strong>
              </span>
            </div>
          </div>
          <div className="result-header-right">
            <span className={`result-badge ${badgeClass}`}>
              {finalResultStatus === "Pass" ? (
                <>
                  <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
                  Passed
                </>
              ) : (
                <>
                  <i className="fa-solid fa-circle-xmark" aria-hidden="true"></i>
                  Failed
                </>
              )}
            </span>
          </div>
        </div>

        <div className="result-table-wrapper">
          <table className="table result-table">
            <thead>
              <tr>
                <th>S.N.</th>
                <th>Subject</th>
                <th className="text-center">Full Marks</th>
                <th className="text-center">Obtained Marks</th>
              </tr>
            </thead>
            <tbody>
              {(result.subjects || []).map((subject, index) => (
                <tr key={`${subject.subjectName}-${index}`}>
                  <td>{index + 1}</td>
                  <td className="subject-name">{subject.subjectName}</td>
                  <td className="text-center">{subject.fullMarks}</td>
                  <td className="text-center fw-bold">{subject.obtainedMarks}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td></td>
                <td className="fw-bold">Total</td>
                <td className="text-center fw-bold">{result.totalFullMarks}</td>
                <td className="text-center fw-bold">{result.totalObtainedMarks}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="result-summary">
          <div className="summary-item">
            <span className="summary-label">Total Marks</span>
            <span className="summary-value">
              {result.totalObtainedMarks} / {result.totalFullMarks}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Percentage</span>
            <span className="summary-value">{result.percentage}%</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Rank</span>
            <span className="summary-value">{formatResultRank(result.rank)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Result</span>
            <span
              className={`summary-value ${
                finalResultStatus === "Pass" ? "text-success" : "text-danger"
              }`}
            >
              {finalResultStatus}
            </span>
          </div>
        </div>

        {result.remarks ? (
          <div className="result-remarks">
            <strong>Remarks:</strong> {result.remarks}
          </div>
        ) : null}

        <div className="result-footer">
          <small className="text-muted">
            Published on: {formatLongDate(result.publishDate || result.publishedAt)}
          </small>
        </div>
      </div>
    </section>
  );
};

const Results = () => {
  const [courses, setCourses] = useState([]);
  const [course, setCourse] = useState("");
  const [mockTests, setMockTests] = useState([]);
  const [mockTestId, setMockTestId] = useState("");
  const [dateOptions, setDateOptions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [result, setResult] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingMockTests, setLoadingMockTests] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [rollError, setRollError] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingCourses(true);

    resultAPI
      .getCourses({ signal: controller.signal })
      .then((response) => {
        if (!response.data.success) {
          return;
        }

        setCourses(Array.isArray(response.data.data) ? response.data.data : []);
      })
      .catch((requestError) => {
        if (!isRequestCanceled(requestError)) {
          setError("Unable to load active programs right now.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingCourses(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    setMockTests([]);
    setMockTestId("");
    setDateOptions([]);
    setSessionId("");
    setResult(null);
    setSearched(false);

    if (!course) {
      return undefined;
    }

    const controller = new AbortController();
    setLoadingMockTests(true);

    resultAPI
      .getMockTests(course, { signal: controller.signal })
      .then((response) => {
        if (!response.data.success) {
          return;
        }

        setMockTests(Array.isArray(response.data.data) ? response.data.data : []);
      })
      .catch((requestError) => {
        if (!isRequestCanceled(requestError)) {
          setMockTests([]);
          setError("Unable to load mock tests for the selected program.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingMockTests(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [course]);

  useEffect(() => {
    setDateOptions([]);
    setSessionId("");
    setResult(null);
    setSearched(false);

    if (!course || !mockTestId) {
      return undefined;
    }

    const controller = new AbortController();
    setLoadingDates(true);

    resultAPI
      .getMockTestDates(course, mockTestId, { signal: controller.signal })
      .then((response) => {
        if (!response.data.success) {
          return;
        }

        setDateOptions(Array.isArray(response.data.data) ? response.data.data : []);
      })
      .catch((requestError) => {
        if (!isRequestCanceled(requestError)) {
          setDateOptions([]);
          setError("Unable to load dates for the selected mock test.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingDates(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [course, mockTestId]);

  const canSubmit =
    Boolean(course) &&
    Boolean(mockTestId) &&
    Boolean(sessionId) &&
    Boolean(normalizeRollNumber(rollNumber)) &&
    !searching;

  const handleCourseChange = (event) => {
    setCourse(event.target.value);
    setError("");
    setRollError("");
  };

  const handleMockTestChange = (event) => {
    setMockTestId(event.target.value);
    setSessionId("");
    setResult(null);
    setSearched(false);
    setError("");
  };

  const handleRollChange = (event) => {
    setRollNumber(event.target.value);
    if (normalizeRollNumber(event.target.value)) {
      setRollError("");
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();

    const trimmedRollNumber = normalizeRollNumber(rollNumber);
    if (!trimmedRollNumber) {
      setRollError("Mock Test Roll No. is required.");
      return;
    }

    if (!course || !mockTestId || !sessionId) {
      setError("Select program, mock test, and mock test date before viewing result.");
      return;
    }

    setSearching(true);
    setError("");
    setRollError("");
    setResult(null);
    setSearched(true);

    try {
      const response = await resultAPI.searchResult({
        courseId: course,
        mockTestId,
        sessionId,
        rollNumber: trimmedRollNumber,
      });
      if (response.data.success) {
        setResult(response.data.data);
      }
    } catch (searchError) {
      const statusCode = searchError.response?.status;
      if (statusCode === 404) {
        setError(
          "No result was found for the selected program, mock test, date and roll number. Please verify the entered information and try again."
        );
      } else if (statusCode === 403) {
        setError("This result has not been published yet. Please check again later.");
      } else {
        setError(
          searchError.response?.data?.error ||
            "Something went wrong while searching. Please try again later."
        );
      }
    } finally {
      setSearching(false);
    }
  };

  return (
    <main className="results-page">
      <section className="results-hero" aria-labelledby="results-page-title">
        <div className="results-hero__overlay"></div>
        <div className="container results-hero__content">
          <p className="results-hero__eyebrow">Sajha Entrance</p>
          <h1 id="results-page-title">Mock Test Result</h1>
          <p>Search and view your individual mock test result.</p>
        </div>
      </section>

      <section className="results-search-section">
        <div className="container">
          <form className="result-search-panel" onSubmit={handleSearch}>
            <ResultField id="program" label="Program">
              <select
                id="program"
                value={course}
                onChange={handleCourseChange}
                disabled={loadingCourses}
                aria-busy={loadingCourses}
              >
                <option value="">
                  {loadingCourses ? "Loading programs..." : "Select Program"}
                </option>
                {courses.map((courseOption) => (
                  <option key={courseOption.code} value={courseOption.code}>
                    {courseOption.name || courseOption.fullName || courseOption.code}
                  </option>
                ))}
              </select>
            </ResultField>

            <ResultField id="mock-test-venue" label="Mock Test Venue">
              <select
                id="mock-test-venue"
                value={mockTestId}
                onChange={handleMockTestChange}
                disabled={!course || loadingMockTests}
                aria-busy={loadingMockTests}
              >
                <option value="">
                  {!course
                    ? "Select Program first"
                    : loadingMockTests
                      ? "Loading mock tests..."
                      : "Select Mock Test"}
                </option>
                {mockTests.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.title}
                  </option>
                ))}
              </select>
            </ResultField>

            <ResultField id="mock-test-date" label="Mock Test Date">
              <select
                id="mock-test-date"
                value={sessionId}
                onChange={(event) => {
                  setSessionId(event.target.value);
                  setResult(null);
                  setSearched(false);
                  setError("");
                }}
                disabled={!course || !mockTestId || loadingDates}
                aria-busy={loadingDates}
              >
                <option value="">
                  {!mockTestId
                    ? "Select Mock Test first"
                    : loadingDates
                      ? "Loading dates..."
                      : "Select Date"}
                </option>
                {dateOptions.map((dateOption) => (
                  <option key={dateOption.sessionId} value={dateOption.sessionId}>
                    {formatLongDate(dateOption.date || dateOption.displayValue)}
                  </option>
                ))}
              </select>
            </ResultField>

            <ResultField
              id="mock-test-roll-number"
              label="Mock Test Roll No."
              error={rollError}
            >
              <input
                id="mock-test-roll-number"
                type="text"
                value={rollNumber}
                onChange={handleRollChange}
                placeholder="Enter Mock Test Roll Number"
                autoComplete="off"
                aria-invalid={Boolean(rollError)}
              />
            </ResultField>

            <button className="result-view-button" type="submit" disabled={!canSubmit}>
              {searching ? (
                <span className="spinner-border spinner-border-sm" role="status"></span>
              ) : (
                <i className="fa-solid fa-search" aria-hidden="true"></i>
              )}
              {searching ? "Viewing..." : "View"}
            </button>
          </form>

          {!loadingCourses && !courses.length ? (
            <ResultSearchState
              icon="fa-circle-info"
              title="No active program available"
              message="Published result programs will appear here once available."
            />
          ) : null}

          {course && !loadingMockTests && !mockTests.length ? (
            <ResultSearchState
              icon="fa-file-circle-xmark"
              title="No mock test available"
              message="No published mock test result is available for the selected program."
            />
          ) : null}

          {mockTestId && !loadingDates && !dateOptions.length ? (
            <ResultSearchState
              icon="fa-calendar-xmark"
              title="No date available"
              message="No published date is available for the selected mock test."
            />
          ) : null}

          {error ? (
            <div className="result-search-alert" role="alert">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
              {error}
            </div>
          ) : null}
        </div>
      </section>

      <div className="container results-content">
        <IndividualResultView result={result} />
      </div>
    </main>
  );
};

export default Results;
