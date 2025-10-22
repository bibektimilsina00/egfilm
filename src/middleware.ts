import NextAuth from 'next-auth';
import { authConfig } from './lib/auth.config';
import type { NextRequest } from 'next/server';

const authMiddleware = NextAuth(authConfig).auth;

export default async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Log all admin route requests
    if (pathname.startsWith('/admin')) {
        console.log('[Middleware] Admin route requested:', pathname);
        console.log('[Middleware] User:', (request as any).auth?.user);
        console.log('[Middleware] User Role:', ((request as any).auth?.user)?.role);
    }

    return authMiddleware(request as any);
}

export const config = {
    // Protect specific routes
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
