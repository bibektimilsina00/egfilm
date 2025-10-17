import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface WatchlistItem {
    id: string;
    userId: string;
    mediaId: number;
    mediaType: 'movie' | 'tv';
    title: string;
    posterPath?: string;
    addedAt: string;
}

/**
 * Hook to manage watchlist with database sync
 */
export function useWatchlist() {
    const { status } = useSession();
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchWatchlist();
        } else {
            setLoading(false);
        }
    }, [status]);

    async function fetchWatchlist() {
        try {
            const response = await fetch('/api/watchlist');
            if (response.ok) {
                const data = await response.json();
                setWatchlist(data.watchlist);
            }
        } catch (error) {
            console.error('Error fetching watchlist:', error);
        } finally {
            setLoading(false);
        }
    }

    async function addToWatchlist(
        mediaId: number,
        mediaType: 'movie' | 'tv',
        title: string,
        posterPath?: string
    ) {
        try {
            const response = await fetch('/api/watchlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mediaId, mediaType, title, posterPath }),
            });

            if (response.ok) {
                await fetchWatchlist(); // Refresh list
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error adding to watchlist:', error);
            return false;
        }
    }

    async function removeFromWatchlist(mediaId: number, mediaType: 'movie' | 'tv') {
        try {
            const response = await fetch(
                `/api/watchlist?mediaId=${mediaId}&mediaType=${mediaType}`,
                { method: 'DELETE' }
            );

            if (response.ok) {
                await fetchWatchlist(); // Refresh list
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error removing from watchlist:', error);
            return false;
        }
    }

    async function isInWatchlist(mediaId: number, mediaType: 'movie' | 'tv') {
        try {
            const response = await fetch(
                `/api/watchlist/check?mediaId=${mediaId}&mediaType=${mediaType}`
            );

            if (response.ok) {
                const data = await response.json();
                return data.inWatchlist;
            }
            return false;
        } catch (error) {
            console.error('Error checking watchlist:', error);
            return false;
        }
    }

    return {
        watchlist,
        loading,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        refetch: fetchWatchlist,
    };
}
