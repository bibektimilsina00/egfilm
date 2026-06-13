import axios, { AxiosInstance } from 'axios';

export const SPORTSRC_BASE_URL = 'https://api.sportsrc.org';

const httpClient: AxiosInstance = axios.create({
    baseURL: SPORTSRC_BASE_URL,
    timeout: 12000,
    headers: { Accept: 'application/json' },
});

// Token-bucket rate limiter — sportsrc free tier allows 20 rps.
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

async function sportsrcGet<T>(params: Record<string, string>): Promise<T> {
    await bucket.take();
    const res = await httpClient.get<T>('/', { params });
    return res.data;
}

export interface SportCategory {
    id?: string;
    name: string;
    slug?: string;
    icon?: string;
    /**
     * The query string parameter accepted by `?data=matches&category=...`.
     * Where not provided by upstream we fall back to a slugified `name`.
     */
    category?: string;
    [key: string]: unknown;
}

export interface Match {
    id: string | number;
    title?: string;
    homeTeam?: string;
    awayTeam?: string;
    home_team?: string;
    away_team?: string;
    league?: string;
    status?: 'upcoming' | 'live' | 'finished' | string;
    startTime?: string;
    start_time?: string;
    date?: string;
    poster?: string;
    thumbnail?: string;
    category?: string;
    sport?: string;
    [key: string]: unknown;
}

export interface MatchDetail extends Match {
    embed?: string;
    embedUrl?: string;
    embed_url?: string;
    iframe?: string;
    sources?: Array<{ name?: string; url: string; quality?: string }>;
    description?: string;
}

export interface League {
    code: string;
    name: string;
    country?: string;
    flag?: string;
    [key: string]: unknown;
}

export interface StandingRow {
    position?: number;
    rank?: number;
    team?: string;
    teamName?: string;
    played?: number;
    won?: number;
    drawn?: number;
    lost?: number;
    goalsFor?: number;
    goalsAgainst?: number;
    points?: number;
    [key: string]: unknown;
}

export interface ScoreboardEntry {
    date?: string;
    homeTeam?: string;
    awayTeam?: string;
    homeScore?: number;
    awayScore?: number;
    league?: string;
    [key: string]: unknown;
}

function unwrap<T>(payload: unknown): T[] {
    if (Array.isArray(payload)) return payload as T[];
    if (payload && typeof payload === 'object') {
        const obj = payload as Record<string, unknown>;
        for (const key of ['data', 'results', 'items', 'matches', 'sports', 'leagues', 'standings', 'scores']) {
            const v = obj[key];
            if (Array.isArray(v)) return v as T[];
        }
    }
    return [];
}

export const sportsrc = {
    async getSports(): Promise<SportCategory[]> {
        const raw = await sportsrcGet<unknown>({ data: 'sports' });
        return unwrap<SportCategory>(raw).map((s) => ({
            ...s,
            category: s.category ?? s.slug ?? (s.name ?? '').toString().toLowerCase().replace(/\s+/g, '-'),
        }));
    },
    async getMatches(category: string): Promise<Match[]> {
        const raw = await sportsrcGet<unknown>({ data: 'matches', category });
        return unwrap<Match>(raw);
    },
    async getMatchDetail(category: string, id: string): Promise<MatchDetail | null> {
        const raw = await sportsrcGet<unknown>({ data: 'detail', category, id });
        if (!raw) return null;
        if (Array.isArray(raw)) return (raw[0] as MatchDetail) ?? null;
        return raw as MatchDetail;
    },
    async getLeagues(): Promise<League[]> {
        const raw = await sportsrcGet<unknown>({ data: 'results', category: 'leagues' });
        return unwrap<League>(raw);
    },
    async getStandings(league: string): Promise<StandingRow[]> {
        const raw = await sportsrcGet<unknown>({ data: 'results', category: 'tables', league });
        return unwrap<StandingRow>(raw);
    },
    async getScores(league: string): Promise<ScoreboardEntry[]> {
        const raw = await sportsrcGet<unknown>({ data: 'results', category: 'scores', league });
        return unwrap<ScoreboardEntry>(raw);
    },
};

export function matchExternalIdHash(category: string, id: string | number): number {
    const s = `${category}:${id}`;
    let hash = 5381;
    for (let i = 0; i < s.length; i++) hash = ((hash << 5) + hash) ^ s.charCodeAt(i);
    return Math.abs(hash) & 0x7fffffff;
}

export function getMatchTeams(match: Match): { home: string; away: string } {
    return {
        home: (match.homeTeam ?? match.home_team ?? '').toString(),
        away: (match.awayTeam ?? match.away_team ?? '').toString(),
    };
}

export function getMatchKickoff(match: Match): Date | null {
    const raw = match.startTime ?? match.start_time ?? match.date;
    if (!raw) return null;
    const d = new Date(raw as string);
    return Number.isNaN(d.getTime()) ? null : d;
}

export function isMatchLive(match: Match): boolean {
    const status = (match.status ?? '').toString().toLowerCase();
    if (status === 'live' || status === 'inprogress' || status === 'in_progress') return true;
    const kickoff = getMatchKickoff(match);
    if (!kickoff) return false;
    const now = Date.now();
    const startedAt = kickoff.getTime();
    return now >= startedAt && now <= startedAt + 1000 * 60 * 60 * 3;
}

export function getMatchEmbedUrl(detail: MatchDetail | null | undefined): string | null {
    if (!detail) return null;
    const direct = detail.embedUrl ?? detail.embed_url ?? detail.embed ?? detail.iframe;
    if (direct && typeof direct === 'string') return direct;
    if (Array.isArray(detail.sources) && detail.sources.length > 0) return detail.sources[0].url;
    return null;
}
