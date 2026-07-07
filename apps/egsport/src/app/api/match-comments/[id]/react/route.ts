import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { toggleReaction } from '@egfilm/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/match-comments/[id]/react { type } — toggle a reaction (auth required). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    let body: { type?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }
    if (!body.type) return NextResponse.json({ error: 'Missing type' }, { status: 400 });
    try {
        const reactions = await toggleReaction(session.user.id, id, body.type);
        return NextResponse.json({ reactions });
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 400 });
    }
}
