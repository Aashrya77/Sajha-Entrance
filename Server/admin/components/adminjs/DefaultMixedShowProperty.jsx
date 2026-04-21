import React from "react";
import { Section } from "@adminjs/design-system";
import { convertToSubProperty } from "../../../node_modules/adminjs/lib/frontend/components/property-type/mixed/convert-to-sub-property.js";
import SafeValueGroup from "./SafeValueGroup";

const DefaultMixedShowProperty = (props) => {
  const {
    property,
    ItemComponent,
  } = props;

  return (
    <SafeValueGroup property={property}>
      <Section>
        {property.subProperties
          .filter((subProperty) => !subProperty.isId)
          .map((subProperty) => {
            const subPropertyWithPath = convertToSubProperty(property, subProperty);

            return (
              <ItemComponent
                {...props}
                key={subPropertyWithPath.path}
                property={subPropertyWithPath}
              />
            );
          })}
      </Section>
    </SafeValueGroup>
  );
};

export default DefaultMixedShowProperty;
