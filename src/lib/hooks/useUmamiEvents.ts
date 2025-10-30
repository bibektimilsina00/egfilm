'use client';

import { useCallback } from 'react';

/**
 * Hook for tracking custom Umami events
 * Usage: const { trackEvent } = useUmamiEvents();
 *        trackEvent('movie_clicked', { movieId: 12345, movieTitle: 'Avatar' });
 */
export function useUmamiEvents() {
    const trackEvent = useCallback((eventName: string, eventData?: Record<string, string | number | boolean | undefined>) => {
        if (typeof window !== 'undefined' && window.umami) {
            try {
                window.umami.track(eventName, eventData);
                if (process.env.NODE_ENV === 'development') {
                    console.log(`✅ [UMAMI] Event tracked: ${eventName}`, eventData);
                }
            } catch (error) {
                console.error('❌ [UMAMI] Failed to track event:', error);
            }
        } else if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ [UMAMI] Tracker not loaded yet, event not tracked:', eventName);
        }
    }, []);

    return { trackEvent };
}

/**
 * Pre-built event tracking functions for common actions
 */
export const umamiEvents = {
    // Movie/TV events
    movieViewed: (movieId: number, title: string) =>
        trackUmamiEvent('movie_viewed', { movieId, title }),

    tvShowViewed: (showId: number, title: string) =>
        trackUmamiEvent('tv_show_viewed', { showId, title }),

    addedToWatchlist: (itemId: number, type: 'movie' | 'tv') =>
        trackUmamiEvent('added_to_watchlist', { itemId, type }),

    removedFromWatchlist: (itemId: number, type: 'movie' | 'tv') =>
        trackUmamiEvent('removed_from_watchlist', { itemId, type }),

    // Watch Together events
    watchTogetherCreated: (roomCode: string) =>
        trackUmamiEvent('watch_together_created', { roomCode }),

    watchTogetherJoined: (roomCode: string) =>
        trackUmamiEvent('watch_together_joined', { roomCode }),

    // Search events
    searched: (query: string, resultCount: number) =>
        trackUmamiEvent('searched', { query, resultCount }),

    // Auth events
    userSignedUp: (method: string) =>
        trackUmamiEvent('user_signed_up', { method }),

    userLoggedIn: (method: string) =>
        trackUmamiEvent('user_logged_in', { method }),

    userLoggedOut: () =>
        trackUmamiEvent('user_logged_out', {}),
};

/**
 * Core function to track Umami events
 */
function trackUmamiEvent(eventName: string, eventData?: Record<string, string | number | boolean | undefined>) {
    if (typeof window !== 'undefined' && window.umami) {
        try {
            window.umami.track(eventName, eventData);
            if (process.env.NODE_ENV === 'development') {
                console.log(`✅ [UMAMI] Event tracked: ${eventName}`, eventData);
            }
        } catch (error) {
            console.error('❌ [UMAMI] Failed to track event:', error);
        }
    } else if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ [UMAMI] Tracker not loaded, event not tracked:', eventName);
    }
}
