import React, { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Box, Button, FormGroup, Icon, Label, Text } from "@adminjs/design-system";
import { flat, useTranslation } from "adminjs";

const formatFileSize = (sizeInBytes) => {
  if (!sizeInBytes) {
    return "0 B";
  }

  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatMimeTypeLabel = (mimeType = "") => {
  const knownMimeTypes = {
    "image/jpeg": "JPG",
    "image/png": "PNG",
    "image/webp": "WEBP",
    "image/gif": "GIF",
  };

  if (knownMimeTypes[mimeType]) {
    return knownMimeTypes[mimeType];
  }

  const [, extension = "FILE"] = mimeType.split("/");
  return extension.toUpperCase();
};

const buildAcceptConfig = (mimeTypes = []) => {
  if (!mimeTypes.length) {
    return undefined;
  }

  return mimeTypes.reduce((accumulator, mimeType) => {
    accumulator[mimeType] = [];
    return accumulator;
  }, {});
};

const formatErrorMessage = (fileRejections = []) => {
  if (!fileRejections.length) {
    return "";
  }

  return fileRejections[0].errors.map((error) => error.message).join(" ");
};

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null || value === "") {
    return [];
  }

  return [value];
};

const areArraysEqual = (left = [], right = []) => {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
};

const isFileLike = (value) => {
  if (!value || typeof value !== "object") {
    return false;
  }

  if (typeof File !== "undefined" && value instanceof File) {
    return true;
  }

  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return true;
  }

  return false;
};

const buildExistingToken = (key) => `existing:${key}`;
const buildNewToken = (index) => `new:${index}`;

const getOrderedItems = (items, orderTokens) => {
  const itemsByToken = new Map(items.map((item) => [item.token, item]));
  const orderedItems = [];
  const seenTokens = new Set();

  orderTokens.forEach((token) => {
    const matchedItem = itemsByToken.get(token);

    if (matchedItem && !seenTokens.has(token)) {
      orderedItems.push(matchedItem);
      seenTokens.add(token);
    }
  });

  items.forEach((item) => {
    if (!seenTokens.has(item.token)) {
      orderedItems.push(item);
    }
  });

  return orderedItems;
};

const moveItem = (items, fromIndex, toIndex) => {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
};

const getFilenameLabel = (item) => {
  if (item.name) {
    return item.name;
  }

  if (item.key) {
    const segments = item.key.split("/");
    return segments[segments.length - 1];
  }

  return "Selected image";
};

