import axios, { AxiosInstance } from 'axios';

export const SPORTSRC_BASE_URL = 'https://api.sportsrc.org';

const httpClient: AxiosInstance = axios.create({
    baseURL: SPORTSRC_BASE_URL,
    timeout: 15000,
    headers: { Accept: 'application/json' },
});

class TokenBucket {
    private tokens: number;
    private last: number;
    constructor(private capacity: number, private refillPerSecond: number) {
        this.tokens = capacity;
        this.last = Date.now();
    }
    async take(): Promise<void> {
        const now = Date.now();
        const elapsed = (now - this.last) / 1000;
        this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillPerSecond);
        this.last = now;
        if (this.tokens >= 1) {
            this.tokens -= 1;
            return;
        }
        const waitMs = ((1 - this.tokens) / this.refillPerSecond) * 1000;
        await new Promise((r) => setTimeout(r, waitMs));
        return this.take();
    }
}

const bucket = new TokenBucket(20, 20);

interface ApiEnvelope<T> {
    success: boolean;
    data: T;
}

async function sportsrcGet<T>(params: Record<string, string>): Promise<T> {
    await bucket.take();
    const res = await httpClient.get<ApiEnvelope<T> | T>('/', { params });
    const body = res.data as ApiEnvelope<T> & { data?: T; error?: string };
    if (body && typeof body === 'object' && 'success' in body) {
        if (body.success === false) {
            throw new Error(body.error || 'sportsrc request failed');
        }
        if ('data' in body) return body.data as T;
    }
    return body as T;
}

// ---------- Sports categories ----------

export interface SportCategory {
    id: string;
    name: string;
    category?: string;
}

// ---------- Match ----------

export interface MatchTeam {
    name: string;
    badge: string | null;
}

export interface Match {
    id: string;
    title: string;
    category: string;
    /** Unix epoch in milliseconds. */
    date: number;
    popular?: boolean;
    poster: string | null;
    teams: {
        home: MatchTeam;
        away: MatchTeam;
    };
}

export interface MatchSource {
    id: string;
    streamNo: number;
    language: string;
    hd: boolean;
    embedUrl: string;
    source?: string;
    viewers?: number;
}

export interface MatchDetail extends Match {
    sources: MatchSource[];
}

// ---------- Leagues ----------

export interface League {
    id: string;
    name: string;
    code?: string;
    country?: string;
}

// ---------- Tables (standings) ----------

export interface StandingTeam {
    id: number;
    name: string;
    shortName?: string;
    tla?: string;
    crest?: string;
}

export interface StandingRow {
    position: number;
    team: StandingTeam;
    playedGames: number;
    form?: string | null;
    won: number;
    draw: number;
    lost: number;
    points: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
}

export interface StandingsGroup {
    stage: string;
    type: string;
    group: string | null;
    table: StandingRow[];
}

export interface TablesResponse {
    filters: { season: string };
    area: { id: number; name: string; code: string; flag: string };
    competition: { id: number; name: string; code: string; type: string; emblem: string };
    season: { id: number; startDate: string; endDate: string; currentMatchday: number; winner: unknown };
    standings: StandingsGroup[];
}

// ---------- Scores ----------

export interface ScoreEntry {
    id?: string | number;
    utcDate?: string;
    status?: string;
    homeTeam?: { id?: number; name?: string; crest?: string };
    awayTeam?: { id?: number; name?: string; crest?: string };
    score?: {
        fullTime?: { home?: number | null; away?: number | null };
        halfTime?: { home?: number | null; away?: number | null };
        winner?: string | null;
    };
    competition?: { id?: number; name?: string; emblem?: string };
    [key: string]: unknown;
}

export interface ScoresResponse {
    live: ScoreEntry[];
    finished: ScoreEntry[];
    last_updated?: string;
}

// ---------- Public client ----------

