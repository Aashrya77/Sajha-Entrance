import React, { useEffect, useRef, useState } from "react";
import { Box, Button, H2, H4, Icon, Label, Text } from "@adminjs/design-system";

const fallbackCourses = [
  { code: "BCA", name: "BCA" },
  { code: "BIT", name: "BIT" },
  { code: "CMAT", name: "CMAT" },
  { code: "CSIT", name: "CSIT" },
  { code: "IOE", name: "IOE" },
];

const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = [".csv", ".xls", ".xlsx"];

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

const textareaStyle = {
  ...inputStyle,
  resize: "vertical",
  minHeight: "120px",
};

const tableStyles = {
  width: "100%",
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

const buttonRowStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const statCardStyle = {
  borderRadius: "16px",
  border: "1px solid #e5e7eb",
  background: "#f8fafc",
  padding: "14px 16px",
};

const getEmptyExamForm = () => ({
  title: "",
  examDate: "",
  publishDate: "",
  description: "",
  status: "draft",
});

const formatLongDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Not scheduled";

const formatDateInput = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const formatDateTimeLocalInput = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
};

const formatFileSize = (value = 0) => {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
};

const sanitizeCourseCodeInput = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const buildCourseLabel = (course) => {
  if (!course?.code) {
    return "";
  }

  if (!course.name || course.name === course.code) {
    return course.code;
  }

  return `${course.name} (${course.code})`;
};

const buildExamFormFromRecord = (exam) => ({
  title: exam?.title || "",
  examDate: formatDateInput(exam?.examDate),
  publishDate: formatDateTimeLocalInput(exam?.publishDate),
  description: exam?.description || "",
  status: exam?.status || "draft",
});

const buildStatusBadgeStyle = (status) => {
  if (status === "published") {
    return {
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #bbf7d0",
    };
  }

  if (status === "scheduled") {
    return {
      background: "#eff6ff",
      color: "#1d4ed8",
      border: "1px solid #bfdbfe",
    };
  }

  return {
    background: "#f8fafc",
    color: "#475569",
    border: "1px solid #e2e8f0",
  };
};

const formatExamOptionLabel = (exam) => {
  const examDate = exam?.examDate
    ? new Date(exam.examDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "No date";

  if (exam?.status === "scheduled" && exam?.publishDate) {
    return `${exam?.title || "Untitled Result Set"} - ${examDate} - Scheduled for ${formatLongDate(
      exam.publishDate
    )}`;
  }

  return `${exam?.title || "Untitled Result Set"} - ${examDate} - ${
    exam?.status || "draft"
  }`;
};

const summarizeFetchError = async (response) => {
  try {
    const data = await response.json();
    return data.error || "Request failed.";
  } catch (error) {
    return "Request failed.";
  }
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
  });

  if (!response.ok) {
    throw new Error(await summarizeFetchError(response));
  }

  const data = await response.json();
  if (data.success === false) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
};

