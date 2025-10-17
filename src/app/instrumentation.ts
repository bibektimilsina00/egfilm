import * as Sentry from "@sentry/nextjs";

export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        await Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || "development",
            tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
            debug: process.env.NODE_ENV !== "production",
            integrations: [
                new Sentry.Integrations.OnUncaughtException(),
                new Sentry.Integrations.OnUnhandledRejection(),
            ],
        });
    }

    if (process.env.NEXT_RUNTIME === "edge") {
        await Sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV || "development",
            tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
            debug: process.env.NODE_ENV !== "production",
        });
    }
}
