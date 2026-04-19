import React, { memo, useMemo } from "react";
import { flat } from "adminjs";
import { Box, FormGroup, FormMessage, Label, Select, Text } from "@adminjs/design-system";

const readSelectedCourses = (record = {}, property = {}) => {
  const selectedCourses = flat.get(record?.params || {}, property.path);

  if (Array.isArray(selectedCourses) && selectedCourses.length > 0) {
    return selectedCourses.map((course) => String(course || "").trim()).filter(Boolean);
  }

  const legacyCourse = String(record?.params?.course || "").trim();
  return legacyCourse ? [legacyCourse] : [];
};

const OnlineClassCoursesEdit = ({ property, record, onChange }) => {
  const propertyPath = property?.path || "courses";
  const options = Array.isArray(property?.availableValues) ? property.availableValues : [];
  const propertyError = record?.errors?.[propertyPath];
  const selectedValues = readSelectedCourses(record, property);
  const helperText =
    property?.description ||
    "Students from any selected course will see this live class. Select at least one.";

  const optionLookup = useMemo(
    () =>
      new Map(
        options.map((option) => [
          String(option?.value || ""),
          {
            value: option?.value,
            label: option?.label || option?.value,
          },
        ])
      ),
    [options]
  );

  const selectedOptions = selectedValues.map(
    (course) => optionLookup.get(course) || { value: course, label: course }
  );

  return (
    <FormGroup error={Boolean(propertyError)}>
      <Label required>{property?.label}</Label>

      <Box style={{ display: "grid", gap: "8px" }}>
        <Select
          value={selectedOptions}
          options={options}
          isMulti
          isSearchable
          closeMenuOnSelect={false}
          placeholder="Search and select one or more courses"
          onChange={(selected) =>
            onChange(
              propertyPath,
              (Array.isArray(selected) ? selected : [])
                .map((option) => String(option?.value || "").trim())
                .filter(Boolean)
            )
          }
        />

        <Text color="grey60" fontSize="12px">
          {helperText}
        </Text>
      </Box>

      <FormMessage>{propertyError?.message}</FormMessage>
    </FormGroup>
  );
};

export default memo(OnlineClassCoursesEdit);
