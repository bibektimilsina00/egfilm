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
 * Popular video source providers - UPDATED 2025
 * These are the latest working embed patterns used by streaming sites
 */
export const VIDEO_SOURCES: VideoSource[] = [
    {
        name: 'VidLink Pro',
        quality: '1080p',
        embed: (tmdbId, type, season, episode) => {
            // VidLink.pro - Biggest streaming API with 99K+ movies, 69K+ shows
            // Supports customization, watch progress tracking, player events
            if (type === 'tv' && season && episode) {
                return `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`;
            }
            return `https://vidlink.pro/movie/${tmdbId}`;
        }
    },
    {
        name: 'VidSrc.to',
        quality: '1080p',
        embed: (tmdbId, type, season, episode) => {
            // VidSrc.to - Next generation streaming API, still active
            // Auto-update links, responsive, high quality
            if (type === 'tv' && season && episode) {
                return `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`;
            }
            return `https://vidsrc.to/embed/movie/${tmdbId}`;
        }
    },
    {
        name: 'AutoEmbed',
        quality: '1080p',
        embed: (tmdbId, type, season, episode) => {
            // AutoEmbed.cc - Supports both IMDB and TMDB IDs
            // Can select default server with ?server=2 parameter
            if (type === 'tv' && season && episode) {
                return `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`;
            }
            return `https://player.autoembed.cc/embed/movie/${tmdbId}`;
        }
    },
    {
        name: 'VidSrc ICU',
        quality: '1080p',
        embed: (tmdbId, type, season, episode) => {
            // VidSrc.icu - Minimal ads, supports anime
            // Also provides movie/tv lists API
            if (type === 'tv' && season && episode) {
                return `https://vidsrc.icu/embed/tv/${tmdbId}/${season}/${episode}`;
            }
            return `https://vidsrc.icu/embed/movie/${tmdbId}`;
        }
    },
    {
        name: 'VidSrc.cc',
        quality: '1080p',
        embed: (tmdbId, type, season, episode) => {
            // VidSrc.cc - Latest generation v2 player
            // Supports custom subtitles and player events
            if (type === 'tv' && season && episode) {
                return `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`;
            }
            return `https://vidsrc.cc/v2/embed/movie/${tmdbId}`;
        }
    },
    {
        name: 'VidSrc NEW',
        quality: '1080p',
        embed: (tmdbId, type, season, episode) => {
            // VidSrc new official domain (vidsrcme.ru)
            // Replaces old vidsrc.me, vidsrc.xyz, vidsrc.net
            if (type === 'tv' && season && episode) {
                return `https://vidsrcme.ru/embed/tv/${tmdbId}/${season}/${episode}`;
            }
            return `https://vidsrcme.ru/embed/movie/${tmdbId}`;
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
