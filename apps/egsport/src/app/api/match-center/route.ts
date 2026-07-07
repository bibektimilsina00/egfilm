import { NextRequest, NextResponse } from 'next/server';
import { bsdConfigured, findEventId, getEvent, getIncidents } from '@/lib/bsd/client';
import { normalizeMatchCenter } from '@/lib/bsd/normalize';
import { EMPTY_MATCH_CENTER } from '@/lib/bsd/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/match-center?home=<team>&away=<team>&date=<ms>
 *
 * Resolves a streaming match to its BSD fixture and returns the normalised
 * match-center payload. Never exposes the BSD token to the client. Returns
 * `{ found: false }` (200) when BSD isn't configured or has no such fixture,
 * so the UI can simply render nothing.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const home = searchParams.get('home')?.trim();
    const away = searchParams.get('away')?.trim();
    const dateMs = Number(searchParams.get('date'));

    if (!bsdConfigured() || !home || !away || !Number.isFinite(dateMs)) {
        return NextResponse.json(EMPTY_MATCH_CENTER);
    }

    try {
        const eventId = await findEventId(home, away, dateMs);
        if (!eventId) return NextResponse.json(EMPTY_MATCH_CENTER);

        const [event, incidents] = await Promise.all([getEvent(eventId), getIncidents(eventId)]);
        const data = normalizeMatchCenter(event, incidents);

        // Cache at the edge/CDN: short for live, longer once finished.
        const ttl = data.live ? 20 : 120;
        return NextResponse.json(data, {
            headers: { 'Cache-Control': `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 3}` },
        });
    } catch {
        return NextResponse.json(EMPTY_MATCH_CENTER);
    }
}