export default function ImageUpload(props) {
  const { property, record, onChange } = props;
  const { translateProperty } = useTranslation();
  const { custom = {} } = property;

  const params = record?.params || {};
  const isMultiple = Boolean(custom.multiple);
  const entityName = custom.entityName || property.label?.toLowerCase() || "image";
  const acceptedFormatsLabel = custom.mimeTypes?.length
    ? custom.mimeTypes.map(formatMimeTypeLabel).join(", ")
    : "JPG, PNG, WEBP, GIF";
  const helperText = custom.maxSize
    ? `Supported formats: ${acceptedFormatsLabel}. Maximum file size: ${formatFileSize(custom.maxSize)}.${custom.uploadPath ? ` Stored in ${custom.uploadPath}.` : ""}`
    : `Supported formats: ${acceptedFormatsLabel}.${custom.uploadPath ? ` Stored in ${custom.uploadPath}.` : ""}`;

  const fileValue = flat.get(params, custom.fileProperty);
  const storedPath = flat.get(params, custom.filePathProperty);
  const storedKey = flat.get(params, custom.keyProperty);
  const storedName = flat.get(params, custom.filenameProperty);
  const isMarkedForRemoval = !isMultiple && fileValue === null;
  const queuedFiles = isMultiple ? toArray(fileValue) : Array.isArray(fileValue) ? fileValue : [];
  const storedKeys = isMultiple ? toArray(storedKey) : [];
  const storedPaths = isMultiple ? toArray(storedPath) : [];
  const storedNames = isMultiple ? toArray(storedName) : [];
  const filesToDelete = isMultiple
    ? new Set(toArray(flat.get(params, custom.filesToDeleteProperty)).map(String))
    : new Set();
  const orderTokens = isMultiple
    ? toArray(flat.get(params, custom.orderProperty)).map(String).filter(Boolean)
    : [];

  const [singlePreview, setSinglePreview] = useState("");
  const [queuedPreviewUrls, setQueuedPreviewUrls] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [modalItem, setModalItem] = useState(null);
  const [draggedToken, setDraggedToken] = useState("");
  const [dragOverToken, setDragOverToken] = useState("");
  const previewUrlCacheRef = useRef(new Map());

  useEffect(() => {
    const previewUrlCache = previewUrlCacheRef.current;
    const activeFiles = queuedFiles.filter(isFileLike);

    activeFiles.forEach((file) => {
      if (!previewUrlCache.has(file)) {
        previewUrlCache.set(file, URL.createObjectURL(file));
      }
    });

    Array.from(previewUrlCache.entries()).forEach(([file, previewUrl]) => {
      if (!activeFiles.includes(file)) {
        URL.revokeObjectURL(previewUrl);
        previewUrlCache.delete(file);
      }
    });

    if (isMultiple) {
      const nextPreviewUrls = queuedFiles.map((file) => previewUrlCache.get(file) || "");

      setQueuedPreviewUrls((currentPreviewUrls) =>
        areArraysEqual(currentPreviewUrls, nextPreviewUrls) ? currentPreviewUrls : nextPreviewUrls
      );
      setSinglePreview((currentPreviewUrl) => (currentPreviewUrl ? "" : currentPreviewUrl));
      return undefined;
    }

    const nextSinglePreview = queuedFiles[0] ? previewUrlCache.get(queuedFiles[0]) || "" : "";

    setSinglePreview((currentPreviewUrl) =>
      currentPreviewUrl === nextSinglePreview ? currentPreviewUrl : nextSinglePreview
    );
    setQueuedPreviewUrls((currentPreviewUrls) =>
      currentPreviewUrls.length ? [] : currentPreviewUrls
    );
  }, [isMultiple, queuedFiles]);

  useEffect(
    () => () => {
      previewUrlCacheRef.current.forEach((previewUrl) => {
        URL.revokeObjectURL(previewUrl);
      });
      previewUrlCacheRef.current.clear();
    },
    []
  );

  const allStoredItems = isMultiple
    ? storedKeys.map((key, index) => ({
        kind: "existing",
        token: buildExistingToken(key),
        key,
        name: storedNames[index],
        src: storedPaths[index],
        originalIndex: index,
      }))
    : [];

  const visibleStoredItems = allStoredItems.filter(
    (item) => item.src && !filesToDelete.has(String(item.originalIndex))
  );

  const queuedItems = isMultiple
    ? queuedFiles.map((file, index) => ({
        kind: "new",
        token: buildNewToken(index),
        file,
        name: file?.name,
        src: queuedPreviewUrls[index],
      }))
    : [];

  const orderedGalleryItems = isMultiple
    ? getOrderedItems([...visibleStoredItems, ...queuedItems], orderTokens)
    : [];

  const commitGalleryItems = (nextItems) => {
    let nextQueuedIndex = 0;
    const nextQueuedFiles = [];
    const nextOrderTokens = [];

    nextItems.forEach((item) => {
      if (item.kind === "new") {
        nextQueuedFiles.push(item.file);
        nextOrderTokens.push(buildNewToken(nextQueuedIndex));
        nextQueuedIndex += 1;
        return;
      }

      nextOrderTokens.push(item.token);
    });

    const remainingExistingTokens = new Set(
      nextItems
        .filter((item) => item.kind === "existing")
        .map((item) => item.token)
    );

    const nextFilesToDelete = allStoredItems
      .filter((item) => !remainingExistingTokens.has(item.token))
      .map((item) => item.originalIndex.toString());

    const nextPaths = storedPaths.map((path, index) =>
      nextFilesToDelete.includes(String(index)) ? null : path
    );

    let nextParams = flat.set(params, custom.fileProperty, nextQueuedFiles);
    nextParams = flat.set(nextParams, custom.filesToDeleteProperty, nextFilesToDelete);
    nextParams = flat.set(nextParams, custom.filePathProperty, nextPaths);
    nextParams = flat.set(nextParams, custom.orderProperty, nextOrderTokens);

    onChange({
      ...record,
      params: nextParams,
    });
  };

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject, open } =
    useDropzone({
      multiple: isMultiple,
      noClick: true,
      noKeyboard: true,
      accept: buildAcceptConfig(custom.mimeTypes),
      maxSize: custom.maxSize,
      onDropAccepted: (acceptedFiles) => {
        setErrorMessage("");

        if (isMultiple) {
          const newItems = acceptedFiles.map((file) => ({
            kind: "new",
            token: `pending:${file.name}:${file.size}:${Date.now()}`,
            file,
            name: file.name,
          }));

          commitGalleryItems([...orderedGalleryItems, ...newItems]);
          return;
        }

        onChange(custom.fileProperty, acceptedFiles.slice(0, 1));
      },
      onDropRejected: (fileRejections) => {
        setErrorMessage(formatErrorMessage(fileRejections));
      },
    });

  const openFileDialog = (event) => {
    event?.stopPropagation?.();
    open();
  };

  const closeModal = (event) => {
    event?.stopPropagation?.();
    setModalItem(null);
  };

  const handleClearSelection = (event) => {
    event.stopPropagation();
    setErrorMessage("");
    onChange(custom.fileProperty, []);
  };

  const handleRemoveStoredImage = (event) => {
    event.stopPropagation();
    setErrorMessage("");
    onChange(custom.fileProperty, null);
  };

  const handleRemoveGalleryItem = (event, token) => {
    event.stopPropagation();
    setErrorMessage("");
    commitGalleryItems(orderedGalleryItems.filter((item) => item.token !== token));
  };

  const handleGalleryDragStart = (event, token) => {
    event.stopPropagation();
    setDraggedToken(token);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleGalleryDrop = (event, targetToken) => {
    event.preventDefault();
    event.stopPropagation();

    if (!draggedToken || draggedToken === targetToken) {
      setDraggedToken("");
      setDragOverToken("");
      return;
    }

    const draggedIndex = orderedGalleryItems.findIndex((item) => item.token === draggedToken);
    const targetIndex = orderedGalleryItems.findIndex((item) => item.token === targetToken);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedToken("");
      setDragOverToken("");
      return;
    }

    commitGalleryItems(moveItem(orderedGalleryItems, draggedIndex, targetIndex));
    setDraggedToken("");
    setDragOverToken("");
  };

  const previewSrc = !isMultiple
    ? queuedFiles.length
      ? singlePreview
      : !isMarkedForRemoval
        ? storedPath
        : ""
    : "";
  const previewName = !isMultiple ? (queuedFiles.length ? queuedFiles[0]?.name : storedKey) : "";
  const hasGalleryItems = orderedGalleryItems.length > 0;

  const dropzoneTitle = isMultiple
    ? isDragActive
      ? `Drop the ${entityName}s here`
      : hasGalleryItems
        ? `Add more ${entityName}s, preview them, or drag cards to reorder`
        : `Drag and drop ${entityName}s here`
    : isDragActive
      ? `Drop the ${entityName} here`
      : previewSrc
        ? `Replace or remove the current ${entityName}`
        : `Drag and drop a ${entityName} here`;

  const actionButtonLabel = isMultiple
    ? hasGalleryItems
      ? "Add images"
      : "Choose images"
    : previewSrc
      ? "Replace image"
      : "Choose image";

  return (
    <FormGroup>
      <Label required={property.isRequired}>
        {translateProperty(property.label, property.resourceId)}
      </Label>

      <Box
        {...getRootProps({
          onClick: openFileDialog,
        })}
        style={{
          border: `2px dashed ${
            isDragReject ? "#d73a49" : isDragAccept || isDragActive ? "#2251cc" : "#c9d1d9"
          }`,
          borderRadius: "18px",
          background: isDragAccept || isDragActive ? "#f6f8ff" : "#fbfcfe",
          padding: "24px",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <input {...getInputProps()} />

        <Box
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <Box style={{ display: "flex", alignItems: "center", gap: "16px", flex: "1 1 280px" }}>
            <Box
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background: "#eaf0ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon icon="Image" color="primary100" />
            </Box>

            <Box>
              <Text style={{ fontWeight: 700, fontSize: "15px", color: "#111827" }}>
                {dropzoneTitle}
              </Text>
              <Text style={{ color: "#6b7280", marginTop: "4px", fontSize: "13px" }}>
                {helperText}
              </Text>
              {isMultiple ? (
                <Text style={{ color: "#6b7280", marginTop: "4px", fontSize: "13px" }}>
                  Click a thumbnail to enlarge it. Drag any card to change the gallery order.
                </Text>
              ) : null}
            </Box>
          </Box>

          <Button type="button" size="sm" variant="outlined" onClick={openFileDialog}>
            {actionButtonLabel}
          </Button>
        </Box>

        {!isMultiple && previewSrc ? (
          <Box
            style={{
              marginTop: "18px",
              padding: "14px",
              borderRadius: "14px",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <Box
              as="button"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setModalItem({
                  src: previewSrc,
                  name: previewName || "Selected image",
                });
              }}
              style={{
                padding: 0,
                border: "none",
                background: "transparent",
                cursor: "zoom-in",
              }}
            >
              <img
                src={previewSrc}
                alt={previewName || "Selected image"}
                style={{
                  width: "120px",
                  height: "84px",
                  objectFit: "cover",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#f3f4f6",
                }}
              />
            </Box>

            <Box style={{ flex: "1 1 220px" }}>
              <Text style={{ fontWeight: 700, fontSize: "14px", color: "#111827" }}>
                {previewName || "Selected image"}
              </Text>
              <Text style={{ color: "#6b7280", marginTop: "4px", fontSize: "13px" }}>
                {queuedFiles.length
                  ? `New ${entityName} selected. Save the record to upload it.`
                  : `Current ${entityName}. Click the thumbnail to preview it.`}
              </Text>
            </Box>

            <Box style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Button type="button" size="sm" variant="outlined" onClick={openFileDialog}>
                Replace
              </Button>

              <Button
                type="button"
                size="sm"
                variant="text"
                color="danger"
                onClick={queuedFiles.length ? handleClearSelection : handleRemoveStoredImage}
              >
                {queuedFiles.length ? "Clear selection" : "Remove image"}
              </Button>
            </Box>
          </Box>
        ) : null}

        {isMultiple && hasGalleryItems ? (
          <Box
            style={{
              marginTop: "20px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: "14px",
            }}
          >
            {orderedGalleryItems.map((item) => (
              <Box
                key={item.token}
                draggable
                onDragStart={(event) => handleGalleryDragStart(event, item.token)}
                onDragEnd={() => {
                  setDraggedToken("");
                  setDragOverToken("");
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (dragOverToken !== item.token) {
                    setDragOverToken(item.token);
                  }
                }}
                onDragLeave={(event) => {
                  event.stopPropagation();
                  if (dragOverToken === item.token) {
                    setDragOverToken("");
                  }
                }}
                onDrop={(event) => handleGalleryDrop(event, item.token)}
                style={{
                  padding: "12px",
                  borderRadius: "16px",
                  border:
                    dragOverToken === item.token
                      ? "1px solid #2251cc"
                      : "1px solid #e5e7eb",
                  background: "#ffffff",
                  boxShadow:
                    draggedToken === item.token
                      ? "0 12px 28px rgba(17, 24, 39, 0.14)"
                      : "0 6px 18px rgba(17, 24, 39, 0.06)",
                  cursor: "grab",
                }}
              >
                <Box
                  as="button"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setModalItem({
                      src: item.src,
                      name: getFilenameLabel(item),
                    });
                  }}
                  style={{
                    width: "100%",
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    cursor: "zoom-in",
                  }}
                >
                  <img
                    src={item.src}
                    alt={getFilenameLabel(item)}
                    style={{
                      width: "100%",
                      height: "120px",
                      objectFit: "cover",
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#f3f4f6",
                    }}
                  />
                </Box>

                <Box
                  style={{
                    marginTop: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                  }}
                >
                  <Box style={{ minWidth: 0, flex: 1 }}>
                    <Text
                      style={{
                        fontWeight: 700,
                        fontSize: "13px",
                        color: "#111827",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {getFilenameLabel(item)}
                    </Text>
                    <Text style={{ color: "#6b7280", marginTop: "3px", fontSize: "12px" }}>
                      {item.kind === "new" ? "New image" : "Saved image"}
                    </Text>
                  </Box>

                  <Button
                    type="button"
                    size="sm"
                    variant="text"
                    color="danger"
                    onClick={(event) => handleRemoveGalleryItem(event, item.token)}
                  >
                    Remove
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        ) : null}
      </Box>

      {!isMultiple && isMarkedForRemoval && storedKey ? (
        <Text style={{ color: "#b45309", marginTop: "10px", fontSize: "13px" }}>
          {`The current ${entityName} will be removed when you save this record.`}
        </Text>
      ) : null}

      {errorMessage ? (
        <Text style={{ color: "#d73a49", marginTop: "10px", fontSize: "13px" }}>
          {errorMessage}
        </Text>
      ) : property.description ? (
        <Text style={{ color: "#6b7280", marginTop: "10px", fontSize: "13px" }}>
          {property.description}
        </Text>
      ) : null}

      {modalItem?.src ? (
        <Box
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1400,
            background: "rgba(17, 24, 39, 0.78)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <Box
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(92vw, 920px)",
              maxHeight: "90vh",
              background: "#ffffff",
              borderRadius: "20px",
              padding: "18px",
              boxShadow: "0 24px 56px rgba(17, 24, 39, 0.28)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <Box
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <Text style={{ fontWeight: 700, fontSize: "15px", color: "#111827" }}>
                {modalItem.name}
              </Text>
              <Button type="button" size="sm" variant="outlined" onClick={closeModal}>
                Close
              </Button>
            </Box>

            <Box
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                borderRadius: "16px",
                background: "#f8fafc",
              }}
            >
              <img
                src={modalItem.src}
                alt={modalItem.name}
                style={{
                  width: "100%",
                  maxHeight: "72vh",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </Box>
          </Box>
        </Box>
      ) : null}
    </FormGroup>
  );
}
