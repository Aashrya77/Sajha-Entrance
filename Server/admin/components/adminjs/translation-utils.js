import startCase from "lodash/startCase";

const ARRAY_INDEX_LABEL_PATTERN = /^\[\d+\]$/;

const normalizeAdminTranslationValue = (value) =>
  value === undefined || value === null ? "" : String(value).trim();

const buildAdminTranslationKeys = (namespace, name, resourceId) => {
  const translationName = name === "" ? "" : normalizeAdminTranslationValue(name);
  const keys = [];

  if (resourceId && typeof resourceId === "string") {
    keys.push(`resources.${resourceId}.${namespace}.${translationName}`);
  }

  keys.push(`${namespace}.${translationName}`);
  return keys;
};

const hasAdminTranslation = (i18n, namespace, name, resourceId) =>
  Boolean(i18n) &&
  buildAdminTranslationKeys(namespace, name, resourceId).some((translationKey) =>
    i18n.exists(translationKey)
  );

const humanizeAdminLabel = (value = "") => {
  const normalizedValue = normalizeAdminTranslationValue(value);
  if (!normalizedValue) {
    return "";
  }

  return startCase(
    normalizedValue.replace(/\./g, " ").replace(/_/g, " ").replace(/-/g, " ")
  );
};

const resolveAdminPropertyLabel = ({ property, i18n, translateProperty }) => {
  const propertyLabel = normalizeAdminTranslationValue(property?.label);
  const propertyPath = normalizeAdminTranslationValue(
    property?.propertyPath || property?.path || property?.name
  );
  const translationKey = propertyLabel || propertyPath;

  if (!translationKey) {
    return "";
  }

  if (ARRAY_INDEX_LABEL_PATTERN.test(translationKey)) {
    return translationKey;
  }

  if (hasAdminTranslation(i18n, "properties", translationKey, property?.resourceId)) {
    return translateProperty(translationKey, property?.resourceId);
  }

  if (
    propertyPath &&
    propertyPath !== translationKey &&
    hasAdminTranslation(i18n, "properties", propertyPath, property?.resourceId)
  ) {
    return translateProperty(propertyPath, property?.resourceId);
  }

  if (propertyLabel && propertyLabel !== propertyPath) {
    return propertyLabel;
  }

  return humanizeAdminLabel(propertyPath || propertyLabel);
};

const resolveAdminMessage = ({ message, i18n, translateMessage, resourceId }) => {
  const rawMessage = message === undefined || message === null ? "" : String(message);
  const normalizedMessage = rawMessage.trim();

  if (!rawMessage && !normalizedMessage) {
    return "";
  }

  if (hasAdminTranslation(i18n, "messages", normalizedMessage, resourceId)) {
    return translateMessage(normalizedMessage, resourceId);
  }

  return normalizedMessage || rawMessage;
};

export {
  ARRAY_INDEX_LABEL_PATTERN,
  hasAdminTranslation,
  humanizeAdminLabel,
  resolveAdminMessage,
  resolveAdminPropertyLabel,
};
