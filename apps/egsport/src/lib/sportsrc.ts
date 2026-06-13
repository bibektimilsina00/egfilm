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
    const body = res.data as ApiEnvelope<T> & { data?: T };
    if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
        return body.data as T;
    }
    return body as T;
}

// ---------- Sports categories ----------

export interface SportCategory {
    id: string;
    name: string;
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
    getMatches(category: string): Promise<Match[]> {
        return sportsrcGet<Match[]>({ data: 'matches', category });
    },
    async getMatchDetail(category: string, id: string): Promise<MatchDetail | null> {
        const data = await sportsrcGet<MatchDetail | null>({ data: 'detail', category, id });
        return data ?? null;
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

export function pickBestSource(detail: MatchDetail | null | undefined, preferredLanguage = 'English'): MatchSource | null {
    if (!detail?.sources?.length) return null;
    const english = detail.sources.filter((s) => (s.language ?? '').toLowerCase().includes(preferredLanguage.toLowerCase()));
    const pool = english.length ? english : detail.sources;
    const hd = pool.find((s) => s.hd);
    return hd ?? pool[0] ?? null;
}
