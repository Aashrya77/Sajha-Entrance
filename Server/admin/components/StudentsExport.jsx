import React, { useEffect, useRef, useState } from "react";
import { Box, Button, H4, Text } from "@adminjs/design-system";
import { useLocation, useNavigate } from "react-router";
import { buildAdminPath } from "../config/paths.js";

const panelStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)",
  padding: "24px",
};

const parseFilename = (contentDisposition = "") => {
  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] || "";
};

const StudentsExport = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasStartedRef = useRef(false);
  const [status, setStatus] = useState("Preparing the Excel file...");
  const [errorMessage, setErrorMessage] = useState("");

  const listUrl = `${
    props?.resource?.href || buildAdminPath("/resources/Student")
  }${location.search || ""}`;

  useEffect(() => {
    if (hasStartedRef.current) {
      return undefined;
    }

    hasStartedRef.current = true;
    const controller = new AbortController();

    const startDownload = async () => {
      try {
        const response = await fetch(
          buildAdminPath(`/api/students/export${location.search || ""}`),
          {
            credentials: "same-origin",
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          let nextError = "Failed to export students.";

          try {
            const data = await response.json();
            nextError = data?.error || data?.details || nextError;
          } catch (_error) {
            // Ignore JSON parsing issues for non-JSON error bodies.
          }

          throw new Error(nextError);
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const filename =
          parseFilename(response.headers.get("content-disposition") || "") ||
          `students-export-${new Date().toISOString().slice(0, 10)}.xlsx`;

        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setStatus("Download started. Returning to the students list...");

        window.setTimeout(() => {
          window.URL.revokeObjectURL(downloadUrl);
          navigate(listUrl);
        }, 300);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setErrorMessage(error.message || "Failed to export students.");
        setStatus("The Excel export could not be prepared.");
      }
    };

    startDownload();

    return () => controller.abort();
  }, [listUrl, location.search, navigate]);

  return (
    <Box flex flexDirection="column" px="xxl" py="xl" style={{ gap: 16 }}>
      <Box style={panelStyle}>
        <H4 mb="default">Student Excel Export</H4>
        <Text mb="default">{status}</Text>

        {errorMessage ? (
          <Box mt="lg" flex flexDirection="column" style={{ gap: 12 }}>
            <Text color="danger">{errorMessage}</Text>
            <Box flex style={{ gap: 12 }}>
              <Button variant="outlined" onClick={() => window.location.reload()}>
                Retry Export
              </Button>
              <Button variant="primary" onClick={() => navigate(listUrl)}>
                Back to Students
              </Button>
            </Box>
          </Box>
        ) : (
          <Text color="grey60">
            The workbook includes the current student records in `.xlsx` format with readable headers.
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default StudentsExport;
