import { describe, it, expect } from 'vitest';
import { normalizeChannels } from '../src/iptv.normalize';
import type { RawChannel, RawStream, RawCountry, RawLogo, RawBlocked } from '../src/iptv.types';

const countries: RawCountry[] = [{ code: 'GB', name: 'United Kingdom', languages: ['eng'], flag: '🇬🇧' }];
const channels: RawChannel[] = [
    { id: 'BBCNews.uk', name: 'BBC News', country: 'GB', categories: ['news'], is_nsfw: false, languages: ['eng'] },
    { id: 'Dead.uk', name: 'Dead', country: 'GB', categories: ['news'], is_nsfw: false }, // no stream -> dropped
    { id: 'Blocked.uk', name: 'Blocked', country: 'GB', categories: ['news'], is_nsfw: false }, // blocklisted -> dropped
    { id: 'Adult.xx', name: 'Adult', country: 'GB', categories: ['xxx'], is_nsfw: true }, // nsfw -> dropped by default
];
const streams: RawStream[] = [
    { channel: 'BBCNews.uk', url: 'https://a/stream.m3u8', quality: '720p', referrer: 'https://ref', user_agent: 'UA' },
    { channel: 'BBCNews.uk', url: 'https://b/stream.m3u8' },
    { channel: 'Blocked.uk', url: 'https://c/stream.m3u8' },
    { channel: 'Adult.xx', url: 'https://d/stream.m3u8' },
    { channel: null, url: 'https://orphan/stream.m3u8' }, // no channel -> ignored
];
const logos: RawLogo[] = [{ channel: 'BBCNews.uk', url: 'https://logo/bbc.png' }];
const blocked: RawBlocked[] = [{ channel: 'Blocked.uk' }];

describe('normalizeChannels', () => {
    it('joins channels with streams, logos, country; drops blocked/streamless/nsfw', () => {
        const result = normalizeChannels({ channels, streams, countries, logos, blocked });
        expect(result.map((c) => c.id)).toEqual(['BBCNews.uk']);
        const bbc = result[0];
        expect(bbc.name).toBe('BBC News');
        expect(bbc.logo).toBe('https://logo/bbc.png');
        expect(bbc.country).toEqual({ code: 'GB', name: 'United Kingdom', flag: '🇬🇧' });
        expect(bbc.streams).toHaveLength(2);
        expect(bbc.streams[0]).toMatchObject({ url: 'https://a/stream.m3u8', quality: '720p', referrer: 'https://ref', userAgent: 'UA' });
    });

    it('keeps nsfw when includeNsfw=true', () => {
        const result = normalizeChannels({ channels, streams, countries, logos, blocked, includeNsfw: true });
        expect(result.map((c) => c.id).sort()).toEqual(['Adult.xx', 'BBCNews.uk']);
    });

    it('derives languages from feeds (union) when provided', () => {
        const feeds = [
            { channel: 'BBCNews.uk', id: 'SD', languages: ['eng'] },
            { channel: 'BBCNews.uk', id: 'HD', languages: ['eng', 'cym'] },
        ];
        const result = normalizeChannels({ channels, streams, countries, logos, blocked, feeds });
        expect(result[0].languages.sort()).toEqual(['cym', 'eng']);
    });
});
