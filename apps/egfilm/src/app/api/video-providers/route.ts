import { NextResponse } from 'next/server';
import { prisma } from '@egfilm/db';

/**
 * GET /api/video-providers
 * Get all enabled video providers (public endpoint)
 */
export async function GET() {
    try {
        const providers = await prisma.videoProvider.findMany({
            where: { isEnabled: true },
            orderBy: [
                { sortOrder: 'asc' },
                { name: 'asc' }
            ],
            select: {
                id: true,
                name: true,
                slug: true,
                quality: true,
                isDefault: true,
                movieTemplate: true,
                tvTemplate: true,
                supportsImdb: true,
                supportsTmdb: true,
                hasMultiQuality: true,
                hasSubtitles: true,
                hasAutoplay: true,
                description: true,
                logoUrl: true
            }
        });

        return NextResponse.json(providers, {
            headers: {
                // Browser caches 5 min; CDN/edge caches 5 min and serves stale for up to 1h while revalidating.
                'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600',
            },
        });
    } catch (error) {
        console.error('Error fetching video providers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch video providers' },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';
