import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN;

export function initSentry() {
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
    sendDefaultPii: false,
  });
}

export function captureException(error, context) {
  if (!dsn) return;
  Sentry.captureException(error, context);
}

export { Sentry };
