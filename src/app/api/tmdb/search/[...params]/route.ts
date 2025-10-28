import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

export async function GET(
    request: NextRequest,
    { params }: { params: { params: string[] } }
) {
    if (!TMDB_API_KEY) {
        return NextResponse.json(
            { error: 'TMDB API key not configured' },
            { status: 500 }
        );
    }

    try {
        // Build the path from params 
        // Examples: ['multi'] -> 'multi', ['movie'] -> 'movie'
        const path = params.params.join('/');

        // Get query parameters from the request
        const searchParams = request.nextUrl.searchParams;
        const queryString = new URLSearchParams();

        // Add the API key
        queryString.set('api_key', TMDB_API_KEY);

        // Forward all other query parameters
        for (const [key, value] of searchParams.entries()) {
            queryString.set(key, value);
        }

        const url = `${TMDB_BASE_URL}/search/${path}?${queryString.toString()}`;

        const response = await axios.get(url, {
            timeout: 10000,
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error('TMDB Search API Error:', error.response?.data || error.message);

        if (error.response?.status === 401) {
            return NextResponse.json(
                { error: 'Invalid TMDB API key' },
                { status: 401 }
            );
        }

        if (error.response?.status === 404) {
            return NextResponse.json(
                { error: 'Search endpoint not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}