import React, { useEffect, useState } from "react";
import { resultAPI } from "../../api/services";
import "./Results.css";

const preferredCourseOrder = ["BIT", "BCA", "CMAT", "CSIT", "IOE"];

const pickDefaultCourse = (courses = []) => {
  for (const code of preferredCourseOrder) {
    const matchedCourse = courses.find((course) => course.code === code);
    if (matchedCourse) {
      return matchedCourse.code;
    }
  }

  return courses[0]?.code || "";
};

const formatLongDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Not published";

const Results = () => {
  const [courses, setCourses] = useState([]);
  const [course, setCourse] = useState("");
  const [examId, setExamId] = useState("");
  const [examOptions, setExamOptions] = useState([]);
  const [symbolNumber, setSymbolNumber] = useState("");
  const [result, setResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState({ exam: null, students: [] });
  const [loading, setLoading] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadCourses = async () => {
      try {
        const response = await resultAPI.getCourses();
        if (!mounted || !response.data.success) {
          return;
        }

        const loadedCourses = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        setCourses(loadedCourses);
        setCourse((currentCourse) => currentCourse || pickDefaultCourse(loadedCourses));
      } catch (fetchError) {
        console.error("Error fetching result courses:", fetchError);
      }
    };

    loadCourses();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!course) {
      setExamOptions([]);
      setExamId("");
      setLeaderboard({ exam: null, students: [] });
      return;
    }

    let mounted = true;
    setLoadingExams(true);

    const loadExams = async () => {
      try {
        const response = await resultAPI.getPublishedExams(course);
        if (!mounted || !response.data.success) {
          return;
        }

        const publishedExams = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        setExamOptions(publishedExams);
        setExamId((currentExamId) =>
          publishedExams.some((exam) => exam._id === currentExamId)
            ? currentExamId
            : ""
        );
      } catch (fetchError) {
        console.error("Error fetching published exams:", fetchError);
        if (mounted) {
          setExamOptions([]);
          setExamId("");
        }
      } finally {
        if (mounted) {
          setLoadingExams(false);
        }
      }
    };

    loadExams();

    return () => {
      mounted = false;
    };
  }, [course]);

  useEffect(() => {
    if (!course) {
      return;
    }

    let mounted = true;
    setLeaderboardLoading(true);

    const loadLeaderboard = async () => {
      try {
        const response = await resultAPI.getTopResults(course, examId);
        if (mounted && response.data.success) {
          setLeaderboard(
            response.data.data || {
              exam: null,
              students: [],
            }
          );
        }
      } catch (fetchError) {
        console.error("Error fetching top results:", fetchError);
        if (mounted) {
          setLeaderboard({ exam: null, students: [] });
        }
      } finally {
        if (mounted) {
          setLeaderboardLoading(false);
        }
      }
    };

    loadLeaderboard();

    return () => {
      mounted = false;
    };
  }, [course, examId]);

  const handleSearch = async (event) => {
    event.preventDefault();

    if (!course) {
      setError("Please select your course");
      return;
    }

    if (!symbolNumber.trim()) {
      setError("Please enter your symbol number");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setSearched(true);

    try {
      const response = await resultAPI.searchResult(
        course,
        symbolNumber.trim(),
        examId
      );
      if (response.data.success) {
        setResult(response.data.data);
      }
    } catch (searchError) {
      if (searchError.response?.status === 404) {
        setError(
          examId
            ? "No published result was found for this symbol number in the selected exam."
            : "No published result was found for this symbol number in the latest exam."
        );
      } else {
        setError(
          searchError.response?.data?.error ||
            "Something went wrong. Please try again later."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const finalResultStatus = result?.resultStatus || result?.result || "";
  const getResultBadgeClass = (resultStatus) =>
    resultStatus === "Pass" ? "result-badge-pass" : "result-badge-fail";

  const getSubjectStatus = (obtained, pass) =>
    obtained >= pass ? "subject-pass" : "subject-fail";

  return (
    <div className="results-page mt-5 pt-5">
      <div className="container-fluid results-container">
        <h1
          className="text-uppercase mb-2 text-center"
          style={{ fontWeight: 900, color: "var(--primary-orange)" }}
        >
          EXAM <span style={{ color: "var(--primary-black)" }}>RESULTS</span>
        </h1>
        <p className="text-center text-muted mb-5">
          Search published entrance results by course, symbol number, and exam.
        </p>

        <div className="row g-4">
          <div className="col-lg-5">
            <div className="result-search-card">
              <div className="search-icon-wrapper">
                <i className="fa-solid fa-magnifying-glass"></i>
              </div>
              <h3 className="text-center mb-4">Search Your Result</h3>
              <form onSubmit={handleSearch}>
                <div className="mb-3">
                  <select
                    className="form-select form-select-lg"
                    value={course}
                    onChange={(event) => setCourse(event.target.value)}
                  >
                    <option value="">-- Select Course --</option>
                    {courses.map((courseOption) => (
                      <option key={courseOption.code} value={courseOption.code}>
                        {courseOption.name || courseOption.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <select
                    className="form-select"
                    value={examId}
                    onChange={(event) => setExamId(event.target.value)}
                    disabled={!course || loadingExams}
                  >
                    <option value="">
                      {loadingExams
                        ? "Loading published exams..."
                        : "Latest published exam"}
                    </option>
                    {examOptions.map((exam) => (
                      <option key={exam._id} value={exam._id}>
                        {exam.title} - {formatLongDate(exam.examDate)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Enter Symbol Number"
                    value={symbolNumber}
                    onChange={(event) => setSymbolNumber(event.target.value)}
                  />
                  <button className="btn btn-search" type="submit" disabled={loading}>
                    {loading ? (
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
                    ) : (
                      <i className="fa-solid fa-search me-2"></i>
                    )}
                    {loading ? "Searching..." : "Search"}
                  </button>
                </div>
              </form>

              {error && searched ? (
                <div className="alert alert-warning text-center mt-3 mb-0">
                  <i className="fa-solid fa-circle-exclamation me-2"></i>
                  {error}
                </div>
              ) : null}
            </div>
          </div>

          <div className="col-lg-7">
            <div className="top-results-section">
              <h2 className="text-center mb-3" style={{ fontWeight: 800 }}>
                <i
                  className="fa-solid fa-trophy me-2"
                  style={{ color: "#f5a623" }}
                ></i>
                TOP <span style={{ color: "var(--primary-orange)" }}>10</span>{" "}
                RESULTS
              </h2>

              <div className="leaderboard-header-card">
                <div>
                  <div className="leaderboard-eyebrow">
                    {course ? `${course} Leaderboard` : "Select a Course"}
                  </div>
                  <div className="leaderboard-exam-title">
                    {leaderboard.exam?.title || "Latest published exam will appear here"}
                  </div>
                </div>
                <div className="leaderboard-exam-meta">
                  {leaderboard.exam
                    ? `Exam Date: ${formatLongDate(leaderboard.exam.examDate)}`
                    : "Published toppers update after result publication"}
                </div>
              </div>

              {leaderboardLoading ? (
                <div className="text-center py-5">
                  <div
                    className="spinner-border"
                    style={{ color: "var(--primary-orange)" }}
                    role="status"
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : leaderboard.students && leaderboard.students.length > 0 ? (
                <div className="leaderboard-card">
                  <table className="table leaderboard-table mb-0">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Student Name</th>
                        <th>Symbol No.</th>
                        <th className="text-center">Marks</th>
                        <th className="text-center">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.students.map((student, index) => (
                        <tr
                          key={`${student.symbolNumber}-${student.rank || index}`}
                          className={index < 3 ? `top-rank rank-${index + 1}` : ""}
                        >
                          <td>
                            <span
                              className={`rank-badge ${
                                index < 3 ? `rank-${index + 1}-badge` : ""
                              }`}
                            >
                              {index === 0 ? (
                                <i className="fa-solid fa-crown me-1"></i>
                              ) : null}
                              {student.rank || index + 1}
                            </span>
                          </td>
                          <td className="fw-semibold">{student.studentName}</td>
                          <td>{student.symbolNumber}</td>
                          <td className="text-center">
                            {student.totalObtainedMarks} / {student.totalFullMarks}
                          </td>
                          <td className="text-center">
                            <span className="percentage-badge">
                              {student.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted">
                    No published topper list is available for {course || "this course"} yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {result ? (
          <div className="row justify-content-center mt-4">
            <div className="col-lg-10">
              <div className="result-card">
                <div className="result-card-header">
                  <div className="result-header-left">
                    <h2 className="result-student-name">{result.studentName}</h2>
                    <div className="result-meta">
                      <span className="result-meta-item">
                        <i className="fa-solid fa-hashtag me-1"></i>
                        Symbol: <strong>{result.symbolNumber}</strong>
                      </span>
                      <span className="result-meta-item">
                        <i className="fa-solid fa-graduation-cap me-1"></i>
                        Course: <strong>{result.course}</strong>
                      </span>
                      <span className="result-meta-item">
                        <i className="fa-solid fa-file-lines me-1"></i>
                        Exam: <strong>{result.examTitle}</strong>
                      </span>
                      <span className="result-meta-item">
                        <i className="fa-solid fa-calendar me-1"></i>
                        Exam Date: <strong>{formatLongDate(result.examDate)}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="result-header-right">
                    <span
                      className={`result-badge ${getResultBadgeClass(finalResultStatus)}`}
                    >
                      {finalResultStatus === "Pass" ? (
                        <>
                          <i className="fa-solid fa-circle-check me-2"></i>PASSED
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-circle-xmark me-2"></i>FAILED
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
                        <th className="text-center">Pass Marks</th>
                        <th className="text-center">Obtained Marks</th>
                        <th className="text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.subjects.map((subject, index) => (
                        <tr
                          key={`${subject.subjectName}-${index}`}
                          className={getSubjectStatus(
                            subject.obtainedMarks,
                            subject.passMarks
                          )}
                        >
                          <td>{index + 1}</td>
                          <td className="subject-name">{subject.subjectName}</td>
                          <td className="text-center">{subject.fullMarks}</td>
                          <td className="text-center">{subject.passMarks}</td>
                          <td className="text-center fw-bold">{subject.obtainedMarks}</td>
                          <td className="text-center">
                            {subject.obtainedMarks >= subject.passMarks ? (
                              <span className="status-pass">
                                <i className="fa-solid fa-check"></i>
                              </span>
                            ) : (
                              <span className="status-fail">
                                <i className="fa-solid fa-xmark"></i>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="total-row">
                        <td></td>
                        <td className="fw-bold">Total</td>
                        <td className="text-center fw-bold">{result.totalFullMarks}</td>
                        <td className="text-center fw-bold">{result.totalPassMarks}</td>
                        <td className="text-center fw-bold">
                          {result.totalObtainedMarks}
                        </td>
                        <td></td>
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
                    <span className="summary-value">{result.rank || "-"}</span>
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
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Results;
