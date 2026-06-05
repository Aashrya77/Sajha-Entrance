import { zoomRecordingEnv } from "./zoomRecordingEnv.js";

const normalizeRule = (category, terms) => {
  const normalizedTerms = Array.isArray(terms) ? terms : String(terms).split("|");

  return {
    category: String(category || "").trim(),
    terms: normalizedTerms
      .map((term) => String(term || "").trim().toLowerCase())
      .filter(Boolean),
  };
};

export const parseZoomRecordingCategoryRules = (rawRules = zoomRecordingEnv.categoryRules) => {
  const rules = String(rawRules || "").trim();

  if (!rules) {
    return [];
  }

  try {
    const parsed = JSON.parse(rules);

    if (Array.isArray(parsed)) {
      return parsed
        .map((rule) => normalizeRule(rule.category, rule.terms ?? rule.keywords ?? []))
        .filter((rule) => rule.category && rule.terms.length > 0);
    }

    return Object.entries(parsed)
      .map(([category, terms]) => normalizeRule(category, terms))
      .filter((rule) => rule.category && rule.terms.length > 0);
  } catch (_error) {
    return rules
      .split(";")
      .map((entry) => {
        const [category, terms = ""] = entry.split(":");
        return normalizeRule(category, terms);
      })
      .filter((rule) => rule.category && rule.terms.length > 0);
  }
};

export const resolveZoomRecordingCategory = (
  title,
  rules = parseZoomRecordingCategoryRules()
) => {
  const normalizedTitle = String(title || "").toLowerCase();
  const match = rules.find((rule) =>
    rule.terms.some((term) => normalizedTitle.includes(term))
  );

  return match?.category || zoomRecordingEnv.defaultCategory;
};
