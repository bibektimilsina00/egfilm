// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Only initialize Sentry if DSN is provided
const edgeDSN = process.env.SENTRY_DSN;

if (edgeDSN) {
  Sentry.init({
    dsn: edgeDSN,

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
    console.log('⚠️ [SENTRY] Edge DSN not configured. Sentry error tracking is disabled.');
  }
}
