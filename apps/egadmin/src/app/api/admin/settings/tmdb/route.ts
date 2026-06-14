import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@egfilm/db';
import { invalidateTmdbKeyCache } from '@egfilm/services';

// GET — return masked status of the current admin's stored TMDB key.
export async function GET() {
    const session = await auth();
    const role = (session?.user as unknown as { role?: string } | undefined)?.role;
    if (!session?.user?.id || role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { tmdbApiKey: true, updatedAt: true },
    });
    return NextResponse.json({
        hasKey: !!user?.tmdbApiKey,
        masked: user?.tmdbApiKey ? `••••${user.tmdbApiKey.slice(-4)}` : null,
        updatedAt: user?.updatedAt ?? null,
    });
}

// PUT — set / replace the current admin's TMDB key.
export async function PUT(req: NextRequest) {
    const session = await auth();
    const role = (session?.user as unknown as { role?: string } | undefined)?.role;
    if (!session?.user?.id || role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const tmdbApiKey = typeof body?.tmdbApiKey === 'string' ? body.tmdbApiKey.trim() : '';
    if (!tmdbApiKey) return NextResponse.json({ error: 'tmdbApiKey required' }, { status: 400 });

    await prisma.user.update({
        where: { id: session.user.id },
        data: { tmdbApiKey },
    });
    invalidateTmdbKeyCache();
    return NextResponse.json({ ok: true });
}

// DELETE — clear the current admin's TMDB key (system falls back to env var).
export async function DELETE() {
    const session = await auth();
    const role = (session?.user as unknown as { role?: string } | undefined)?.role;
    if (!session?.user?.id || role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await prisma.user.update({
        where: { id: session.user.id },
        data: { tmdbApiKey: null },
    });
    invalidateTmdbKeyCache();
    return NextResponse.json({ ok: true });
}
