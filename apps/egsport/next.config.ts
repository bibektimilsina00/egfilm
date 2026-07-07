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
            './node_modules/styled-jsx/**/*',
            './node_modules/styled-jsx/package.json',
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
            { protocol: 'https', hostname: 'api.sportsrc.org', pathname: '/**' },
            { protocol: 'https', hostname: 'sportsrc.org', pathname: '/**' },
            { protocol: 'https', hostname: 'streamed.pk', pathname: '/**' },
            { protocol: 'https', hostname: 'streamed.st', pathname: '/**' },
            { protocol: 'https', hostname: 'media.api-sports.io', pathname: '/**' },
            { protocol: 'https', hostname: 'flagcdn.com', pathname: '/**' },
        ],
        formats: ['image/avif', 'image/webp'],
    },
    productionBrowserSourceMaps: false,
    reactStrictMode: true,
    output: 'standalone',
    poweredByHeader: false,
};

export default nextConfig;
