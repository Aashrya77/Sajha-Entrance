import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { mockTestAPI } from "../../api/services";
import Loader from "../../components/Loader/Loader";

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
    <div style={{ paddingTop: "125px", minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <div className="container">
        <div
          style={{
            display: "flex",
            gap: "0",
            borderBottom: "2px solid #e0e0e0",
            marginBottom: "24px",
          }}
        >
          {[
            { key: "online", label: "Online Exam", icon: "fa-laptop" },
            { key: "physical", label: "Physical Exam", icon: "fa-building" },
            { key: "mocktest", label: "Mock Test", icon: "fa-file-lines" },
            { key: "results", label: "Results", icon: "fa-chart-bar" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === "results") {
                  window.location.href = isAuthenticated ? "/mocktest-results" : "/student/login";
                }
              }}
              style={{
                padding: "12px 28px",
                fontSize: "15px",
                fontWeight: activeTab === tab.key ? 700 : 500,
                color: activeTab === tab.key ? "#1a365d" : "#888",
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === tab.key ? "3px solid #1a365d" : "3px solid transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontStyle:
                  tab.key === "online" || tab.key === "physical" ? "italic" : "normal",
              }}
            >
              <i className={`fa-solid ${tab.icon} me-2`}></i>
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
              style={{
                background: "#fff",
                borderRadius: "10px",
                padding: "4px",
                border: "1px solid #e0e0e0",
                display: "flex",
                alignItems: "center",
                marginBottom: "28px",
                maxWidth: "680px",
              }}
            >
              <i
                className="fa-solid fa-magnifying-glass"
                style={{ padding: "0 12px", color: "#aaa" }}
              ></i>
              <input
                type="text"
                placeholder="Search by mock test, course, or subject"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  padding: "10px 4px",
                  fontSize: "15px",
                  background: "transparent",
                }}
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    fetchMockTests("");
                  }}
                  style={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    padding: "0 12px",
                    color: "#aaa",
                  }}
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
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {filteredTests.map((test) => {
                  const availability = getAvailabilityMeta(test, now);
                  const canStart = test.canStart && test.availabilityStatus === "live";
                  const actionHref = isAuthenticated ? `/mocktest/${test._id}` : "/student/login";

                  return (
                    <div
                      key={test._id}
                      style={{
                        background: "#fff",
                        borderRadius: "16px",
                        padding: "24px 28px",
                        border: "1px solid #e8e8e8",
                        transition: "box-shadow 0.2s ease",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                      }}
                      onMouseOver={(event) => {
                        event.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.08)";
                      }}
                      onMouseOut={(event) => {
                        event.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "14px",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}
                      >
                        <div style={{ display: "grid", gap: "8px" }}>
                          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1a365d", margin: 0 }}>
                            {test.title}
                          </h3>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <span
                              style={{
                                ...getBadgeStyle(availability.tone),
                                borderRadius: "999px",
                                padding: "5px 12px",
                                fontSize: "12px",
                                fontWeight: 700,
                              }}
                            >
                              {availability.label}
                            </span>
                            <span
                              style={{
                                ...getBadgeStyle("neutral"),
                                borderRadius: "999px",
                                padding: "5px 12px",
                                fontSize: "12px",
                                fontWeight: 700,
                              }}
                            >
                              {test.totalQuestions} questions
                            </span>
                          </div>
                        </div>

                        <span
                          style={{
                            padding: "4px 14px",
                            borderRadius: "20px",
                            fontSize: "13px",
                            fontWeight: 600,
                            border: "1.5px solid #ff6b35",
                            color: "#ff6b35",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Total marks: {test.totalMarks}
                        </span>
                      </div>

                      {test.description ? (
                        <p style={{ color: "#475569", lineHeight: 1.7, marginBottom: "16px" }}>
                          {test.description.replace(/<[^>]*>/g, " ").trim()}
                        </p>
                      ) : null}

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                          gap: "10px",
                          marginBottom: "16px",
                          fontSize: "14px",
                          color: "#475569",
                        }}
                      >
                        <div>
                          <strong>Course:</strong> {test.courseName || test.course || "General"}
                        </div>
                        <div>
                          <strong>Subjects:</strong>{" "}
                          {test.subjectNames?.length ? test.subjectNames.join(", ") : "Mixed"}
                        </div>
                        <div>
                          <strong>Duration:</strong> {test.duration} mins
                        </div>
                        <div>
                          <strong>Pass Marks:</strong> {test.passMarks || 0}
                        </div>
                        <div>
                          <strong>Start:</strong> {formatDateTime(test.startAt)}
                        </div>
                        <div>
                          <strong>End:</strong> {formatDateTime(test.endAt)}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "12px",
                        }}
                      >
                        <div style={{ color: "#64748b", fontSize: "13px" }}>{availability.helper}</div>

                        {canStart ? (
                          <Link
                            to={actionHref}
                            style={{
                              padding: "10px 32px",
                              borderRadius: "25px",
                              fontSize: "14px",
                              fontWeight: 600,
                              backgroundColor: "#ff6b35",
                              color: "#fff",
                              textDecoration: "none",
                              border: "none",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              display: "inline-block",
                            }}
                          >
                            Start Test
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled
                            style={{
                              padding: "10px 24px",
                              borderRadius: "25px",
                              fontSize: "14px",
                              fontWeight: 600,
                              backgroundColor: "#e2e8f0",
                              color: "#64748b",
                              border: "none",
                              cursor: "not-allowed",
                            }}
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
