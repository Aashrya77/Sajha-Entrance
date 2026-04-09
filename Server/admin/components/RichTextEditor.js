import React, { memo, useCallback } from "react";
import {
  FormGroup,
  FormMessage,
  Label,
  RichTextEditor as AdminRichTextEditor,
} from "@adminjs/design-system";

const RichTextEditor = (props) => {
  const { property, record, onChange } = props;
  const value = record?.params?.[property.path] || "";
  const error = record?.errors?.[property.path];

  const handleChange = useCallback(
    (content) => {
      onChange(property.path, content);
    },
    [onChange, property.path]
  );

  return (
    React.createElement(
      FormGroup,
      { error: Boolean(error) },
      React.createElement(Label, null, property.label),
      React.createElement(AdminRichTextEditor, {
        value,
        onChange: handleChange,
        options: property.props,
      }),
      React.createElement(FormMessage, null, error?.message)
    )
  );
};

export default memo(RichTextEditor);
