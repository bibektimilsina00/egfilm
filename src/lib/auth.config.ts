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
            const isOnAdmin = nextUrl.pathname.startsWith('/admin');

            // Debug logging for admin routes
            if (isOnAdmin) {
                console.log('[Auth Config] Admin route requested');
                console.log('[Auth Config] Is Logged In:', isLoggedIn);
                console.log('[Auth Config] User Role:', userRole);
                console.log('[Auth Config] Auth object:', auth);
                console.log('[Auth Config] Returning:', isLoggedIn);
            }

            // Admin routes: allow through if logged in (client-side layout will handle role check)
            // This prevents the middleware from redirecting to login when user is already logged in
            if (isOnAdmin) {
                return isLoggedIn; // Let client-side handle admin role check and redirect
            }

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
