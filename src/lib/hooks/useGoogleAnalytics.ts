/**
 * Google Analytics Hook for React
 * 
 * Easy-to-use React hook for tracking events with Google Analytics
 */

declare global {
    interface Window {
        gtag: (command: string, action?: string, parameters?: Record<string, unknown>) => void;
        dataLayer: Record<string, unknown>[];
    }
}

interface EventProperties {
    [key: string]: string | number | boolean;
}

export function useAnalytics() {
    // Ensure Google Analytics is available
    const getGtag = () => {
        if (typeof window !== 'undefined' && window.gtag) {
            return window.gtag;
        }
        console.warn('Google Analytics not loaded yet');
        return null;
    };

    /**
     * Track custom events
     * @param eventName - The name of the event
     * @param properties - Event data
     */
    const trackEvent = (eventName: string, properties?: EventProperties) => {
        const gtag = getGtag();
        if (!gtag) {
            console.warn(`Cannot track event "${eventName}": Google Analytics not available`);
            return;
        }

        try {
            gtag('event', eventName, properties);
            console.log(`Tracked event: ${eventName}`, properties);
        } catch (error) {
            console.error('Error tracking event:', error);
        }
    };

    /**
     * Track page views
     */
    const trackPageView = (pageName: string, properties?: EventProperties) => {
        trackEvent('page_view', {
            page_title: pageName,
            ...properties
        });
    };

    /**
     * Track errors for debugging
     */
    const trackError = (error: Error, context?: EventProperties) => {
        trackEvent('exception', {
            description: error.message,
            fatal: false,
            ...context
        });
    };

    /**
     * Track movie/TV content views
     */
    const trackContentView = (
        contentType: 'movie' | 'tv' | 'episode',
        contentId: string,
        contentTitle?: string,
        genre?: string,
        rating?: number
    ) => {
        trackEvent('content_view', {
            content_type: contentType,
            content_id: contentId,
            content_title: contentTitle || 'Unknown',
            genre: genre || 'Unknown',
            rating: rating || 0
        });
    };

    /**
     * Track search activity
     */
    const trackSearch = (
        searchQuery: string,
        searchType: 'movie' | 'tv' | 'multi' | 'person' = 'multi',
        results?: number
    ) => {
        trackEvent('search', {
            search_term: searchQuery,
            search_type: searchType,
            search_results: results || 0
        });
    };

    /**
     * Track watch party events
     */
    const trackWatchParty = (
        action: 'create' | 'join' | 'leave' | 'sync' | 'play' | 'pause',
        partyId?: string,
        participantCount?: number,
        contentType?: 'movie' | 'tv',
        contentId?: string
    ) => {
        trackEvent('watch_party', {
            action: action,
            party_id: partyId || 'unknown',
            participant_count: participantCount || 0,
            content_type: contentType || 'unknown',
            content_id: contentId || 'unknown'
        });
    };

    /**
     * Track watchlist management
     */
    const trackWatchlist = (
        action: 'add' | 'remove' | 'view',
        contentType: 'movie' | 'tv',
        contentId?: string,
        contentTitle?: string
    ) => {
        trackEvent('watchlist', {
            action: action,
            content_type: contentType,
            content_id: contentId || 'unknown',
            content_title: contentTitle || 'Unknown'
        });
    };

    /**
     * Track user session events
     */
    const trackSession = (eventName: string, properties?: EventProperties) => {
        trackEvent(`session_${eventName}`, properties);
    };

    /**
     * Track video player events
     */
    const trackPlayerEvent = (action: string, properties?: EventProperties) => {
        trackEvent(`player_${action}`, properties);
    };

    /**
     * Track performance metrics
     */
    const trackPerformance = (metricName: string, duration: number) => {
        trackEvent('performance_metric', {
            metric: metricName,
            duration_ms: duration,
        });
    };

    return {
        trackEvent,
        trackPageView,
        trackError,
        trackContentView,
        trackSearch,
        trackWatchParty,
        trackWatchlist,
        trackSession,
        trackPlayerEvent,
        trackPerformance,
    };
}