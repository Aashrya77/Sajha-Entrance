import React from "react";
import { AdminReferenceValue } from "./adminjs-safe-helpers";
import SafeValueGroup from "./SafeValueGroup";

const DefaultReferenceShowProperty = ({ property, record }) => (
  <SafeValueGroup property={property}>
    <AdminReferenceValue property={property} record={record} />
  </SafeValueGroup>
);

export default DefaultReferenceShowProperty;
