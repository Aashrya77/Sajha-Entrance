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

  if (availabilityStatus === "live") {
    return {
      tone: "success",
      label: "Live",
      helper: endAt ? `Ends ${formatDateTime(endAt)}` : "Available now",
    };
  }

  if (availabilityStatus === "upcoming") {
    return {
      tone: "warning",
      label: "Scheduled",
      helper: startAt
        ? `Starts in ${formatCountdown(startAt.getTime() - now.getTime())}`
        : "Starts soon",
    };
  }

  return {
    tone: "neutral",
    label: availabilityStatus || "Unavailable",
    helper: endAt ? `Ended ${formatDateTime(endAt)}` : "Unavailable",
  };
};

const getBadgeStyle = (tone) => {
  if (tone === "success") {
    return {
      color: "#166534",
      background: "#dcfce7",
      border: "1px solid #bbf7d0",
    };
  }

  if (tone === "warning") {
    return {
      color: "#c2410c",
      background: "#ffedd5",
      border: "1px solid #fed7aa",
    };
  }

  return {
    color: "#475569",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  };
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
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#888" }}>
            <i
              className="fa-solid fa-clock"
              style={{ fontSize: "48px", marginBottom: "16px", color: "#ccc" }}
            ></i>
            <h3 style={{ fontWeight: 700, color: "#555" }}>Coming Soon</h3>
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
              <div
                style={{
                  marginBottom: "18px",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  background: "#fff1f2",
                  border: "1px solid #fecdd3",
                  color: "#be123c",
                }}
              >
                {pageError}
              </div>
            ) : null}

            {filteredTests.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
                <i
                  className="fa-solid fa-file-circle-xmark"
                  style={{ fontSize: "48px", marginBottom: "16px", color: "#ccc" }}
                ></i>
                <h3 style={{ fontWeight: 700, color: "#555" }}>No mock tests found</h3>
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
                            <span
                              className="mock-tests-page__badge"
                              style={{
                                ...getBadgeStyle(availability.tone),
                              }}
                            >
                              {availability.label}
                            </span>
                            <span
                              className="mock-tests-page__badge"
                              style={{
                                ...getBadgeStyle("neutral"),
                              }}
                            >
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
                        <div className="mock-tests-page__meta-item">
                          <strong>Course:</strong> {test.courseName || test.course || "General"}
                        </div>
                        <div className="mock-tests-page__meta-item">
                          <strong>Subjects:</strong>{" "}
                          {test.subjectNames?.length ? test.subjectNames.join(", ") : "Mixed"}
                        </div>
                        <div className="mock-tests-page__meta-item">
                          <strong>Duration:</strong> {test.duration} mins
                        </div>
                        <div className="mock-tests-page__meta-item">
                          <strong>Pass Marks:</strong> {test.passMarks || 0}
                        </div>
                        <div className="mock-tests-page__meta-item">
                          <strong>Start:</strong> {formatDateTime(test.startAt)}
                        </div>
                        <div className="mock-tests-page__meta-item">
                          <strong>End:</strong> {formatDateTime(test.endAt)}
                        </div>
                      </div>

                      <div className="mock-tests-page__card-footer">
                        <div className="mock-tests-page__helper">{availability.helper}</div>

                        {canStart ? (
                          <Link
                            to={actionHref}
                            className="mock-tests-page__action mock-tests-page__action--primary"
                          >
                            Start Test
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="mock-tests-page__action mock-tests-page__action--disabled"
                          >
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