export const sportsrc = {
    getSports(): Promise<SportCategory[]> {
        return sportsrcGet<SportCategory[]>({ data: 'sports' });
    },
    async getMatches(category: string): Promise<Match[]> {
        // The provider's per-sport `matches` buckets are now empty; all active
        // matches are served from the single `live` bucket. Try the requested
        // category first, then fall back to `live` filtered by the match's own
        // `category` field so per-sport UI sections keep working.
        const direct = await sportsrcGet<Match[]>({ data: 'matches', category });
        if (Array.isArray(direct) && direct.length > 0) return direct;
        if (category === 'live') return direct ?? [];
        const live = await sportsrcGet<Match[]>({ data: 'matches', category: 'live' });
        if (!Array.isArray(live)) return [];
        return live.filter((m) => (m.category ?? '').toLowerCase() === category.toLowerCase());
    },
    async getMatchDetail(category: string, id: string): Promise<MatchDetail | null> {
        // Detail lookups only resolve under the `live` bucket now; the per-sport
        // category returns "not found". Try the given category, then retry `live`.
        try {
            const data = await sportsrcGet<MatchDetail | null>({ data: 'detail', category, id });
            if (data) return data;
        } catch {
            // fall through to the `live` bucket
        }
        if (category !== 'live') {
            const live = await sportsrcGet<MatchDetail | null>({ data: 'detail', category: 'live', id });
            if (live) return live;
        }
        return null;
    },
    getLeagues(): Promise<League[]> {
        return sportsrcGet<League[]>({ data: 'results', category: 'leagues' });
    },
    getStandings(league: string): Promise<TablesResponse | null> {
        return sportsrcGet<TablesResponse>({ data: 'results', category: 'tables', league });
    },
    getScores(league: string): Promise<ScoresResponse> {
        return sportsrcGet<ScoresResponse>({ data: 'results', category: 'scores', league });
    },
};

// ---------- Helpers ----------

export function matchExternalIdHash(category: string, id: string | number): number {
    const s = `${category}:${id}`;
    let hash = 5381;
    for (let i = 0; i < s.length; i++) hash = ((hash << 5) + hash) ^ s.charCodeAt(i);
    return Math.abs(hash) & 0x7fffffff;
}

export function getMatchKickoff(match: Match | MatchDetail | null | undefined): Date | null {
    if (!match?.date) return null;
    const d = new Date(match.date);
    return Number.isNaN(d.getTime()) ? null : d;
}

export function isMatchLive(match: Match | MatchDetail): boolean {
    const kickoff = getMatchKickoff(match);
    if (!kickoff) return false;
    const now = Date.now();
    const startedAt = kickoff.getTime();
    return now >= startedAt && now <= startedAt + 1000 * 60 * 60 * 3;
}

/**
 * Resolve the iframe URL for a source.
 *
 * The API's `embedUrl` points at the `embed.streamapi.cc` wrapper, which injects
 * a rotating pop-under ad script + a Histats tracker around the real player
 * (`embed.st`). When we have the underlying `source`/`id`/`streamNo`, we build the
 * inner `embed.st` URL directly and skip that wrapper layer — removing one ad
 * layer. The inner player still serves its own ads; this is a partial reduction,
 * not full ad-block. Falls back to the original `embedUrl` if fields are missing.
 */
export function resolveEmbedUrl(s: MatchSource): string {
    if (s.source && s.id && s.streamNo != null) {
        return `https://embed.st/embed/${s.source}/${s.id}/${s.streamNo}`;
    }
    return s.embedUrl;
}

export function pickBestSource(detail: MatchDetail | null | undefined, preferredLanguage = 'English'): MatchSource | null {
    if (!detail?.sources?.length) return null;
    const english = detail.sources.filter((s) => (s.language ?? '').toLowerCase().includes(preferredLanguage.toLowerCase()));
    const pool = english.length ? english : detail.sources;
    const hd = pool.find((s) => s.hd);
    return hd ?? pool[0] ?? null;
}
