import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/t/p/**',
      },
    ],
    // Optimize images for better performance
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Add quality config for Next.js 16 compatibility
    qualities: [75, 85, 90, 95, 100],
    // Minimize image loads
    minimumCacheTTL: 31536000, // 1 year cache
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Enable standalone output for Docker
  output: 'standalone',
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    // Speed up webpack compilation
    webpackBuildWorker: true,
    // Optimize package imports
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Minimize production bundle
  productionBrowserSourceMaps: true,
  // React compiler for better performance
  reactStrictMode: true,
  // Optimize fonts
  optimizeFonts: true,
  // Reduce bundle size by removing unused code
  swcMinify: true,
  // Turbopack configuration (new location)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  // Compression and optimization
  compress: true,
  // Enhanced headers for SEO, security, and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Security Headers
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://cloud.umami.is https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https://image.tmdb.org https://www.google-analytics.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://api.themoviedb.org https://cloud.umami.is https://www.google-analytics.com https://*.umami.dev",
              "frame-src 'self' https://vidsrc.icu https://vidsrc.to https://vidsrc.me https://vidsrc.xyz https://2embed.org https://embed.su https://autoembed.to https://*.youtube.com https://youtube.com",
              "frame-ancestors 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "require-trusted-types-for 'script'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Permissions-Policy',
            value: 'interest-cohort=(), browsing-topics=()',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Robots-Tag',
            value: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
          },
          {
            key: 'Accept-CH',
            value: 'Viewport-Width, Width, DPR, Save-Data',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
      // Cache static assets
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache images and OG images
      {
        source: '/api/og/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200',
          },
        ],
      },
      // Cache sitemaps with shorter duration for freshness
      {
        source: '/sitemap-:path.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=43200, s-maxage=43200, stale-while-revalidate=21600',
          },
          {
            key: 'Content-Type',
            value: 'application/xml',
          },
        ],
      },
      // Cache main sitemap.xml
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=43200, s-maxage=43200, stale-while-revalidate=21600',
          },
          {
            key: 'Content-Type',
            value: 'application/xml',
          },
        ],
      },
      // Cache sitemap index
      {
        source: '/sitemap-index.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=43200, s-maxage=43200, stale-while-revalidate=21600',
          },
          {
            key: 'Content-Type',
            value: 'application/xml',
          },
        ],
      },
      // Cache robots.txt
      {
        source: '/robots.txt',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400',
          },
        ],
      },
    ];
  },

  // SEO-friendly redirects
  async redirects() {
    return [
      // Redirect old URLs to new structure (example redirects)
      {
        source: '/movies/:id',
        destination: '/movie/:id',
        permanent: true,
      },
      {
        source: '/shows/:id',
        destination: '/tv/:id',
        permanent: true,
      },
      {
        source: '/watch/:id',
        destination: '/movie/:id',
        permanent: true,
      },
      // Remove trailing slashes for consistency
      {
        source: '/:path+/',
        destination: '/:path+',
        permanent: true,
      },
      // Redirect common misspellings
      {
        source: '/moive/:path*',
        destination: '/movie/:path*',
        permanent: true,
      },
      {
        source: '/tvshow/:path*',
        destination: '/tv/:path*',
        permanent: true,
      },
    ];
  },

  // SEO-friendly rewrites
  async rewrites() {
    return [
      // Blog subdomain rewrite (if blog is on same server)
      {
        source: '/blog/:path*',
        destination: 'https://blog.egfilm.xyz/blog/:path*',
      },
    ];
  },
  // Webpack performance optimizations (only when not using Turbopack)
  webpack: (config, { dev, isServer }) => {
    // Skip Webpack config when using Turbopack
    if (process.env.TURBOPACK) {
      return config;
    }
    // Suppress unnecessary logging and warnings
    if (!isServer) {
      config.infrastructureLogging = {
        level: 'error', // Only show errors, hide warnings
      };
    } else {
      config.infrastructureLogging = {
        level: 'error',
      };
    }

    // Speed up builds with better caching (without buildDependencies to avoid warnings)
    config.cache = {
      type: 'filesystem',
    };

    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunks
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            // React and related libraries
            react: {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types)[\\/]/,
              chunks: 'all',
              priority: 30,
            },
          },
        },
      };
    }

    // Faster module resolution
    config.resolve = {
      ...config.resolve,
      symlinks: false,
    };

    return config;
  },
};

export default nextConfig;