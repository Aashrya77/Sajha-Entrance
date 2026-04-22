import React from "react";
import { Section } from "@adminjs/design-system";
import { flat } from "adminjs";
import { convertArraySubProperty } from "./adminjs-safe-helpers";
import SafeValueGroup from "./SafeValueGroup";

const DefaultArrayShowProperty = (props) => {
  const {
    property,
    record,
    ItemComponent,
  } = props;
  const items = flat.get(record.params, property.path) || [];

  return (
    <SafeValueGroup property={property}>
      <Section>
        {(items || []).map((item, index) => {
          const itemProperty = convertArraySubProperty(property, index);

          return (
            <ItemComponent
              {...props}
              key={itemProperty.path}
              property={itemProperty}
            />
          );
        })}
      </Section>
    </SafeValueGroup>
  );
};

export default DefaultArrayShowProperty;
