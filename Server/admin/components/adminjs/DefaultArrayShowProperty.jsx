import React from "react";
import { Section } from "@adminjs/design-system";
import { flat } from "../../../node_modules/adminjs/lib/utils/index.js";
import { convertToSubProperty } from "../../../node_modules/adminjs/lib/frontend/components/property-type/array/convert-to-sub-property.js";
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
          const itemProperty = convertToSubProperty(property, index);

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
