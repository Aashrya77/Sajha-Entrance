import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, H2, H4, Label, Select, Text } from "@adminjs/design-system";
import { buildAdminPath } from "../config/paths.js";

const BRAND = "#ff7422";
const EMPTY_VALUE = "\u2014";

const surface = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
};

const inputStyle = {
  width: "100%",
  height: "44px",
  border: "1px solid #d1d5db",
  borderRadius: "10px",
  padding: "9px 12px",
  background: "#fff",
  color: "#111827",
};

const primaryButtonStyle = {
  background: BRAND,
  borderColor: BRAND,
  color: "#ffffff",
};

const selectStyles = {
  container: (base) => ({ ...base, width: "100%", minWidth: 0 }),
  control: (base, state) => ({
    ...base,
    minHeight: "44px",
    height: "44px",
    borderRadius: "10px",
    borderColor: state.isFocused ? "rgba(255, 116, 34, 0.7)" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(255, 116, 34, 0.14)" : "none",
    background: "#fff",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    "&:hover": { borderColor: state.isFocused ? "rgba(255, 116, 34, 0.7)" : "#94a3b8" },
  }),
  valueContainer: (base) => ({ ...base, minWidth: 0, padding: "0 10px" }),
  singleValue: (base) => ({
    ...base,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: "#111827",
  }),
  placeholder: (base) => ({ ...base, color: "#64748b" }),
  indicatorsContainer: (base) => ({ ...base, height: "42px", flexShrink: 0 }),
  menu: (base) => ({ ...base, zIndex: 50, borderRadius: "10px", overflow: "hidden" }),
  menuList: (base) => ({ ...base, maxHeight: "280px", padding: "4px" }),
  option: (base, state) => ({
    ...base,
    borderRadius: "8px",
    color: "#0f172a",
    background: state.isSelected ? "#fff1e8" : state.isFocused ? "#f8fafc" : "#fff",
    cursor: "pointer",
  }),
};

const thStyle = {
  padding: "12px 14px",
  textAlign: "left",
  background: "#f8fafc",
  borderBottom: "1px solid #dbe2ea",
  whiteSpace: "nowrap",
  fontWeight: 700,
};

const tdStyle = {
  padding: "12px 14px",
  borderBottom: "1px solid #edf0f4",
  color: "#1f2937",
};

const pageStyles = `
  .mock-test-results-page,
  .mock-test-results-page * {
    box-sizing: border-box;
  }

  .mock-test-results-page {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
  }

  .mock-test-results__filter-grid {
    display: grid;
    grid-template-columns: minmax(170px, 1fr) minmax(300px, 1.65fr) minmax(170px, .8fr) auto;
    gap: 14px;
    align-items: end;
  }

  .mock-test-results__field {
    min-width: 0;
  }

  .mock-test-results__field-label {
    display: block;
    margin-bottom: 7px;
  }

  .mock-test-results__clear-button {
    height: 44px !important;
    min-height: 44px !important;
    white-space: nowrap;
  }

  .mock-test-results__summary-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;
  }

  .mock-test-results__summary-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    padding-top: 16px;
    margin-top: 16px;
    border-top: 1px solid #eef2f7;
  }

  .mock-test-results__primary-button,
  .mock-test-results__primary-button:hover,
  .mock-test-results__primary-button:focus {
    background: #ff7422 !important;
    border-color: #ff7422 !important;
    color: #ffffff !important;
    opacity: 1;
  }

  .mock-test-results__primary-button *,
  .mock-test-results__danger-button * {
    color: inherit !important;
  }

  .mock-test-results__primary-button:disabled {
    background: #fdba8c !important;
    border-color: #fdba8c !important;
    color: #ffffff !important;
    opacity: .78;
  }

  .mock-test-results__danger-button,
  .mock-test-results__danger-button:hover,
  .mock-test-results__danger-button:focus {
    background: #b91c1c !important;
    border-color: #b91c1c !important;
    color: #ffffff !important;
  }

  .mock-test-results__button-content {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-width: 1px;
    color: inherit !important;
  }

  .mock-test-results__spinner {
    width: 14px;
    height: 14px;
    flex: 0 0 14px;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: mock-test-results-spin .7s linear infinite;
  }

  @keyframes mock-test-results-spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 1180px) {
    .mock-test-results__filter-grid {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.45fr);
    }

    .mock-test-results__clear-button {
      width: 100%;
    }

    .mock-test-results__summary-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 800px) {
    .mock-test-results__summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 600px) {
    .mock-test-results__filter-grid {
      grid-template-columns: minmax(0, 1fr);
    }

    .mock-test-results__summary-actions,
    .mock-test-results__summary-actions > button {
      width: 100%;
    }
  }

  @media (max-width: 420px) {
    .mock-test-results__summary-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
`;

const parseDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const normalizedValue = String(value).trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)
    ? new Date(`${normalizedValue}T00:00:00.000Z`)
    : new Date(normalizedValue);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (value) => {
  const date = parseDateValue(value);
  return date
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kathmandu",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    : EMPTY_VALUE;
};

const formatDate = (value) => {
  const date = parseDateValue(value);
  return date
    ? new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kathmandu",
        year: "numeric",
        month: "short",
        day: "2-digit",
      }).format(date)
    : EMPTY_VALUE;
};

const formatMarks = (value) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString("en-US", { maximumFractionDigits: 8 })
    : EMPTY_VALUE;
};

const formatDuration = (seconds) => {
  if (seconds === null || seconds === undefined || !Number.isFinite(Number(seconds))) {
    return EMPTY_VALUE;
  }
  const safe = Math.max(0, Math.floor(Number(seconds)));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remaining = safe % 60;
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(remaining).padStart(2, "0")}s`;
  }
  if (minutes > 0) return `${minutes}m ${String(remaining).padStart(2, "0")}s`;
  return `${remaining}s`;
};

const statusMeta = {
  not_generated: {
    label: "Not Generated",
    description: "No ranking preview has been generated for this mock test.",
    color: "#475569",
    background: "#f1f5f9",
  },
  draft: {
    label: "Preview Generated",
    description: "Ranking has been generated but is not finalized.",
    color: "#9a3412",
    background: "#fff1e8",
  },
  finalized: {
    label: "Finalized",
    description: "This result is locked and ready for export.",
    color: "#166534",
    background: "#dcfce7",
  },
  locked: {
    label: "Finalized",
    description: "This result is locked and ready for export.",
    color: "#166534",
    background: "#dcfce7",
  },
};

const getStatusMeta = (status) => statusMeta[status] || statusMeta.not_generated;

const StatusBadge = ({ status }) => {
  const meta = getStatusMeta(status);
  return (
    <span
      title={meta.description}
      aria-label={`${meta.label}. ${meta.description}`}
      style={{
        display: "inline-flex",
        padding: "5px 10px",
        borderRadius: "999px",
        color: meta.color,
        background: meta.background,
        fontSize: "12px",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {meta.label}
    </span>
  );
};

const LoadingLabel = ({ visible, children }) => (
  <span className="mock-test-results__button-content">
    {visible ? <span className="mock-test-results__spinner" aria-hidden="true" /> : null}
    <span>{children}</span>
  </span>
);

let redirected = false;
const redirectToLogin = () => {
  if (redirected || typeof window === "undefined") return;
  redirected = true;
  const returnTo = `${window.location.pathname}${window.location.search}`;
  window.location.assign(
    `${buildAdminPath("/login")}?redirectTo=${encodeURIComponent(returnTo)}`
  );
};

const apiRequest = async (path, options = {}) => {
  const response = await fetch(buildAdminPath(path), {
    credentials: "include",
    headers: { Accept: "application/json", ...(options.headers || {}) },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    if (response.status === 401) redirectToLogin();
    throw new Error(payload.error || "The result request could not be completed.");
  }
  return payload;
};

const actionLoadingLabels = {
  regenerate: "Regenerating\u2026",
  finalize: "Finalizing\u2026",
  unlock: "Unlocking\u2026",
};

const ConfirmationModal = ({ confirmation, busy, onCancel, onConfirm }) => {
  const [typedValue, setTypedValue] = useState("");
  if (!confirmation) return null;
  const needsTypedConfirmation = confirmation.type === "unlock";
  const canConfirm = !needsTypedConfirmation || typedValue === "UNLOCK";
  const busyLabel = actionLoadingLabels[confirmation.type] || "Working\u2026";

  return (
    <Box
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(15, 23, 42, 0.55)",
        display: "grid",
        placeItems: "center",
        padding: "20px",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mock-test-result-confirmation-title"
    >
      <Box style={{ ...surface, width: "min(520px, 100%)", padding: "24px" }}>
        <H4 id="mock-test-result-confirmation-title" style={{ margin: 0 }}>
          {confirmation.title}
        </H4>
        <Text style={{ color: "#475569", marginTop: "12px", lineHeight: 1.6 }}>
          {confirmation.message}
        </Text>
        {needsTypedConfirmation ? (
          <Box mt="lg">
            <Label htmlFor="mock-test-result-unlock-confirmation">Type UNLOCK to continue</Label>
            <input
              id="mock-test-result-unlock-confirmation"
              autoFocus
              value={typedValue}
              onChange={(event) => setTypedValue(event.target.value)}
              style={{ ...inputStyle, marginTop: "7px" }}
            />
          </Box>
        ) : null}
        <Box mt="xl" display="flex" justifyContent="flex-end" flexWrap="wrap" style={{ gap: "10px" }}>
          <Button type="button" variant="outlined" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            className={
              confirmation.type === "unlock"
                ? "mock-test-results__danger-button"
                : "mock-test-results__primary-button"
            }
            style={
              confirmation.type === "unlock"
                ? { background: "#b91c1c", borderColor: "#b91c1c", color: "#ffffff" }
                : primaryButtonStyle
            }
            onClick={onConfirm}
            disabled={busy || !canConfirm}
            aria-label={busy ? busyLabel : confirmation.confirmLabel}
          >
            <LoadingLabel visible={busy}>
              {busy ? busyLabel : confirmation.confirmLabel}
            </LoadingLabel>
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default function MockTestResults() {
  const [selection, setSelection] = useState({
    courseId: "",
    mockTestId: "",
    examDate: "",
  });
  const [catalog, setCatalog] = useState({ courses: [], mockTests: [], capabilities: {} });
  const [detail, setDetail] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [message, setMessage] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const isSuperAdmin = Boolean(catalog.capabilities?.canUnlock);

  const loadCatalog = async (nextSelection = selection) => {
    setLoadingList(true);
    setMessage(null);
    try {
      const params = new URLSearchParams();
      if (nextSelection.courseId) params.set("courseId", nextSelection.courseId);
      if (nextSelection.examDate) params.set("examDate", nextSelection.examDate);
      const payload = await apiRequest(`/api/mock-test-results/tests?${params}`);
      setCatalog(payload.data || { courses: [], mockTests: [], capabilities: {} });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => loadCatalog(selection), 200);
    return () => window.clearTimeout(timer);
  }, [selection.courseId, selection.examDate]);

  useEffect(() => {
    setDetail(null);
    if (!selection.mockTestId) return undefined;
    let active = true;
    setLoadingDetail(true);
    apiRequest(`/api/mock-test-results/${selection.mockTestId}`)
      .then((payload) => {
        if (active) setDetail(payload.data);
      })
      .catch((error) => {
        if (active) setMessage({ type: "error", text: error.message });
      })
      .finally(() => {
        if (active) setLoadingDetail(false);
      });
    return () => {
      active = false;
    };
  }, [selection.mockTestId]);

  const courseOptions = useMemo(
    () => [
      { value: "", label: "All courses" },
      ...catalog.courses.map((course) => ({ value: course.id, label: course.name })),
    ],
    [catalog.courses]
  );

  const mockTestOptions = useMemo(
    () =>
      catalog.mockTests.map((test) => {
        const label = `${test.title} \u2014 ${test.courseName || "No course"} \u2014 ${formatDate(
          test.examDate
        )}`;
        return { value: test.id, label, test };
      }),
    [catalog.mockTests]
  );

  const selectedCourseOption =
    courseOptions.find((option) => option.value === selection.courseId) || courseOptions[0];
  const selectedMockTestOption =
    mockTestOptions.find((option) => option.value === selection.mockTestId) || null;
  const summary = detail?.summary;
  const snapshot = detail?.snapshot;
  const rows = snapshot?.results || [];
  const selectedStatus = getStatusMeta(summary?.resultStatus);

  const refreshSelected = async () => {
    if (!selection.mockTestId) return;
    const payload = await apiRequest(`/api/mock-test-results/${selection.mockTestId}`);
    setDetail(payload.data);
    await loadCatalog(selection);
  };

  const runAction = async (action) => {
    if (!selection.mockTestId || busyAction) return;
    setBusyAction(action);
    setMessage(null);
    try {
      const payload = await apiRequest(
        `/api/mock-test-results/${selection.mockTestId}/${action}`,
        { method: "POST" }
      );
      setDetail((current) => ({
        ...(current || {}),
        snapshot: payload.data,
        summary: current?.summary
          ? { ...current.summary, resultStatus: payload.data.status }
          : current?.summary,
      }));
      setMessage({ type: "success", text: payload.message || "Result updated successfully." });
      await refreshSelected();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setBusyAction("");
      setConfirmation(null);
    }
  };

  const exportExcel = async (type) => {
    if (!selection.mockTestId || busyAction) return;
    const isInternal = type === "internal";
    const action = isInternal ? "export-internal" : "export-public";
    const endpoint = isInternal ? "export-internal-leads" : "export";
    setBusyAction(action);
    setMessage(null);
    try {
      const response = await fetch(
        buildAdminPath(`/api/mock-test-results/${selection.mockTestId}/${endpoint}`),
        { credentials: "include" }
      );
      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        if (response.status === 401) redirectToLogin();
        throw new Error(
          errorPayload.error ||
            `${isInternal ? "Internal leads" : "Public result"} export failed.`
        );
      }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") || "";
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
      const filename =
        filenameMatch?.[1] ||
        (isInternal ? "mock-test-INTERNAL-leads.xlsx" : "mock-test-public-result.xlsx");
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage({
        type: "success",
        text: `${isInternal ? "Internal leads" : "Public result"} exported successfully.`,
      });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setBusyAction("");
    }
  };

  const clearSelection = () => {
    setSelection({ courseId: "", mockTestId: "", examDate: "" });
    setDetail(null);
    setMessage(null);
  };

  const renderSummaryActions = () => {
    if (!snapshot) {
      return (
        <Button
          type="button"
          variant="primary"
          className="mock-test-results__primary-button"
          style={primaryButtonStyle}
          onClick={() => runAction("preview")}
          disabled={!summary?.hasEnded || Boolean(busyAction)}
          aria-label={busyAction === "preview" ? "Generating preview" : "Generate Preview"}
        >
          <LoadingLabel visible={busyAction === "preview"}>
            {busyAction === "preview" ? "Generating\u2026" : "Generate Preview"}
          </LoadingLabel>
        </Button>
      );
    }

    if (snapshot.status !== "locked") {
      return (
        <>
          <Button
            type="button"
            variant="outlined"
            onClick={() =>
              setConfirmation({
                type: "regenerate",
                title: "Regenerate ranking preview?",
                message:
                  "This replaces the current preview with the latest eligible attempts. It does not change historical attempt records.",
                confirmLabel: "Regenerate Preview",
              })
            }
            disabled={Boolean(busyAction)}
            aria-label="Regenerate Preview"
          >
            Regenerate Preview
          </Button>
          <Button
            type="button"
            variant="primary"
            className="mock-test-results__primary-button"
            style={primaryButtonStyle}
            onClick={() =>
              setConfirmation({
                type: "finalize",
                title: "Finalize this result?",
                message:
                  "Finalizing will lock the currently displayed ranking snapshot. It will become the source for Excel export and cannot be regenerated unless a super admin explicitly unlocks it.",
                confirmLabel: "Finalize Result",
              })
            }
            disabled={Boolean(busyAction)}
            aria-label="Finalize Result"
          >
            Finalize Result
          </Button>
        </>
      );
    }

    return (
      <>
        <Button
          type="button"
          variant="primary"
          className="mock-test-results__primary-button"
          style={primaryButtonStyle}
          onClick={() => exportExcel("public")}
          disabled={Boolean(busyAction)}
          aria-label={
            busyAction === "export-public"
              ? "Exporting Public Result"
              : "Export Public Result"
          }
        >
          <LoadingLabel visible={busyAction === "export-public"}>
            {busyAction === "export-public" ? "Exporting\u2026" : "Export Public Result"}
          </LoadingLabel>
        </Button>
        <Button
          type="button"
          variant="outlined"
          onClick={() => exportExcel("internal")}
          disabled={Boolean(busyAction)}
          aria-label={
            busyAction === "export-internal"
              ? "Exporting Internal Leads"
              : "Export Internal Leads"
          }
        >
          <LoadingLabel visible={busyAction === "export-internal"}>
            {busyAction === "export-internal" ? "Exporting\u2026" : "Export Internal Leads"}
          </LoadingLabel>
        </Button>
        {isSuperAdmin ? (
          <Button
            type="button"
            variant="outlined"
            onClick={() =>
              setConfirmation({
                type: "unlock",
                title: "Unlock finalized result?",
                message:
                  "This is a privileged audited action. The finalized snapshot will return to preview status and must be reviewed and finalized again before export.",
                confirmLabel: "Unlock Result",
              })
            }
            disabled={Boolean(busyAction)}
            aria-label="Unlock Result"
          >
            Unlock Result
          </Button>
        ) : null}
      </>
    );
  };

  return (
    <Box
      variant="grey"
      className="mock-test-results-page"
      style={{ padding: "24px 18px 40px", background: "#f5f7fb" }}
    >
      <style>{pageStyles}</style>
      <Box
        style={{
          width: "100%",
          maxWidth: "1440px",
          minWidth: 0,
          margin: "0 auto",
          display: "grid",
          gap: "18px",
        }}
      >
        <Box style={{ ...surface, padding: "22px" }}>
          <H2 style={{ margin: 0 }}>Mock Test Results</H2>
          <Text style={{ color: "#64748b", marginTop: "7px" }}>
            Generate, verify and export ranked mock test results.
          </Text>
        </Box>

        <Box style={{ ...surface, padding: "18px" }}>
          <Box className="mock-test-results__filter-grid">
            <Box className="mock-test-results__field">
              <Label htmlFor="mock-test-result-course" className="mock-test-results__field-label">
                Course
              </Label>
              <Select
                inputId="mock-test-result-course"
                aria-label="Course"
                value={selectedCourseOption}
                options={courseOptions}
                onChange={(option) =>
                  setSelection((current) => ({
                    ...current,
                    courseId: option?.value || "",
                    mockTestId: "",
                  }))
                }
                isClearable={false}
                isSearchable={false}
                styles={selectStyles}
              />
            </Box>

            <Box
              className="mock-test-results__field"
              title={selectedMockTestOption?.label || "Search by mock test title, course, or exam date"}
            >
              <Label htmlFor="mock-test-result-test" className="mock-test-results__field-label">
                Mock Test
              </Label>
              <Select
                inputId="mock-test-result-test"
                aria-label="Search and select a mock test"
                value={selectedMockTestOption}
                options={mockTestOptions}
                onChange={(option) =>
                  setSelection((current) => ({ ...current, mockTestId: option?.value || "" }))
                }
                placeholder={loadingList ? "Loading mock tests\u2026" : "Search mock tests"}
                noOptionsMessage={({ inputValue }) =>
                  inputValue ? "No matching mock tests" : "No mock tests available"
                }
                isDisabled={loadingList}
                isClearable
                isSearchable
                styles={selectStyles}
                formatOptionLabel={(option) => <span title={option.label}>{option.label}</span>}
              />
            </Box>

            <Box className="mock-test-results__field">
              <Label htmlFor="mock-test-result-date" className="mock-test-results__field-label">
                Exam Date
              </Label>
              <input
                id="mock-test-result-date"
                aria-label="Exam Date"
                type="date"
                value={selection.examDate}
                onChange={(event) =>
                  setSelection((current) => ({
                    ...current,
                    examDate: event.target.value,
                    mockTestId: "",
                  }))
                }
                style={inputStyle}
              />
            </Box>

            <Button
              type="button"
              variant="outlined"
              className="mock-test-results__clear-button"
              onClick={clearSelection}
              aria-label="Clear mock test selection"
            >
              Clear Selection
            </Button>
          </Box>
        </Box>

        {message ? (
          <Box
            style={{
              padding: "12px 14px",
              borderRadius: "12px",
              border: `1px solid ${message.type === "error" ? "#fecaca" : "#bbf7d0"}`,
              background: message.type === "error" ? "#fef2f2" : "#f0fdf4",
              color: message.type === "error" ? "#991b1b" : "#166534",
            }}
            role="status"
          >
            {message.text}
          </Box>
        ) : null}

        {!selection.mockTestId ? (
          <Box
            style={{ ...surface, padding: "28px 20px", textAlign: "center", color: "#64748b" }}
          >
            Select a course and mock test to view or generate its ranking result.
          </Box>
        ) : loadingDetail ? (
          <Box style={{ ...surface, padding: "28px 20px", textAlign: "center", color: "#64748b" }}>
            Loading result details\u2026
          </Box>
        ) : summary ? (
          <>
            <Box style={{ ...surface, padding: "20px" }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
                flexWrap="wrap"
                style={{ gap: "14px" }}
              >
                <Box style={{ minWidth: 0, flex: "1 1 260px" }}>
                  <H4 style={{ margin: 0, overflowWrap: "anywhere" }}>{summary.mockTestTitle}</H4>
                  <Text style={{ color: "#64748b", marginTop: "5px" }}>
                    {summary.courseName || "No course"}
                  </Text>
                </Box>
                <Box style={{ textAlign: "right", flex: "0 1 300px" }}>
                  <StatusBadge status={summary.resultStatus} />
                  <Text style={{ color: "#64748b", fontSize: "12px", marginTop: "6px" }}>
                    {selectedStatus.description}
                  </Text>
                </Box>
              </Box>

              <Box mt="lg" className="mock-test-results__summary-grid">
                {[
                  ["Exam Start Time", formatDateTime(summary.examStartTime)],
                  ["Exam End Time", formatDateTime(summary.examEndTime)],
                  ["Duration", `${summary.durationMinutes} minutes`],
                  ["Full Marks", formatMarks(summary.fullMarks)],
                  ["Submitted Students", summary.totalSubmittedStudents],
                  [
                    "Retake Setting",
                    summary.allowRetake
                      ? `Allowed (${summary.maxAttempts || "Unlimited"})`
                      : "No retake",
                  ],
                ].map(([label, value]) => (
                  <Box
                    key={label}
                    style={{
                      minWidth: 0,
                      padding: "10px 11px",
                      borderRadius: "10px",
                      border: "1px solid #eef2f7",
                      background: "#f8fafc",
                    }}
                  >
                    <Text style={{ color: "#64748b", fontSize: "11px" }}>{label}</Text>
                    <Text
                      title={String(value)}
                      style={{ fontWeight: 700, fontSize: "13px", marginTop: "3px", overflowWrap: "anywhere" }}
                    >
                      {value}
                    </Text>
                  </Box>
                ))}
              </Box>

              {detail.eligibility?.duplicateAttemptsExcluded > 0 ? (
                <Box
                  mt="lg"
                  style={{
                    padding: "11px 13px",
                    borderRadius: "10px",
                    background: "#fff7ed",
                    color: "#9a3412",
                  }}
                >
                  {detail.eligibility.duplicateAttemptsExcluded} duplicate valid attempt(s) were excluded.
                  The first completed attempt per student is used.
                </Box>
              ) : null}

              {detail.eligibility?.missingDurationCount > 0 ? (
                <Box
                  mt="md"
                  style={{
                    padding: "11px 13px",
                    borderRadius: "10px",
                    background: "#fffbeb",
                    color: "#92400e",
                  }}
                >
                  {detail.eligibility.missingDurationCount} ranked attempt(s) have no reliable duration and
                  appear after timed attempts when marks are equal.
                </Box>
              ) : null}

              {!summary.hasEnded ? (
                <Text style={{ color: "#b45309", marginTop: "14px" }}>
                  Result generation is disabled until the mock test has ended.
                </Text>
              ) : null}

              <Box className="mock-test-results__summary-actions">
                {renderSummaryActions()}
              </Box>
            </Box>

            <Box style={{ ...surface, padding: "20px", minWidth: 0 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                style={{ gap: "10px" }}
              >
                <H4 style={{ margin: 0 }}>Result Preview</H4>
                <Text style={{ color: "#64748b" }}>
                  {rows.length} {rows.length === 1 ? "student" : "students"}
                </Text>
              </Box>

              {rows.length ? (
                <Box mt="lg" style={{ width: "100%", maxWidth: "100%", overflowX: "auto" }}>
                  <table style={{ width: "100%", minWidth: "620px", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, textAlign: "center" }}>Rank</th>
                        <th style={thStyle}>Student Name</th>
                        <th style={{ ...thStyle, textAlign: "center" }}>Marks</th>
                        <th style={{ ...thStyle, textAlign: "center" }}>Time Taken</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={`${row.rank}-${row.studentName}`}>
                          <td style={{ ...tdStyle, textAlign: "center", fontWeight: 700 }}>{row.rank}</td>
                          <td style={tdStyle}>{row.studentName}</td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>{formatMarks(row.marks)}</td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            {formatDuration(row.timeTakenSeconds)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              ) : (
                <Box
                  mt="lg"
                  style={{
                    padding: "26px 18px",
                    textAlign: "center",
                    color: "#64748b",
                    border: "1px dashed #cbd5e1",
                    borderRadius: "12px",
                  }}
                >
                  {snapshot
                    ? "No valid submitted attempts were available when this preview was generated."
                    : "No ranking preview has been generated for this mock test."}
                </Box>
              )}
            </Box>
          </>
        ) : null}
      </Box>

      <ConfirmationModal
        confirmation={confirmation}
        busy={Boolean(busyAction)}
        onCancel={() => setConfirmation(null)}
        onConfirm={() => runAction(confirmation.type)}
      />
    </Box>
  );
}
