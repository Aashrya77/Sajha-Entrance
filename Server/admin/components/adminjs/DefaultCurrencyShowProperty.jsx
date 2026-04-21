import React from "react";
import formatValue from "../../../node_modules/adminjs/lib/frontend/components/property-type/currency/format-value.js";
import SafeValueGroup from "./SafeValueGroup";

const DefaultCurrencyShowProperty = ({ property, record }) => {
  const value = `${record.params[property.path]}`;

  return (
    <SafeValueGroup property={property}>
      {formatValue(value, property.props)}
    </SafeValueGroup>
  );
};

export default DefaultCurrencyShowProperty;
