import NextAuth from 'next-auth';
import { authConfig } from './lib/auth.config';

// Main app has no admin functionality - minimal middleware
export default NextAuth(authConfig).auth;

export const config = {
    // Protect specific routes
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
