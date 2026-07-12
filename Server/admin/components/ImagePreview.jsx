import React from "react";
import { flat } from "adminjs";

const toArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

export default function ImagePreview({ property, record }) {
  const custom = property?.custom || {};
  const paths = toArray(flat.get(record?.params, custom.filePathProperty));
  const names = toArray(
    flat.get(record?.params, custom.filenameProperty || custom.keyProperty)
  );

  if (!paths.length) {
    return null;
  }

  return (
    <div className="sajha-admin-image-preview">
      {paths.map((path, index) =>
        path ? (
          <a
            key={`${path}-${index}`}
            href={path}
            target="_blank"
            rel="noreferrer"
            title="Open full-size image"
            className="sajha-admin-image-preview__link"
            style={{
              display: "block",
              width: 220,
              height: 132,
              overflow: "hidden",
            }}
          >
            <img
              src={path}
              alt={names[index] || property.label || "Uploaded image"}
              className="sajha-admin-image-preview__image"
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </a>
        ) : null
      )}
    </div>
  );
}
