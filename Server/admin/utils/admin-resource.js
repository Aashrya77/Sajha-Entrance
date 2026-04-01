import { hasPermission } from "./admin-auth.js";
import { createAuditAfterHook } from "./admin-audit.js";

const toArray = (value) => {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

const combineGuards = (existingGuard, nextGuard) => async (context) => {
  const existingResult =
    typeof existingGuard === "function"
      ? await existingGuard(context)
      : existingGuard === undefined
        ? true
        : existingGuard;

  const nextResult =
    typeof nextGuard === "function"
      ? await nextGuard(context)
      : nextGuard === undefined
        ? true
        : nextGuard;

  return Boolean(existingResult && nextResult);
};

const mergeAction = (existingAction = {}, additions = {}) => ({
  ...existingAction,
  ...additions,
  before: [...toArray(existingAction.before), ...toArray(additions.before)],
  after: [...toArray(existingAction.after), ...toArray(additions.after)],
  isAccessible: combineGuards(existingAction.isAccessible, additions.isAccessible),
});

const normalizeResource = (resource) =>
  resource?.resource
    ? {
        ...resource,
        options: {
          ...(resource.options || {}),
        },
      }
    : {
        resource,
        options: {},
      };

const resourceIdOf = (resourceEntry) =>
  resourceEntry.options?.id ||
  resourceEntry.resource?.modelName ||
  resourceEntry.resource?.name ||
  "Resource";

const guardForAction = (actionName, manageUsersOnly = false) => ({ currentAdmin }) => {
  if (!currentAdmin) {
    return false;
  }

  if (manageUsersOnly) {
    return hasPermission(currentAdmin, "manageUsers");
  }

  if (actionName === "list" || actionName === "show" || actionName === "search") {
    return hasPermission(currentAdmin, "read");
  }

  if (actionName === "new" || actionName === "edit") {
    return hasPermission(currentAdmin, "write");
  }

  if (actionName === "delete" || actionName === "bulkDelete") {
    return hasPermission(currentAdmin, "delete");
  }

  return hasPermission(currentAdmin, "read");
};

const decorateAdminResource = (resource, config = {}) => {
  const normalizedResource = normalizeResource(resource);
  const resourceId = resourceIdOf(normalizedResource);
  const actions = { ...(normalizedResource.options.actions || {}) };
  const manageUsersOnly = Boolean(config.manageUsersOnly);
  const readOnly = Boolean(config.readOnly);
  const auditEnabled = config.audit !== false;

  ["list", "show", "search", "new", "edit", "delete", "bulkDelete"].forEach((actionName) => {
    if (readOnly && ["new", "edit", "delete", "bulkDelete"].includes(actionName)) {
      actions[actionName] = mergeAction(actions[actionName], {
        isAccessible: () => false,
      });
      return;
    }

    const additions = {
      isAccessible: guardForAction(actionName, manageUsersOnly),
    };

    if (auditEnabled && ["new", "edit", "delete"].includes(actionName)) {
      additions.after = [createAuditAfterHook(actionName, resourceId)];
    }

    actions[actionName] = mergeAction(actions[actionName], additions);
  });

  normalizedResource.options.actions = actions;
  return normalizedResource;
};

export { decorateAdminResource, resourceIdOf };
