import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, H2, H4, Label, RichTextEditor, Text } from "@adminjs/design-system";
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
  fontSize: "14px",
};

const badgeStyle = (tone = "neutral") => {
  const tones = {
    success: {
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #bbf7d0",
    },
    warning: {
      background: "#ffedd5",
      color: "#c2410c",
      border: "1px solid #fed7aa",
    },
    brand: {
      background: "#fff1e8",
      color: "#d95a12",
      border: "1px solid #ffd7bf",
    },
    neutral: {
      background: "#f8fafc",
      color: "#475569",
      border: "1px solid #e2e8f0",
    },
  };

  return {
    ...tones[tone],
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  };
};

const getEmptyForm = () => ({
  _id: "",
  title: "",
  description: "",
  instructions: "",
  courseRef: "",
  subjectRefs: [],
  questionRefs: [],
  status: "draft",
  startAt: "",
  endAt: "",
  duration: 60,
  passMarks: 0,
});

const formatDateTimeInput = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

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

const stripHtml = (value = "") =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

export default function MockTestScheduler() {
  const [workspace, setWorkspace] = useState({ courses: [], subjects: [], tests: [] });
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [form, setForm] = useState(getEmptyForm());
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [questionSearch, setQuestionSearch] = useState("");
  const [testSearch, setTestSearch] = useState("");

  const loadWorkspace = async (message = "") => {
    setLoading(true);
    try {
      const response = await fetch(buildAdminPath("/api/mock-tests/workspace"), {
        credentials: "same-origin",
      });
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Failed to load mock test workspace.");
      }

      setWorkspace(data.data);
      if (message) {
        setPageMessage(message);
      }
      setPageError("");
    } catch (error) {
      setPageError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  const selectedSubjects = useMemo(() => {
    const subjectIdSet = new Set(form.subjectRefs);
    return workspace.subjects.filter((subject) => subjectIdSet.has(`${subject._id}`));
  }, [form.subjectRefs, workspace.subjects]);

  useEffect(() => {
    const loadQuestions = async () => {
      if (!form.courseRef || !form.subjectRefs.length) {
        setAvailableQuestions([]);
        return;
      }

      setQuestionLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("courseRef", form.courseRef);
        params.append("subjectRefs", form.subjectRefs.join(","));
        if (questionSearch.trim()) {
          params.append("search", questionSearch.trim());
        }

        const response = await fetch(buildAdminPath(`/api/mock-tests/questions?${params.toString()}`), {
          credentials: "same-origin",
        });
        const data = await response.json();

        if (!response.ok || data.success === false) {
          throw new Error(data.error || "Failed to load published questions.");
        }

        setAvailableQuestions(Array.isArray(data.data) ? data.data : []);
        setPageError("");
      } catch (error) {
        setPageError(error.message);
      } finally {
        setQuestionLoading(false);
      }
    };

    const timeout = setTimeout(loadQuestions, questionSearch ? 250 : 0);
    return () => clearTimeout(timeout);
  }, [form.courseRef, form.subjectRefs, questionSearch]);

  const filteredTests = useMemo(() => {
    const term = testSearch.trim().toLowerCase();
    if (!term) {
      return workspace.tests;
    }

    return workspace.tests.filter((test) =>
      [test.title, test.courseName, ...(test.subjectNames || [])]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [testSearch, workspace.tests]);

  const selectedQuestionSet = useMemo(() => new Set(form.questionRefs), [form.questionRefs]);

  const selectedQuestionSummary = useMemo(() => {
    const questionMap = new Map(availableQuestions.map((question) => [`${question._id}`, question]));
    const selectedQuestions = form.questionRefs
      .map((questionId) => questionMap.get(`${questionId}`))
      .filter(Boolean);

    return {
      count: selectedQuestions.length,
      totalMarks: selectedQuestions.reduce((sum, question) => sum + (Number(question.marks) || 0), 0),
      questions: selectedQuestions,
    };
  }, [availableQuestions, form.questionRefs]);

  const updateForm = (updates) => {
    setForm((currentForm) => ({
      ...currentForm,
      ...updates,
    }));
  };

  const resetForm = () => {
    setForm(getEmptyForm());
    setSelectedTestId("");
    setAvailableQuestions([]);
    setQuestionSearch("");
    setPageError("");
  };

  const loadTestDetail = async (testId) => {
    setLoading(true);
    try {
      const response = await fetch(buildAdminPath(`/api/mock-tests/${testId}`), {
        credentials: "same-origin",
      });
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Failed to load mock test details.");
      }

      const test = data.data;
      setSelectedTestId(`${test._id}`);
      setForm({
        _id: `${test._id}`,
        title: test.title || "",
        description: test.description || "",
        instructions: test.instructions || "",
        courseRef: test.courseRef || "",
        subjectRefs: Array.isArray(test.subjectRefs) ? test.subjectRefs : [],
        questionRefs: Array.isArray(test.questionRefs) ? test.questionRefs : [],
        status: test.status || "draft",
        startAt: formatDateTimeInput(test.startAt),
        endAt: formatDateTimeInput(test.endAt),
        duration: Number(test.duration || 60) || 60,
        passMarks: Number(test.passMarks || 0) || 0,
      });
      setPageMessage("");
      setPageError("");
    } catch (error) {
      setPageError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subjectId) => {
    setForm((currentForm) => {
      const nextSubjectRefs = currentForm.subjectRefs.includes(subjectId)
        ? currentForm.subjectRefs.filter((entry) => entry !== subjectId)
        : [...currentForm.subjectRefs, subjectId];

      return {
        ...currentForm,
        subjectRefs: nextSubjectRefs,
        questionRefs: currentForm.questionRefs.filter((questionId) =>
          availableQuestions.some(
            (question) =>
              `${question._id}` === `${questionId}` &&
              nextSubjectRefs.includes(`${question.subject}`)
          )
        ),
      };
    });
  };

  const toggleQuestion = (questionId) => {
    setForm((currentForm) => ({
      ...currentForm,
      questionRefs: currentForm.questionRefs.includes(questionId)
        ? currentForm.questionRefs.filter((entry) => entry !== questionId)
        : [...currentForm.questionRefs, questionId],
    }));
  };

  const saveMockTest = async () => {
    setSaving(true);
    setPageError("");
    setPageMessage("");

    try {
      const endpoint = selectedTestId
        ? buildAdminPath(`/api/mock-tests/${selectedTestId}`)
        : buildAdminPath("/api/mock-tests");
      const method = selectedTestId ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          ...form,
          manualStatusOverride: form.status === "live",
        }),
      });
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(
          data.error ||
            Object.values(data.errors || {})[0] ||
            "Failed to save the mock test."
        );
      }

      setWorkspace(data.data);
      setPageMessage(data.message || "Mock test saved successfully.");
      if (!selectedTestId) {
        resetForm();
      }
    } catch (error) {
      setPageError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (testId, status) => {
    try {
      const response = await fetch(buildAdminPath(`/api/mock-tests/${testId}/status`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Failed to update mock test status.");
      }

      setWorkspace(data.data);
      setPageMessage(data.message || "Mock test status updated.");
      setPageError("");
    } catch (error) {
      setPageError(error.message);
    }
  };

  const deleteTest = async (testId) => {
    if (!window.confirm("Delete this mock test and keep only past attempts?")) {
      return;
    }

    try {
      const response = await fetch(buildAdminPath(`/api/mock-tests/${testId}`), {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Failed to delete the mock test.");
      }

      setWorkspace(data.data);
      setPageMessage(data.message || "Mock test deleted successfully.");

      if (selectedTestId === `${testId}`) {
        resetForm();
      }
    } catch (error) {
      setPageError(error.message);
    }
  };

  if (loading) {
    return (
      <Box style={{ padding: "28px" }}>
        <Text>Loading mock test scheduler...</Text>
      </Box>
    );
  }

  return (
    <Box
      style={{
        maxWidth: "1460px",
        margin: "0 auto",
        padding: "28px 20px 40px",
        display: "grid",
        gap: "22px",
      }}
    >
      <Box style={{ ...surfaceStyle, padding: "24px", display: "grid", gap: "12px" }}>
        <Box
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
            alignItems: "start",
            flexWrap: "wrap",
          }}
        >
          <Box style={{ display: "grid", gap: "8px" }}>
            <H2 style={{ marginBottom: 0 }}>Mock Test Scheduler</H2>
            <Text style={{ color: "#475569" }}>
              Build scheduled or live mock tests from published subject questions.
            </Text>
          </Box>

          <Box style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span style={badgeStyle("brand")}>{workspace.tests.length} tests</span>
            <span style={badgeStyle("success")}>
              {workspace.tests.filter((test) => test.status === "live").length} live
            </span>
            <span style={badgeStyle("warning")}>
              {workspace.tests.filter((test) => test.status === "scheduled").length} scheduled
            </span>
          </Box>
        </Box>

        {pageError ? (
          <Box
            style={{
              borderRadius: "14px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              padding: "12px 14px",
            }}
          >
            {pageError}
          </Box>
        ) : null}

        {pageMessage ? (
          <Box
            style={{
              borderRadius: "14px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
              padding: "12px 14px",
            }}
          >
            {pageMessage}
          </Box>
        ) : null}
      </Box>

      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(340px, 0.8fr)",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <Box style={{ ...surfaceStyle, padding: "24px", display: "grid", gap: "20px" }}>
          <Box
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <H4 style={{ marginBottom: 0 }}>
              {selectedTestId ? "Edit Mock Test" : "Create Mock Test"}
            </H4>
            <Box style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {selectedTestId ? (
                <>
                  <Button size="sm" variant="outlined" onClick={() => updateStatus(selectedTestId, "live")}>
                    Make Live
                  </Button>
                  <Button size="sm" variant="outlined" onClick={() => updateStatus(selectedTestId, "completed")}>
                    End Test
                  </Button>
                  <Button size="sm" variant="outlined" onClick={() => updateStatus(selectedTestId, "archived")}>
                    Archive
                  </Button>
                </>
              ) : null}
              <Button size="sm" variant="outlined" onClick={resetForm}>
                New Mock Test
              </Button>
            </Box>
          </Box>

          <Box
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            <Box>
              <Label>Mock test title</Label>
              <input
                type="text"
                value={form.title}
                onChange={(event) => updateForm({ title: event.target.value })}
                style={inputStyle}
              />
            </Box>

            <Box>
              <Label>Course</Label>
              <select
                value={form.courseRef}
                onChange={(event) =>
                  updateForm({
                    courseRef: event.target.value,
                    subjectRefs: [],
                    questionRefs: [],
                  })
                }
                style={inputStyle}
              >
                <option value="">Select course</option>
                {workspace.courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </Box>

            <Box>
              <Label>Status</Label>
              <select
                value={form.status}
                onChange={(event) => updateForm({ status: event.target.value })}
                style={inputStyle}
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </Box>

            <Box>
              <Label>Duration (minutes)</Label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.duration}
                onChange={(event) => updateForm({ duration: Number(event.target.value) })}
                style={inputStyle}
              />
            </Box>

            <Box>
              <Label>Start time</Label>
              <input
                type="datetime-local"
                value={form.startAt}
                onChange={(event) => updateForm({ startAt: event.target.value })}
                style={inputStyle}
              />
            </Box>

            <Box>
              <Label>End time</Label>
              <input
                type="datetime-local"
                value={form.endAt}
                onChange={(event) => updateForm({ endAt: event.target.value })}
                style={inputStyle}
              />
            </Box>

            <Box>
              <Label>Pass marks</Label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.passMarks}
                onChange={(event) => updateForm({ passMarks: Number(event.target.value) })}
                style={inputStyle}
              />
            </Box>

            <Box>
              <Label>Auto-calculated total marks</Label>
              <Box style={{ ...inputStyle, color: "#334155", fontWeight: 700 }}>
                {selectedQuestionSummary.totalMarks}
              </Box>
            </Box>
          </Box>

          <Box>
            <Label>Description</Label>
            <Box style={{ marginTop: "8px" }}>
              <RichTextEditor
                value={form.description}
                onChange={(value) => updateForm({ description: value })}
              />
            </Box>
          </Box>

          <Box>
            <Label>Instructions</Label>
            <Box style={{ marginTop: "8px" }}>
              <RichTextEditor
                value={form.instructions}
                onChange={(value) => updateForm({ instructions: value })}
              />
            </Box>
          </Box>

          <Box style={{ display: "grid", gap: "10px" }}>
            <Label>Select subjects</Label>
            <Box
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "10px",
              }}
            >
              {workspace.subjects
                .filter((subject) => !form.courseRef || `${subject.course?._id || subject.course}` === form.courseRef)
                .map((subject) => (
                  <label
                    key={subject._id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "14px",
                      padding: "12px",
                      background: form.subjectRefs.includes(`${subject._id}`) ? "#fff7ed" : "#fff",
                      display: "grid",
                      gap: "6px",
                    }}
                  >
                    <span style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={form.subjectRefs.includes(`${subject._id}`)}
                        onChange={() => toggleSubject(`${subject._id}`)}
                      />
                      <strong>{subject.name}</strong>
                    </span>
                    <Text style={{ color: "#64748b", fontSize: "12px" }}>
                      {subject.questionPublishedCount || 0} published questions
                    </Text>
                  </label>
                ))}
            </Box>
          </Box>

          <Box style={{ display: "grid", gap: "12px" }}>
            <Box
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Box>
                <Label>Question set</Label>
                <Text style={{ color: "#64748b", fontSize: "13px" }}>
                  Select the published questions that should appear in this mock test.
                </Text>
              </Box>
              <input
                type="text"
                placeholder="Search published questions"
                value={questionSearch}
                onChange={(event) => setQuestionSearch(event.target.value)}
                style={{ ...inputStyle, width: "280px", marginTop: 0 }}
              />
            </Box>

            <Box
              style={{
                display: "grid",
                gap: "10px",
                maxHeight: "520px",
                overflowY: "auto",
                paddingRight: "4px",
              }}
            >
              {questionLoading ? (
                <Text style={{ color: "#64748b" }}>Loading published questions...</Text>
              ) : availableQuestions.length ? (
                availableQuestions.map((question) => (
                  <label
                    key={question._id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "14px",
                      padding: "14px",
                      background: selectedQuestionSet.has(`${question._id}`) ? "#f8fafc" : "#fff",
                      display: "grid",
                      gap: "6px",
                    }}
                  >
                    <span style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={selectedQuestionSet.has(`${question._id}`)}
                        onChange={() => toggleQuestion(`${question._id}`)}
                      />
                      <strong>{question.subjectName}</strong>
                    </span>
                    <Text style={{ color: "#0f172a" }}>
                      {stripHtml(question.questionText).slice(0, 180) || "Image-based question"}
                    </Text>
                    <Text style={{ color: "#64748b", fontSize: "12px" }}>
                      Marks: {question.marks} | Difficulty: {question.difficulty || "not set"}
                    </Text>
                  </label>
                ))
              ) : (
                <Box
                  style={{
                    border: "1px dashed #cbd5e1",
                    borderRadius: "16px",
                    padding: "22px",
                    textAlign: "center",
                    color: "#64748b",
                  }}
                >
                  Select a course and one or more subjects to load published questions.
                </Box>
              )}
            </Box>
          </Box>

          <Box style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <Text style={{ color: "#64748b" }}>
              Selected {selectedQuestionSummary.count} questions for {selectedQuestionSummary.totalMarks} total
              marks.
            </Text>
            <Box style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {selectedTestId ? (
                <Button variant="text" color="danger" onClick={() => deleteTest(selectedTestId)}>
                  Delete Test
                </Button>
              ) : null}
              <Button onClick={saveMockTest} disabled={saving}>
                {saving ? "Saving..." : selectedTestId ? "Update Mock Test" : "Create Mock Test"}
              </Button>
            </Box>
          </Box>
        </Box>

        <Box style={{ ...surfaceStyle, padding: "24px", display: "grid", gap: "18px", position: "sticky", top: "88px" }}>
          <H4 style={{ marginBottom: 0 }}>Selected Summary</H4>
          <Text style={{ color: "#64748b" }}>
            {selectedSubjects.length
              ? selectedSubjects.map((subject) => subject.name).join(", ")
              : "No subjects selected yet."}
          </Text>
          <span style={badgeStyle("brand")}>{selectedQuestionSummary.count} selected questions</span>
          <span style={badgeStyle("success")}>{selectedQuestionSummary.totalMarks} total marks</span>
          <span style={badgeStyle("neutral")}>Pass marks: {form.passMarks || 0}</span>
          <span style={badgeStyle("warning")}>Duration: {form.duration || 0} min</span>

          <Box style={{ display: "grid", gap: "10px" }}>
            {selectedQuestionSummary.questions.slice(0, 6).map((question, index) => (
              <Box
                key={question._id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "12px",
                  background: "#fff",
                }}
              >
                <Text style={{ fontWeight: 700, color: "#0f172a" }}>
                  Q{index + 1}. {question.subjectName}
                </Text>
                <Text style={{ color: "#64748b", fontSize: "13px", marginTop: "6px" }}>
                  {stripHtml(question.questionText).slice(0, 120) || "Image-based question"}
                </Text>
              </Box>
            ))}

            {selectedQuestionSummary.count > 6 ? (
              <Text style={{ color: "#64748b", fontSize: "13px" }}>
                +{selectedQuestionSummary.count - 6} more selected questions
              </Text>
            ) : null}
          </Box>
        </Box>
      </Box>

      <Box style={{ ...surfaceStyle, padding: "24px", display: "grid", gap: "18px" }}>
        <Box
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Box>
            <H4 style={{ marginBottom: "6px" }}>Existing Mock Tests</H4>
            <Text style={{ color: "#64748b" }}>
              Review scheduled/live tests and reopen one to edit or manually change its lifecycle.
            </Text>
          </Box>

          <input
            type="text"
            placeholder="Search mock tests"
            value={testSearch}
            onChange={(event) => setTestSearch(event.target.value)}
            style={{ ...inputStyle, width: "280px", marginTop: 0 }}
          />
        </Box>

        {filteredTests.length ? (
          <Box style={{ display: "grid", gap: "12px" }}>
            {filteredTests.map((test) => (
              <Box
                key={test._id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "18px",
                  padding: "18px",
                  background: selectedTestId === `${test._id}` ? "#fff7ed" : "#fff",
                  display: "grid",
                  gap: "12px",
                }}
              >
                <Box
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    alignItems: "start",
                    flexWrap: "wrap",
                  }}
                >
                  <Box style={{ display: "grid", gap: "8px" }}>
                    <Text style={{ color: "#0f172a", fontWeight: 700 }}>{test.title}</Text>
                    <Box style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <span
                        style={badgeStyle(
                          test.status === "live"
                            ? "success"
                            : test.status === "scheduled"
                              ? "warning"
                              : "neutral"
                        )}
                      >
                        {test.status}
                      </span>
                      <span style={badgeStyle("neutral")}>{test.courseName}</span>
                      <span style={badgeStyle("brand")}>{test.totalQuestions} questions</span>
                    </Box>
                    <Text style={{ color: "#64748b", fontSize: "13px" }}>
                      Start: {formatDateTime(test.startAt)} | End: {formatDateTime(test.endAt)}
                    </Text>
                  </Box>

                  <Box style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <Button size="sm" variant="outlined" onClick={() => loadTestDetail(test._id)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outlined" onClick={() => updateStatus(test._id, "live")}>
                      Live
                    </Button>
                    <Button size="sm" variant="outlined" onClick={() => updateStatus(test._id, "completed")}>
                      Complete
                    </Button>
                    <Button size="sm" variant="text" color="danger" onClick={() => deleteTest(test._id)}>
                      Delete
                    </Button>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box
            style={{
              borderRadius: "18px",
              border: "1px dashed #cbd5e1",
              padding: "28px",
              textAlign: "center",
              color: "#64748b",
            }}
          >
            No mock tests matched the current search.
          </Box>
        )}
      </Box>
    </Box>
  );
}
