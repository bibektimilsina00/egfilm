import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            // Add role and id to JWT token on sign in (for middleware)
            if (user) {
                token.role = (user as any).role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            // Add role and id to session from JWT token (for middleware)
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const userRole = (auth?.user as any)?.role;

            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            const isOnWatchlist = nextUrl.pathname.startsWith('/watchlist');
            const isOnWatchParty = nextUrl.pathname.startsWith('/watch-party');
            // No admin functionality in main app

            // Protected routes require login
            if (isOnDashboard || isOnWatchlist || isOnWatchParty) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                return true;
            }

            return true;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
