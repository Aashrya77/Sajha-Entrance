import React from "react";
import mapValue from "../../../node_modules/adminjs/lib/frontend/components/property-type/datetime/map-value.js";
import SafeValueGroup from "./SafeValueGroup";

const DefaultDatetimeShowProperty = ({ property, record }) => {
  const value = mapValue(record.params[property.path], property.type);

  return <SafeValueGroup property={property}>{value}</SafeValueGroup>;
};

export default DefaultDatetimeShowProperty;
