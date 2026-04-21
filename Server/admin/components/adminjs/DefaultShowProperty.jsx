import React from "react";
import DefaultPropertyValue from "../../../node_modules/adminjs/lib/frontend/components/property-type/default-type/default-property-value.js";
import SafeValueGroup from "./SafeValueGroup";

const DefaultShowProperty = (props) => (
  <SafeValueGroup property={props.property}>
    <DefaultPropertyValue {...props} />
  </SafeValueGroup>
);

export default DefaultShowProperty;
