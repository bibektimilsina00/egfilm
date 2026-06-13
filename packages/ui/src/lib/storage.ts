// Generic local-storage helpers for watchlist / continue-watching / history.
// Each consumer app instantiates with its own storage prefix so localStorage
// keys are app-isolated.

export interface BaseMediaItem {
    id: number;
    title?: string;
    name?: string;
    poster_path: string | null;
    backdrop_path?: string | null;
    overview?: string;
    release_date?: string;
    first_air_date?: string;
    vote_average?: number;
    genre_ids?: number[];
    [key: string]: unknown;
}

export interface WatchlistRecord<T extends BaseMediaItem = BaseMediaItem> {
    media_type: string;
    addedAt: number;
}

export interface ContinueWatchingRecord<T extends BaseMediaItem = BaseMediaItem> {
    media_type: string;
    progress: number;
    lastWatched: number;
}

export interface HistoryRecord<T extends BaseMediaItem = BaseMediaItem> {
    media_type: string;
    viewedAt: number;
}

type Stored<T extends BaseMediaItem, Extra extends object> = T & Extra;

export interface AppStorage<T extends BaseMediaItem = BaseMediaItem> {
    addToWatchlist(item: T, type: string): void;
    removeFromWatchlist(id: number, type: string): void;
    isInWatchlist(id: number, type: string): boolean;
    getWatchlist(): Array<Stored<T, WatchlistRecord<T>>>;

    addToContinueWatching(item: T, type: string, progress?: number): void;
    removeFromContinueWatching(id: number, type: string): void;
    getContinueWatching(): Array<Stored<T, ContinueWatchingRecord<T>>>;

    addToHistory(item: T, type: string): void;
    getHistory(): Array<Stored<T, HistoryRecord<T>>>;
    clearHistory(): void;
}

function safeParse<T>(raw: string | null): T[] {
    if (!raw) return [];
    try {
        return JSON.parse(raw) as T[];
    } catch {
        return [];
    }
}

export function createStorage<T extends BaseMediaItem = BaseMediaItem>(
    prefix: string,
    options?: {
        continueWatchingLimit?: number;
        historyLimit?: number;
    },
): AppStorage<T> {
    const watchlistKey = `${prefix}_watchlist`;
    const continueKey = `${prefix}_continue`;
    const historyKey = `${prefix}_history`;
    const cwLimit = options?.continueWatchingLimit ?? 20;
    const hLimit = options?.historyLimit ?? 50;

    const isBrowser = () => typeof window !== 'undefined';

    return {
        addToWatchlist(item, type) {
            if (!isBrowser()) return;
            const list = this.getWatchlist();
            const exists = list.some((i) => i.id === item.id && i.media_type === type);
            if (exists) return;
            const next = [{ ...(item as object), media_type: type, addedAt: Date.now() } as Stored<T, WatchlistRecord<T>>, ...list];
            localStorage.setItem(watchlistKey, JSON.stringify(next));
        },
        removeFromWatchlist(id, type) {
            if (!isBrowser()) return;
            const filtered = this.getWatchlist().filter((i) => !(i.id === id && i.media_type === type));
            localStorage.setItem(watchlistKey, JSON.stringify(filtered));
        },
        isInWatchlist(id, type) {
            if (!isBrowser()) return false;
            return this.getWatchlist().some((i) => i.id === id && i.media_type === type);
        },
        getWatchlist() {
            if (!isBrowser()) return [];
            return safeParse<Stored<T, WatchlistRecord<T>>>(localStorage.getItem(watchlistKey));
        },

        addToContinueWatching(item, type, progress = 0) {
            if (!isBrowser()) return;
            const existing = this.getContinueWatching().filter(
                (i) => !(i.id === item.id && i.media_type === type),
            );
            const next = [
                { ...(item as object), media_type: type, progress, lastWatched: Date.now() } as Stored<T, ContinueWatchingRecord<T>>,
                ...existing,
            ].slice(0, cwLimit);
            localStorage.setItem(continueKey, JSON.stringify(next));
        },
        removeFromContinueWatching(id, type) {
            if (!isBrowser()) return;
            const filtered = this.getContinueWatching().filter((i) => !(i.id === id && i.media_type === type));
            localStorage.setItem(continueKey, JSON.stringify(filtered));
        },
        getContinueWatching() {
            if (!isBrowser()) return [];
            return safeParse<Stored<T, ContinueWatchingRecord<T>>>(localStorage.getItem(continueKey));
        },

        addToHistory(item, type) {
            if (!isBrowser()) return;
            const existing = this.getHistory().filter((i) => !(i.id === item.id && i.media_type === type));
            const next = [
                { ...(item as object), media_type: type, viewedAt: Date.now() } as Stored<T, HistoryRecord<T>>,
                ...existing,
            ].slice(0, hLimit);
            localStorage.setItem(historyKey, JSON.stringify(next));
        },
        getHistory() {
            if (!isBrowser()) return [];
            return safeParse<Stored<T, HistoryRecord<T>>>(localStorage.getItem(historyKey));
        },
        clearHistory() {
            if (!isBrowser()) return;
            localStorage.removeItem(historyKey);
        },
    };
}
