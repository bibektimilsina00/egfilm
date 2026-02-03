/**
 * Video source providers for streaming movies and TV shows
 * RELIES ON DATABASE ONLY - DEPRECATED: Hardcoded sources removed
 */

export interface VideoSource {
    name: string;
    quality: string;
    embed: (tmdbId: number, type: 'movie' | 'tv', season?: number, episode?: number) => string;
}

/**
 * Hardcoded sources removed. Use /api/video-providers instead.
 */
export const VIDEO_SOURCES: VideoSource[] = [];

/**
 * Get the default video source (Returns null as sources are in DB)
 */
export const getDefaultSource = (): VideoSource | null => {
    return VIDEO_SOURCES[0] || null;
};

/**
 * Get embed URL for a movie (Returns empty string as sources are in DB)
 */
export const getMovieEmbedUrl = (tmdbId: number, sourceIndex: number = 0): string => {
    const source = VIDEO_SOURCES[sourceIndex];
    if (!source) return '';
    return source.embed(tmdbId, 'movie');
};

/**
 * Get embed URL for a TV show episode (Returns empty string as sources are in DB)
 */
export const getTVEmbedUrl = (
    tmdbId: number,
    season: number,
    episode: number,
    sourceIndex: number = 0
): string => {
    const source = VIDEO_SOURCES[sourceIndex];
    if (!source) return '';
    return source.embed(tmdbId, 'tv', season, episode);
};
