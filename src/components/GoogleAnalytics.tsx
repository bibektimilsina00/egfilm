'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Global gtag interface is already declared elsewhere

interface GoogleAnalyticsProps {
    measurementId: string;
}

function GoogleAnalyticsInner({ measurementId }: GoogleAnalyticsProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!measurementId || typeof window === 'undefined') return;

        // Load gtag script
        const script1 = document.createElement('script');
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        script1.async = true;
        document.head.appendChild(script1);

        // Initialize gtag
        const script2 = document.createElement('script');
        script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}', {
        page_title: document.title,
        page_location: window.location.href,
      });
    `;
        document.head.appendChild(script2);

        // Make gtag available globally
        window.gtag = function gtag() {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({});  // Arguments can't be spread here, use specific tracking calls instead
        };

        return () => {
            // Cleanup scripts on unmount
            document.head.removeChild(script1);
            document.head.removeChild(script2);
        };
    }, [measurementId]);

    useEffect(() => {
        if (!measurementId || typeof window === 'undefined' || !window.gtag) return;

        const url = pathname + (searchParams ? searchParams.toString() : '');

        // Track page views
        window.gtag('config', measurementId, {
            page_path: url,
            page_title: document.title,
        });
    }, [pathname, searchParams, measurementId]);

    return null;
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
    return (
        <Suspense fallback={null}>
            <GoogleAnalyticsInner measurementId={measurementId} />
        </Suspense>
    );
}

// Analytics hook for easy event tracking
export function useGoogleAnalytics() {
    const trackEvent = (eventName: string, parameters?: Record<string, unknown>) => {
        if (typeof window === 'undefined' || !window.gtag) {
            console.warn('Google Analytics not loaded');
            return;
        }

        window.gtag('event', eventName, parameters);
    };

    const trackPageView = (pagePath: string, pageTitle?: string) => {
        if (typeof window === 'undefined' || !window.gtag) return;

        window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
            page_path: pagePath,
            page_title: pageTitle || document.title,
        });
    };

    const trackCustomEvent = (action: string, category: string, label?: string, value?: number) => {
        trackEvent(action, {
            event_category: category,
            event_label: label,
            value: value,
        });
    };

    // Predefined events for movie/TV tracking
    const trackMediaView = (mediaType: 'movie' | 'tv', mediaId: string, mediaTitle: string) => {
        trackEvent('media_view', {
            content_type: mediaType,
            content_id: mediaId,
            content_title: mediaTitle,
        });
    };

    const trackSearch = (searchTerm: string, searchType: 'multi' | 'movie' | 'tv' = 'multi') => {
        trackEvent('search', {
            search_term: searchTerm,
            search_type: searchType,
        });
    };

    const trackWatchlistAction = (action: 'add' | 'remove', mediaType: 'movie' | 'tv', mediaId: string) => {
        trackEvent('watchlist_action', {
            action: action,
            content_type: mediaType,
            content_id: mediaId,
        });
    };

    return {
        trackEvent,
        trackPageView,
        trackCustomEvent,
        trackMediaView,
        trackSearch,
        trackWatchlistAction,
    };
}