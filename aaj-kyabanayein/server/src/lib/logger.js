const isProd = process.env.NODE_ENV === "production";

export const logger = {
  info(...args) {
    console.log(...args);
  },
  warn(...args) {
    console.warn(...args);
  },
  error(...args) {
    console.error(...args);
  },
  debug(...args) {
    if (!isProd) console.debug(...args);
  },
};
