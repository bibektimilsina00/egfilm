import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './lib/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req: NextRequest) => {
    const { nextUrl } = req;

    // 1. Redirect HTTP to HTTPS in production
    const isProduction = process.env.NODE_ENV === 'production';
    const xForwardedProto = req.headers.get('x-forwarded-proto');

    if (isProduction && xForwardedProto === 'http') {
        return NextResponse.redirect(
            `https://${req.headers.get('host')}${nextUrl.pathname}${nextUrl.search}`,
            301
        );
    }

    return NextResponse.next();
});

export const config = {
    // Protect specific routes and apply to all pages for protocol check
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
