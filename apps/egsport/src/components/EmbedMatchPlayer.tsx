'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, SkipForward } from 'lucide-react';
import { resolveEmbedUrl, type MatchSource } from '@/lib/sportsrc';

/**
 * Multi-source player with automatic failover.
 *
 * `sources` are aggregated from whichever provider resolved the match. The user
 * can switch manually, and if a stream never signals that it loaded (iframe
 * `onError`, or no `onLoad` within a grace period) we auto-advance to the next
 * source so a dead stream doesn't strand the viewer on a black screen.
 */

const LOAD_GRACE_MS = 12_000;

export default function EmbedMatchPlayer({
    sources,
    title,
    initialIndex = 0,
}: {
    sources: MatchSource[];
    title?: string;
    initialIndex?: number;
}) {
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const [failed, setFailed] = useState<Set<number>>(new Set());
    const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const active = sources?.[activeIndex] ?? null;
    const activeSrc = active ? resolveEmbedUrl(active) : '';

    // Advance to the next not-yet-failed source; wraps once, then gives up.
    function advance() {
        setFailed((prev) => {
            const next = new Set(prev).add(activeIndex);
            const candidate = sources.findIndex((_, i) => !next.has(i));
            if (candidate !== -1) setActiveIndex(candidate);
            return next;
        });
    }

    // If the iframe hasn't reported a successful load within the grace window,
    // treat the source as dead and move on. Cross-origin players rarely fire a
    // reliable onError, so this timeout is the real failover trigger.
    useEffect(() => {
        if (!active) return;
        if (loadTimer.current) clearTimeout(loadTimer.current);
        loadTimer.current = setTimeout(advance, LOAD_GRACE_MS);
        return () => {
            if (loadTimer.current) clearTimeout(loadTimer.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSrc]);

    function onLoad() {
        if (loadTimer.current) clearTimeout(loadTimer.current);
    }

    if (!sources || sources.length === 0 || !active) {
        return (
            <div className="aspect-video w-full flex flex-col items-center justify-center gap-2 bg-gray-900 text-gray-400 rounded-xl border border-gray-800">
                <AlertTriangle className="h-6 w-6" />
                <p className="text-sm">No stream available for this match.</p>
            </div>
        );
    }

    const label = (s: MatchSource) =>
        `#${s.streamNo} · ${s.language}${s.hd ? ' · HD' : ''}${s.provider ? ` · ${s.provider}` : ''}`;

    return (
        <div className="space-y-2">
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-gray-800">
                <iframe
                    key={activeSrc}
                    src={activeSrc}
                    title={title ?? 'Live stream'}
                    className="absolute inset-0 h-full w-full"
                    allow="encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    referrerPolicy="no-referrer"
                    onLoad={onLoad}
                    onError={advance}
                />
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {sources.map((s, i) => (
                    <button
                        key={`${s.provider ?? ''}-${s.id}-${s.streamNo}`}
                        onClick={() => setActiveIndex(i)}
                        className={
                            'text-xs px-3 py-1.5 rounded-md border transition-colors ' +
                            (i === activeIndex
                                ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                                : failed.has(i)
                                    ? 'border-gray-800 bg-gray-900 text-gray-600 line-through hover:text-gray-400'
                                    : 'border-gray-800 bg-gray-900 text-gray-300 hover:border-blue-500/40 hover:text-blue-400')
                        }
                    >
                        {label(s)}
                    </button>
                ))}
                {sources.length > 1 ? (
                    <button
                        onClick={advance}
                        className="ml-auto inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-gray-800 bg-gray-900 text-gray-300 hover:border-blue-500/40 hover:text-blue-400"
                        title="Stream not working? Switch to the next source."
                    >
                        <SkipForward className="h-3.5 w-3.5" /> Try next
                    </button>
                ) : null}
            </div>
        </div>
    );
}
