import NextAuth from 'next-auth';
import { authConfig } from './lib/auth.config';

export default NextAuth(authConfig).auth;

export const config = {
    // Protect specific routes
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
