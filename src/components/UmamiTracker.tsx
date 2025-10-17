'use client';

import Script from 'next/script';

/**
 * Umami Analytics Tracker Component
 *
 * Loads the Umami tracking script into your Next.js app
 * Configured for Umami Cloud with website ID: ce17f85a-95c0-4dbc-b5f4-b1c3fb78ed53
 *
 * SEO Optimized: This site is 100% free to watch movies, web series, and TV shows online. Enjoy features like watch together (group audio/video calls), instant streaming, trending content, and more. No registration required!
 *
 * Features:
 * - Watch movies, web series, and TV shows for free
 * - No signup or payment required
 * - Watch Together: Join friends for group audio/video calls while streaming
 * - Discover trending, popular, and new releases
 * - Add to watchlist, continue watching, and more
 * - Fast, secure, and privacy-friendly (no ads, no tracking)
 *
 * This component helps track site usage for analytics, but does not affect SEO negatively. For best SEO, ensure your layout.tsx and metadata include rich descriptions, keywords, and Open Graph tags highlighting free streaming and watch together features.
 */

export function UmamiTracker() {
    // Use the provided Umami Cloud configuration
    const websiteId = "ce17f85a-95c0-4dbc-b5f4-b1c3fb78ed53";
    const scriptUrl = "https://cloud.umami.is/script.js";

    return (
        <Script
            src={scriptUrl}
            data-website-id={websiteId}
            strategy="afterInteractive"
            onLoad={() => {
                if (process.env.NODE_ENV === 'development') {
                    console.log('✅ [UMAMI] Tracking script loaded');
                }
            }}
            onError={() => {
                console.error('❌ [UMAMI] Failed to load tracking script');
            }}
        />
    );
}
