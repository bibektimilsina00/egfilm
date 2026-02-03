import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// CORS headers for cross-origin requests (needed for test HTML file)
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * OPTIONS /api/video-providers
 * Handle preflight requests for CORS
 */
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * GET /api/video-providers
 * Get all enabled video providers (public endpoint)
 */
export async function GET() {
    try {
        // Create a controller for the timeout
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Database timeout')), 2000)
        );

        const dbPromise = prisma.videoProvider.findMany({
            where: { isEnabled: true },
            orderBy: [
                { adScore: 'asc' },    // Lowest ad score first (best experience)
                { sortOrder: 'asc' },
                { name: 'asc' }
            ],
            select: {
                id: true,
                name: true,
                slug: true,
                quality: true,
                isDefault: true,
                sortOrder: true,
                movieTemplate: true,
                tvTemplate: true,
                supportsImdb: true,
                supportsTmdb: true,
                hasMultiQuality: true,
                hasSubtitles: true,
                hasAutoplay: true,
                description: true,
                logoUrl: true,
                // Ad tracking stats
                adReports: true,
                totalViews: true,
                adScore: true,
            }
        });

        // Race between the database and the timeout
        const providers = await Promise.race([dbPromise, timeoutPromise]) as any[];

        return NextResponse.json(providers, { headers: corsHeaders });
    } catch (error) {
        return NextResponse.json([], { headers: corsHeaders });
    }
}

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 1 minute
