import axios, { AxiosInstance } from 'axios';
import type { Match, MatchDetail, MatchSource, SportCategory } from '../sportsrc';
import { SportsProvider, TokenBucket } from './base';

/**
 * dlhd.st (DaddyLive) provider. Requires an API key. The key is stored on the
 * SportsProviderConfig row and passed in at construction time.
 *
 * Endpoints:
 *   GET /daddyapi.php?key={K}&endpoint=channels   → { channels: [{channel_id, channel_name, logo_url}] }
 *   GET /daddyapi.php?key={K}&endpoint=schedule   → { day: { category: [{ time, event, channels: [id] }] } }
 *   Streams:  https://dlhd.st/stream/stream-{id}.php
 *
 * We treat each scheduled event as one Match and resolve its playable stream
 * pages as MatchSources.
 */

const BASE_URL = 'https://dlhd.st';
const CACHE_MS = 60_000;

interface RawChannel {
    channel_id: string | number;
    channel_name: string;
    logo_url?: string;
}
interface RawEvent {
    time: string; // "HH:mm" UK GMT
    event: string; // "Team A vs Team B" or generic title
    channels: Array<string | number | RawChannel>;
}
type RawSchedulePayload = Record<string, Record<string, RawEvent[]>>;

function stableEventId(day: string, category: string, e: RawEvent): string {
    const key = `${day}|${category}|${e.time}|${e.event}`;
    // djb2 → hex, kept short
    let h = 5381;
    for (let i = 0; i < key.length; i++) h = ((h << 5) + h) ^ key.charCodeAt(i);
    return (h >>> 0).toString(16);
}

function parseDayTime(day: string, hhmm: string): number {
    // day is like "Tuesday 15th July 2025 - Schedule Time UK GMT" — try to strip
    // to a Date-parseable form. The upstream format is inconsistent, so if we
    // can't parse, return 0 (match still surfaces, sort just puts it earlier).
    const cleaned = day.replace(/(\d+)(st|nd|rd|th)/i, '$1').replace(/-.*$/, '').trim();
    const iso = Date.parse(`${cleaned} ${hhmm} UTC`);
    return Number.isFinite(iso) ? iso : 0;
}

function teamsFromEvent(event: string): { home: { name: string; badge: null }; away: { name: string; badge: null } } {
    const parts = event.split(/\s+vs\.?\s+/i);
    if (parts.length >= 2) return { home: { name: parts[0].trim(), badge: null }, away: { name: parts.slice(1).join(' vs ').trim(), badge: null } };
    return { home: { name: event.trim(), badge: null }, away: { name: '', badge: null } };
}

function normalizeCategory(cat: string): string {
    const c = cat.toLowerCase();
    if (c.includes('foot') && !c.includes('am')) return 'football';
    if (c.includes('am') && c.includes('football')) return 'american-football';
    if (c.includes('basket')) return 'basketball';
    if (c.includes('tennis')) return 'tennis';
    if (c.includes('cricket')) return 'cricket';
    if (c.includes('rugby')) return 'rugby';
    if (c.includes('hockey')) return 'hockey';
    if (c.includes('base')) return 'baseball';
    if (c.includes('golf')) return 'golf';
    if (c.includes('motor') || c.includes('formula') || c.includes('nascar')) return 'motor-sports';
    if (c.includes('fight') || c.includes('mma') || c.includes('boxing')) return 'fight';
    return 'other';
}

export class DlhdProvider implements SportsProvider {
    readonly name: string;
    private base: string;
    private key: string;
    private http: AxiosInstance;
    private bucket = new TokenBucket(6, 3);
    private scheduleCache: { at: number; data: RawSchedulePayload } | null = null;

    constructor(opts: { baseURL?: string; apiKey: string; name?: string }) {
        this.base = (opts.baseURL ?? BASE_URL).replace(/\/$/, '');
        this.key = opts.apiKey;
        this.name = opts.name ?? 'dlhd';
        this.http = axios.create({ baseURL: this.base, timeout: 15_000, headers: { Accept: 'application/json' } });
    }

    private async schedule(): Promise<RawSchedulePayload> {
        const now = Date.now();
        if (this.scheduleCache && now - this.scheduleCache.at < CACHE_MS) return this.scheduleCache.data;
        await this.bucket.take();
        const res = await this.http.get<RawSchedulePayload>('/daddyapi.php', { params: { key: this.key, endpoint: 'schedule' } });
        const data = (res.data && typeof res.data === 'object') ? res.data : {};
        this.scheduleCache = { at: now, data };
        return data;
    }

    async getSports(): Promise<SportCategory[]> {
        const data = await this.schedule();
        const seen = new Map<string, string>();
        for (const day of Object.values(data)) {
            if (!day || typeof day !== 'object') continue;
            for (const cat of Object.keys(day)) {
                const norm = normalizeCategory(cat);
                if (!seen.has(norm)) seen.set(norm, cat);
            }
        }
        return Array.from(seen.entries()).map(([id, orig]) => ({ id, name: orig, category: id }));
    }

    private *iterEvents(data: RawSchedulePayload): Iterable<{ day: string; category: string; event: RawEvent }> {
        for (const [day, cats] of Object.entries(data)) {
            if (!cats || typeof cats !== 'object') continue;
            for (const [category, events] of Object.entries(cats)) {
                if (!Array.isArray(events)) continue;
                for (const event of events) {
                    if (!event || typeof event !== 'object') continue;
                    yield { day, category, event };
                }
            }
        }
    }

    async getMatches(category: string): Promise<Match[]> {
        const data = await this.schedule();
        const wantAll = category === 'live' || category === 'all';
        const out: Match[] = [];
        for (const { day, category: cat, event } of this.iterEvents(data)) {
            const norm = normalizeCategory(cat);
            if (!wantAll && norm !== category.toLowerCase()) continue;
            out.push({
                id: stableEventId(day, cat, event),
                title: event.event,
                category: norm,
                date: parseDayTime(day, event.time),
                popular: false,
                poster: null,
                teams: teamsFromEvent(event.event),
                provider: this.name,
            });
        }
        return out;
    }

    async getMatchDetail(_category: string, id: string): Promise<MatchDetail | null> {
        const data = await this.schedule();
        for (const { day, category: cat, event } of this.iterEvents(data)) {
            if (stableEventId(day, cat, event) !== id) continue;
            const sources: MatchSource[] = (event.channels ?? []).map((raw, i) => {
                const chId = typeof raw === 'object' && raw && 'channel_id' in raw ? String((raw as RawChannel).channel_id) : String(raw);
                const chName = typeof raw === 'object' && raw && 'channel_name' in raw ? (raw as RawChannel).channel_name : `Ch ${chId}`;
                return {
                    id: chId,
                    streamNo: i + 1,
                    language: chName || 'Multi',
                    hd: false,
                    embedUrl: `${this.base}/stream/stream-${chId}.php`,
                    source: chName,
                    provider: this.name,
                };
            });
            return {
                id,
                title: event.event,
                category: normalizeCategory(cat),
                date: parseDayTime(day, event.time),
                popular: false,
                poster: null,
                teams: teamsFromEvent(event.event),
                provider: this.name,
                sources,
            };
        }
        return null;
    }
}
