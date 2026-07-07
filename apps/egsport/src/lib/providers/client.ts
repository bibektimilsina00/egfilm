import type { Match, MatchDetail, League, TablesResponse, ScoresResponse, SportCategory } from '../sportsrc';
import { SportsProvider } from './base';
import { SportsrcProvider } from './sportsrc-provider';
import { StreamedProvider } from './streamed-provider';

/**
 * Multi-provider failover client.
 *
 * Providers are tried in order. The first one that answers without error (and,
 * for list calls, with a non-empty result) wins. A provider that throws is put
 * on a short cooldown so we stop hammering a dead host; once every provider is
 * cooling down we ignore the cooldown and try them all again (better a slow
 * answer than none).
 *
 * All mirrors carry ~the same fixtures, so switching provider mid-session is
 * seamless: the next list render simply comes from whichever host is healthy.
 * Match ids are provider-specific, so a detail lookup only resolves on the
 * provider that produced the current list; the others return null and are
 * skipped — no misfires, just failover.
 */

const COOLDOWN_MS = 60_000;

const sportsrcProvider = new SportsrcProvider();

const providers: SportsProvider[] = [
    sportsrcProvider,
    new StreamedProvider('https://streamed.pk', 'streamed.pk'),
    new StreamedProvider('https://streamed.st', 'streamed.st'),
];

const failUntil = new Map<string, number>();

function healthyFirst(): SportsProvider[] {
    const now = Date.now();
    const healthy = providers.filter((p) => (failUntil.get(p.name) ?? 0) <= now);
    // If everything is cooling down, try them all anyway rather than give up.
    return healthy.length ? healthy : providers;
}

function markFailed(p: SportsProvider) {
    failUntil.set(p.name, Date.now() + COOLDOWN_MS);
    if (typeof console !== 'undefined') console.warn(`[sports] provider "${p.name}" failed, cooling down ${COOLDOWN_MS / 1000}s`);
}

function markOk(p: SportsProvider) {
    if (failUntil.has(p.name)) failUntil.delete(p.name);
}

/**
 * Run `fn` against providers in health order until one succeeds. `accept`
 * decides whether a non-throwing result is good enough to stop (used to treat
 * an empty list from a healthy provider as "keep trying the others").
 */
async function failover<T>(fn: (p: SportsProvider) => Promise<T>, accept: (v: T) => boolean, fallback: T): Promise<T> {
    let last: T = fallback;
    let any = false;
    for (const p of healthyFirst()) {
        try {
            const v = await fn(p);
            markOk(p);
            any = true;
            if (accept(v)) return v;
            last = v; // remember the (empty-but-valid) result in case nobody has data
        } catch {
            markFailed(p);
        }
    }
    return any ? last : fallback;
}

const nonEmptyArray = <T>(v: T[]) => Array.isArray(v) && v.length > 0;

export const sportsrc = {
    getSports(): Promise<SportCategory[]> {
        return failover((p) => p.getSports(), nonEmptyArray, []);
    },
    getMatches(category: string): Promise<Match[]> {
        return failover((p) => p.getMatches(category), nonEmptyArray, []);
    },
    getMatchDetail(category: string, id: string): Promise<MatchDetail | null> {
        return failover((p) => p.getMatchDetail(category, id), (v) => v != null, null);
    },

    // Leagues / standings / scores exist only on sportsrc; no mirror failover.
    async getLeagues(): Promise<League[]> {
        try {
            return await sportsrcProvider.getLeagues();
        } catch {
            return [];
        }
    },
    async getStandings(league: string): Promise<TablesResponse | null> {
        try {
            return await sportsrcProvider.getStandings(league);
        } catch {
            return null;
        }
    },
    async getScores(league: string): Promise<ScoresResponse> {
        try {
            return await sportsrcProvider.getScores(league);
        } catch {
            return { live: [], finished: [] };
        }
    },
};

/** Ordered provider names, for diagnostics/UI. */
export const providerNames = providers.map((p) => p.name);
