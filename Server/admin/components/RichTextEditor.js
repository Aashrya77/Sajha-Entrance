import React, { memo, useCallback, useState } from "react";
import {
  FormGroup,
  FormMessage,
  Icon,
  Label,
  RichTextEditor as AdminRichTextEditor,
} from "@adminjs/design-system";

const createTableMarkup = (rows, columns) => {
  const headerCells = Array.from({ length: columns }, () => "<th><p></p></th>").join("");
  const bodyCells = Array.from({ length: columns }, () => "<td><p></p></td>").join("");
  const bodyRows = Array.from({ length: Math.max(rows - 1, 0) }, () => `<tr>${bodyCells}</tr>`).join("");

  return `<table><tbody><tr>${headerCells}</tr>${bodyRows}</tbody></table><p></p>`;
};

const TABLE_PICKER_SIZE = 8;
const tableEditorStyles = `
  .college-rich-text-editor__native { position: relative; }
  .college-rich-text-editor__native .ProseMirror table { width: 100%; border: 1px solid #94a3b8 !important; border-collapse: collapse !important; table-layout: fixed; }
  .college-rich-text-editor__native .ProseMirror th,
  .college-rich-text-editor__native .ProseMirror td { min-width: 90px; min-height: 38px; padding: 9px 10px; vertical-align: top; border: 1px solid #94a3b8 !important; }
  .college-rich-text-editor__native .ProseMirror th { background: #f1f5f9 !important; }
  .college-rich-text-editor__table-picker { position: absolute; z-index: 12; top: 42px; right: 10px; width: 206px; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; box-shadow: 0 14px 32px rgba(15, 23, 42, .16); }
  .college-rich-text-editor__table-picker-label { min-height: 18px; margin-bottom: 8px; color: #334155; font-size: 12px; font-weight: 700; }
  .college-rich-text-editor__table-picker-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 3px; }
  .college-rich-text-editor__table-picker-cell { width: 20px; height: 20px; padding: 0; cursor: pointer; border: 1px solid #94a3b8; border-radius: 2px; background: #fff; }
  .college-rich-text-editor__table-picker-cell:hover,
  .college-rich-text-editor__table-picker-cell:focus-visible,
  .college-rich-text-editor__table-picker-cell.is-selected { border-color: #f97316; outline: 0; background: #fff1e8; }
`;

const RichTextEditor = (props) => {
  const { property, record, onChange } = props;
  const value = record?.params?.[property.path] || "";
  const error = record?.errors?.[property.path];
  const [editorVersion, setEditorVersion] = useState(0);
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const [tableSize, setTableSize] = useState({ rows: 0, columns: 0 });
  const tableToolsEnabled = Boolean(property?.props?.tableTools);

  const handleChange = useCallback(
    (content) => {
      onChange(property.path, content);
    },
    [onChange, property.path]
  );

  const handleInsertTable = useCallback((rows, columns) => {
    onChange(property.path, `${value}${createTableMarkup(rows, columns)}`);
    setEditorVersion((currentVersion) => currentVersion + 1);
    setTablePickerOpen(false);
    setTableSize({ rows: 0, columns: 0 });
  }, [onChange, property.path, value]);

  return (
    React.createElement(
      FormGroup,
      { error: Boolean(error) },
      React.createElement(Label, null, property.label),
      React.createElement(
        "div",
        { className: tableToolsEnabled ? "college-rich-text-editor__native" : undefined },
        tableToolsEnabled ? React.createElement("style", null, tableEditorStyles) : null,
        React.createElement(AdminRichTextEditor, {
          key: `rich-text-editor-${property.path}-${editorVersion}`,
          value,
          onChange: handleChange,
          options: property.props,
        }),
        tableToolsEnabled
          ? React.createElement(
              "button",
              {
                type: "button",
                className: "college-rich-text-editor__table-button",
                title: "Insert table",
                "aria-label": "Insert table",
                "aria-expanded": tablePickerOpen,
                style: {
                  position: "absolute",
                  zIndex: 13,
                  top: "7px",
                  right: "10px",
                  display: "grid",
                  width: "28px",
                  height: "28px",
                  padding: 0,
                  placeItems: "center",
                  cursor: "pointer",
                  border: 0,
                  borderRadius: "4px",
                  background: "#ffffff",
                },
                onMouseDown: (event) => event.preventDefault(),
                onClick: () => setTablePickerOpen((isOpen) => !isOpen),
              },
              React.createElement(Icon, { icon: "Grid", size: 18 })
            )
          : null,
        tableToolsEnabled && tablePickerOpen
          ? React.createElement(
              "div",
              {
                className: "college-rich-text-editor__table-picker",
                onMouseLeave: () => setTableSize({ rows: 0, columns: 0 }),
              },
              React.createElement(
                "div",
                { className: "college-rich-text-editor__table-picker-label" },
                tableSize.rows && tableSize.columns
                  ? `${tableSize.columns} x ${tableSize.rows} table`
                  : "Insert table"
              ),
              React.createElement(
                "div",
                { className: "college-rich-text-editor__table-picker-grid" },
                Array.from({ length: TABLE_PICKER_SIZE * TABLE_PICKER_SIZE }, (_, index) => {
                  const rows = Math.floor(index / TABLE_PICKER_SIZE) + 1;
                  const columns = (index % TABLE_PICKER_SIZE) + 1;
                  const isSelected = rows <= tableSize.rows && columns <= tableSize.columns;

                  return React.createElement("button", {
                    key: `${rows}-${columns}`,
                    type: "button",
                    className: `college-rich-text-editor__table-picker-cell${
                      isSelected ? " is-selected" : ""
                    }`,
                    "aria-label": `Insert ${columns} columns by ${rows} rows table`,
                    onMouseEnter: () => setTableSize({ rows, columns }),
                    onFocus: () => setTableSize({ rows, columns }),
                    onClick: () => handleInsertTable(rows, columns),
                  });
                })
              )
            )
          : null
      ),
      React.createElement(FormMessage, null, error?.message)
    )
  );
};

export default memo(RichTextEditor);
