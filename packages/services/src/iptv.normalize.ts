import type { RawChannel, RawStream, RawCountry, RawLogo, RawBlocked, RawFeed, TvChannel, TvStream } from './iptv.types';

export interface NormalizeInput {
    channels: RawChannel[];
    streams: RawStream[];
    countries: RawCountry[];
    logos: RawLogo[];
    blocked: RawBlocked[];
    feeds?: RawFeed[];
    includeNsfw?: boolean;
}

/**
 * Join raw iptv-org datasets into a single normalized TvChannel list.
 * Drops channels that are blocklisted, closed/replaced, have no playable stream,
 * or (by default) are flagged NSFW.
 */
export function normalizeChannels(input: NormalizeInput): TvChannel[] {
    const { channels, streams, countries, logos, blocked, feeds = [], includeNsfw = false } = input;

    const blockedSet = new Set(blocked.map((b) => b.channel));
    const countryByCode = new Map(countries.map((c) => [c.code, c]));
    const logoByChannel = new Map(logos.map((l) => [l.channel, l.url]));

    // iptv-org keeps per-channel languages on feeds, not channels. Aggregate the
    // union of languages across a channel's feeds.
    const langsByChannel = new Map<string, Set<string>>();
    for (const f of feeds) {
        if (!f.languages?.length) continue;
        const set = langsByChannel.get(f.channel) ?? new Set<string>();
        for (const l of f.languages) set.add(l);
        langsByChannel.set(f.channel, set);
    }

    const streamsByChannel = new Map<string, TvStream[]>();
    for (const s of streams) {
        if (!s.channel || !s.url) continue;
        const list = streamsByChannel.get(s.channel) ?? [];
        list.push({ url: s.url, quality: s.quality ?? null, referrer: s.referrer ?? null, userAgent: s.user_agent ?? null });
        streamsByChannel.set(s.channel, list);
    }

    const result: TvChannel[] = [];
    for (const ch of channels) {
        if (blockedSet.has(ch.id)) continue;
        if (ch.closed || ch.replaced_by) continue;
        if (ch.is_nsfw && !includeNsfw) continue;
        const chStreams = streamsByChannel.get(ch.id);
        if (!chStreams || chStreams.length === 0) continue;
        const country = countryByCode.get(ch.country);
        const feedLangs = langsByChannel.get(ch.id);
        const languages = feedLangs && feedLangs.size > 0 ? [...feedLangs] : ch.languages ?? [];
        result.push({
            id: ch.id,
            name: ch.name,
            logo: logoByChannel.get(ch.id) ?? null,
            country: country ? { code: country.code, name: country.name, flag: country.flag } : null,
            categories: ch.categories ?? [],
            languages,
            streams: chStreams,
            isNsfw: ch.is_nsfw,
        });
    }
    return result;
}
