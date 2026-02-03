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
 * POST /api/video-providers/[slug]/report-ad
 * Report that an ad was shown on this provider
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        // Increment adReports and recalculate adScore
        const provider = await prisma.videoProvider.update({
            where: { slug },
            data: {
                adReports: { increment: 1 },
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

        // Check if we should auto-update default provider
        await updateDefaultProvider();

        return NextResponse.json({
            success: true,
            provider: updated.name,
            adReports: updated.adReports,
            totalViews: updated.totalViews,
            adScore: updated.adScore,
        }, { headers: corsHeaders });

    } catch (error) {
        console.error('Error reporting ad:', error);
        return NextResponse.json(
            { error: 'Failed to report ad' },
            { status: 500, headers: corsHeaders }
        );
    }
}

/**
 * Auto-update default provider to the one with lowest ad score
 * Only changes default if the current best has significantly lower score
 */
async function updateDefaultProvider() {
    // Get provider with lowest ad score (minimum 10 views to qualify)
    const bestProvider = await prisma.videoProvider.findFirst({
        where: {
            isEnabled: true,
            totalViews: { gte: 10 }, // Need at least 10 views to qualify
        },
        orderBy: [
            { adScore: 'asc' },
            { sortOrder: 'asc' },
        ],
    });

    if (!bestProvider) return;

    // Get current default
    const currentDefault = await prisma.videoProvider.findFirst({
        where: { isDefault: true },
    });

    // Only switch if best provider has 20% better ad score
    if (currentDefault && bestProvider.id !== currentDefault.id) {
        const improvement = currentDefault.adScore - bestProvider.adScore;
        if (improvement > 0.2 || currentDefault.adScore === 0) {
            // Switch default
            await prisma.$transaction([
                prisma.videoProvider.updateMany({
                    where: { isDefault: true },
                    data: { isDefault: false },
                }),
                prisma.videoProvider.update({
                    where: { id: bestProvider.id },
                    data: { isDefault: true },
                }),
            ]);
            console.log(`🔄 Auto-switched default provider to ${bestProvider.name} (adScore: ${bestProvider.adScore})`);
        }
    }
}
