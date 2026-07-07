import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listMatchComments, createMatchComment } from '@egfilm/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function roleOf(session: { user?: { role?: string } } | null): boolean {
    const role = session?.user?.role;
    return role === 'admin' || role === 'moderator';
}

/** GET /api/match-comments?matchKey= — public list (reactions marked for the signed-in user). */
export async function GET(req: NextRequest) {
    const matchKey = new URL(req.url).searchParams.get('matchKey')?.trim();
    if (!matchKey) return NextResponse.json({ error: 'Missing matchKey' }, { status: 400 });
    const session = await auth();
    const comments = await listMatchComments(matchKey, session?.user?.id, roleOf(session));
    return NextResponse.json({ comments });
}

/** POST /api/match-comments — create a comment (auth required). */
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    let body: { matchKey?: string; content?: string; parentId?: string | null };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }
    if (!body.matchKey || !body.content?.trim()) return NextResponse.json({ error: 'Missing matchKey or content' }, { status: 400 });
    try {
        const comment = await createMatchComment(session.user.id, {
            matchKey: body.matchKey,
            content: body.content,
            parentId: body.parentId ?? null,
        }, roleOf(session));
        return NextResponse.json({ comment }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 400 });
    }
}
