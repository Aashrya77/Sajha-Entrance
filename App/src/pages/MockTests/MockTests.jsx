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

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Not specified";

const formatDuration = (minutes) => {
  const numericMinutes = Number(minutes || 0);
  return numericMinutes > 0 ? `${numericMinutes} mins` : "Not specified";
};

const formatCount = (value, singular, plural) => {
  const numericValue = Number(value || 0);
  if (numericValue <= 0) {
    return "Not specified";
  }

  return `${numericValue} ${numericValue === 1 ? singular : plural}`;
};

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
  const completedAt = test?.latestAttempt?.completedAt
    ? new Date(test.latestAttempt.completedAt)
    : null;
  const availabilityStatus = test?.availabilityStatus || "scheduled";
  const normalizedAvailabilityStatus = String(availabilityStatus).toLowerCase();

  if (test?.hasCompletedAttempt) {
    return {
      tone: "completed",
      label: "Completed",
      helper:
        completedAt && !Number.isNaN(completedAt.getTime())
          ? `Completed on ${formatDateTime(completedAt)}`
          : "Completed",
    };
  }

  if (normalizedAvailabilityStatus === "live") {
    return {
      tone: "live",
      label: "Live",
      helper: endAt ? `Ends ${formatDateTime(endAt)}` : "Available now",
    };
  }

  if (normalizedAvailabilityStatus === "upcoming") {
    return {
      tone: "open",
      label: "Open",
      helper: startAt
        ? `Starts ${formatDateTime(startAt)}`
        : "Opening soon",
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

const buildMockTestActions = (test, isAuthenticated) => {
  const canStart = test.canStart && test.availabilityStatus === "live";
  const examHref = isAuthenticated ? `/mocktest/${test._id}` : "/student/login";

  if (test.hasCompletedAttempt) {
    const resultHref = test.latestAttempt?.id
      ? `/mocktest-result/${test.latestAttempt.id}`
      : "/mocktest-results";
    const actions = [
      {
        type: "link",
        label: "View Result",
        href: isAuthenticated ? resultHref : "/student/login",
        modifier: "secondary",
      },
    ];

    if (test.canRetake) {
      actions.push({
        type: "link",
        label: "Retake Test",
        href: examHref,
        modifier: "primary",
      });
    }

    return actions;
  }

  if (canStart) {
    return [{
      type: "link",
      label: "Start Test",
      href: examHref,
      modifier: "primary",
    }];
  }

  return [{
    type: "button",
    label: "Unavailable",
    modifier: "disabled",
  }];
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
                  const actions = buildMockTestActions(test, isAuthenticated);
                  const examDate = test.examDate || test.startAt || test.publishedAt;

                  return (
                    <div
                      key={test._id}
                      className="mock-tests-page__card"
                    >
                      <div className="mock-tests-page__card-head">
                        <span className="mock-tests-page__exam-icon" aria-hidden="true">
                          <i className="fa-regular fa-file-lines"></i>
                        </span>

                        <div className="mock-tests-page__card-title-group">
                          <h3 className="mock-tests-page__card-title">{test.title}</h3>
                          <p className="mock-tests-page__card-subtitle">
                            {test.courseName || test.course || "Entrance Preparation"}
                          </p>
                        </div>

                        <span className={`mock-tests-page__badge mock-tests-page__badge--${availability.tone}`}>
                          {availability.label}
                        </span>
                      </div>

                      <div className="mock-tests-page__meta-grid">
                        {[
                          {
                            iconClass: "fa-regular fa-calendar",
                            label: "Date",
                            value: formatDate(examDate),
                          },
                          {
                            iconClass: "fa-regular fa-clock",
                            label: "Duration",
                            value: formatDuration(test.duration),
                          },
                          {
                            iconClass: "fa-regular fa-file-lines",
                            label: "Questions",
                            value: formatCount(test.totalQuestions, "Question", "Questions"),
                          },
                          {
                            iconClass: "fa-solid fa-trophy",
                            label: "Marks",
                            value: formatCount(test.totalMarks, "Mark", "Marks"),
                          },
                        ].map((item) => (
                          <div className="mock-tests-page__meta-item" key={item.label}>
                            <i className={item.iconClass} aria-hidden="true"></i>
                            <span className="mock-tests-page__meta-copy">
                              <strong>{item.label}</strong>
                              <span>{item.value}</span>
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mock-tests-page__card-footer">
                        <div className="mock-tests-page__helper">
                          <i className="fa-regular fa-clock" aria-hidden="true"></i>
                          {availability.helper}
                        </div>

                        <div className="mock-tests-page__actions">
                          {actions.map((action) =>
                            action.type === "link" ? (
                              <Link
                                key={action.label}
                                to={action.href}
                                className={`mock-tests-page__action mock-tests-page__action--${action.modifier}`}
                              >
                                {action.label}
                              </Link>
                            ) : (
                              <button
                                key={action.label}
                                type="button"
                                disabled
                                className="mock-tests-page__action mock-tests-page__action--disabled"
                              >
                                {action.label}
                              </button>
                            )
                          )}
                        </div>
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
