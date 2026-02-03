import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * POST /api/video-providers/[slug]/track-view
 * Track that a provider was viewed/used
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        // Increment totalViews and recalculate adScore
        const provider = await prisma.videoProvider.update({
            where: { slug },
            data: {
                totalViews: { increment: 1 },
            },
        });

        // Recalculate adScore
        const adScore = provider.totalViews > 0
            ? provider.adReports / provider.totalViews
            : 0;

        const updated = await prisma.videoProvider.update({
            where: { slug },
            data: { adScore },
        });

        return NextResponse.json({
            success: true,
            provider: updated.name,
            totalViews: updated.totalViews,
            adScore: updated.adScore,
        }, { headers: corsHeaders });

    } catch (error) {
        console.error('Error tracking view:', error);
        return NextResponse.json(
            { error: 'Failed to track view' },
            { status: 500, headers: corsHeaders }
        );
    }
}
