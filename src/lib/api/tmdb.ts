import axios from 'axios';

const TMDB_BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export interface Movie {
    id: number;
    title: string;
    original_title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    popularity: number;
    genre_ids: number[];
    adult: boolean;
    original_language: string;
    video: boolean;
}

export interface TVShow {
    id: number;
    name: string;
    original_name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    first_air_date: string;
    vote_average: number;
    vote_count: number;
    popularity: number;
    genre_ids: number[];
    origin_country: string[];
    original_language: string;
}

export interface Genre {
    id: number;
    name: string;
}

export interface MovieDetails extends Movie {
    genres: Genre[];
    runtime: number;
    budget: number;
    revenue: number;
    status: string;
    tagline: string;
    production_companies: Array<{ id: number; name: string; logo_path: string | null }>;
    credits?: {
        cast: Array<{ id: number; name: string; character: string; profile_path: string | null }>;
        crew: Array<{ id: number; name: string; job: string; profile_path: string | null }>;
    };
    videos?: {
        results: Array<{ id: string; key: string; name: string; site: string; type: string }>;
    };
}

export interface TVShowDetails extends TVShow {
    genres: Genre[];
    number_of_seasons: number;
    number_of_episodes: number;
    seasons: Array<{
        id: number;
        season_number: number;
        episode_count: number;
        air_date: string;
        poster_path: string | null;
    }>;
    created_by: Array<{ id: number; name: string }>;
    networks: Array<{ id: number; name: string; logo_path: string | null }>;
    status: string;
    type: string;
    credits?: {
        cast: Array<{ id: number; name: string; character: string; profile_path: string | null }>;
    };
    videos?: {
        results: Array<{ id: string; key: string; name: string; site: string; type: string }>;
    };
}

const tmdbClient = axios.create({
    baseURL: TMDB_BASE_URL,
    params: {
        api_key: TMDB_API_KEY,
    },
});

export const tmdbApi = {
    // Movies
    getPopularMovies: async (page = 1) => {
        const response = await tmdbClient.get('/movie/popular', { params: { page } });
        return response.data;
    },

    getTrendingMovies: async (timeWindow: 'day' | 'week' = 'week') => {
        const response = await tmdbClient.get(`/trending/movie/${timeWindow}`);
        return response.data;
    },

    getTopRatedMovies: async (page = 1) => {
        const response = await tmdbClient.get('/movie/top_rated', { params: { page } });
        return response.data;
    },

    getNowPlayingMovies: async (page = 1) => {
        const response = await tmdbClient.get('/movie/now_playing', { params: { page } });
        return response.data;
    },

    getUpcomingMovies: async (page = 1) => {
        const response = await tmdbClient.get('/movie/upcoming', { params: { page } });
        return response.data;
    },

    getMovieDetails: async (movieId: number): Promise<MovieDetails> => {
        const response = await tmdbClient.get(`/movie/${movieId}`, {
            params: {
                append_to_response: 'credits,videos,similar,recommendations',
            },
        });
        return response.data;
    },

    // TV Shows
    getPopularTVShows: async (page = 1) => {
        const response = await tmdbClient.get('/tv/popular', { params: { page } });
        return response.data;
    },

    getTrendingTVShows: async (timeWindow: 'day' | 'week' = 'week') => {
        const response = await tmdbClient.get(`/trending/tv/${timeWindow}`);
        return response.data;
    },

    getTopRatedTVShows: async (page = 1) => {
        const response = await tmdbClient.get('/tv/top_rated', { params: { page } });
        return response.data;
    },

    getTVShowDetails: async (tvId: number): Promise<TVShowDetails> => {
        const response = await tmdbClient.get(`/tv/${tvId}`, {
            params: {
                append_to_response: 'credits,videos,similar,recommendations',
            },
        });
        return response.data;
    },

    // Search
    searchMulti: async (query: string, page = 1) => {
        const response = await tmdbClient.get('/search/multi', {
            params: { query, page },
        });
        return response.data;
    },

    searchMovies: async (query: string, page = 1) => {
        const response = await tmdbClient.get('/search/movie', {
            params: { query, page },
        });
        return response.data;
    },

    searchTVShows: async (query: string, page = 1) => {
        const response = await tmdbClient.get('/search/tv', {
            params: { query, page },
        });
        return response.data;
    },

    // Genres
    getMovieGenres: async () => {
        const response = await tmdbClient.get('/genre/movie/list');
        return response.data.genres;
    },

    getTVGenres: async () => {
        const response = await tmdbClient.get('/genre/tv/list');
        return response.data.genres;
    },

    // Discovery
    discoverMovies: async (params: {
        page?: number;
        with_genres?: string;
        sort_by?: string;
        year?: number;
        'vote_average.gte'?: number;
    }) => {
        const response = await tmdbClient.get('/discover/movie', { params });
        return response.data;
    },

    discoverTVShows: async (params: {
        page?: number;
        with_genres?: string;
        sort_by?: string;
        first_air_date_year?: number;
        'vote_average.gte'?: number;
    }) => {
        const response = await tmdbClient.get('/discover/tv', { params });
        return response.data;
    },
};

// Helper functions for image URLs
export const getImageUrl = (path: string | null, size: 'w500' | 'w780' | 'original' = 'w500') => {
    if (!path) return '/placeholder-poster.png';
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

export const getBackdropUrl = (path: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280') => {
    if (!path) return '/placeholder-backdrop.png';
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

export default tmdbApi;
