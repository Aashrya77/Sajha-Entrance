import React, { useState } from "react";

const styles = {
  container: {
    maxWidth: 900,
    margin: "24px auto",
    padding: 32,
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
    fontFamily: "'Roboto', sans-serif",
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 20,
    color: "#1a1a2e",
  },
  infoBox: {
    background: "#e8f4fd",
    border: "1px solid #b3d7f0",
    borderRadius: 6,
    padding: 16,
    marginBottom: 20,
    fontSize: 13,
    lineHeight: 1.6,
    color: "#1a3d5c",
  },
  mono: {
    fontFamily: "monospace",
    background: "#f0f4f8",
    padding: "8px 10px",
    borderRadius: 4,
    display: "block",
    marginTop: 8,
    fontSize: 12,
    wordBreak: "break-all",
  },
  fileInput: {
    marginBottom: 16,
    padding: "8px 0",
  },
  btn: {
    background: "#3795f0",
    color: "#fff",
    border: "none",
    padding: "10px 28px",
    borderRadius: 6,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  btnDisabled: {
    background: "#a0c4e8",
    cursor: "not-allowed",
  },
  errorBox: {
    background: "#fdecea",
    border: "1px solid #f5c6cb",
    borderRadius: 6,
    padding: 14,
    marginTop: 16,
    color: "#842029",
    fontSize: 14,
  },
  successBox: {
    background: "#d1e7dd",
    border: "1px solid #a3cfbb",
    borderRadius: 6,
    padding: 14,
    marginTop: 16,
    color: "#0f5132",
    fontSize: 14,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 12,
    fontSize: 13,
  },
  th: {
    background: "#f5f5f5",
    padding: "8px 12px",
    textAlign: "left",
    borderBottom: "2px solid #ddd",
    fontWeight: 600,
  },
  td: {
    padding: "8px 12px",
    borderBottom: "1px solid #eee",
  },
};

const BulkUploadResults = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an Excel file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/results/bulk-upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Upload failed.");
        if (data.errors && data.errors.length > 0) {
          setResult(data);
        }
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Bulk Upload Student Results</h2>

      <div style={styles.infoBox}>
        <strong>Excel File Format:</strong>
        <br />
        Your Excel file should have these columns:
        <span style={styles.mono}>
          symbolNumber | studentName | course | examDate | subject1_name |
          subject1_fullMarks | subject1_passMarks | subject1_obtainedMarks |
          subject2_name | subject2_fullMarks | ... | remarks
        </span>
        <br />
        <strong>Course</strong> must be one of: BIT, BCA, CMAT, CSIT
        <br />
        <strong>examDate</strong> format: YYYY-MM-DD (e.g. 2025-06-15)
        <br />
        <strong>Subject columns</strong> repeat for each subject. The number of
        subject groups should match the course (e.g. BIT has 3 subjects).
        <br />
        <strong>remarks</strong> column is optional.
      </div>

      <div>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          style={styles.fileInput}
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={uploading || !file}
        style={{
          ...styles.btn,
          ...(uploading || !file ? styles.btnDisabled : {}),
        }}
      >
        {uploading ? "Uploading..." : "Upload & Import"}
      </button>

      {error && <div style={styles.errorBox}>{error}</div>}

      {result && result.success && (
        <div style={styles.successBox}>
          Successfully imported <strong>{result.inserted}</strong> result(s).
          {result.skipped > 0 && (
            <>
              {" "}Skipped <strong>{result.skipped}</strong> row(s) due to errors.
            </>
          )}
        </div>
      )}

      {result && result.errors && result.errors.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <strong style={{ color: "#842029" }}>Row Errors:</strong>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Row</th>
                <th style={styles.th}>Error</th>
              </tr>
            </thead>
            <tbody>
              {result.errors.map((err, idx) => (
                <tr key={idx}>
                  <td style={styles.td}>{err.row}</td>
                  <td style={styles.td}>{err.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BulkUploadResults;
