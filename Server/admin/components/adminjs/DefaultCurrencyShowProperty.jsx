import React from "react";
import { formatAdminCurrencyValue } from "./adminjs-safe-helpers";
import SafeValueGroup from "./SafeValueGroup";

const DefaultCurrencyShowProperty = ({ property, record }) => {
  const value = `${record.params[property.path]}`;

  return (
    <SafeValueGroup property={property}>
      {formatAdminCurrencyValue(value, property.props)}
    </SafeValueGroup>
  );
};

export default DefaultCurrencyShowProperty;
