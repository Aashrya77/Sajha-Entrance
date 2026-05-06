const trimTrailingSlashes = (value = "") => String(value || "").replace(/\/+$/g, "");

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

const normalizeHostname = (hostname = "") =>
  String(hostname || "")
    .trim()
    .replace(/^\[|\]$/g, "")
    .toLowerCase();

const isLocalHostname = (hostname = "") => {
  const normalizedHostname = normalizeHostname(hostname);
  return LOCAL_HOSTNAMES.has(normalizedHostname) || normalizedHostname.endsWith(".local");
};

const parseAbsoluteUrl = (value = "") => {
  const normalizedValue = trimTrailingSlashes(value);

  if (!normalizedValue) {
    return null;
  }

  try {
    return new URL(normalizedValue);
  } catch (_error) {
    return null;
  }
};

const resolveRequestOrigin = (req) =>
  trimTrailingSlashes(`${req.protocol}://${req.get("host")}`);

const resolveConfiguredPublicUrl = (configuredUrl = "", fallbackUrl = "") => {
  const normalizedConfiguredUrl = trimTrailingSlashes(configuredUrl);
  const normalizedFallbackUrl = trimTrailingSlashes(fallbackUrl);

  if (!normalizedConfiguredUrl) {
    return normalizedFallbackUrl;
  }

  const configuredUrlObject = parseAbsoluteUrl(normalizedConfiguredUrl);
  const fallbackUrlObject = parseAbsoluteUrl(normalizedFallbackUrl);

  if (
    configuredUrlObject &&
    fallbackUrlObject &&
    isLocalHostname(configuredUrlObject.hostname) &&
    !isLocalHostname(fallbackUrlObject.hostname)
  ) {
    return normalizedFallbackUrl;
  }

  return configuredUrlObject
    ? trimTrailingSlashes(configuredUrlObject.toString())
    : normalizedConfiguredUrl;
};

const resolvePublicBackendUrl = (req) =>
  resolveConfiguredPublicUrl(process.env.BACKEND_URL, resolveRequestOrigin(req));

const resolvePublicFrontendUrl = (req) => {
  const requestOrigin = trimTrailingSlashes(
    req.get("origin") || resolveRequestOrigin(req)
  );

  return resolveConfiguredPublicUrl(
    process.env.FRONTEND_URL || process.env.CLIENT_URL,
    requestOrigin
  );
};

export {
  isLocalHostname,
  resolveConfiguredPublicUrl,
  resolvePublicBackendUrl,
  resolvePublicFrontendUrl,
  resolveRequestOrigin,
  trimTrailingSlashes,
};
