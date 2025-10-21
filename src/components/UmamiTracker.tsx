'use client';

import Script from 'next/script';
import { useEffect } from 'react';

/**
 * Umami Analytics Tracker Component
 *
 * Loads the Umami tracking script into your Next.js app
 * Configured for Umami Cloud with website ID: ce17f85a-95c0-4dbc-b5f4-b1c3fb78ed53
 *
 * Provides comprehensive analytics tracking for all pages and user interactions
 */

export function UmamiTracker() {
    const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || "ce17f85a-95c0-4dbc-b5f4-b1c3fb78ed53";
    const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || "https://cloud.umami.is/script.js";

    useEffect(() => {
        // Verify Umami is loaded and tracking
        if (typeof window !== 'undefined' && (window as any).umami) {
            if (process.env.NODE_ENV === 'development') {
                console.log('✅ [UMAMI] Tracker initialized and ready');
            }
        }
    }, []);

    // Only load if both website ID and script URL are configured
    if (!websiteId || !scriptUrl) {
        if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ [UMAMI] Configuration incomplete - tracking disabled');
        }
        return null;
    }

    return (
        <>
            <Script
                src={scriptUrl}
                data-website-id={websiteId}
                strategy="afterInteractive"
                async
                defer
                onLoad={() => {
                    if (process.env.NODE_ENV === 'development') {
                        console.log('✅ [UMAMI] Tracking script loaded successfully');
                    }
                }}
                onError={(error) => {
                    console.error('❌ [UMAMI] Failed to load tracking script:', error);
                }}
            />
        </>
    );
}
