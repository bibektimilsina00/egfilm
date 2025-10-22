/**
 * TMDb API Proxy
 * Proxies requests to TMDb API to hide API key from client
 * GET /api/tmdb/[...path] - Proxy any TMDb API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        if (!TMDB_API_KEY) {
            return NextResponse.json(
                { error: 'TMDb API key not configured' },
                { status: 500 }
            );
        }

        const { path } = await params;
        const tmdbPath = path.join('/');
        
        // Get query parameters from the request
        const searchParams = request.nextUrl.searchParams;
        const queryString = searchParams.toString();
        
        // Build TMDb URL with API key
        const url = `${TMDB_BASE_URL}/${tmdbPath}?api_key=${TMDB_API_KEY}${queryString ? `&${queryString}` : ''}`;
        
        // Forward request to TMDb
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            next: {
                revalidate: 3600, // Cache for 1 hour
            },
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(
                { error: error.status_message || 'TMDb API error' },
                { status: response.status }
            );
        }

        const data = await response.json();
        
        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error: any) {
        console.error('TMDb proxy error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch from TMDb' },
            { status: 500 }
        );
    }
}
