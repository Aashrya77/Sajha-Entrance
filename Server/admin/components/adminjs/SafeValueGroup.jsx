import React from "react";
import { ValueGroup } from "@adminjs/design-system";
import { useTranslation } from "adminjs";
import { resolveAdminPropertyLabel } from "./translation-utils";

const SafeValueGroup = ({ property, children }) => {
  const { i18n, translateProperty } = useTranslation();

  return (
    <ValueGroup
      label={resolveAdminPropertyLabel({
        property,
        i18n,
        translateProperty,
      })}
    >
      {children}
    </ValueGroup>
  );
};

export default SafeValueGroup;
