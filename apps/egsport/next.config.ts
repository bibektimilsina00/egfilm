import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
    outputFileTracingRoot: path.join(__dirname, '..', '..'),
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
