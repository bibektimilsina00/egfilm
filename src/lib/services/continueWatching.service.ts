import { prisma } from '../prisma';

export interface ContinueWatchingData {
    mediaId: number;
    mediaType: 'movie' | 'tv';
    title: string;
    posterPath?: string;
    progress: number; // 0-100
    season?: number;
    episode?: number;
}

/**
 * Save or update continue watching progress
 */
export async function saveContinueWatching(userId: string, data: ContinueWatchingData) {
    try {
        const continueWatching = await prisma.continueWatching.upsert({
            where: {
                userId_mediaId_mediaType: {
                    userId,
                    mediaId: data.mediaId,
                    mediaType: data.mediaType,
                },
            },
            update: {
                title: data.title,
                posterPath: data.posterPath,
                progress: data.progress,
                season: data.season,
                episode: data.episode,
                updatedAt: new Date(),
            },
            create: {
                userId,
                mediaId: data.mediaId,
                mediaType: data.mediaType,
                title: data.title,
                posterPath: data.posterPath,
                progress: data.progress,
                season: data.season,
                episode: data.episode,
            },
        });

        return continueWatching;
    } catch (error) {
        console.error('Error saving continue watching:', error);
        throw new Error('Failed to save continue watching');
    }
}

/**
 * Get continue watching list for user
 */
export async function getContinueWatching(userId: string) {
    try {
        const continueWatching = await prisma.continueWatching.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            take: 20, // Limit to recent 20 items
        });

        return continueWatching;
    } catch (error) {
        console.error('Error fetching continue watching:', error);
        throw new Error('Failed to fetch continue watching');
    }
}

/**
 * Remove item from continue watching
 */
export async function removeContinueWatching(
    userId: string,
    mediaId: number,
    mediaType: 'movie' | 'tv'
) {
    try {
        await prisma.continueWatching.delete({
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
        console.error('Error removing continue watching:', error);
        throw new Error('Failed to remove continue watching');
    }
}

/**
 * Get progress for specific media
 */
export async function getProgress(
    userId: string,
    mediaId: number,
    mediaType: 'movie' | 'tv'
) {
    try {
        const item = await prisma.continueWatching.findUnique({
            where: {
                userId_mediaId_mediaType: {
                    userId,
                    mediaId,
                    mediaType,
                },
            },
        });

        return item?.progress || 0;
    } catch (error) {
        console.error('Error getting progress:', error);
        return 0;
    }
}

/**
 * Migrate localStorage continue watching to database
 */
export async function migrateContinueWatchingFromLocalStorage(
    userId: string,
    localStorageItems: ContinueWatchingData[]
) {
    try {
        const promises = localStorageItems.map((item) =>
            saveContinueWatching(userId, item)
        );

        await Promise.all(promises);
        return { success: true, count: localStorageItems.length };
    } catch (error) {
        console.error('Error migrating continue watching:', error);
        throw new Error('Failed to migrate continue watching');
    }
}
