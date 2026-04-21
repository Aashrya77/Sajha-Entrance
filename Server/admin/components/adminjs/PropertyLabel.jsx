import React from "react";
import { Box, Icon, Label, Tooltip } from "@adminjs/design-system";
import { useTranslation } from "adminjs";
import { resolveAdminMessage, resolveAdminPropertyLabel } from "./translation-utils";

const PropertyDescription = ({ property, tm }) => {
  if (!property.description) {
    return null;
  }

  return (
    <Box mx="sm" display="inline-flex">
      <Tooltip
        direction={property.custom?.tooltipDirection || "top"}
        title={tm}
        size="lg"
      >
        <Box>
          <Icon icon="HelpCircle" color="info" />
        </Box>
      </Tooltip>
    </Box>
  );
};

const PropertyLabel = (props) => {
  const {
    property,
    props: labelProps,
    filter = false,
  } = props;
  const { i18n, translateProperty, tm } = useTranslation();

  if (property.hideLabel) {
    return null;
  }

  return (
    <Label
      htmlFor={filter ? ["filter", property.path].join("-") : property.path}
      required={!filter && property.isRequired}
      {...labelProps}
    >
      {resolveAdminPropertyLabel({
        property,
        i18n,
        translateProperty,
      })}
      <PropertyDescription
        property={property}
        tm={resolveAdminMessage({
          message: property.description,
          i18n,
          translateMessage: tm,
          resourceId: property.resourceId,
        })}
      />
    </Label>
  );
};

export default PropertyLabel;
