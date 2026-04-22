import React from "react";
import { formatAdminDateTimeValue } from "./adminjs-safe-helpers";
import SafeValueGroup from "./SafeValueGroup";

const DefaultDatetimeShowProperty = ({ property, record }) => {
  const value = formatAdminDateTimeValue(record.params[property.path], property.type);

  return <SafeValueGroup property={property}>{value}</SafeValueGroup>;
};

export default DefaultDatetimeShowProperty;
