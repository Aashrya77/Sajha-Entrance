const MIN_PRODUCTION_SECRET_BYTES = 32;

export const getJwtSecret = () =>
  process.env.JWT_SECRET || "local-development-only-jwt-secret";
export const getSessionSecret = () =>
  process.env.SESSION_SECRET || "local-development-only-session-secret";

export const assertProductionSecuritySecrets = (env = process.env) => {
  if (env.NODE_ENV !== "production") {
    return;
  }

  const invalidSecrets = ["JWT_SECRET", "SESSION_SECRET"].filter(
    (name) => Buffer.byteLength(env[name] || "", "utf8") < MIN_PRODUCTION_SECRET_BYTES
  );

  if (invalidSecrets.length > 0) {
    throw new Error(
      `Production requires strong secrets (at least ${MIN_PRODUCTION_SECRET_BYTES} bytes): ${invalidSecrets.join(", ")}`
    );
  }
};