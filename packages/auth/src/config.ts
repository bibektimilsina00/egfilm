import type { NextAuthConfig } from 'next-auth';

export interface AuthFactoryOptions {
    /**
     * The path for the sign-in page (default: '/login').
     */
    signInPage?: string;
    /**
     * Path prefixes that require an authenticated user. Anything not matching
     * is open. Default: `['/dashboard', '/watchlist', '/watch-party']`.
     */
    protectedPaths?: string[];
}

export function createAuthConfig(opts: AuthFactoryOptions = {}): NextAuthConfig {
    const signIn = opts.signInPage ?? '/login';
    const protectedPaths = opts.protectedPaths ?? ['/dashboard', '/watchlist', '/watch-party'];

    return {
        pages: { signIn },
        callbacks: {
            async jwt({ token, user }) {
                if (user) {
                    (token as unknown as Record<string, unknown>).role = (user as unknown as Record<string, unknown>).role;
                    (token as unknown as Record<string, unknown>).id = (user as unknown as Record<string, unknown>).id;
                }
                return token;
            },
            async session({ session, token }) {
                if (session.user) {
                    (session.user as unknown as Record<string, unknown>).role = (token as unknown as Record<string, unknown>).role;
                    (session.user as unknown as Record<string, unknown>).id = (token as unknown as Record<string, unknown>).id;
                }
                return session;
            },
            authorized({ auth, request: { nextUrl } }) {
                const isLoggedIn = !!auth?.user;
                const requiresAuth = protectedPaths.some((p) => nextUrl.pathname.startsWith(p));
                if (requiresAuth) return isLoggedIn;
                return true;
            },
        },
        providers: [],
    } satisfies NextAuthConfig;
}
