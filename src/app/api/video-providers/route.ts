import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

        // Race between the database and the timeout
        const providers = await Promise.race([dbPromise, timeoutPromise]) as any[];

        return NextResponse.json(providers);
    } catch (error) {
        return NextResponse.json([]);
    }
}

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 1 minute
