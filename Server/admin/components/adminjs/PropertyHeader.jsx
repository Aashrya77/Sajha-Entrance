import React, { memo, useMemo } from "react";
import { TableCell, Icon, cssClass } from "@adminjs/design-system";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "adminjs";
import { resolveAdminPropertyLabel } from "./translation-utils";

const SafeSortLink = (props) => {
  const {
    sortBy,
    property,
    direction,
  } = props;
  const location = useLocation();
  const { i18n, translateProperty } = useTranslation();
  const isActive = useMemo(
    () => sortBy === property.propertyPath,
    [sortBy, property]
  );
  const query = new URLSearchParams(location.search);
  const oppositeDirection = isActive && direction === "asc" ? "desc" : "asc";
  const sortedByIcon = direction === "asc" ? "ChevronUp" : "ChevronDown";

  query.set("direction", oppositeDirection);
  query.set("sortBy", property.propertyPath);

  return (
    <NavLink to={{ search: query.toString() }} className={cssClass("SortLink")}>
      {resolveAdminPropertyLabel({
        property,
        i18n,
        translateProperty,
      })}
      {isActive ? <Icon icon={sortedByIcon} color="grey40" ml="lg" /> : null}
    </NavLink>
  );
};

const PropertyHeader = (props) => {
  const {
    property,
    titleProperty,
    display,
  } = props;
  const { i18n, translateProperty } = useTranslation();
  const isMain = property.propertyPath === titleProperty.propertyPath;

  return (
    <TableCell className={isMain ? "main" : undefined} display={display}>
      {property.isSortable ? (
        <SafeSortLink {...props} />
      ) : (
        resolveAdminPropertyLabel({
          property,
          i18n,
          translateProperty,
        })
      )}
    </TableCell>
  );
};

const checkSortProps = (previousProps, nextProps) =>
  previousProps.direction === nextProps.direction &&
  previousProps.property.propertyPath === nextProps.property.propertyPath &&
  previousProps.sortBy === nextProps.sortBy &&
  previousProps.property.resourceId === nextProps.property.resourceId;

export default memo(PropertyHeader, checkSortProps);
