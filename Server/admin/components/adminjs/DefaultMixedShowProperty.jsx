import React from "react";
import { Section } from "@adminjs/design-system";
import { convertMixedSubProperty } from "./adminjs-safe-helpers";
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
            const subPropertyWithPath = convertMixedSubProperty(property, subProperty);

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
