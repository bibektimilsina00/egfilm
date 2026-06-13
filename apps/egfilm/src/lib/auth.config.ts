import { createAuthConfig } from '@egfilm/auth/config';

export const authConfig = createAuthConfig({
    signInPage: '/login',
    protectedPaths: ['/dashboard', '/watchlist', '/watch-party'],
    cookieDomain: process.env.AUTH_COOKIE_DOMAIN,
});
