import { rateLimit } from "express-rate-limit";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeEmailKey = (value = "") =>
  String(value || "").trim().toLowerCase();

const buildRateLimitResponse = (message) => (_req, res, _next, options) =>
  res.status(options.statusCode).json({
    success: false,
    code: "RATE_LIMITED",
    error: message,
  });

const createLimiter = ({
  message = "Too many requests. Please try again later.",
  ...options
}) =>
  rateLimit({
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: buildRateLimitResponse(message),
    ...options,
  });

const createEmailLimiter = ({
  keyPrefix,
  windowMs,
  limit,
  message,
  skipSuccessfulRequests = false,
}) =>
  createLimiter({
    windowMs,
    limit,
    skipSuccessfulRequests,
    skip: (req) => !normalizeEmailKey(req.body?.email),
    keyGenerator: (req) => `${keyPrefix}:${normalizeEmailKey(req.body?.email)}`,
    message,
  });

export const rateLimitDefaults = {
  globalWindowMs: parsePositiveInteger(
    process.env.GLOBAL_API_RATE_LIMIT_WINDOW_MS,
    FIFTEEN_MINUTES_MS
  ),
  globalLimit: parsePositiveInteger(process.env.GLOBAL_API_RATE_LIMIT_MAX, 300),
  registerIpWindowMs: FIFTEEN_MINUTES_MS,
  registerIpLimit: 3,
  registerEmailWindowMs: ONE_HOUR_MS,
  registerEmailLimit: 3,
  loginIpWindowMs: FIFTEEN_MINUTES_MS,
  loginIpLimit: 20,
  loginEmailWindowMs: FIFTEEN_MINUTES_MS,
  loginEmailLimit: 10,
  firebaseLoginWindowMs: FIFTEEN_MINUTES_MS,
  firebaseLoginLimit: 10,
  forgotPasswordIpWindowMs: FIFTEEN_MINUTES_MS,
  forgotPasswordIpLimit: 5,
  forgotPasswordEmailWindowMs: ONE_HOUR_MS,
  forgotPasswordEmailLimit: 3,
  resetPasswordWindowMs: FIFTEEN_MINUTES_MS,
  resetPasswordLimit: 10,
};

// TODO: The default in-memory store is acceptable only for the current
// single-process deployment. Replace it with Redis or another shared store
// before horizontal scaling or running multiple Node.js instances.
export const createGlobalApiLimiter = (overrides = {}) =>
  createLimiter({
    windowMs: rateLimitDefaults.globalWindowMs,
    limit: rateLimitDefaults.globalLimit,
    message: "Too many API requests. Please try again later.",
    ...overrides,
  });

export const createAuthRateLimiters = (overrides = {}) => {
  const config = { ...rateLimitDefaults, ...overrides };

  return {
    registerIpLimiter: createLimiter({
      windowMs: config.registerIpWindowMs,
      limit: config.registerIpLimit,
      message: "Too many registration attempts. Please try again later.",
    }),
    registerEmailLimiter: createEmailLimiter({
      keyPrefix: "student-register-email",
      windowMs: config.registerEmailWindowMs,
      limit: config.registerEmailLimit,
      message: "Too many registration attempts. Please try again later.",
    }),
    loginIpLimiter: createLimiter({
      windowMs: config.loginIpWindowMs,
      limit: config.loginIpLimit,
      skipSuccessfulRequests: true,
      message: "Too many login attempts. Please try again later.",
    }),
    loginEmailLimiter: createEmailLimiter({
      keyPrefix: "student-login-email",
      windowMs: config.loginEmailWindowMs,
      limit: config.loginEmailLimit,
      skipSuccessfulRequests: true,
      message: "Too many login attempts. Please try again later.",
    }),
    firebaseLoginLimiter: createLimiter({
      windowMs: config.firebaseLoginWindowMs,
      limit: config.firebaseLoginLimit,
      message: "Too many Firebase login attempts. Please try again later.",
    }),
    forgotPasswordIpLimiter: createLimiter({
      windowMs: config.forgotPasswordIpWindowMs,
      limit: config.forgotPasswordIpLimit,
      message: "Too many password reset requests. Please try again later.",
    }),
    forgotPasswordEmailLimiter: createEmailLimiter({
      keyPrefix: "student-forgot-password-email",
      windowMs: config.forgotPasswordEmailWindowMs,
      limit: config.forgotPasswordEmailLimit,
      message: "Too many password reset requests. Please try again later.",
    }),
    resetPasswordLimiter: createLimiter({
      windowMs: config.resetPasswordWindowMs,
      limit: config.resetPasswordLimit,
      message: "Too many password reset attempts. Please try again later.",
    }),
  };
};

export const globalApiLimiter = createGlobalApiLimiter();

export const {
  registerIpLimiter,
  registerEmailLimiter,
  loginIpLimiter,
  loginEmailLimiter,
  firebaseLoginLimiter,
  forgotPasswordIpLimiter,
  forgotPasswordEmailLimiter,
  resetPasswordLimiter,
} = createAuthRateLimiters();
