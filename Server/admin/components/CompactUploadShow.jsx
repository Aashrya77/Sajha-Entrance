import React from "react";
import { FormGroup, Label } from "@adminjs/design-system";
import { useTranslation } from "adminjs";
import ImagePreview from "./ImagePreview";

// @adminjs/upload's default show component passes width="100%", which makes
// uploaded images fill the entire record view.
export default function CompactUploadShow(props) {
  const { property } = props;
  const { translateProperty } = useTranslation();

  return (
    <FormGroup>
      <Label>{translateProperty(property.label, property.resourceId)}</Label>
      <ImagePreview {...props} />
    </FormGroup>
  );
}
