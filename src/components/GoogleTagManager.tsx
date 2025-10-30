'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Note: Using existing dataLayer type from GoogleAnalytics components

interface GoogleTagManagerProps {
    gtmId: string;
}

export function GoogleTagManager({ gtmId }: GoogleTagManagerProps) {
    const pathname = usePathname();

    useEffect(() => {
        // Push page view to GTM dataLayer
        if (typeof window !== 'undefined' && window.dataLayer) {
            window.dataLayer.push({
                event: 'page_view',
                page_location: window.location.href,
                page_path: pathname,
                page_title: document.title,
            });
        }
    }, [pathname]);

    return null;
}

// GTM Event Tracking Functions
export const gtm = {
    // Track custom events
    trackEvent: (eventName: string, parameters: Record<string, unknown> = {}) => {
        if (typeof window !== 'undefined' && window.dataLayer) {
            window.dataLayer.push({
                event: eventName,
                ...parameters,
            });
        }
    },

    // Track ecommerce events (useful for premium features)
    trackPurchase: (transactionId: string, value: number, currency = 'USD') => {
        if (typeof window !== 'undefined' && window.dataLayer) {
            window.dataLayer.push({
                event: 'purchase',
                ecommerce: {
                    transaction_id: transactionId,
                    value: value,
                    currency: currency,
                },
            });
        }
    },

    // Track video interactions
    trackVideo: (action: string, videoTitle: string, videoId: string) => {
        if (typeof window !== 'undefined' && window.dataLayer) {
            window.dataLayer.push({
                event: 'video_engagement',
                video_action: action,
                video_title: videoTitle,
                video_id: videoId,
            });
        }
    },

    // Track search events
    trackSearch: (searchTerm: string, resultsCount?: number) => {
        if (typeof window !== 'undefined' && window.dataLayer) {
            window.dataLayer.push({
                event: 'search',
                search_term: searchTerm,
                search_results_count: resultsCount,
            });
        }
    },

    // Track content engagement
    trackContentEngagement: (contentType: string, contentId: string, action: string) => {
        if (typeof window !== 'undefined' && window.dataLayer) {
            window.dataLayer.push({
                event: 'content_engagement',
                content_type: contentType,
                content_id: contentId,
                engagement_action: action,
            });
        }
    },

    // Track user interactions
    trackUserInteraction: (elementType: string, elementText: string) => {
        if (typeof window !== 'undefined' && window.dataLayer) {
            window.dataLayer.push({
                event: 'user_interaction',
                element_type: elementType,
                element_text: elementText,
            });
        }
    },
};

export default GoogleTagManager;