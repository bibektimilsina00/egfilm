// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Only initialize Sentry if DSN is provided via environment variable
const clientDSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (clientDSN) {
  Sentry.init({
    dsn: clientDSN,

    // Add optional integrations for additional features
    integrations: [
      Sentry.replayIntegration(),
      Sentry.httpClientIntegration(),
    ],

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

    // Enable logs to be sent to Sentry
    enableLogs: true,

    // Define how likely Replay events are sampled.
    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.5,

    // Define how likely Replay events are sampled when an error occurs.
    replaysOnErrorSampleRate: 1.0,

    // Enable sending user PII (Personally Identifiable Information)
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
    sendDefaultPii: false, // Set to false for privacy in production

    // Environment tag for better organization
    environment: process.env.NODE_ENV,

    // Attach stack trace to errors
    attachStacktrace: true,
  });
} else {
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️ [SENTRY] Client DSN not configured. Sentry error tracking is disabled.');
  }
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;