import React, { memo, useCallback } from "react";
import {
  FormGroup,
  FormMessage,
  Label,
  TinyMCE,
} from "@adminjs/design-system";

const EDITOR_PLUGINS = [
  "advlist",
  "anchor",
  "autolink",
  "charmap",
  "code",
  "codesample",
  "fullscreen",
  "hr",
  "image",
  "link",
  "lists",
  "media",
  "preview",
  "searchreplace",
  "table",
  "visualblocks",
  "wordcount",
];

const EDITOR_TOOLBAR = [
  "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough",
  "forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent",
  "link unlink image table hr | blockquote codesample charmap | searchreplace visualblocks removeformat",
  "preview code fullscreen",
];

const editorOptions = {
  height: 560,
  menubar: "file edit view insert format tools table help",
  plugins: EDITOR_PLUGINS,
  toolbar: EDITOR_TOOLBAR,
  toolbar_mode: "sliding",
  browser_spellcheck: true,
  contextmenu: "link image table",
  image_advtab: true,
  image_caption: true,
  link_default_target: "_blank",
  table_default_attributes: { border: "1" },
  table_default_styles: {
    width: "100%",
    borderCollapse: "collapse",
  },
  table_resize_bars: true,
  table_sizing_mode: "responsive",
  content_style: `
    body { font-family: Inter, Arial, sans-serif; font-size: 15px; line-height: 1.65; padding: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { min-width: 70px; padding: 8px 10px; border: 1px solid #94a3b8; vertical-align: top; }
    th { background: #f1f5f9; font-weight: 700; }
    img { max-width: 100%; height: auto; }
  `,
};

const RichTextEditor = ({ property, record, onChange }) => {
  const value = record?.params?.[property.path] || "";
  const error = record?.errors?.[property.path];

  const handleChange = useCallback(
    (content) => onChange(property.path, content),
    [onChange, property.path]
  );

  return React.createElement(
    FormGroup,
    { error: Boolean(error) },
    React.createElement(Label, null, property.label),
    React.createElement(TinyMCE, {
      value,
      onChange: handleChange,
      options: { ...editorOptions, ...(property?.props?.editorOptions || {}) },
    }),
    React.createElement(FormMessage, null, error?.message)
  );
};

export default memo(RichTextEditor);
