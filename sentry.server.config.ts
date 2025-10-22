// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Only initialize Sentry if DSN is provided
const serverDSN = process.env.SENTRY_DSN;

if (serverDSN) {
  Sentry.init({
    dsn: serverDSN,

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

    // Enable logs to be sent to Sentry
    enableLogs: true,

    // Enable sending user PII (Personally Identifiable Information)
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
    sendDefaultPii: false,

    // Environment tag
    environment: process.env.NODE_ENV,

    // Attach stack trace
    attachStacktrace: true,
  });
} else {
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️ [SENTRY] Server DSN not configured. Sentry error tracking is disabled.');
  }
}
