import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { prisma } from '@egfilm/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/sports-analytics?window=24h|7d|30d
 *
 * Aggregates SportsSourceReport rows into three views:
 *   - bySource:  which sources fail the most (all reasons combined)
 *   - byProvider: which upstream provider is failing most
 *   - byMatch:   which matches suffered the most reports
 *   - byCountry: geographic spread (helps spot geo-blocks)
 */

const WINDOWS: Record<string, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
};

export async function GET(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        const { searchParams } = new URL(request.url);
        const windowKey = searchParams.get('window') || '7d';
        const ms = WINDOWS[windowKey] ?? WINDOWS['7d'];
        const since = new Date(Date.now() - ms);

        const [bySource, byProvider, byMatch, byCountry, total] = await Promise.all([
            prisma.sportsSourceReport.groupBy({
                by: ['sourceKey', 'providerName'],
                where: { createdAt: { gte: since } },
                _count: { sourceKey: true },
                orderBy: { _count: { sourceKey: 'desc' } },
                take: 50,
            }),
            prisma.sportsSourceReport.groupBy({
                by: ['providerName'],
                where: { createdAt: { gte: since } },
                _count: { providerName: true },
                orderBy: { _count: { providerName: 'desc' } },
            }),
            prisma.sportsSourceReport.groupBy({
                by: ['matchKey'],
                where: { createdAt: { gte: since } },
                _count: { matchKey: true },
                orderBy: { _count: { matchKey: 'desc' } },
                take: 25,
            }),
            prisma.sportsSourceReport.groupBy({
                by: ['country'],
                where: { createdAt: { gte: since }, country: { not: null } },
                _count: { country: true },
                orderBy: { _count: { country: 'desc' } },
                take: 25,
            }),
            prisma.sportsSourceReport.count({ where: { createdAt: { gte: since } } }),
        ]);

        return NextResponse.json({
            window: windowKey,
            total,
            bySource: bySource.map((r) => ({ sourceKey: r.sourceKey, providerName: r.providerName, count: r._count.sourceKey })),
            byProvider: byProvider.map((r) => ({ providerName: r.providerName, count: r._count.providerName })),
            byMatch: byMatch.map((r) => ({ matchKey: r.matchKey, count: r._count.matchKey })),
            byCountry: byCountry.map((r) => ({ country: r.country, count: r._count.country })),
        });
    } catch (e) {
        console.error('sports-analytics failed', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