const createErrorReportCsv = (errors = []) => {
  const header = ["Row Number", "Symbol Number", "Messages", "Raw Row JSON"];
  const rows = errors.map((error) => [
    error.rowNumber || "",
    error.symbolNumber || "",
    (error.messages || []).join(" | "),
    JSON.stringify(error.rowData || {}),
  ]);

  return [header, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
};

const mergeCourses = (courses = []) => {
  const merged = new Map();

  [...fallbackCourses, ...(Array.isArray(courses) ? courses : [])].forEach((course) => {
    if (!course?.code) {
      return;
    }

    merged.set(course.code, {
      code: course.code,
      name: course.name || course.code,
      fullName: course.fullName || course.name || course.code,
    });
  });

  return Array.from(merged.values()).sort((left, right) =>
    String(left.name || left.code).localeCompare(String(right.name || right.code))
  );
};

export default function BulkUploadResults() {
  const fileInputRef = useRef(null);

  const [courses, setCourses] = useState(fallbackCourses);
  const [courseSelection, setCourseSelection] = useState("");
  const [customCourseCode, setCustomCourseCode] = useState("");
  const [customCourseName, setCustomCourseName] = useState("");
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState("");
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [examForm, setExamForm] = useState(getEmptyExamForm());
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [duplicateStrategy, setDuplicateStrategy] = useState("block");
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingExams, setLoadingExams] = useState(false);
  const [savingExam, setSavingExam] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [examActionLoading, setExamActionLoading] = useState("");
  const [previewResult, setPreviewResult] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");

  const selectedCourse =
    courseSelection === "__custom__"
      ? null
      : courses.find((course) => course.code === courseSelection) || null;
  const selectedCourseCode =
    courseSelection === "__custom__"
      ? sanitizeCourseCodeInput(customCourseCode)
      : courseSelection;
  const selectedCourseName =
    courseSelection === "__custom__"
      ? String(customCourseName || "").trim() ||
        sanitizeCourseCodeInput(customCourseCode) ||
        "Custom Course"
      : selectedCourse?.name || selectedCourseCode;
  const selectedExam = exams.find((exam) => exam._id === examId) || null;
  const templateCourseCode = selectedCourseCode || "CSIT";
  const mappedColumns = Array.isArray(previewResult?.detectedColumns)
    ? previewResult.detectedColumns
    : [];
  const sampleRows = Array.isArray(previewResult?.sampleRows) ? previewResult.sampleRows : [];
  const previewHeaders = mappedColumns.map((column) => column.header);

  const resetImportState = () => {
    setPreviewResult(null);
    setImportResult(null);
  };

  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      const data = await fetchJson("/admin/api/result-courses");
      setCourses(mergeCourses(data.data));
    } catch (error) {
      setCourses(mergeCourses());
      setPageError(error.message);
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadExams = async (courseCode, nextExamId = "") => {
    if (!courseCode) {
      setExams([]);
      setExamId("");
      setIsCreatingExam(true);
      setExamForm(getEmptyExamForm());
      return;
    }

    setLoadingExams(true);
    try {
      const data = await fetchJson(
        `/admin/api/result-exams?course=${encodeURIComponent(courseCode)}`
      );
      const loadedExams = Array.isArray(data.data) ? data.data : [];
      setExams(loadedExams);

      const resolvedExamId =
        (nextExamId && loadedExams.some((exam) => exam._id === nextExamId) && nextExamId) ||
        (loadedExams.some((exam) => exam._id === examId) && examId) ||
        "";

      if (resolvedExamId) {
        const nextExam = loadedExams.find((exam) => exam._id === resolvedExamId);
        setExamId(resolvedExamId);
        setIsCreatingExam(false);
        setExamForm(buildExamFormFromRecord(nextExam));
      } else {
        setExamId("");
        setIsCreatingExam(true);
        setExamForm(getEmptyExamForm());
      }
    } catch (error) {
      setExams([]);
      setExamId("");
      setIsCreatingExam(true);
      setExamForm(getEmptyExamForm());
      setPageError(error.message);
    } finally {
      setLoadingExams(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    resetImportState();

    if (!selectedCourseCode) {
      setExams([]);
      setExamId("");
      setIsCreatingExam(false);
      setExamForm(getEmptyExamForm());
      return;
    }

    if (courseSelection === "__custom__") {
      setExams([]);
      setExamId("");
      setIsCreatingExam(true);
      setExamForm(getEmptyExamForm());
      return;
    }

    loadExams(selectedCourseCode);
  }, [courseSelection, selectedCourseCode]);

  const handleSelectExam = (nextExamId) => {
    setExamId(nextExamId);
    resetImportState();

    const exam = exams.find((item) => item._id === nextExamId);
    if (exam) {
      setIsCreatingExam(false);
      setExamForm(buildExamFormFromRecord(exam));
      return;
    }

    setIsCreatingExam(true);
    setExamForm(getEmptyExamForm());
  };

  const handleStartCreateExam = () => {
    setExamId("");
    setIsCreatingExam(true);
    setExamForm(getEmptyExamForm());
    setPageMessage("Create the result set details below, then upload the result file.");
    setPageError("");
    resetImportState();
  };

  const ensureCourseSelectionIsValid = () => {
    if (!selectedCourseCode) {
      throw new Error("Select a course before continuing.");
    }

    if (courseSelection === "__custom__" && !String(customCourseName || "").trim()) {
      throw new Error("Enter a course name for the new custom course.");
    }
  };

  const handleSaveExam = async () => {
    try {
      ensureCourseSelectionIsValid();

      if (!String(examForm.title || "").trim()) {
        throw new Error("Result set title is required.");
      }

      if (!examForm.examDate) {
        throw new Error("Exam date is required.");
      }

      if (examForm.status === "scheduled" && !examForm.publishDate) {
        throw new Error("Publish date and time is required for scheduled results.");
      }

      setSavingExam(true);
      setPageError("");
      setPageMessage("");

      const endpoint = isCreatingExam
        ? "/admin/api/result-exams"
        : `/admin/api/result-exams/${examId}`;
      const method = isCreatingExam ? "POST" : "PATCH";
      const response = await fetchJson(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...examForm,
          course: selectedCourseCode,
          courseName: selectedCourseName,
        }),
      });

      setPageMessage(
        isCreatingExam
          ? "Result set created. You can now preview and import results."
          : "Result set updated successfully."
      );

      await loadCourses();
      if (courseSelection !== "__custom__") {
        await loadExams(selectedCourseCode, response.data?._id || examId);
      } else {
        setCourses((currentCourses) =>
          mergeCourses([
            ...currentCourses,
            {
              code: selectedCourseCode,
              name: selectedCourseName,
            },
          ])
        );
        setCourseSelection(selectedCourseCode);
        setCustomCourseCode("");
        setCustomCourseName("");
        await loadExams(selectedCourseCode, response.data?._id || "");
      }
    } catch (error) {
      setPageError(error.message);
    } finally {
      setSavingExam(false);
    }
  };

  const clearFileSelection = () => {
    setFile(null);
    resetImportState();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateAndSetFile = (nextFile) => {
    if (!nextFile) {
      return;
    }

    const lowerName = String(nextFile.name || "").toLowerCase();
    const hasSupportedExtension = SUPPORTED_EXTENSIONS.some((extension) =>
      lowerName.endsWith(extension)
    );

    if (!hasSupportedExtension) {
      setPageError("Only CSV, XLS, and XLSX files are supported.");
      return;
    }

    if (nextFile.size > MAX_UPLOAD_SIZE_BYTES) {
      setPageError("The selected file exceeds the 8 MB upload limit.");
      return;
    }

    setPageError("");
    setFile(nextFile);
    resetImportState();
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handlePreview = async () => {
    try {
      ensureCourseSelectionIsValid();

      if (!examId) {
        throw new Error("Select or create a result set before previewing.");
      }

      if (!file) {
        throw new Error("Choose a CSV or Excel file before previewing.");
      }

      setPreviewing(true);
      setPageError("");
      setPageMessage("");
      setImportResult(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("course", selectedCourseCode);
      formData.append("examId", examId);
      formData.append("duplicateStrategy", duplicateStrategy);

      const response = await fetch("/admin/api/results/bulk-upload/preview", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error(await summarizeFetchError(response));
      }

      const data = await response.json();
      setPreviewResult(data);
      setPageMessage("Preview ready. Review validation, duplicates, and sample rows before importing.");
    } catch (error) {
      setPreviewResult(null);
      setPageError(error.message);
    } finally {
      setPreviewing(false);
    }
  };

  const handleImport = async () => {
    try {
      ensureCourseSelectionIsValid();

      if (!examId) {
        throw new Error("Select or create a result set before importing.");
      }

      if (!file) {
        throw new Error("Choose a file before importing.");
      }

      if (!previewResult?.summary?.importableRows) {
        throw new Error("Preview the file first. Only validated rows can be imported.");
      }

      if (
        duplicateStrategy === "upsert" &&
        (previewResult.summary?.rowsToUpdate || 0) > 0 &&
        !window.confirm(
          `Replace ${previewResult.summary.rowsToUpdate} existing result row(s) in this result set?`
        )
      ) {
        return;
      }

      setImporting(true);
      setPageError("");
      setPageMessage("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("course", selectedCourseCode);
      formData.append("examId", examId);
      formData.append("duplicateStrategy", duplicateStrategy);

      const response = await fetch("/admin/api/results/bulk-upload/import", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error(await summarizeFetchError(response));
      }

      const data = await response.json();
      setImportResult(data);
      setPageMessage("Import completed successfully.");
      await loadExams(selectedCourseCode, examId);
    } catch (error) {
      setPageError(error.message);
    } finally {
      setImporting(false);
    }
  };

  const handleExamAction = async (action) => {
    if (!selectedExam) {
      setPageError("Select a result set first.");
      return;
    }

    if (
      action === "delete" &&
      !window.confirm("Delete this result set and all imported student results?")
    ) {
      return;
    }

    setExamActionLoading(action);
    setPageError("");
    setPageMessage("");

    try {
      const endpointMap = {
        publish: `/admin/api/result-exams/${selectedExam._id}/publish`,
        unpublish: `/admin/api/result-exams/${selectedExam._id}/unpublish`,
        recalculate: `/admin/api/result-exams/${selectedExam._id}/recalculate-ranks`,
        delete: `/admin/api/result-exams/${selectedExam._id}`,
      };

      await fetchJson(endpointMap[action], {
        method: action === "delete" ? "DELETE" : "POST",
      });

      if (action === "delete") {
        clearFileSelection();
        setExamId("");
        resetImportState();
      }

      setPageMessage(
        action === "publish"
          ? "Results published immediately."
          : action === "unpublish"
            ? "Result set moved back to draft."
            : action === "recalculate"
              ? "Ranks recalculated successfully."
              : "Result set deleted successfully."
      );

      await loadExams(selectedCourseCode, action === "delete" ? "" : selectedExam._id);
    } catch (error) {
      setPageError(error.message);
    } finally {
      setExamActionLoading("");
    }
  };

  const handleDownloadErrorReport = () => {
    if (!previewResult?.errors?.length) {
      return;
    }

    const blob = new Blob([createErrorReportCsv(previewResult.errors)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "result-upload-errors.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const statusHelpText =
    examForm.status === "draft"
      ? "Draft results stay hidden from the student portal."
      : examForm.status === "scheduled"
        ? examForm.publishDate
          ? `This result set becomes visible after ${formatLongDate(examForm.publishDate)}.`
          : "Choose a publish date and time for the scheduled release."
        : "Published result sets are visible on the student portal immediately.";

  return (
    <Box
      style={{
        maxWidth: "1320px",
        margin: "0 auto",
        padding: "28px 20px 40px",
        display: "grid",
        gap: "22px",
      }}
    >
      <Box
        style={{
          ...surfaceStyle,
          padding: "30px",
          background:
            "linear-gradient(135deg, rgba(255, 116, 34, 0.1), rgba(15, 23, 42, 0.03))",
        }}
      >
        <H2 style={{ marginBottom: "10px" }}>Exam Result Upload Workspace</H2>
        <Text style={{ display: "block", color: "#475569", lineHeight: 1.7 }}>
          Manual single-result creation has been removed from the primary workflow.
          Admins now create a result set, preview a CSV or Excel file, validate it,
          and confirm the import before results become searchable on the student portal.
        </Text>
      </Box>

      {pageError ? (
        <Box
          style={{
            ...surfaceStyle,
            padding: "16px 18px",
            borderColor: "#fecaca",
            background: "#fef2f2",
            color: "#b91c1c",
          }}
        >
          {pageError}
        </Box>
      ) : null}

      {pageMessage ? (
        <Box
          style={{
            ...surfaceStyle,
            padding: "16px 18px",
            borderColor: "#bbf7d0",
            background: "#f0fdf4",
            color: "#166534",
          }}
        >
          {pageMessage}
        </Box>
      ) : null}

      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(360px, 1.2fr) minmax(360px, 1fr)",
          gap: "22px",
        }}
      >
        <Box style={{ ...surfaceStyle, padding: "24px", display: "grid", gap: "18px" }}>
          <H4 style={{ marginBottom: "0" }}>1. Setup Result Set</H4>

          <Box
            style={{
              borderRadius: "16px",
              border: "1px solid #fed7aa",
              background: "#fff7ed",
              padding: "16px",
              color: "#9a3412",
              lineHeight: 1.6,
            }}
          >
            Supported formats: `.csv`, `.xls`, `.xlsx`
            <br />
            Max file size: 8 MB
            <br />
            Required sample columns: `Symbol No.`, `Student Name`, `Course`, `Exam Date`,
            `Subject 1 Name`, `Subject 1 Full Marks`, `Subject 1 Pass Marks`,
            `Subject 1 Obtained Marks`, `Remarks`
          </Box>

          <Box style={{ display: "grid", gap: "16px" }}>
            <Box>
              <Label>Course</Label>
              <select
                value={courseSelection}
                onChange={(event) => {
                  setCourseSelection(event.target.value);
                  setPageError("");
                  setPageMessage("");
                }}
                style={inputStyle}
              >
                <option value="">
                  {loadingCourses ? "Loading courses..." : "Select a course"}
                </option>
                {courses.map((course) => (
                  <option key={course.code} value={course.code}>
                    {buildCourseLabel(course)}
                  </option>
                ))}
                <option value="__custom__">Add New Course</option>
              </select>
            </Box>

            {courseSelection === "__custom__" ? (
              <Box style={{ display: "grid", gap: "14px" }}>
                <Box>
                  <Label>New Course Code</Label>
                  <input
                    value={customCourseCode}
                    onChange={(event) => setCustomCourseCode(event.target.value)}
                    placeholder="Example: BBS"
                    style={inputStyle}
                  />
                  <Text style={{ display: "block", marginTop: "8px", color: "#64748b" }}>
                    Stored code preview: {selectedCourseCode || "Enter a course code"}
                  </Text>
                </Box>

                <Box>
                  <Label>New Course Name</Label>
                  <input
                    value={customCourseName}
                    onChange={(event) => setCustomCourseName(event.target.value)}
                    placeholder="Example: BBS Entrance"
                    style={inputStyle}
                  />
                </Box>
              </Box>
            ) : null}

            <Box
              style={{
                borderRadius: "16px",
                border: "1px solid #e5e7eb",
                background: "#f8fafc",
                padding: "16px",
                display: "grid",
                gap: "14px",
              }}
            >
              <Box style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                <Text style={{ fontWeight: 700, color: "#0f172a" }}>
                  {isCreatingExam ? "Create New Result Set" : "Edit Selected Result Set"}
                </Text>
                {!isCreatingExam ? (
                  <span
                    style={{
                      ...buildStatusBadgeStyle(selectedExam?.status),
                      borderRadius: "999px",
                      padding: "6px 10px",
                      fontSize: "12px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    {selectedExam?.status || "draft"}
                  </span>
                ) : null}
              </Box>

              <Box style={{ display: "grid", gap: "14px" }}>
                <Box>
                  <Label>Existing Result Sets</Label>
                  <select
                    value={examId}
                    onChange={(event) => handleSelectExam(event.target.value)}
                    disabled={!selectedCourseCode || courseSelection === "__custom__" || loadingExams}
                    style={inputStyle}
                  >
                    <option value="">
                      {courseSelection === "__custom__"
                        ? "Custom course will create a new result set"
                        : loadingExams
                          ? "Loading result sets..."
                          : exams.length
                            ? "Select a result set"
                            : "No result sets yet"}
                    </option>
                    {exams.map((exam) => (
                      <option key={exam._id} value={exam._id}>
                        {formatExamOptionLabel(exam)}
                      </option>
                    ))}
                  </select>
                </Box>

                <Box style={buttonRowStyle}>
                  <Button variant="outlined" size="sm" onClick={handleStartCreateExam}>
                    New Result Set
                  </Button>
                  <Button
                    variant="text"
                    size="sm"
                    disabled={!selectedCourseCode || courseSelection === "__custom__"}
                    onClick={() => loadExams(selectedCourseCode, examId)}
                  >
                    Refresh Result Sets
                  </Button>
                  <Button
                    variant="text"
                    size="sm"
                    as="a"
                    href="/admin/resources/ResultExam"
                  >
                    Manage Result Sets
                  </Button>
                </Box>

                <Box>
                  <Label>Exam / Mock Test Title</Label>
                  <input
                    value={examForm.title}
                    onChange={(event) =>
                      setExamForm((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="Weekly Mock Test - Set 12"
                    style={inputStyle}
                  />
                </Box>

                <Box>
                  <Label>Exam Date</Label>
                  <input
                    type="date"
                    value={examForm.examDate}
                    onChange={(event) =>
                      setExamForm((current) => ({ ...current, examDate: event.target.value }))
                    }
                    style={inputStyle}
                  />
                </Box>

                <Box>
                  <Label>Status</Label>
                  <select
                    value={examForm.status}
                    onChange={(event) =>
                      setExamForm((current) => ({ ...current, status: event.target.value }))
                    }
                    style={inputStyle}
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                  </select>
                  <Text style={{ display: "block", marginTop: "8px", color: "#64748b" }}>
                    {statusHelpText}
                  </Text>
                </Box>

                <Box>
                  <Label>Publish Date & Time</Label>
                  <input
                    type="datetime-local"
                    value={examForm.publishDate}
                    onChange={(event) =>
                      setExamForm((current) => ({
                        ...current,
                        publishDate: event.target.value,
                      }))
                    }
                    style={inputStyle}
                  />
                </Box>

                <Box>
                  <Label>Description</Label>
                  <textarea
                    value={examForm.description}
                    onChange={(event) =>
                      setExamForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Optional notes about this result set"
                    style={textareaStyle}
                  />
                </Box>

                <Box style={buttonRowStyle}>
                  <Button
                    size="sm"
                    disabled={!selectedCourseCode || savingExam}
                    onClick={handleSaveExam}
                  >
                    {savingExam
                      ? isCreatingExam
                        ? "Creating..."
                        : "Saving..."
                      : isCreatingExam
                        ? "Create Result Set"
                        : "Save Result Set"}
                  </Button>

                  <Button
                    variant="outlined"
                    size="sm"
                    disabled={!templateCourseCode}
                    as="a"
                    href={`/admin/api/results/templates?course=${encodeURIComponent(
                      templateCourseCode
                    )}&format=csv`}
                  >
                    Download CSV Template
                  </Button>

                  <Button
                    variant="outlined"
                    size="sm"
                    disabled={!templateCourseCode}
                    as="a"
                    href={`/admin/api/results/templates?course=${encodeURIComponent(
                      templateCourseCode
                    )}&format=xlsx`}
                  >
                    Download Excel Template
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box style={{ ...surfaceStyle, padding: "24px", display: "grid", gap: "18px" }}>
          <H4 style={{ marginBottom: "0" }}>2. Upload, Preview, and Import</H4>

          <Box
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragActive(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              validateAndSetFile(event.dataTransfer.files?.[0] || null);
            }}
            style={{
              borderRadius: "20px",
              border: `2px dashed ${dragActive ? "#ff7422" : "#cbd5e1"}`,
              background: dragActive ? "#fff7ed" : "#f8fafc",
              padding: "26px",
              textAlign: "center",
              transition: "all 0.2s ease",
            }}
          >
            <Icon icon="Upload" style={{ fontSize: "26px", color: "#ff7422" }} />
            <Text
              style={{
                display: "block",
                marginTop: "12px",
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Drag and drop your result file here
            </Text>
            <Text style={{ display: "block", marginTop: "6px", color: "#64748b" }}>
              or browse a CSV, XLS, or XLSX file
            </Text>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={(event) => validateAndSetFile(event.target.files?.[0] || null)}
              style={{ display: "none" }}
            />

            <Box style={{ ...buttonRowStyle, justifyContent: "center", marginTop: "18px" }}>
              <Button size="sm" onClick={handleBrowseClick}>
                Browse File
              </Button>
              {file ? (
                <Button size="sm" variant="outlined" onClick={clearFileSelection}>
                  Remove File
                </Button>
              ) : null}
            </Box>
          </Box>

          {file ? (
            <Box
              style={{
                ...surfaceStyle,
                boxShadow: "none",
                padding: "18px",
                display: "grid",
                gap: "10px",
              }}
            >
              <Text style={{ fontWeight: 700, color: "#0f172a" }}>Selected File</Text>
              <Text style={{ color: "#475569" }}>Name: {file.name}</Text>
              <Text style={{ color: "#475569" }}>Size: {formatFileSize(file.size)}</Text>
              <Text style={{ color: "#475569" }}>
                Type: {file.type || file.name.split(".").pop()?.toUpperCase() || "Unknown"}
              </Text>
            </Box>
          ) : null}

          <Box style={{ display: "grid", gap: "14px" }}>
            <Box>
              <Label>Duplicate Handling</Label>
              <Box style={{ marginTop: "10px", display: "grid", gap: "10px" }}>
                <label style={{ display: "flex", gap: "10px", alignItems: "start" }}>
                  <input
                    type="radio"
                    checked={duplicateStrategy === "block"}
                    onChange={() => setDuplicateStrategy("block")}
                  />
                  <span>Block duplicates and import only brand new rows in this result set.</span>
                </label>
                <label style={{ display: "flex", gap: "10px", alignItems: "start" }}>
                  <input
                    type="radio"
                    checked={duplicateStrategy === "upsert"}
                    onChange={() => setDuplicateStrategy("upsert")}
                  />
                  <span>
                    Replace existing rows in this result set only after explicit import confirmation.
                  </span>
                </label>
              </Box>
            </Box>

            <Box style={buttonRowStyle}>
              <Button
                disabled={!selectedCourseCode || !examId || !file || previewing}
                onClick={handlePreview}
              >
                {previewing ? "Previewing..." : "Step 1: Preview File"}
              </Button>

              <Button
                variant="outlined"
                disabled={!previewResult?.summary?.importableRows || importing}
                onClick={handleImport}
              >
                {importing ? "Importing..." : "Step 2: Confirm Import"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {selectedExam ? (
        <Box style={{ ...surfaceStyle, padding: "24px", display: "grid", gap: "18px" }}>
          <H4 style={{ marginBottom: "0" }}>Result Set Actions</H4>

          <Box
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >
            <Box style={statCardStyle}>
              <Text style={{ display: "block", color: "#64748b", fontSize: "12px" }}>
                Title
              </Text>
              <Text style={{ display: "block", marginTop: "6px", fontWeight: 700 }}>
                {selectedExam.title}
              </Text>
            </Box>
            <Box style={statCardStyle}>
              <Text style={{ display: "block", color: "#64748b", fontSize: "12px" }}>
                Exam Date
              </Text>
              <Text style={{ display: "block", marginTop: "6px", fontWeight: 700 }}>
                {formatLongDate(selectedExam.examDate)}
              </Text>
            </Box>
            <Box style={statCardStyle}>
              <Text style={{ display: "block", color: "#64748b", fontSize: "12px" }}>
                Publish Schedule
              </Text>
              <Text style={{ display: "block", marginTop: "6px", fontWeight: 700 }}>
                {selectedExam.publishDate ? formatLongDate(selectedExam.publishDate) : "Not set"}
              </Text>
            </Box>
            <Box style={statCardStyle}>
              <Text style={{ display: "block", color: "#64748b", fontSize: "12px" }}>
                Imported Students
              </Text>
              <Text style={{ display: "block", marginTop: "6px", fontWeight: 700 }}>
                {selectedExam.resultCount || 0}
              </Text>
            </Box>
          </Box>

          <Box style={buttonRowStyle}>
            <Button
              size="sm"
              variant="outlined"
              disabled={examActionLoading === "publish" || selectedExam.status === "published"}
              onClick={() => handleExamAction("publish")}
            >
              {examActionLoading === "publish" ? "Publishing..." : "Publish Now"}
            </Button>

            <Button
              size="sm"
              variant="outlined"
              disabled={examActionLoading === "unpublish" || selectedExam.status === "draft"}
              onClick={() => handleExamAction("unpublish")}
            >
              {examActionLoading === "unpublish" ? "Updating..." : "Move to Draft"}
            </Button>

            <Button
              size="sm"
              variant="outlined"
              disabled={examActionLoading === "recalculate"}
              onClick={() => handleExamAction("recalculate")}
            >
              {examActionLoading === "recalculate"
                ? "Recalculating..."
                : "Recalculate Ranks"}
            </Button>

            <Button size="sm" variant="text" as="a" href="/admin/resources/StudentResult">
              View Imported Results
            </Button>

            <Button
              size="sm"
              variant="danger"
              disabled={examActionLoading === "delete"}
              onClick={() => handleExamAction("delete")}
            >
              {examActionLoading === "delete" ? "Deleting..." : "Delete Result Set"}
            </Button>
          </Box>
        </Box>
      ) : null}

      {previewResult ? (
        <Box style={{ ...surfaceStyle, padding: "24px", display: "grid", gap: "20px" }}>
          <H4 style={{ marginBottom: "0" }}>Preview and Validation</H4>

          <Box
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "12px",
            }}
          >
            {[
              ["Detected Rows", previewResult.summary?.totalRows || 0],
              ["Detected Columns", mappedColumns.length],
              ["Importable Rows", previewResult.summary?.importableRows || 0],
              ["Invalid Rows", previewResult.summary?.invalidRows || 0],
              ["Empty Rows", previewResult.summary?.emptyRows || 0],
              ["Rows to Update", previewResult.summary?.rowsToUpdate || 0],
              ["Rows to Insert", previewResult.summary?.rowsToInsert || 0],
              ["Blocked Duplicates", previewResult.summary?.blockedDuplicates || 0],
            ].map(([label, value]) => (
              <Box key={label} style={statCardStyle}>
                <Text style={{ display: "block", color: "#64748b", fontSize: "12px" }}>
                  {label}
                </Text>
                <Text
                  style={{
                    display: "block",
                    marginTop: "6px",
                    fontWeight: 700,
                    fontSize: "22px",
                  }}
                >
                  {value}
                </Text>
              </Box>
            ))}
          </Box>

          {previewResult.templateSubjects?.length ? (
            <Box
              style={{
                borderRadius: "16px",
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                padding: "16px",
              }}
            >
              <Text style={{ display: "block", fontWeight: 700, marginBottom: "8px" }}>
                Subject Template Used for Calculation
              </Text>
              <Text style={{ color: "#475569", lineHeight: 1.6 }}>
                {previewResult.templateSubjects
                  .map((subject) => `${subject.name} (${subject.fullMarks}/${subject.passMarks})`)
                  .join(", ")}
              </Text>
            </Box>
          ) : null}

          {mappedColumns.length ? (
            <Box style={{ display: "grid", gap: "10px" }}>
              <Text style={{ display: "block", fontWeight: 700 }}>Detected Column Mapping</Text>
              <Box
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "10px",
                }}
              >
                {mappedColumns.map((column) => (
                  <Box
                    key={column.header}
                    style={{
                      borderRadius: "14px",
                      border: "1px solid #e5e7eb",
                      background: column.kind === "unknown" ? "#fff7ed" : "#f8fafc",
                      padding: "12px 14px",
                    }}
                  >
                    <Text style={{ display: "block", color: "#0f172a", fontWeight: 700 }}>
                      {column.header}
                    </Text>
                    <Text style={{ display: "block", marginTop: "6px", color: "#64748b" }}>
                      {column.mappedTo}
                    </Text>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : null}

          {sampleRows.length ? (
            <Box style={{ display: "grid", gap: "10px" }}>
              <Text style={{ display: "block", fontWeight: 700 }}>First Parsed Records</Text>
              <Box style={{ overflowX: "auto" }}>
                <table style={tableStyles}>
                  <thead>
                    <tr>
                      <th style={thStyles}>Row</th>
                      {previewHeaders.map((header) => (
                        <th key={header} style={thStyles}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sampleRows.map((row) => (
                      <tr key={`sample-${row.rowNumber}`}>
                        <td style={tdStyles}>{row.rowNumber}</td>
                        {previewHeaders.map((header) => (
                          <td key={`${row.rowNumber}-${header}`} style={tdStyles}>
                            {String(row.data?.[header] ?? "") || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Box>
          ) : null}

          {previewResult.previewRows?.length ? (
            <Box style={{ display: "grid", gap: "10px" }}>
              <Text style={{ display: "block", fontWeight: 700 }}>
                Calculated Preview of Importable Rows
              </Text>
              <Box style={{ overflowX: "auto" }}>
                <table style={tableStyles}>
                  <thead>
                    <tr>
                      <th style={thStyles}>Row</th>
                      <th style={thStyles}>Symbol Number</th>
                      <th style={thStyles}>Student Name</th>
                      <th style={thStyles}>Marks</th>
                      <th style={thStyles}>Percentage</th>
                      <th style={thStyles}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewResult.previewRows.map((row) => (
                      <tr key={`${row.rowNumber}-${row.symbolNumber}`}>
                        <td style={tdStyles}>{row.rowNumber}</td>
                        <td style={tdStyles}>{row.symbolNumber}</td>
                        <td style={tdStyles}>{row.studentName}</td>
                        <td style={tdStyles}>
                          {row.totalObtainedMarks} / {row.totalFullMarks}
                        </td>
                        <td style={tdStyles}>{row.percentage}%</td>
                        <td style={tdStyles}>{row.resultStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Box>
          ) : null}

          {previewResult.duplicateRows?.length ? (
            <Box
              style={{
                borderRadius: "16px",
                border: "1px solid #fde68a",
                background: "#fffbeb",
                padding: "16px",
                display: "grid",
                gap: "10px",
              }}
            >
              <Text style={{ display: "block", fontWeight: 700, color: "#92400e" }}>
                Duplicate Review
              </Text>
              <Text style={{ color: "#92400e" }}>
                {previewResult.duplicateRows.length} row(s) matched existing results in this
                result set.
              </Text>
              <Box style={{ overflowX: "auto" }}>
                <table style={tableStyles}>
                  <thead>
                    <tr>
                      <th style={thStyles}>Row</th>
                      <th style={thStyles}>Symbol Number</th>
                      <th style={thStyles}>Existing Student</th>
                      <th style={thStyles}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewResult.duplicateRows.map((row) => (
                      <tr key={`duplicate-${row.rowNumber}-${row.symbolNumber}`}>
                        <td style={tdStyles}>{row.rowNumber}</td>
                        <td style={tdStyles}>{row.symbolNumber}</td>
                        <td style={tdStyles}>{row.studentName || "-"}</td>
                        <td style={tdStyles}>{row.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Box>
          ) : null}

          {previewResult.errors?.length ? (
            <Box style={{ display: "grid", gap: "10px" }}>
              <Box
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <Text style={{ display: "block", fontWeight: 700 }}>Validation Errors</Text>
                <Button size="sm" variant="outlined" onClick={handleDownloadErrorReport}>
                  Download Error Report
                </Button>
              </Box>

              <Box style={{ overflowX: "auto" }}>
                <table style={tableStyles}>
                  <thead>
                    <tr>
                      <th style={thStyles}>Row</th>
                      <th style={thStyles}>Symbol</th>
                      <th style={thStyles}>Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewResult.errors.map((error, index) => (
                      <tr key={`${error.rowNumber}-${index}`}>
                        <td style={tdStyles}>{error.rowNumber}</td>
                        <td style={tdStyles}>{error.symbolNumber || "-"}</td>
                        <td style={tdStyles}>
                          {(error.messages || []).map((message) => (
                            <Text
                              key={message}
                              style={{ display: "block", color: "#b91c1c", marginBottom: "4px" }}
                            >
                              <Icon icon="Warning" /> {message}
                            </Text>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Box>
          ) : null}
        </Box>
      ) : null}

      {exams.length ? (
        <Box style={{ ...surfaceStyle, padding: "24px", display: "grid", gap: "18px" }}>
          <H4 style={{ marginBottom: "0" }}>Existing Result Sets</H4>
          <Box style={{ overflowX: "auto" }}>
            <table style={tableStyles}>
              <thead>
                <tr>
                  <th style={thStyles}>Result Set</th>
                  <th style={thStyles}>Course</th>
                  <th style={thStyles}>Exam Date</th>
                  <th style={thStyles}>Publish Schedule</th>
                  <th style={thStyles}>Status</th>
                  <th style={thStyles}>Students</th>
                  <th style={thStyles}>Last Import</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr
                    key={exam._id}
                    onClick={() => handleSelectExam(exam._id)}
                    style={{
                      cursor: "pointer",
                      background: exam._id === examId ? "#fff7ed" : "transparent",
                    }}
                  >
                    <td style={tdStyles}>
                      <Text style={{ display: "block", fontWeight: 700 }}>{exam.title}</Text>
                    </td>
                    <td style={tdStyles}>{exam.courseName || exam.course}</td>
                    <td style={tdStyles}>{formatLongDate(exam.examDate)}</td>
                    <td style={tdStyles}>
                      {exam.publishDate ? formatLongDate(exam.publishDate) : "Not set"}
                    </td>
                    <td style={tdStyles}>
                      <span
                        style={{
                          ...buildStatusBadgeStyle(exam.status),
                          borderRadius: "999px",
                          padding: "6px 10px",
                          fontSize: "12px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        {exam.status}
                      </span>
                    </td>
                    <td style={tdStyles}>{exam.resultCount || 0}</td>
                    <td style={tdStyles}>
                      {exam.lastImportedAt ? formatLongDate(exam.lastImportedAt) : "Not imported"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Box>
      ) : null}

      {importResult ? (
        <Box style={{ ...surfaceStyle, padding: "24px", display: "grid", gap: "12px" }}>
          <H4 style={{ marginBottom: "0" }}>Import Result</H4>
          <Text style={{ color: "#166534" }}>
            Imported {importResult.insertedCount || 0} new row(s) and updated{" "}
            {importResult.updatedCount || 0} existing row(s).
          </Text>
          <Text style={{ color: "#475569" }}>
            Skipped {importResult.skippedCount || 0} row(s), including invalid or empty rows.
          </Text>
        </Box>
      ) : null}
    </Box>
  );
}
