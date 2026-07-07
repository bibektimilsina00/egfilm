import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deleteMatchComment } from '@egfilm/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** DELETE /api/match-comments/[id] — delete own comment (or as admin/moderator). */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const role = (session.user as { role?: string }).role;
    const isAdmin = role === 'admin' || role === 'moderator';
    try {
        await deleteMatchComment(session.user.id, id, isAdmin);
        return NextResponse.json({ ok: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed';
        return NextResponse.json({ error: msg }, { status: msg === 'Forbidden' ? 403 : 400 });
    }
}
