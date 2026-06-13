import { describe, it, expect } from 'vitest';
import { rewriteM3u8 } from '../src/streamProxy.rewrite';

const proxy = (u: string) => `/api/stream-proxy?url=${encodeURIComponent(u)}`;

describe('rewriteM3u8', () => {
    it('rewrites absolute segment urls through the proxy', () => {
        const base = 'https://host.tv/live/playlist.m3u8';
        const input = ['#EXTM3U', '#EXTINF:6,', 'https://host.tv/live/seg1.ts', ''].join('\n');
        const out = rewriteM3u8(input, base, proxy);
        expect(out).toContain(proxy('https://host.tv/live/seg1.ts'));
    });

    it('resolves relative segment urls against the base then proxies', () => {
        const base = 'https://host.tv/live/playlist.m3u8';
        const input = ['#EXTM3U', '#EXTINF:6,', 'seg1.ts'].join('\n');
        const out = rewriteM3u8(input, base, proxy);
        expect(out).toContain(proxy('https://host.tv/live/seg1.ts'));
    });

    it('rewrites nested variant playlists in a master playlist', () => {
        const base = 'https://host.tv/master.m3u8';
        const input = ['#EXTM3U', '#EXT-X-STREAM-INF:BANDWIDTH=1000', '720/index.m3u8'].join('\n');
        const out = rewriteM3u8(input, base, proxy);
        expect(out).toContain(proxy('https://host.tv/720/index.m3u8'));
    });

    it('rewrites URI attributes in EXT-X-KEY / EXT-X-MEDIA tags', () => {
        const base = 'https://host.tv/master.m3u8';
        const input = '#EXT-X-KEY:METHOD=AES-128,URI="key.bin"';
        const out = rewriteM3u8(input, base, proxy);
        expect(out).toContain(`URI="${proxy('https://host.tv/key.bin')}"`);
    });

    it('leaves comment/tag-only lines untouched', () => {
        const out = rewriteM3u8('#EXTM3U\n#EXT-X-VERSION:3', 'https://host.tv/p.m3u8', proxy);
        expect(out).toContain('#EXT-X-VERSION:3');
    });
});
