import React from "react";
import ReferenceValue from "../../../node_modules/adminjs/lib/frontend/components/property-type/reference/reference-value.js";
import SafeValueGroup from "./SafeValueGroup";

const DefaultReferenceShowProperty = ({ property, record }) => (
  <SafeValueGroup property={property}>
    <ReferenceValue property={property} record={record} />
  </SafeValueGroup>
);

export default DefaultReferenceShowProperty;
