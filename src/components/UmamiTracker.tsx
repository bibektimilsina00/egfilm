'use client';

import Script from 'next/script';

/**
 * Umami Analytics Tracker Component
 * 
 * Loads the Umami tracking script into your Next.js app
 * 
 * Usage in layout.tsx:
 * import { UmamiTracker } from '@/components/UmamiTracker';
 * 
 * return (
 *   <html>
 *     <body>
 *       <UmamiTracker />
 *       {children}
 *     </body>
 *   </html>
 * )
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_UMAMI_WEBSITE_ID: Your Umami website ID
 * - NEXT_PUBLIC_UMAMI_SCRIPT_URL: Your Umami server URL (e.g., https://your-umami.example.com/script.js)
 */

export function UmamiTracker() {
    const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
    const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;

    // Don't render if environment variables are missing
    if (!websiteId || !scriptUrl) {
        if (process.env.NODE_ENV === 'development') {
            console.warn(
                '⚠️ [UMAMI] Missing configuration. Set NEXT_PUBLIC_UMAMI_WEBSITE_ID and NEXT_PUBLIC_UMAMI_SCRIPT_URL'
            );
        }
        return null;
    }

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
