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
        // iptv-org channel logos are served from arbitrary third-party hosts.
        // We render them with plain <img>, but allow https remotePatterns broadly
        // in case next/image is used anywhere.
        remotePatterns: [{ protocol: 'https', hostname: '**' }],
        formats: ['image/avif', 'image/webp'],
    },
    productionBrowserSourceMaps: false,
    reactStrictMode: true,
    output: 'standalone',
    poweredByHeader: false,
};

export default nextConfig;
