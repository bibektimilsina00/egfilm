'use client';

import * as Sentry from '@sentry/nextjs';

export function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    // Report error to Sentry
    if (error) {
        Sentry.captureException(error, {
            contexts: {
                react: {
                    componentStack: error.stack,
                },
            },
        });
    }

    return (
        <html>
            <body>
                <div
                    style={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#000',
                        color: '#fff',
                        fontFamily: 'system-ui',
                        padding: '20px',
                    }}
                >
                    <div style={{ textAlign: 'center', maxWidth: '600px' }}>
                        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                            ⚠️ Something went wrong!
                        </h1>
                        <p style={{ fontSize: '1rem', marginBottom: '2rem', color: '#aaa' }}>
                            An unexpected error occurred. Our team has been notified and will
                            investigate.
                        </p>
                        {error?.digest && (
                            <p
                                style={{
                                    fontSize: '0.875rem',
                                    color: '#666',
                                    marginBottom: '2rem',
                                    fontFamily: 'monospace',
                                }}
                            >
                                Error ID: {error.digest}
                            </p>
                        )}
                        <button
                            onClick={() => reset()}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#007bff',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                            }}
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
