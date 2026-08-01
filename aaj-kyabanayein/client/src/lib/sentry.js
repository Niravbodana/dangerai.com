import * as Sentry from "@sentry/react";

const dsn = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1,
    sendDefaultPii: false,
  });
}

export function captureException(error, context) {
  if (!dsn) return;
  Sentry.captureException(error, context);
}

export { Sentry };
