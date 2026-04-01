const nodeEnv = process.env.NODE_ENV || "development";

const isProduction = nodeEnv === "production";
const isDevelopment = !isProduction;

const prefixMessage = (scope, args) => {
  if (!scope) {
    return args;
  }

  return [`[${scope}]`, ...args];
};

const createLogger = (scope = "") => ({
  info: (...args) => console.info(...prefixMessage(scope, args)),
  warn: (...args) => console.warn(...prefixMessage(scope, args)),
  error: (...args) => console.error(...prefixMessage(scope, args)),
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...prefixMessage(scope, args));
    }
  },
});

export { createLogger, isDevelopment, isProduction };
