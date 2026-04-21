import React from "react";
import SafeValueGroup from "./SafeValueGroup";

const DefaultTextareaShowProperty = ({ property, record }) => {
  const value = record.params[property.path] || "";

  return (
    <SafeValueGroup property={property}>
      {value.split(/(?:\r\n|\r|\n)/g).map((line, index) => (
        <React.Fragment key={index}>
          {line}
          <br />
        </React.Fragment>
      ))}
    </SafeValueGroup>
  );
};

export default DefaultTextareaShowProperty;
