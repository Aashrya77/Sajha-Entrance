import React from "react";
import { AdminDefaultPropertyValue } from "./adminjs-safe-helpers";
import SafeValueGroup from "./SafeValueGroup";

const DefaultPhoneShowProperty = (props) => (
  <SafeValueGroup property={props.property}>
    <AdminDefaultPropertyValue {...props} />
  </SafeValueGroup>
);

export default DefaultPhoneShowProperty;
