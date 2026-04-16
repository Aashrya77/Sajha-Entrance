import React, { memo } from "react";
import { flat } from "adminjs";
import { Box, Text } from "@adminjs/design-system";

const readSelectedCourses = (record = {}, property = {}) => {
  const selectedCourses = flat.get(record?.params || {}, property.path);

  if (Array.isArray(selectedCourses) && selectedCourses.length > 0) {
    return selectedCourses.map((course) => String(course || "").trim()).filter(Boolean);
  }

  const legacyCourse = String(record?.params?.course || "").trim();
  return legacyCourse ? [legacyCourse] : [];
};

const resolveCourseLabel = (course = "", availableValues = []) => {
  const matchingOption = availableValues.find((option) => option?.value === course);
  return matchingOption?.label || course;
};

const OnlineClassCoursesDisplay = ({ property, record }) => {
  const availableValues = Array.isArray(property?.availableValues) ? property.availableValues : [];
  const courses = readSelectedCourses(record, property);

  if (!courses.length) {
    return <Text color="grey60">No courses assigned</Text>;
  }

  return (
    <Box style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {courses.map((course) => (
        <Box
          as="span"
          key={course}
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 10px",
            borderRadius: "999px",
            background: "#eef2ff",
            color: "#3730a3",
            fontSize: "12px",
            fontWeight: 600,
            lineHeight: 1.2,
          }}
        >
          {resolveCourseLabel(course, availableValues)}
        </Box>
      ))}
    </Box>
  );
};

export default memo(OnlineClassCoursesDisplay);
