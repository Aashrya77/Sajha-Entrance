import React, { useEffect } from "react";

const BulkUploadRedirect = () => {
  useEffect(() => {
    window.location.href = "/admin/bulk-upload";
  }, []);

  return React.createElement("div", {
    style: { padding: 40, textAlign: "center", color: "#666" }
  }, "Redirecting to Bulk Upload page...");
};

export default BulkUploadRedirect;
