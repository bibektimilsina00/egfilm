import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
    outputFileTracingRoot: path.join(__dirname, '..', '..'),
    outputFileTracingIncludes: {
        '/**/*': [
            './node_modules/next/**/*',
            './node_modules/next/package.json',
            './node_modules/@next/**/*',
            './node_modules/.pnpm/next@*/**/*',
        ],
    },
    transpilePackages: [
        '@egfilm/db',
        '@egfilm/auth',
        '@egfilm/ui',
        '@egfilm/services',
        '@egfilm/realtime',
    ],
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'image.tmdb.org', pathname: '/t/p/**' },
            { protocol: 'https', hostname: '**' },
        ],
        formats: ['image/avif', 'image/webp'],
    },
    productionBrowserSourceMaps: false,
    reactStrictMode: true,
    output: 'standalone',
    poweredByHeader: false,
};

export default nextConfig;
