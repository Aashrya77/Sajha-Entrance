import React from "react";
import { Box, Text } from "@adminjs/design-system";
import xss from "xss";
import SafeValueGroup from "./SafeValueGroup";

const createMarkup = (html) => ({
  __html: xss(html),
});

const DefaultRichtextShowProperty = ({ property, record }) => {
  const value = record.params[property.path] || "";

  return (
    <SafeValueGroup property={property}>
      <Box py="xl" px={["0", "xl"]} border="default">
        <Text dangerouslySetInnerHTML={createMarkup(value)} />
      </Box>
    </SafeValueGroup>
  );
};

export default DefaultRichtextShowProperty;
