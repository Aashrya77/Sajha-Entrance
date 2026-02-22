import React, { useState, useEffect } from 'react';
import { resultAPI } from '../../api/services';
import './Results.css';

const COURSES = ['BIT', 'BCA', 'CMAT', 'CSIT'];

const Results = () => {
  const [course, setCourse] = useState('');
  const [symbolNumber, setSymbolNumber] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [topResults, setTopResults] = useState({});
  const [activeCourse, setActiveCourse] = useState('BIT');
  const [topLoading, setTopLoading] = useState(true);

  useEffect(() => {
    const fetchTopResults = async () => {
      try {
        const response = await resultAPI.getTopResults();
        if (response.data.success) {
          setTopResults(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching top results:', err);
      }
      setTopLoading(false);
    };
    fetchTopResults();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!course) {
      setError('Please select your course');
      return;
    }
    if (!symbolNumber.trim()) {
      setError('Please enter your symbol number');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setSearched(true);

    try {
      const response = await resultAPI.searchResult(course, symbolNumber.trim());
      if (response.data.success) {
        setResult(response.data.data);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('No result found for this symbol number. Please check and try again.');
      } else {
        setError(err.response?.data?.error || 'Something went wrong. Please try again later.');
      }
    }
    setLoading(false);
  };

  const getResultBadgeClass = (resultStatus) => {
    return resultStatus === 'Pass' ? 'result-badge-pass' : 'result-badge-fail';
  };

  const getSubjectStatus = (obtained, pass) => {
    return obtained >= pass ? 'subject-pass' : 'subject-fail';
  };

  return (
    <div className="results-page mt-5 pt-5">
      <div className="container">
        <h1 className="text-uppercase mb-2 text-center" style={{ fontWeight: 900, color: 'var(--primary-orange)' }}>
          EXAM <span style={{ color: 'var(--primary-black)' }}>RESULTS</span>
        </h1>
        <p className="text-center text-muted mb-5">Check your entrance exam results by entering your symbol number</p>

        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8">
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
                    onChange={(e) => setCourse(e.target.value)}
                  >
                    <option value="">-- Select Course --</option>
                    {COURSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Enter Symbol Number"
                    value={symbolNumber}
                    onChange={(e) => setSymbolNumber(e.target.value)}
                  />
                  <button
                    className="btn btn-search"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    ) : (
                      <i className="fa-solid fa-search me-2"></i>
                    )}
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {error && searched && (
          <div className="row justify-content-center mt-4">
            <div className="col-lg-8">
              <div className="alert alert-warning text-center">
                <i className="fa-solid fa-circle-exclamation me-2"></i>
                {error}
              </div>
            </div>
          </div>
        )}

        {/* Top 10 Leaderboard */}
        <div className="top-results-section mt-5">
          <h2 className="text-center mb-4" style={{ fontWeight: 800 }}>
            <i className="fa-solid fa-trophy me-2" style={{ color: '#f5a623' }}></i>
            TOP <span style={{ color: 'var(--primary-orange)' }}>10</span> RESULTS
          </h2>

          <div className="course-tabs">
            {COURSES.map((course) => (
              <button
                key={course}
                className={`course-tab ${activeCourse === course ? 'active' : ''}`}
                onClick={() => setActiveCourse(course)}
              >
                {course}
              </button>
            ))}
          </div>

          {topLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: 'var(--primary-orange)' }} role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : topResults[activeCourse] && topResults[activeCourse].length > 0 ? (
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
                  {topResults[activeCourse].map((student, index) => (
                    <tr key={student.symbolNumber} className={index < 3 ? `top-rank rank-${index + 1}` : ''}>
                      <td>
                        <span className={`rank-badge ${index < 3 ? `rank-${index + 1}-badge` : ''}`}>
                          {index === 0 && <i className="fa-solid fa-crown me-1"></i>}
                          {index + 1}
                        </span>
                      </td>
                      <td className="fw-semibold">{student.studentName}</td>
                      <td>{student.symbolNumber}</td>
                      <td className="text-center">{student.totalObtainedMarks} / {student.totalFullMarks}</td>
                      <td className="text-center">
                        <span className="percentage-badge">{student.percentage}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted">No results available for {activeCourse} yet.</p>
            </div>
          )}
        </div>

        {result && (
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
                        <i className="fa-solid fa-calendar me-1"></i>
                        Exam Date: <strong>{new Date(result.examDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="result-header-right">
                    <span className={`result-badge ${getResultBadgeClass(result.result)}`}>
                      {result.result === 'Pass' ? (
                        <><i className="fa-solid fa-circle-check me-2"></i>PASSED</>
                      ) : (
                        <><i className="fa-solid fa-circle-xmark me-2"></i>FAILED</>
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
                        <tr key={index} className={getSubjectStatus(subject.obtainedMarks, subject.passMarks)}>
                          <td>{index + 1}</td>
                          <td className="subject-name">{subject.subjectName}</td>
                          <td className="text-center">{subject.fullMarks}</td>
                          <td className="text-center">{subject.passMarks}</td>
                          <td className="text-center fw-bold">{subject.obtainedMarks}</td>
                          <td className="text-center">
                            {subject.obtainedMarks >= subject.passMarks ? (
                              <span className="status-pass"><i className="fa-solid fa-check"></i></span>
                            ) : (
                              <span className="status-fail"><i className="fa-solid fa-xmark"></i></span>
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
                        <td className="text-center">-</td>
                        <td className="text-center fw-bold">{result.totalObtainedMarks}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="result-summary">
                  <div className="summary-item">
                    <span className="summary-label">Total Marks</span>
                    <span className="summary-value">{result.totalObtainedMarks} / {result.totalFullMarks}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Percentage</span>
                    <span className="summary-value">{result.percentage}%</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Result</span>
                    <span className={`summary-value ${result.result === 'Pass' ? 'text-success' : 'text-danger'}`}>
                      {result.result}
                    </span>
                  </div>
                </div>

                {result.remarks && (
                  <div className="result-remarks">
                    <strong>Remarks:</strong> {result.remarks}
                  </div>
                )}

                <div className="result-footer">
                  <small className="text-muted">
                    Published on: {new Date(result.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;
