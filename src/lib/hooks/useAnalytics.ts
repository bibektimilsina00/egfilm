'use client';

/**
 * Comprehensive Umami Analytics Hook
 * Tracks page views, events, video quality, WebRTC connections, and Watch Together activity
 *
 * Umami window object reference: window.umami
 * Send events: umami.track('event_name', { property: value })
 */

interface UmamiProperties {
    [key: string]: string | number | boolean | undefined;
}

interface UmamiAnalytics {
    track: (event: string, properties?: UmamiProperties) => void;
}

// Extend window interface for Umami
declare global {
    interface Window {
        umami?: UmamiAnalytics;
    }
}

export function useAnalytics() {
    // Ensure Umami is available
    const getUmami = () => {
        if (typeof window !== 'undefined' && window.umami) {
            return window.umami;
        }
        return null;
    };

    /**
     * Track generic event with properties
     * @param eventName - Event name (max 50 chars)
     * @param properties - Event data (stored as strings by Umami)
     */
    const trackEvent = (eventName: string, properties?: UmamiProperties) => {
        const umami = getUmami();
        if (!umami) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('📊 [ANALYTICS] Umami not initialized. Make sure tracking script is loaded.');
            }
            return;
        }

        // Truncate event name to 50 chars (Umami limit)
        const truncatedName = eventName.substring(0, 50);

        try {
            umami.track(truncatedName, properties);
            if (process.env.NODE_ENV === 'development') {
                console.log('📊 [UMAMI]', truncatedName, properties);
            }
        } catch (error) {
            console.error('📊 [UMAMI ERROR]', error);
        }
    };

    /**
     * Track page view with custom metadata
     * @param pageName - Page identifier (watch_together, movies, tv, etc)
     * @param properties - Additional page properties
     */
    const trackPageView = (pageName: string, properties?: UmamiProperties) => {
        trackEvent('page_view', {
            page: pageName,
            ...properties,
        });
    };

    /**
     * Track application errors
     * @param error - Error object
     * @param context - Additional error context
     */
    const trackError = (error: Error, context?: UmamiProperties) => {
        trackEvent('error_occurred', {
            error_message: error.message.substring(0, 100),
            error_type: error.name,
            ...context,
        });
    };

    /**
     * Track Watch Together room events
     * @param eventName - watch_together_room_joined, room_left, participant_joined, etc
     * @param properties - Event data (participants, duration, etc)
     */
    const trackWatchTogetherEvent = (eventName: string, properties?: UmamiProperties) => {
        const fullEventName = `watch_together_${eventName}`;
        trackEvent(fullEventName, properties);
    };

    /**
     * Track video quality and performance metrics
     * @param quality - Video quality level (high, medium, low)
     * @param duration - Video stream duration in seconds
     * @param resolution - Video resolution (1280x720, 640x480, etc)
     */
    const trackVideoQuality = (quality: string, duration: number, resolution: string) => {
        trackEvent('video_quality', {
            quality,
            duration_seconds: String(duration),
            resolution,
            timestamp: new Date().toISOString(),
        });
    };

    /**
     * Track WebRTC connection events
     * @param status - Connection status (ice_candidate, connected, failed, etc)
     * @param details - Connection details (ice_type, protocol, etc)
     */
    const trackConnectionEvent = (status: string, details?: UmamiProperties) => {
        trackEvent('webrtc_connection', {
            status,
            ...details,
        });
    };

    /**
     * Track media device permissions
     * @param deviceType - camera, microphone, screen
     * @param granted - true if permission granted
     */
    const trackPermission = (deviceType: string, granted: boolean) => {
        trackEvent('permission_granted', {
            device_type: deviceType,
            granted: granted ? 'yes' : 'no',
        });
    };

    /**
     * Track message sent in chat
     * @param messageLength - Length of message
     * @param participantCount - Number of participants in room
     */
    const trackMessage = (messageLength: number, participantCount?: number) => {
        trackEvent('message_sent', {
            message_length: String(messageLength),
            participant_count: participantCount ? String(participantCount) : undefined,
        });
    };

    /**
     * Track video/audio toggle state changes
     * @param deviceType - camera or microphone
     * @param enabled - true if enabled, false if disabled
     */
    const trackDeviceToggle = (deviceType: string, enabled: boolean) => {
        trackEvent('device_toggled', {
            device_type: deviceType,
            enabled: enabled ? 'yes' : 'no',
        });
    };

    /**
     * Track user session events
     * @param eventName - login, logout, register, session_start
     * @param properties - Session properties
     */
    const trackSession = (eventName: string, properties?: UmamiProperties) => {
        trackEvent(`session_${eventName}`, properties);
    };

    /**
     * Track search and content discovery
     * @param searchQuery - What user searched for
     * @param results - Number of results found
     */
    const trackSearch = (searchQuery: string, results?: number) => {
        trackEvent('search_performed', {
            query: searchQuery.substring(0, 100),
            results: results ? String(results) : undefined,
        });
    };

    /**
     * Track content interactions
     * @param contentType - movie, tv, watchlist, etc
     * @param action - viewed, added, removed, shared
     * @param contentId - ID of the content
     */
    const trackContent = (contentType: string, action: string, contentId?: string) => {
        trackEvent('content_interaction', {
            content_type: contentType,
            action,
            content_id: contentId,
        });
    };

    /**
     * Track video player events
     * @param action - play, pause, seek, source_change, fullscreen
     * @param properties - Additional player properties
     */
    const trackPlayerEvent = (action: string, properties?: UmamiProperties) => {
        trackEvent('player_event', {
            action,
            ...properties,
        });
    };

    /**
     * Track performance metrics
     * @param metricName - metric identifier
     * @param duration - duration in milliseconds
     */
    const trackPerformance = (metricName: string, duration: number) => {
        trackEvent('performance_metric', {
            metric: metricName,
            duration_ms: String(duration),
        });
    };

    return {
        trackEvent,
        trackPageView,
        trackError,
        trackWatchTogetherEvent,
        trackVideoQuality,
        trackConnectionEvent,
        trackPermission,
        trackMessage,
        trackDeviceToggle,
        trackSession,
        trackSearch,
        trackContent,
        trackPlayerEvent,
        trackPerformance,
    };
}
