import React, { useState } from "react";
import {
  Box,
  Button,
  Text,
  MessageBox,
  Loader,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@adminjs/design-system";

const EXPECTED_HEADERS = [
  "symbolNumber",
  "studentName",
  "course",
  "examDate",
  "remarks",
];

const SUBJECT_COLUMNS = [
  "subjectName",
  "fullMarks",
  "passMarks",
  "obtainedMarks",
];

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
    <Box variant="white" p="xl" m="xl" style={{ maxWidth: 900 }}>
      <Text as="h2" mb="lg" fontWeight="bold" fontSize="xl">
        Bulk Upload Student Results
      </Text>

      <MessageBox mb="lg" message="Excel File Format" variant="info">
        <Text mt="sm" fontSize="sm">
          Your Excel file should have these columns:
        </Text>
        <Text fontSize="sm" mt="sm" style={{ fontFamily: "monospace" }}>
          symbolNumber | studentName | course | examDate | subject1_name |
          subject1_fullMarks | subject1_passMarks | subject1_obtainedMarks |
          subject2_name | subject2_fullMarks | ... | remarks
        </Text>
        <Text mt="sm" fontSize="sm">
          <strong>Course</strong> must be one of: BIT, BCA, CMAT, CSIT
          <br />
          <strong>examDate</strong> format: YYYY-MM-DD (e.g. 2025-06-15)
          <br />
          <strong>Subject columns</strong> repeat for each subject. The number of
          subject groups should match the course (e.g. BIT has 3 subjects).
          <br />
          <strong>remarks</strong> column is optional.
        </Text>
      </MessageBox>

      <Box mb="lg">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          style={{ marginBottom: 12 }}
        />
      </Box>

      <Button
        onClick={handleUpload}
        disabled={uploading || !file}
        variant="primary"
        size="lg"
      >
        {uploading ? <Loader /> : "Upload & Import"}
      </Button>

      {error && (
        <MessageBox mt="lg" variant="danger" message="Error">
          <Text fontSize="sm">{error}</Text>
        </MessageBox>
      )}

      {result && result.success && (
        <MessageBox mt="lg" variant="success" message="Upload Complete">
          <Text fontSize="sm">
            Successfully imported <strong>{result.inserted}</strong> result(s).
            {result.skipped > 0 && (
              <>
                {" "}Skipped <strong>{result.skipped}</strong> row(s) due to errors.
              </>
            )}
          </Text>
        </MessageBox>
      )}

      {result && result.errors && result.errors.length > 0 && (
        <Box mt="lg">
          <Text fontWeight="bold" mb="sm" color="red">
            Row Errors:
          </Text>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Row</TableCell>
                <TableCell>Error</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {result.errors.map((err, idx) => (
                <TableRow key={idx}>
                  <TableCell>{err.row}</TableCell>
                  <TableCell>{err.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default BulkUploadResults;
