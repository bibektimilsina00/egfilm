import NextAuth from 'next-auth';
import { createAuthConfig, type AuthFactoryOptions } from './config';

export function createAuthMiddleware(opts: AuthFactoryOptions = {}) {
    const { auth } = NextAuth(createAuthConfig(opts));
    return auth;
}

export const defaultMatcher = ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'];
