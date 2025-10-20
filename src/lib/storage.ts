// Watchlist management
import { MediaItem } from './tmdb';

type WatchlistItem = {
    id: number;
    title?: string;
    name?: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string;
    release_date?: string;
    first_air_date?: string;
    vote_average: number;
    genre_ids: number[];
    media_type: 'movie' | 'tv';
    addedAt: number;
};

export const addToWatchlist = (item: MediaItem, type: 'movie' | 'tv') => {
    if (typeof window === 'undefined') return;

    const watchlist = getWatchlist();
    const newItem: WatchlistItem = { ...item, media_type: type, addedAt: Date.now() };

    // Check if already exists
    const exists = watchlist.some(
        (i) => i.id === item.id && i.media_type === type
    );

    if (!exists) {
        watchlist.unshift(newItem);
        localStorage.setItem('egfilm_watchlist', JSON.stringify(watchlist));
    }
};

export const removeFromWatchlist = (id: number, type: 'movie' | 'tv') => {
    if (typeof window === 'undefined') return;

    const watchlist = getWatchlist();
    const filtered = watchlist.filter(
        (item) => !(item.id === id && item.media_type === type)
    );
    localStorage.setItem('egfilm_watchlist', JSON.stringify(filtered));
};

export const isInWatchlist = (id: number, type: 'movie' | 'tv'): boolean => {
    if (typeof window === 'undefined') return false;

    const watchlist = getWatchlist();
    return watchlist.some((item) => item.id === id && item.media_type === type);
};

export const getWatchlist = (): WatchlistItem[] => {
    if (typeof window === 'undefined') return [];

    try {
        const data = localStorage.getItem('egfilm_watchlist');
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

// Continue Watching management
export const addToContinueWatching = (
    item: MediaItem,
    type: 'movie' | 'tv',
    progress: number = 0
) => {
    if (typeof window === 'undefined') return;

    const continueWatching = getContinueWatching();
    const newItem = {
        ...item,
        media_type: type,
        progress,
        lastWatched: Date.now(),
    };

    // Remove if already exists
    const filtered = continueWatching.filter(
        (i) => !(i.id === item.id && i.media_type === type)
    );

    // Add to beginning
    filtered.unshift(newItem);

    // Keep only last 20 items
    const limited = filtered.slice(0, 20);

    localStorage.setItem('egfilm_continue', JSON.stringify(limited));
};

export const removeFromContinueWatching = (id: number, type: 'movie' | 'tv') => {
    if (typeof window === 'undefined') return;

    const continueWatching = getContinueWatching();
    const filtered = continueWatching.filter(
        (item) => !(item.id === id && item.media_type === type)
    );
    localStorage.setItem('egfilm_continue', JSON.stringify(filtered));
};

type ContinueWatchingItem = {
    id: number;
    title?: string;
    name?: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string;
    release_date?: string;
    first_air_date?: string;
    vote_average: number;
    genre_ids: number[];
    media_type: 'movie' | 'tv';
    progress: number;
    lastWatched: number;
};

export const getContinueWatching = (): ContinueWatchingItem[] => {
    if (typeof window === 'undefined') return [];

    try {
        const data = localStorage.getItem('egfilm_continue');
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

type HistoryItem = {
    id: number;
    title?: string;
    name?: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string;
    release_date?: string;
    first_air_date?: string;
    vote_average: number;
    genre_ids: number[];
    media_type: 'movie' | 'tv';
    viewedAt: number;
};

// Viewing history
export const addToHistory = (item: MediaItem, type: 'movie' | 'tv') => {
    if (typeof window === 'undefined') return;

    const history = getHistory();
    const newItem = { ...item, media_type: type, viewedAt: Date.now() };

    // Remove if already exists
    const filtered = history.filter(
        (i) => !(i.id === item.id && i.media_type === type)
    );

    // Add to beginning
    filtered.unshift(newItem);

    // Keep only last 50 items
    const limited = filtered.slice(0, 50);

    localStorage.setItem('egfilm_history', JSON.stringify(limited));
};

export const getHistory = (): HistoryItem[] => {
    if (typeof window === 'undefined') return [];

    try {
        const data = localStorage.getItem('egfilm_history');
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

export const clearHistory = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('egfilm_history');
};
