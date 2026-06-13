import { createAuthMiddleware } from '@egfilm/auth/middleware';

export default createAuthMiddleware({
    signInPage: '/login',
    protectedPaths: ['/watchlist', '/watch-together'],
    cookieDomain: process.env.AUTH_COOKIE_DOMAIN,
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
