import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { mockTestAPI } from "../../api/services";
import Loader from "../../components/Loader/Loader";
import "./MockTests.css";

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

const formatCountdown = (milliseconds) => {
  if (milliseconds === null || milliseconds === undefined) {
    return "";
  }

  if (milliseconds <= 0) {
    return "Starting now";
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
};

const getAvailabilityMeta = (test, now) => {
  const startAt = test?.startAt ? new Date(test.startAt) : null;
  const endAt = test?.endAt ? new Date(test.endAt) : null;
  const availabilityStatus = test?.availabilityStatus || "scheduled";
  const normalizedAvailabilityStatus = String(availabilityStatus).toLowerCase();

  if (normalizedAvailabilityStatus === "live") {
    return {
      tone: "live",
      label: "Live",
      helper: endAt ? `Ends ${formatDateTime(endAt)}` : "Available now",
    };
  }

  if (normalizedAvailabilityStatus === "upcoming") {
    return {
      tone: "warning",
      label: "Scheduled",
      helper: startAt
        ? `Starts in ${formatCountdown(startAt.getTime() - now.getTime())}`
        : "Starts soon",
    };
  }

  if (normalizedAvailabilityStatus === "completed") {
    return {
      tone: "completed",
      label: "Completed",
      helper: endAt ? `Ended ${formatDateTime(endAt)}` : "Completed",
    };
  }

  return {
    tone: "neutral",
    label: availabilityStatus || "Unavailable",
    helper: endAt ? `Ended ${formatDateTime(endAt)}` : "Unavailable",
  };
};

const getAvailabilityIconClass = (tone) => {
  if (tone === "live") {
    return "fa-circle mock-tests-page__live-dot";
  }

  if (tone === "completed") {
    return "fa-circle-check";
  }

  if (tone === "warning") {
    return "fa-clock";
  }

  return "fa-circle-info";
};

const MockTests = ({ isAuthenticated }) => {
  const [mockTests, setMockTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("mocktest");
  const [pageError, setPageError] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetchMockTests();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchMockTests = async (nextSearch = "") => {
    setLoading(true);
    try {
      const response = await mockTestAPI.getAllMockTests(nextSearch);
      if (response.data.success) {
        setMockTests(response.data.data.mockTests || []);
      }
      setPageError("");
    } catch (error) {
      console.error("Error fetching mock tests:", error);
      setPageError("Unable to load mock tests right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    fetchMockTests(searchTerm);
  };

  const filteredTests = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return mockTests.filter((test) => {
      if (!term) {
        return true;
      }

      return [test.title, test.courseName, test.course, ...(test.subjectNames || [])]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [mockTests, searchTerm]);

  if (loading) {
    return (
      <div className="container mt-5 pt-5 d-flex justify-content-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="mock-tests-page">
      <div className="container">
        <div className="mock-tests-page__tabs">
          {[
            { key: "online", label: "Online Exam", icon: "fa-laptop" },
            { key: "physical", label: "Physical Exam", icon: "fa-building" },
            { key: "mocktest", label: "Mock Test", icon: "fa-file-lines" },
            { key: "results", label: "Results", icon: "fa-chart-bar" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === "results") {
                  window.location.href = isAuthenticated ? "/mocktest-results" : "/student/login";
                }
              }}
              className={`mock-tests-page__tab ${
                activeTab === tab.key ? "mock-tests-page__tab--active" : ""
              } ${
                tab.key === "online" || tab.key === "physical"
                  ? "mock-tests-page__tab--secondary"
                  : ""
              }`.trim()}
            >
              <i className={`fa-solid ${tab.icon} mock-tests-page__tab-icon`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {(activeTab === "online" || activeTab === "physical") && (
          <div className="mock-tests-page__state">
            <i className="fa-solid fa-clock mock-tests-page__state-icon"></i>
            <h3 className="mock-tests-page__state-title">Coming Soon</h3>
            <p>This feature will be available soon. Stay tuned!</p>
          </div>
        )}

        {activeTab === "mocktest" && (
          <>
            <form
              onSubmit={handleSearch}
              className="mock-tests-page__search"
            >
              <i
                className="fa-solid fa-magnifying-glass mock-tests-page__search-icon"
              ></i>
              <input
                type="text"
                placeholder="Search by mock test, course, or subject"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="mock-tests-page__search-input"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    fetchMockTests("");
                  }}
                  className="mock-tests-page__search-clear"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              ) : null}
            </form>

            {pageError ? (
              <div className="mock-tests-page__error" role="alert">
                {pageError}
              </div>
            ) : null}

            {filteredTests.length === 0 ? (
              <div className="mock-tests-page__state mock-tests-page__state--empty">
                <i className="fa-solid fa-file-circle-xmark mock-tests-page__state-icon"></i>
                <h3 className="mock-tests-page__state-title">No mock tests found</h3>
                <p>Try adjusting your search or check back later.</p>
              </div>
            ) : (
              <div className="mock-tests-page__grid">
                {filteredTests.map((test) => {
                  const availability = getAvailabilityMeta(test, now);
                  const canStart = test.canStart && test.availabilityStatus === "live";
                  const actionHref = isAuthenticated ? `/mocktest/${test._id}` : "/student/login";

                  return (
                    <div
                      key={test._id}
                      className="mock-tests-page__card"
                    >
                      <div className="mock-tests-page__card-head">
                        <div className="mock-tests-page__card-title-group">
                          <h3 className="mock-tests-page__card-title">
                            {test.title}
                          </h3>
                          <div className="mock-tests-page__badge-row">
                            <span className={`mock-tests-page__badge mock-tests-page__badge--status mock-tests-page__badge--${availability.tone}`}>
                              <i className={`fa-solid ${getAvailabilityIconClass(availability.tone)}`} aria-hidden="true"></i>
                              {availability.label}
                            </span>
                            <span className="mock-tests-page__badge mock-tests-page__badge--questions">
                              <i className="fa-solid fa-file-lines" aria-hidden="true"></i>
                              {test.totalQuestions} questions
                            </span>
                          </div>
                        </div>

                        <span className="mock-tests-page__marks">
                          Total marks: {test.totalMarks}
                        </span>
                      </div>

                      {test.description ? (
                        <p className="mock-tests-page__description">
                          {test.description.replace(/<[^>]*>/g, " ").trim()}
                        </p>
                      ) : null}

                      <div className="mock-tests-page__meta-grid">
                        <div className="mock-tests-page__meta-item mock-tests-page__meta-item--course">
                          <span className="mock-tests-page__meta-icon">
                            <i className="fa-solid fa-book-open" aria-hidden="true"></i>
                          </span>
                          <span className="mock-tests-page__meta-copy">
                            <strong>Course</strong>
                            <span>{test.courseName || test.course || "General"}</span>
                          </span>
                        </div>
                        <div className="mock-tests-page__meta-item mock-tests-page__meta-item--subjects">
                          <span className="mock-tests-page__meta-icon">
                            <i className="fa-solid fa-clipboard-list" aria-hidden="true"></i>
                          </span>
                          <span className="mock-tests-page__meta-copy">
                            <strong>Subjects</strong>
                            <span>{test.subjectNames?.length ? test.subjectNames.join(", ") : "Mixed"}</span>
                          </span>
                        </div>
                        <div className="mock-tests-page__meta-item mock-tests-page__meta-item--duration">
                          <span className="mock-tests-page__meta-icon">
                            <i className="fa-solid fa-clock" aria-hidden="true"></i>
                          </span>
                          <span className="mock-tests-page__meta-copy">
                            <strong>Duration</strong>
                            <span>{test.duration} mins</span>
                          </span>
                        </div>
                        <div className="mock-tests-page__meta-item mock-tests-page__meta-item--pass">
                          <span className="mock-tests-page__meta-icon">
                            <i className="fa-solid fa-award" aria-hidden="true"></i>
                          </span>
                          <span className="mock-tests-page__meta-copy">
                            <strong>Pass Marks</strong>
                            <span>{test.passMarks || 0}</span>
                          </span>
                        </div>
                      </div>

                      <div className="mock-tests-page__date-grid">
                        <div className="mock-tests-page__date-item">
                          <strong>
                            <i className="fa-solid fa-calendar-days" aria-hidden="true"></i>
                            Start
                          </strong>
                          <span>{formatDateTime(test.startAt)}</span>
                        </div>
                        <div className="mock-tests-page__date-item">
                          <strong>
                            <i className="fa-solid fa-calendar-days" aria-hidden="true"></i>
                            End
                          </strong>
                          <span>{formatDateTime(test.endAt)}</span>
                        </div>
                      </div>

                      <div className="mock-tests-page__card-footer">
                        <div className="mock-tests-page__helper">
                          <i className="fa-solid fa-circle-info" aria-hidden="true"></i>
                          {availability.helper}
                        </div>

                        {canStart ? (
                          <Link
                            to={actionHref}
                            className="mock-tests-page__action mock-tests-page__action--primary"
                          >
                            <i className="fa-solid fa-play" aria-hidden="true"></i>
                            Start Test
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="mock-tests-page__action mock-tests-page__action--disabled"
                          >
                            <i className="fa-solid fa-lock" aria-hidden="true"></i>
                            {availability.label === "Scheduled" ? "Starts Soon" : "Unavailable"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MockTests;
