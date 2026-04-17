import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  FormGroup,
  H4,
  Input,
  Label,
  Select,
  Text,
} from "@adminjs/design-system";
import { useTranslation } from "adminjs";
import { useNavigate } from "react-router";

const panelStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)",
  padding: "24px",
};

const SEARCHABLE_TYPES = new Set([
  "string",
  "textarea",
  "email",
  "password",
  "phone",
  "number",
  "date",
  "datetime",
  "richtext",
]);

const getPropertyPath = (property = {}) =>
  property.propertyPath || property.path || property.name || "";

const isReferenceSearchEnabled = (property = {}) =>
  Boolean(property?.custom?.searchableReference);

const getRecordFieldValue = (record = {}, propertyPath = "") => {
  const populatedRecord = record?.populated?.[propertyPath];

  if (populatedRecord?.title) {
    return populatedRecord.title;
  }

  const rawValue = record?.params?.[propertyPath];
  return String(rawValue ?? "").trim();
};

const getSearchableProperties = (resource = {}, translateProperty) => {
  const propertiesByPath = resource.properties || {};
  const candidates = [
    ...(Array.isArray(resource.filterProperties) ? resource.filterProperties : []),
    ...(Array.isArray(resource.listProperties) ? resource.listProperties : []),
  ];

  if (resource.titleProperty) {
    candidates.unshift(resource.titleProperty);
  }

  const options = new Map();

  candidates.forEach((property) => {
    const path = getPropertyPath(property);

    if (!path || path.startsWith("_")) {
      return;
    }

    const resolvedProperty = propertiesByPath[path] || property;
    const type = resolvedProperty?.type || property?.type || "string";
    const isReference = Boolean(resolvedProperty?.reference || property?.reference);

    if (isReference && !isReferenceSearchEnabled(resolvedProperty) && !isReferenceSearchEnabled(property)) {
      return;
    }

    if (!isReference && !SEARCHABLE_TYPES.has(type)) {
      return;
    }

    if (resolvedProperty?.isArray || property?.isArray) {
      return;
    }

    options.set(path, {
      value: path,
      label: translateProperty(path, resource?.id, {
        defaultValue: resolvedProperty?.label || property?.label || path,
      }),
    });
  });

  return Array.from(options.values());
};

const buildRecordActionPath = (rootPath, resourceId, record) => {
  const availableAction = ["show", "edit"].find((actionName) =>
    record?.recordActions?.some((action) => action.name === actionName)
  );

  if (!availableAction) {
    return "";
  }

  return `${rootPath}/resources/${resourceId}/records/${record.id}/${availableAction}`;
};

const AdminResourceSearch = (props) => {
  const navigate = useNavigate();
  const { translateAction, translateLabel, translateProperty } = useTranslation();
  const resource = props?.resource || {};
  const resourceId = resource?.id;
  const rootPath = window.REDUX_STATE?.paths?.rootPath || "/admin";
  const searchableProperties = useMemo(
    () => getSearchableProperties(resource, translateProperty),
    [resource, translateProperty]
  );
  const [searchProperty, setSearchProperty] = useState(searchableProperties[0] || null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const listUrl = resource?.href || `${rootPath}/resources/${resourceId}`;
  const resourceLabel = translateLabel(resource?.name || resourceId || "Records", resourceId, {
    defaultValue: resource?.name || resourceId || "Records",
  });
  const searchActionLabel = translateAction("search", resourceId, {
    defaultValue: "Search",
  });

  const handleSearch = async (event) => {
    event.preventDefault();

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setErrorMessage("Enter a keyword to search.");
      setHasSearched(false);
      setResults([]);
      return;
    }

    if (!searchProperty?.value) {
      setErrorMessage("This resource does not have a searchable field configured.");
      setHasSearched(false);
      setResults([]);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        searchProperty: searchProperty.value,
        perPage: "25",
        page: "1",
      });
      const response = await fetch(
        `${rootPath}/api/resources/${resourceId}/actions/search/${encodeURIComponent(trimmedQuery)}?${params.toString()}`,
        {
          credentials: "same-origin",
        }
      );

      if (!response.ok) {
        let nextError = "Search failed.";

        try {
          const data = await response.json();
          nextError = data?.error || data?.notice?.message || nextError;
        } catch (_error) {
          // Ignore non-JSON responses.
        }

        throw new Error(nextError);
      }

      const data = await response.json();
      setResults(Array.isArray(data?.records) ? data.records : []);
      setErrorMessage(data?.error || "");
    } catch (error) {
      setResults([]);
      setErrorMessage(error.message || "Search failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenRecord = (record) => {
    const nextPath = buildRecordActionPath(rootPath, resourceId, record);

    if (nextPath) {
      navigate(nextPath);
      return;
    }

    navigate(listUrl);
  };

  return (
    <Box flex flexDirection="column" px="xxl" py="xl" style={{ gap: 16 }}>
      <Box style={panelStyle}>
        <H4 mb="default">{`${searchActionLabel} ${resourceLabel}`}</H4>
        <Text mb="xl" color="grey60">
          Search this resource without leaving the admin panel. Results open directly to the matching record.
        </Text>

        {searchableProperties.length === 0 ? (
          <Box flex flexDirection="column" style={{ gap: 12 }}>
            <Text color="danger">No searchable fields are configured for this resource yet.</Text>
            <Button variant="outlined" onClick={() => navigate(listUrl)}>
              Back to List
            </Button>
          </Box>
        ) : (
          <form onSubmit={handleSearch}>
            <Box flex flexDirection="column" style={{ gap: 16 }}>
              <FormGroup>
                <Label>Search Field</Label>
                <Select
                  value={searchProperty}
                  options={searchableProperties}
                  onChange={(selected) => setSearchProperty(selected)}
                  isClearable={false}
                />
              </FormGroup>

              <FormGroup>
                <Label>Keyword</Label>
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search by ${searchProperty?.label || "field"}`}
                />
              </FormGroup>

              <Box flex style={{ gap: 12, flexWrap: "wrap" }}>
                <Button type="submit" variant="primary" isLoading={isLoading}>
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                    setErrorMessage("");
                    setHasSearched(false);
                  }}
                >
                  Clear
                </Button>
                <Button type="button" variant="outlined" onClick={() => navigate(listUrl)}>
                  Back to List
                </Button>
              </Box>
            </Box>
          </form>
        )}

        {errorMessage ? (
          <Text mt="lg" color="danger">
            {errorMessage}
          </Text>
        ) : null}

        {hasSearched && !isLoading ? (
          <Box mt="xl" flex flexDirection="column" style={{ gap: 12 }}>
            <Text color="grey60">
              {results.length > 0
                ? `Found ${results.length} matching record${results.length === 1 ? "" : "s"}.`
                : "No matching records found."}
            </Text>

            {results.map((record) => (
              <Box
                key={record.id}
                flex
                justifyContent="space-between"
                alignItems="center"
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: "14px 16px",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <Box flex flexDirection="column">
                  <Text fontWeight="bold">
                    {getRecordFieldValue(record, searchProperty?.value) || record.title || record.id}
                  </Text>
                  <Text color="grey60">
                    {searchProperty?.label}: {getRecordFieldValue(record, searchProperty?.value) || "N/A"}
                  </Text>
                </Box>

                <Button type="button" size="sm" onClick={() => handleOpenRecord(record)}>
                  Open
                </Button>
              </Box>
            ))}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};

export default AdminResourceSearch;
