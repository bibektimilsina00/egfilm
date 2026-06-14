import { prisma } from '@egfilm/db';

// In-memory cache so we don't hit the DB on every TMDB call.
// Single-process cache; if you scale horizontally each replica caches its own.
const TTL_MS = 5 * 60 * 1000;
let cached: { key: string; expires: number } | null = null;

/**
 * Resolves the active TMDB API key.
 *
 * Resolution order:
 *  1. In-memory cache (5 min TTL).
 *  2. Most recently updated admin user's `tmdbApiKey`.
 *  3. `process.env.TMDB_API_KEY` fallback.
 *
 * Returns `null` if no key is available anywhere.
 */
export async function getActiveTmdbKey(): Promise<string | null> {
    if (cached && cached.expires > Date.now()) return cached.key;

    let key: string | null = null;
    try {
        const admin = await prisma.user.findFirst({
            where: { role: 'admin', tmdbApiKey: { not: null } },
            orderBy: { updatedAt: 'desc' },
            select: { tmdbApiKey: true },
        });
        key = admin?.tmdbApiKey ?? null;
    } catch (err) {
        // DB down → fall back to env so the app keeps working.
        console.error('[tmdbKey] DB lookup failed; using env fallback:', err);
    }

    if (!key) key = process.env.TMDB_API_KEY ?? null;
    if (key) cached = { key, expires: Date.now() + TTL_MS };
    return key;
}

/** Clear the cache so the next call re-reads the DB. Call after admin saves a new key. */
export function invalidateTmdbKeyCache(): void {
    cached = null;
}
