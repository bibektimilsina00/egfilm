import 'server-only';
import type {
    PlayerListItem, PlayerDetail, PlayerStatLine, CareerEntry, TransferEntry,
    TeamListItem, TeamDetail, SquadPlayer, TeamFixture, Venue, Paged,
} from './v2-types';

/**
 * BSD v2 server-side client for players & teams (and their sub-resources).
 * Same token + TTL-cache discipline as the v1 client: the token never leaves
 * the server, and responses are cached per-instance to stay fast and polite.
 */

const BASE = 'https://sports.bzzoiro.com/api/v2';
const TOKEN = process.env.BSD_API_TOKEN;

export function bsdConfigured(): boolean {
    return !!TOKEN;
}

const cache = new Map<string, { value: unknown; expires: number }>();

async function get<T>(path: string, ttlMs: number): Promise<T> {
    if (!TOKEN) throw new Error('BSD_API_TOKEN not configured');
    const now = Date.now();
    const hit = cache.get(path);
    if (hit && hit.expires > now) return hit.value as T;
    const res = await fetch(`${BASE}${path}`, {
        headers: { Authorization: `Token ${TOKEN}`, Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) throw new Error(`BSD v2 ${path} -> ${res.status}`);
    const value = (await res.json()) as T;
    cache.set(path, { value, expires: now + ttlMs });
    if (cache.size > 800) for (const [k, v] of cache) if (v.expires <= now) cache.delete(k);
    return value;
}

/** Resolve a sub-resource that may 404 or error into a safe fallback. */
async function soft<T>(p: Promise<T>, fallback: T): Promise<T> {
    try {
        return await p;
    } catch {
        return fallback;
    }
}

const n = (v: unknown): number | null => {
    const x = typeof v === 'string' ? parseFloat(v) : (v as number);
    return Number.isFinite(x) ? x : null;
};
const s = (v: unknown): string | null => (v == null || v === '' ? null : String(v));
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
/** Read a name from a value that may be a plain string or a `{ name }` object. */
const nameOf = (v: unknown): string | null => {
    if (typeof v === 'string') return v || null;
    if (v && typeof v === 'object' && 'name' in v) return s((v as { name?: unknown }).name);
    return null;
};

// ---------- raw shapes (only fields we read) ----------

interface RawPlayer {
    id: number;
    name: string;
    short_name?: string;
    position?: string;
    specific_position?: string;
    jersey_number?: string | number;
    nationality?: string;
    current_team_id?: number;
    national_team_id?: number;
    market_value_eur?: number;
    rating?: number;
    date_of_birth?: string;
    height_cm?: number;
    weight_kg?: number;
    preferred_foot?: string;
    contract_until?: string;
    availability?: string;
    potential?: number;
    injury_risk?: string;
    wage_eur_annual?: number;
    strengths?: unknown;
    weaknesses?: unknown;
    attributes?: Record<string, number> | null;
}
interface RawTeam {
    id: number;
    name: string;
    short_name?: string;
    country?: string;
    venue_id?: number;
}
interface RawEvent {
    id: number;
    home_team?: string;
    away_team?: string;
    home_score?: number;
    away_score?: number;
    event_date?: string;
    status?: string;
    category?: string;
    league?: { name?: string };
}

// ---------- mappers ----------

function toPlayerListItem(p: RawPlayer): PlayerListItem {
    return {
        id: p.id,
        name: p.name,
        shortName: s(p.short_name),
        position: s(p.position),
        specificPosition: s(p.specific_position),
        jerseyNumber: s(p.jersey_number),
        nationality: s(p.nationality),
        currentTeamId: p.current_team_id ?? null,
        marketValueEur: p.market_value_eur ?? null,
        rating: n(p.rating),
    };
}

function toTeamListItem(t: RawTeam): TeamListItem {
    return { id: t.id, name: t.name, shortName: s(t.short_name), country: s(t.country), venueId: t.venue_id ?? null };
}

function toFixture(e: RawEvent): TeamFixture {
    return {
        id: e.id,
        homeTeam: e.home_team ?? 'Home',
        awayTeam: e.away_team ?? 'Away',
        homeScore: e.home_score ?? null,
        awayScore: e.away_score ?? null,
        date: s(e.event_date),
        status: s(e.status),
        league: s(e.league?.name),
        category: e.category ?? 'football',
    };
}

// ---------- players ----------

function playerQuery(opts: { name?: string; position?: string; limit?: number; offset?: number }): string {
    const q = new URLSearchParams();
    if (opts.name) q.set('name', opts.name);
    if (opts.position) q.set('position', opts.position);
    q.set('limit', String(opts.limit ?? 30));
    q.set('offset', String(opts.offset ?? 0));
    return q.toString();
}

export async function listPlayers(opts: { name?: string; position?: string; limit?: number; offset?: number }): Promise<Paged<PlayerListItem>> {
    const data = await get<{ count?: number; results?: RawPlayer[] }>(`/players/?${playerQuery(opts)}`, 60_000);
    return { count: data.count ?? 0, results: (data.results ?? []).map(toPlayerListItem) };
}

export async function getPlayer(id: number): Promise<PlayerDetail | null> {
    let raw: RawPlayer;
    try {
        raw = await get<RawPlayer>(`/players/${id}/`, 10 * 60_000);
    } catch {
        return null;
    }
    if (!raw?.id) return null;

    const [statsRaw, careerRaw, transfersRaw, team] = await Promise.all([
        soft(get<{ results?: unknown[] } | unknown[]>(`/players/${id}/stats/`, 5 * 60_000), [] as unknown[]),
        soft(get<{ results?: unknown[] } | unknown[]>(`/players/${id}/career/`, 30 * 60_000), [] as unknown[]),
        soft(get<{ results?: unknown[] } | unknown[]>(`/players/${id}/transfers/`, 30 * 60_000), [] as unknown[]),
        raw.current_team_id ? soft(getTeamListItem(raw.current_team_id), null) : Promise.resolve(null),
    ]);

    const asRows = (x: { results?: unknown[] } | unknown[]): Record<string, unknown>[] =>
        (Array.isArray(x) ? x : (x.results ?? [])) as Record<string, unknown>[];

    const stats: PlayerStatLine[] = asRows(statsRaw).slice(0, 15).map((r) => ({
        competition: nameOf(r.competition) ?? nameOf(r.league),
        season: nameOf(r.season),
        appearances: n(r.appearances ?? r.matches ?? r.games),
        goals: n(r.goals),
        assists: n(r.assists),
        minutes: n(r.minutes ?? r.minutes_played),
        yellow: n(r.yellow_cards ?? r.yellow),
        red: n(r.red_cards ?? r.red),
        rating: n(r.rating ?? r.avg_rating),
    }));
    const career: CareerEntry[] = asRows(careerRaw).map((r) => ({
        team: nameOf(r.team) ?? s(r.team_name),
        from: s(r.from ?? r.start_date ?? r.season_start),
        to: s(r.to ?? r.end_date ?? r.season_end),
        appearances: n(r.appearances ?? r.matches),
        goals: n(r.goals),
    }));
    const transfers: TransferEntry[] = asRows(transfersRaw).map((r) => ({
        date: s(r.date ?? r.transfer_date),
        from: nameOf(r.from) ?? nameOf(r.from_team),
        to: nameOf(r.to) ?? nameOf(r.to_team),
        fee: s(r.fee ?? r.fee_text),
        type: s(r.type ?? r.transfer_type),
    }));

    return {
        ...toPlayerListItem(raw),
        dateOfBirth: s(raw.date_of_birth),
        heightCm: raw.height_cm ?? null,
        weightKg: raw.weight_kg ?? null,
        preferredFoot: s(raw.preferred_foot),
        nationalTeamId: raw.national_team_id ?? null,
        contractUntil: s(raw.contract_until),
        availability: s(raw.availability),
        potential: n(raw.potential),
        injuryRisk: s(raw.injury_risk),
        wageEurAnnual: raw.wage_eur_annual ?? null,
        strengths: arr(raw.strengths),
        weaknesses: arr(raw.weaknesses),
        attributes: raw.attributes ?? null,
        team,
        stats,
        career,
        transfers,
    };
}

// ---------- teams ----------

export async function listTeams(opts: { name?: string; limit?: number; offset?: number }): Promise<Paged<TeamListItem>> {
    const q = new URLSearchParams();
    if (opts.name) q.set('name', opts.name);
    q.set('limit', String(opts.limit ?? 30));
    q.set('offset', String(opts.offset ?? 0));
    const data = await get<{ count?: number; results?: RawTeam[] }>(`/teams/?${q.toString()}`, 5 * 60_000);
    return { count: data.count ?? 0, results: (data.results ?? []).map(toTeamListItem) };
}

async function getTeamListItem(id: number): Promise<TeamListItem | null> {
    try {
        const raw = await get<RawTeam>(`/teams/${id}/`, 10 * 60_000);
        return raw?.id ? toTeamListItem(raw) : null;
    } catch {
        return null;
    }
}

export async function getTeam(id: number): Promise<TeamDetail | null> {
    let raw: RawTeam;
    try {
        raw = await get<RawTeam>(`/teams/${id}/`, 10 * 60_000);
    } catch {
        return null;
    }
    if (!raw?.id) return null;

    const [squadRaw, fixturesRaw, venue] = await Promise.all([
        soft(get<{ players?: Record<string, unknown>[] }>(`/teams/${id}/squad/`, 10 * 60_000), { players: [] }),
        soft(get<{ results?: RawEvent[] } | RawEvent[]>(`/teams/${id}/fixtures/`, 2 * 60_000), [] as RawEvent[]),
        raw.venue_id ? soft(getVenue(raw.venue_id), null) : Promise.resolve(null),
    ]);

    const squad: SquadPlayer[] = (squadRaw.players ?? []).map((p) => ({
        id: Number(p.id ?? p.player_id),
        name: String(p.name ?? ''),
        position: s(p.position ?? p.specific_position),
        jerseyNumber: s(p.jersey_number),
        nationality: s(p.nationality),
        marketValueEur: (p.market_value_eur as number) ?? null,
    })).filter((p) => p.id && p.name);

    const fxArr = Array.isArray(fixturesRaw) ? fixturesRaw : (fixturesRaw.results ?? []);
    const fixtures: TeamFixture[] = fxArr.map(toFixture);

    return { ...toTeamListItem(raw), venue, squad, fixtures };
}

async function getVenue(id: number): Promise<Venue | null> {
    try {
        const raw = await get<{ id: number; name: string; city?: string; country?: string; capacity?: number; built_year?: number }>(`/venues/${id}/`, 30 * 60_000);
        return raw?.id ? { id: raw.id, name: raw.name, city: s(raw.city), country: s(raw.country), capacity: raw.capacity ?? null, builtYear: raw.built_year ?? null } : null;
    } catch {
        return null;
    }
}
