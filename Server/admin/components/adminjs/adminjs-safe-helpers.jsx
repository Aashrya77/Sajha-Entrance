import React from "react";
import {
  Badge,
  ButtonCSS,
  formatCurrencyProperty,
  formatDateProperty,
} from "@adminjs/design-system";
import { styled } from "@adminjs/design-system/styled-components";
import { ViewHelpers, useTranslation } from "adminjs";
import startCase from "lodash/startCase";
import { Link } from "react-router-dom";

const StyledLink = styled(Link)`
  ${ButtonCSS};
  padding-left: ${({ theme }) => theme.space.xs};
  padding-right: ${({ theme }) => theme.space.xs};
`;

const mapBooleanValue = (value) => {
  if (typeof value === "undefined") {
    return "";
  }

  return value ? "Yes" : "No";
};

const pickCurrencyFormatOptions = (props = {}) => {
  const optionKeys = [
    "value",
    "decimalSeparator",
    "groupSeparator",
    "disableGroupSeparators",
    "intlConfig",
    "decimalScale",
    "prefix",
    "suffix",
  ];

  return Object.keys(props).reduce((formatOptions, key) => {
    if (!optionKeys.includes(key)) {
      return formatOptions;
    }

    if (props[key] === null || props[key] === undefined) {
      return formatOptions;
    }

    formatOptions[key] = props[key].toString();
    return formatOptions;
  }, {});
};

const stripTimeFromISO = (value) => String(value || "").split("T")[0];

const formatAdminCurrencyValue = (value, props = {}) =>
  formatCurrencyProperty(
    pickCurrencyFormatOptions({
      value,
      ...props,
    })
  );

const formatAdminDateTimeValue = (value, propertyType) => {
  if (!value) {
    return "";
  }

  const date =
    propertyType === "date"
      ? new Date(`${stripTimeFromISO(value)}T00:00:00`)
      : new Date(value);

  return date ? formatDateProperty(date, propertyType) : "";
};

const getArraySubpropertyPath = (path, index) => [path, index].join(".");

const convertArraySubProperty = (arrayProperty, index) => ({
  ...arrayProperty,
  path: getArraySubpropertyPath(arrayProperty.path, index),
  label: `[${index + 1}]`,
  isArray: false,
  isDraggable: false,
});

const convertMixedSubProperty = (property, subProperty) => {
  const [subPropertyPath = ""] = String(subProperty?.name || "").split(".").slice(-1);

  return {
    ...subProperty,
    path: [property.path, subPropertyPath].join("."),
  };
};

const AdminBooleanPropertyValue = (props) => {
  const {
    record,
    property,
    resource,
  } = props;
  const { tl } = useTranslation();
  const rawValue = record?.params?.[property.path];

  if (typeof rawValue === "undefined" || rawValue === "") {
    return null;
  }

  const baseValue = mapBooleanValue(rawValue);
  const translation = tl(`${property.path}.${rawValue}`, resource?.id, {
    defaultValue: baseValue,
  });

  return (
    <Badge outline size="sm">
      {translation}
    </Badge>
  );
};

const AdminDefaultPropertyValue = ({
  property: {
    propertyPath,
    availableValues,
    path,
  },
  record,
  resource: {
    id: resourceId,
  } = {},
}) => {
  const rawValue = record?.params?.[path];
  const { tl } = useTranslation();

  if (typeof rawValue === "undefined") {
    return null;
  }

  // eslint-disable-next-line eqeqeq
  const option = availableValues?.find((availableValue) => availableValue.value == rawValue);

  if (option) {
    const label = option.label || rawValue;

    return (
      <Badge>
        {tl(`${propertyPath}.${label}`, resourceId, {
          defaultValue: startCase(label),
        })}
      </Badge>
    );
  }

  return rawValue;
};

const AdminReferenceValue = ({ property, record }) => {
  const h = new ViewHelpers();
  const refId = record?.params?.[property.path];
  const populated = record?.populated?.[property.path];
  const value = populated?.title || refId;

  if (!property.reference) {
    throw new Error(`property: "${property.path}" does not have a reference`);
  }

  if (populated?.recordActions?.find((action) => action.name === "show")) {
    const href = h.recordActionUrl({
      resourceId: property.reference,
      recordId: refId,
      actionName: "show",
    });

    return (
      <StyledLink variant="text" to={href}>
        {value}
      </StyledLink>
    );
  }

  return <span>{value}</span>;
};

export {
  AdminBooleanPropertyValue,
  AdminDefaultPropertyValue,
  AdminReferenceValue,
  convertArraySubProperty,
  convertMixedSubProperty,
  formatAdminCurrencyValue,
  formatAdminDateTimeValue,
};
