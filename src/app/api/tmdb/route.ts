import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

export async function GET() {
    return NextResponse.json({
        configured: !!TMDB_API_KEY,
        baseUrl: 'https://api.themoviedb.org/3',
        proxyPath: '/api/tmdb',
        endpoints: {
            trending: '/api/tmdb/trending/{media_type}/{time_window}',
            movie: '/api/tmdb/movie/{movie_id}',
            tv: '/api/tmdb/tv/{tv_id}',
            search: '/api/tmdb/search/{search_type}',
            popular: {
                movies: '/api/tmdb/movie/popular',
                tv: '/api/tmdb/tv/popular'
            }
        },
        status: TMDB_API_KEY ? 'ready' : 'api_key_missing'
    });
}