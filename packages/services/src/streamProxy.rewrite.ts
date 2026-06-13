// Pure helper: rewrite all resource URLs in an .m3u8 playlist to go through a proxy.
// `base` is the absolute URL the playlist was fetched from (for resolving relative URLs).
// `toProxy` maps an absolute URL to the proxied URL.
export function rewriteM3u8(content: string, base: string, toProxy: (absUrl: string) => string): string {
    const resolve = (u: string) => new URL(u, base).toString();

    return content
        .split('\n')
        .map((line) => {
            const trimmed = line.trim();
            if (trimmed === '') return line;

            // Tag line: rewrite any URI="..." attribute (EXT-X-KEY, EXT-X-MEDIA, EXT-X-MAP, etc.)
            if (trimmed.startsWith('#')) {
                return line.replace(/URI="([^"]+)"/g, (_m, uri) => `URI="${toProxy(resolve(uri))}"`);
            }

            // Resource line (segment or nested playlist).
            return toProxy(resolve(trimmed));
        })
        .join('\n');
}
