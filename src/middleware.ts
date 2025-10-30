import NextAuth from 'next-auth';
import { authConfig } from './lib/auth.config';
import type { NextRequest } from 'next/server';

const authMiddleware = NextAuth(authConfig).auth;

export default async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // No admin functionality in main app

    return authMiddleware(request as any);
}

export const config = {
    // Protect specific routes
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
