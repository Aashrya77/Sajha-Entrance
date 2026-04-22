import React from "react";
import { AdminBooleanPropertyValue } from "./adminjs-safe-helpers";
import SafeValueGroup from "./SafeValueGroup";

const DefaultBooleanShowProperty = (props) => (
  <SafeValueGroup property={props.property}>
    <AdminBooleanPropertyValue {...props} />
  </SafeValueGroup>
);

export default DefaultBooleanShowProperty;
