import NextAuth from 'next-auth';
import { authConfig } from './lib/auth.config';
import { NextResponse } from 'next/server';

const authMiddleware = NextAuth(authConfig).auth;

export default async function middleware(request: any) {
    const pathname = request.nextUrl.pathname;

    // Log all admin route requests
    if (pathname.startsWith('/admin')) {
        console.log('[Middleware] Admin route requested:', pathname);
        console.log('[Middleware] User:', request.auth?.user);
        console.log('[Middleware] User Role:', (request.auth?.user as any)?.role);
    }

    return authMiddleware(request);
}

export const config = {
    // Protect specific routes
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
