import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, H2, H4, Icon, Label, Text } from "@adminjs/design-system";
import { buildAdminPath } from "../config/paths.js";

const surfaceStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "20px",
  boxShadow: "0 12px 35px rgba(15, 23, 42, 0.06)",
};

const inputStyle = {
  width: "100%",
  marginTop: "8px",
  borderRadius: "14px",
  border: "1px solid #d1d5db",
  padding: "12px 14px",
  background: "#fff",
};

const tableStyles = {
  width: "100%",
  minWidth: "940px",
  borderCollapse: "collapse",
  fontSize: "13px",
};

const thStyles = {
  textAlign: "left",
  padding: "12px 14px",
  borderBottom: "1px solid #e5e7eb",
  background: "#f8fafc",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const tdStyles = {
  padding: "12px 14px",
  borderBottom: "1px solid #eef2f7",
  verticalAlign: "top",
};

const formatLongDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Not set";

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "-";

let hasRedirectedToAdminLogin = false;

const redirectToAdminLogin = () => {
  if (hasRedirectedToAdminLogin || typeof window === "undefined") {
    return;
  }

  hasRedirectedToAdminLogin = true;
  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.setTimeout(() => {
    window.location.assign(
      `${buildAdminPath("/login")}?redirectTo=${encodeURIComponent(returnTo)}`
    );
  }, 0);
};

const fetchJson = async (url) => {
  const response = await fetch(url, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success === false) {
    if (response.status === 401) {
      redirectToAdminLogin();
      throw new Error(payload.error || "Your admin session has expired. Please log in again.");
    }

    if (response.status === 403) {
      throw new Error(payload.error || "You do not have permission to manage results.");
    }

    throw new Error(
      payload.error || payload.message || "Unable to load result management data. Please try again."
    );
  }

  return payload.data || payload;
};

export default function ResultRankingPreview() {
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [course, setCourse] = useState("");
  const [examId, setExamId] = useState("");
  const [status, setStatus] = useState("");
  const [ranking, setRanking] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoadingCourses(true);
    fetchJson(buildAdminPath("/api/result-courses"))
      .then((data) => {
        if (mounted) {
          setCourses(Array.isArray(data) ? data : []);
        }
      })
      .catch((fetchError) => {
        if (mounted) {
          setError(fetchError.message || "Failed to load courses.");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoadingCourses(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setExamId("");
    setRanking(null);
    setExams([]);

    if (!course) {
      return undefined;
    }

    let mounted = true;
    const params = new URLSearchParams({ course });
    if (status) {
      params.set("status", status);
    }

    setLoadingExams(true);
    fetchJson(buildAdminPath(`/api/result-exams?${params.toString()}`))
      .then((data) => {
        if (mounted) {
          setExams(Array.isArray(data) ? data : []);
        }
      })
      .catch((fetchError) => {
        if (mounted) {
          setError(fetchError.message || "Failed to load result sets.");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoadingExams(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [course, status]);

  const selectedExam = useMemo(
    () => exams.find((exam) => String(exam._id) === String(examId)) || null,
    [exams, examId]
  );

  const loadRanking = async () => {
    if (!course || !examId) {
      setError("Select a course and result set first.");
      return;
    }

    setError("");
    setLoadingRanking(true);

    try {
      const params = new URLSearchParams({
        course,
        examId,
        limit: "10",
      });
      if (status) {
        params.set("status", status);
      }

      const data = await fetchJson(
        buildAdminPath(`/api/results/ranking-preview?${params.toString()}`)
      );
      setRanking(data);
    } catch (fetchError) {
      setRanking(null);
      setError(fetchError.message || "Failed to load ranking preview.");
    } finally {
      setLoadingRanking(false);
    }
  };

  const students = Array.isArray(ranking?.students) ? ranking.students : [];

  return (
    <Box variant="grey" p="xl">
      <Box style={{ ...surfaceStyle, padding: "26px" }} mb="xl">
        <Text color="grey60" mb="sm">
          Exam Results
        </Text>
        <H2 style={{ margin: 0 }}>Result Ranking Preview</H2>
        <Text color="grey60" mt="md">
          Preview the Top 10 ranking for a selected program, mock test, and date before publishing.
        </Text>
      </Box>

      <Box style={{ ...surfaceStyle, padding: "22px" }} mb="xl">
        <Box
          display="grid"
          gridTemplateColumns={["1fr", "1fr 1fr", "1fr 1fr 1fr auto"]}
          gridGap="18px"
          alignItems="end"
        >
          <Box>
            <Label>Program / Course</Label>
            <select
              style={inputStyle}
              value={course}
              onChange={(event) => setCourse(event.target.value)}
              disabled={loadingCourses}
            >
              <option value="">
                {loadingCourses ? "Loading courses..." : "Select course"}
              </option>
              {courses.map((courseOption) => (
                <option key={courseOption.code} value={courseOption.code}>
                  {courseOption.name || courseOption.code}
                </option>
              ))}
            </select>
          </Box>

          <Box>
            <Label>Result Status</Label>
            <select
              style={inputStyle}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </Box>

          <Box>
            <Label>Mock Test / Exam</Label>
            <select
              style={inputStyle}
              value={examId}
              onChange={(event) => {
                setExamId(event.target.value);
                setRanking(null);
              }}
              disabled={!course || loadingExams}
            >
              <option value="">
                {!course
                  ? "Select course first"
                  : loadingExams
                    ? "Loading result sets..."
                    : "Select result set"}
              </option>
              {exams.map((exam) => (
                <option key={exam._id} value={exam._id}>
                  {exam.title} - {formatLongDate(exam.examDate)}
                </option>
              ))}
            </select>
          </Box>

          <Button
            variant="primary"
            onClick={loadRanking}
            disabled={!course || !examId || loadingRanking}
          >
            <Icon icon="Trophy" />
            {loadingRanking ? "Loading..." : "Preview Top 10"}
          </Button>
        </Box>

        {selectedExam ? (
          <Box mt="lg" display="flex" flexWrap="wrap" style={{ gap: "10px" }}>
            <Text color="grey80">Date: {formatLongDate(selectedExam.examDate)}</Text>
            <Text color="grey80">Status: {selectedExam.status}</Text>
            <Text color="grey80">Records: {selectedExam.resultCount || 0}</Text>
          </Box>
        ) : null}

        {error ? (
          <Box mt="lg" p="lg" style={{ borderRadius: "14px", background: "#fef2f2", color: "#991b1b" }}>
            {error}
          </Box>
        ) : null}
      </Box>

      <Box style={{ ...surfaceStyle, padding: "22px" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb="lg" flexWrap="wrap">
          <H4 style={{ margin: 0 }}>Top 10 Ranking</H4>
          <Text color="grey60">
            {ranking?.summary?.totalResultRecords !== undefined
              ? `${ranking.summary.totalResultRecords} total result record(s)`
              : "Select filters to preview ranking"}
          </Text>
        </Box>

        {loadingRanking ? (
          <Text color="grey60">Loading ranking preview...</Text>
        ) : students.length ? (
          <Box style={{ overflowX: "auto" }}>
            <table style={tableStyles}>
              <thead>
                <tr>
                  {[
                    "Rank",
                    "Student",
                    "Roll No.",
                    "Course",
                    "Mock Test",
                    "Date",
                    "Marks",
                    "Percentage",
                    "Result",
                    "Submitted",
                  ].map((heading) => (
                    <th key={heading} style={thStyles}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={student.id || `${student.symbolNumber}-${index}`}>
                    <td style={tdStyles}>{student.rank || index + 1}</td>
                    <td style={tdStyles}>{student.studentName}</td>
                    <td style={tdStyles}>{student.symbolNumber}</td>
                    <td style={tdStyles}>{student.courseName || student.course}</td>
                    <td style={tdStyles}>{student.examTitle}</td>
                    <td style={tdStyles}>{formatLongDate(student.examDate)}</td>
                    <td style={tdStyles}>
                      {student.totalObtainedMarks} / {student.totalFullMarks}
                    </td>
                    <td style={tdStyles}>{student.percentage}%</td>
                    <td style={tdStyles}>{student.resultStatus}</td>
                    <td style={tdStyles}>{formatDateTime(student.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        ) : (
          <Text color="grey60">
            No ranking data is available for the selected filters.
          </Text>
        )}
      </Box>
    </Box>
  );
}
