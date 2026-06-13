import { normalizeChannels } from './iptv.normalize';
import type {
    RawChannel,
    RawStream,
    RawCountry,
    RawLogo,
    RawBlocked,
    RawFeed,
    RawCategory,
    RawLanguage,
    TvChannel,
    TvCategory,
    TvCountry,
    TvLanguage,
} from './iptv.types';

const API = 'https://iptv-org.github.io/api';
const DAY_MS = 86400_000;

const FETCH_TIMEOUT_MS = 20000;

async function fetchJson<T>(path: string): Promise<T> {
    const res = await fetch(`${API}/${path}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`iptv-org fetch failed: ${path} (${res.status})`);
    return res.json() as Promise<T>;
}

// In-memory TTL cache. The normalized channel list is ~4MB which exceeds the
// Next.js data-cache 2MB limit, so we memoize in process memory instead. In a
// long-running (output: standalone) server this persists across requests.
interface Cached {
    channels: TvChannel[];
    countries: TvCountry[];
    categories: TvCategory[];
    languages: TvLanguage[];
    at: number;
}
let cache: Cached | null = null;
let inflight: Promise<Cached> | null = null;

async function build(): Promise<Cached> {
    const [channels, streams, countries, logos, blocked, feeds, rawCats, rawLangs] = await Promise.all([
        fetchJson<RawChannel[]>('channels.json'),
        fetchJson<RawStream[]>('streams.json'),
        fetchJson<RawCountry[]>('countries.json'),
        fetchJson<RawLogo[]>('logos.json'),
        fetchJson<RawBlocked[]>('blocklist.json'),
        fetchJson<RawFeed[]>('feeds.json').catch(() => [] as RawFeed[]),
        fetchJson<RawCategory[]>('categories.json').catch(() => [] as RawCategory[]),
        fetchJson<RawLanguage[]>('languages.json').catch(() => [] as RawLanguage[]),
    ]);

    const normalized = normalizeChannels({ channels, streams, countries, logos, blocked, feeds });

    const countrySeen = new Map<string, TvCountry>();
    const catCounts = new Map<string, number>();
    const langCounts = new Map<string, number>();
    for (const c of normalized) {
        if (c.country && !countrySeen.has(c.country.code)) countrySeen.set(c.country.code, c.country);
        for (const cat of c.categories) catCounts.set(cat, (catCounts.get(cat) ?? 0) + 1);
        for (const l of c.languages) langCounts.set(l, (langCounts.get(l) ?? 0) + 1);
    }
    const catName = new Map(rawCats.map((r) => [r.id, r.name]));
    const langName = new Map(rawLangs.map((r) => [r.code, r.name]));

    return {
        channels: normalized,
        countries: [...countrySeen.values()].sort((a, b) => a.name.localeCompare(b.name)),
        categories: [...catCounts.entries()]
            .map(([id, count]) => ({ id, name: catName.get(id) ?? id, count }))
            .sort((a, b) => b.count - a.count),
        languages: [...langCounts.entries()]
            .map(([code, count]) => ({ code, name: langName.get(code) ?? code, count }))
            .sort((a, b) => b.count - a.count),
        at: Date.now(),
    };
}

async function load(): Promise<Cached> {
    if (cache && Date.now() - cache.at < DAY_MS) return cache;
    if (inflight) return inflight;
    inflight = build()
        .then((c) => {
            cache = c;
            return c;
        })
        .finally(() => {
            inflight = null;
        });
    return inflight;
}

async function safeLoad(): Promise<Cached> {
    try {
        return await load();
    } catch {
        // Serve stale cache if available; otherwise empty.
        return cache ?? { channels: [], countries: [], categories: [], languages: [], at: Date.now() };
    }
}

export async function getChannels(): Promise<TvChannel[]> {
    return (await safeLoad()).channels;
}

export async function getChannel(id: string): Promise<TvChannel | null> {
    const { channels } = await safeLoad();
    return channels.find((c) => c.id === id) ?? null;
}

export async function getCountries(): Promise<TvCountry[]> {
    return (await safeLoad()).countries;
}

export async function getCategories(): Promise<TvCategory[]> {
    return (await safeLoad()).categories;
}

export async function getLanguages(): Promise<TvLanguage[]> {
    return (await safeLoad()).languages;
}
