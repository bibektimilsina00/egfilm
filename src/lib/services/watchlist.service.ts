import { prisma } from '../prisma';

export interface WatchlistItemData {
    mediaId: number;
    mediaType: 'movie' | 'tv';
    title: string;
    posterPath?: string;
}

/**
 * Add item to user's watchlist
 */
export async function addToWatchlist(userId: string, item: WatchlistItemData) {
    try {
        const watchlistItem = await prisma.watchlistItem.upsert({
            where: {
                userId_mediaId_mediaType: {
                    userId,
                    mediaId: item.mediaId,
                    mediaType: item.mediaType,
                },
            },
            update: {
                title: item.title,
                posterPath: item.posterPath,
            },
            create: {
                userId,
                mediaId: item.mediaId,
                mediaType: item.mediaType,
                title: item.title,
                posterPath: item.posterPath,
            },
        });

        return watchlistItem;
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        throw new Error('Failed to add to watchlist');
    }
}

/**
 * Remove item from user's watchlist
 */
export async function removeFromWatchlist(
    userId: string,
    mediaId: number,
    mediaType: 'movie' | 'tv'
) {
    try {
        await prisma.watchlistItem.delete({
            where: {
                userId_mediaId_mediaType: {
                    userId,
                    mediaId,
                    mediaType,
                },
            },
        });

        return { success: true };
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        throw new Error('Failed to remove from watchlist');
    }
}

/**
 * Get user's watchlist
 */
export async function getWatchlist(userId: string) {
    try {
        const watchlist = await prisma.watchlistItem.findMany({
            where: { userId },
            orderBy: { addedAt: 'desc' },
        });

        return watchlist;
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        throw new Error('Failed to fetch watchlist');
    }
}

/**
 * Check if item is in watchlist
 */
export async function isInWatchlist(
    userId: string,
    mediaId: number,
    mediaType: 'movie' | 'tv'
) {
    try {
        const item = await prisma.watchlistItem.findUnique({
            where: {
                userId_mediaId_mediaType: {
                    userId,
                    mediaId,
                    mediaType,
                },
            },
        });

        return !!item;
    } catch (error) {
        console.error('Error checking watchlist:', error);
        return false;
    }
}

/**
 * Migrate localStorage watchlist to database
 */
export async function migrateWatchlistFromLocalStorage(
    userId: string,
    localStorageItems: WatchlistItemData[]
) {
    try {
        const promises = localStorageItems.map((item) =>
            addToWatchlist(userId, item)
        );

        await Promise.all(promises);
        return { success: true, count: localStorageItems.length };
    } catch (error) {
        console.error('Error migrating watchlist:', error);
        throw new Error('Failed to migrate watchlist');
    }
}
