/**
 * Video source providers for streaming movies and TV shows
 * Similar to how fmovies, soap2day work - using embedded players
 */

export interface VideoSource {
    name: string;
    quality: string;
    embed: (tmdbId: number, type: 'movie' | 'tv', season?: number, episode?: number) => string;
}

/**
 * Popular video source providers
 * These are common embed patterns used by streaming sites
 */
export const VIDEO_SOURCES: VideoSource[] = [
    {
        name: 'VidSrc',
        quality: 'HD',
        embed: (tmdbId, type, season, episode) => {
            if (type === 'tv' && season && episode) {
                return `https://vidsrc.xyz/embed/tv/${tmdbId}/${season}/${episode}`;
            }
            return `https://vidsrc.xyz/embed/movie/${tmdbId}`;
        }
    },
    {
        name: 'VidSrc Pro',
        quality: 'HD',
        embed: (tmdbId, type, season, episode) => {
            if (type === 'tv' && season && episode) {
                return `https://vidsrc.pro/embed/tv/${tmdbId}/${season}/${episode}`;
            }
            return `https://vidsrc.pro/embed/movie/${tmdbId}`;
        }
    },
    {
        name: 'VidSrc.to',
        quality: 'HD',
        embed: (tmdbId, type, season, episode) => {
            if (type === 'tv' && season && episode) {
                return `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`;
            }
            return `https://vidsrc.to/embed/movie/${tmdbId}`;
        }
    },
    {
        name: '2Embed',
        quality: 'HD',
        embed: (tmdbId, type, season, episode) => {
            if (type === 'tv' && season && episode) {
                return `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`;
            }
            return `https://www.2embed.cc/embed/${tmdbId}`;
        }
    },
    {
        name: 'SuperEmbed',
        quality: 'HD',
        embed: (tmdbId, type, season, episode) => {
            if (type === 'tv' && season && episode) {
                return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;
            }
            return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`;
        }
    }
];

/**
 * Get the default video source
 */
export const getDefaultSource = (): VideoSource => {
    return VIDEO_SOURCES[0];
};

/**
 * Get embed URL for a movie
 */
export const getMovieEmbedUrl = (tmdbId: number, sourceIndex: number = 0): string => {
    const source = VIDEO_SOURCES[sourceIndex] || VIDEO_SOURCES[0];
    return source.embed(tmdbId, 'movie');
};

/**
 * Get embed URL for a TV show episode
 */
export const getTVEmbedUrl = (
    tmdbId: number,
    season: number,
    episode: number,
    sourceIndex: number = 0
): string => {
    const source = VIDEO_SOURCES[sourceIndex] || VIDEO_SOURCES[0];
    return source.embed(tmdbId, 'tv', season, episode);
};
