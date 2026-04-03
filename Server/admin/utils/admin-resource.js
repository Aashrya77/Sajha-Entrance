import {
  ADMINJS_ACTION_PERMISSION_MAP,
  getAdminResourceAccessConfig,
} from "../constants/permissions.js";
import { hasPermission } from "./admin-auth.js";
import { createAuditAfterHook } from "./admin-audit.js";

const toArray = (value) => {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

const resolveSyncGuard = (guard, context) => {
  const result =
    typeof guard === "function"
      ? guard(context)
      : guard === undefined
        ? true
        : guard;

  if (result && typeof result.then === "function") {
    console.error(
      "[AdminJS RBAC] Async action guard detected. AdminJS expects synchronous guards, so access was denied by default."
    );
    return false;
  }

  return Boolean(result);
};

const combineGuards = (existingGuard, nextGuard) => (context) =>
  resolveSyncGuard(existingGuard, context) && resolveSyncGuard(nextGuard, context);

const mergeAction = (existingAction = {}, additions = {}) => ({
  ...existingAction,
  ...additions,
  before: [...toArray(existingAction.before), ...toArray(additions.before)],
  after: [...toArray(existingAction.after), ...toArray(additions.after)],
  isAccessible: combineGuards(existingAction.isAccessible, additions.isAccessible),
  isVisible: combineGuards(existingAction.isVisible, additions.isVisible),
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

const resolvePermissionAction = (actionName, resourceAccessConfig) =>
  resourceAccessConfig.customActionPermissions?.[actionName] ||
  ADMINJS_ACTION_PERMISSION_MAP[actionName] ||
  "view";

const isMutatingPermissionAction = (permissionAction) =>
  ["add", "edit", "delete"].includes(permissionAction);

const buildActionGuard = (actionName, resourceAccessConfig) => ({ currentAdmin }) => {
  if (!currentAdmin) {
    return false;
  }

  const permissionAction = resolvePermissionAction(actionName, resourceAccessConfig);

  if (resourceAccessConfig.readOnly && isMutatingPermissionAction(permissionAction)) {
    return false;
  }

  if (
    resourceAccessConfig.superAdminOnlyActions?.includes(actionName) &&
    currentAdmin.role !== "super_admin"
  ) {
    return false;
  }

  if (!resourceAccessConfig.permissionResource) {
    return true;
  }

  return hasPermission(currentAdmin, resourceAccessConfig.permissionResource, permissionAction);
};

const decorateAdminResource = (resource, config = {}) => {
  const normalizedResource = normalizeResource(resource);
  const resourceId = resourceIdOf(normalizedResource);
  const resourceAccessConfig = {
    ...(getAdminResourceAccessConfig(resourceId) || {}),
    ...config,
  };
  const actions = { ...(normalizedResource.options.actions || {}) };
  const auditEnabled = resourceAccessConfig.audit !== false;
  const actionNames = new Set([
    "list",
    "show",
    "search",
    "new",
    "edit",
    "delete",
    "bulkDelete",
    ...Object.keys(actions),
    ...Object.keys(resourceAccessConfig.customActionPermissions || {}),
  ]);

  actionNames.forEach((actionName) => {
    const permissionAction = resolvePermissionAction(actionName, resourceAccessConfig);
    const guard = buildActionGuard(actionName, resourceAccessConfig);
    const additions = {
      isAccessible: guard,
      isVisible: guard,
    };

    if (auditEnabled && isMutatingPermissionAction(permissionAction) && ["new", "edit", "delete"].includes(actionName)) {
      additions.after = [createAuditAfterHook(actionName, resourceId)];
    }

    actions[actionName] = mergeAction(actions[actionName], additions);
  });

  normalizedResource.options.actions = actions;
  return normalizedResource;
};

export { decorateAdminResource, resourceIdOf };
