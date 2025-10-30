'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Umami Analytics Tracker Component
 *
 * Loads the Umami tracking script and automatically tracks:
 * - Initial page load
 * - Client-side route changes (App Router navigation)
 * - Custom events via window.umami
 *
 * Configured for Umami Cloud with website ID from env or fallback
 */

export function UmamiTracker() {
    const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || "ce17f85a-95c0-4dbc-b5f4-b1c3fb78ed53";
    const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || "https://cloud.umami.is/script.js";
    
    const pathname = usePathname();

    // Track initial load and route changes
    useEffect(() => {
        if (typeof window !== 'undefined' && window.umami) {
            // Get current URL with query params from window.location
            const url = window.location.pathname + window.location.search;
            
            // Track page view
            window.umami.track(url);
            
            if (process.env.NODE_ENV === 'development') {
                console.log('✅ [UMAMI] Page view tracked:', url);
            }
        }
    }, [pathname]);

    // Verify Umami is loaded
    useEffect(() => {
        const checkUmami = () => {
            if (typeof window !== 'undefined' && window.umami) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('✅ [UMAMI] Tracker initialized and ready');
                }
                return true;
            }
            return false;
        };

        // Check immediately
        if (!checkUmami()) {
            // If not ready, check again after a delay
            const timeout = setTimeout(checkUmami, 1000);
            return () => clearTimeout(timeout);
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
        <Script
            src={scriptUrl}
            data-website-id={websiteId}
            strategy="afterInteractive"
            data-auto-track="false"
            onLoad={() => {
                if (process.env.NODE_ENV === 'development') {
                    console.log('✅ [UMAMI] Tracking script loaded successfully');
                }
            }}
            onError={(error) => {
                console.error('❌ [UMAMI] Failed to load tracking script:', error);
            }}
        />
    );
}
