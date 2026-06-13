import { createAuthMiddleware } from '@egfilm/auth/middleware';

export default createAuthMiddleware({
    signInPage: '/login',
    protectedPaths: ['/favorites'],
});

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
