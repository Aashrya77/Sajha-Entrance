import React from "react";
import BooleanPropertyValue from "../../../node_modules/adminjs/lib/frontend/components/property-type/boolean/boolean-property-value.js";
import SafeValueGroup from "./SafeValueGroup";

const DefaultBooleanShowProperty = (props) => (
  <SafeValueGroup property={props.property}>
    <BooleanPropertyValue {...props} />
  </SafeValueGroup>
);

export default DefaultBooleanShowProperty;
