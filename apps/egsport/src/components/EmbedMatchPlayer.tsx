'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ShieldAlert, SkipForward, ThumbsDown } from 'lucide-react';
import { resolveEmbedUrl, type MatchSource } from '@/lib/sportsrc';
import { useBadSources } from '@/lib/hooks/useBadSources';
import { useAdblockDetect } from '@/lib/hooks/useAdblockDetect';

/**
 * Multi-source player with automatic + user-driven failover.
 *
 * Reliability signals:
 *  - LOAD_GRACE_MS: if the iframe never signals a load within this window, treat
 *    the source as dead and advance.
 *  - STALL_MS: after the initial load, if we see no postMessage from the iframe
 *    AND no user interaction for this long, show a "stream stuck?" nudge.
 *  - useBadSources(matchKey): sources demoted for this user (localStorage) or
 *    demoted globally (server rankings) are moved to the back of the strip and
 *    struck through so they're picked last on auto-failover.
 *  - Every auto-fail / user report is recorded server-side so future users are
 *    protected from the same bad source.
 */

const LOAD_GRACE_MS = 12_000;
const STALL_MS = 60_000;

function sourceKeyOf(s: MatchSource): string {
    return `${s.provider ?? ''}|${s.source ?? ''}|${s.id}|${s.streamNo}`;
}

export default function EmbedMatchPlayer({
    sources,
    title,
    matchKey,
    initialIndex = 0,
}: {
    sources: MatchSource[];
    title?: string;
    /** "<category>:<id>" — required to enable sticky bad-source memory. */
    matchKey?: string;
    initialIndex?: number;
}) {
    const effectiveMatchKey = matchKey ?? '';
    const { isBad, markBad, reportToServer } = useBadSources(effectiveMatchKey);
    const adblockOn = useAdblockDetect();

    // Reorder sources: not-bad first (in original order), bad after. Do this in
    // a memo so state that indexes into the array stays valid across renders.
    const orderedSources = useMemo(() => {
        if (!sources?.length) return [];
        const good: MatchSource[] = [];
        const bad: MatchSource[] = [];
        for (const s of sources) {
            (isBad(sourceKeyOf(s)) ? bad : good).push(s);
        }
        return [...good, ...bad];
    }, [sources, isBad]);

    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const [failed, setFailed] = useState<Set<number>>(new Set());
    const [showStall, setShowStall] = useState(false);
    const [adblockDismissed, setAdblockDismissed] = useState(false);
    const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stallTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastActivity = useRef<number>(Date.now());

    // Clamp activeIndex when the source list re-orders (e.g. rankings arrive
    // after mount). Only reset to 0 if the currently-active index no longer
    // points at a source; otherwise leave the viewer where they were.
    useEffect(() => {
        if (activeIndex >= orderedSources.length) setActiveIndex(0);
    }, [orderedSources.length, activeIndex]);

    const active = orderedSources[activeIndex] ?? null;
    const activeSrc = active ? resolveEmbedUrl(active) : '';
    const activeKey = active ? sourceKeyOf(active) : '';

    const advance = useCallback((reason: 'auto-failed' | 'user-report' | 'stall') => {
        setFailed((prev) => {
            const next = new Set(prev).add(activeIndex);
            const candidate = orderedSources.findIndex((_, i) => !next.has(i));
            if (candidate !== -1) setActiveIndex(candidate);
            return next;
        });
        if (active && effectiveMatchKey) {
            markBad(activeKey);
            reportToServer(activeKey, active.provider ?? 'unknown', reason);
        }
        setShowStall(false);
    }, [activeIndex, orderedSources, active, activeKey, effectiveMatchKey, markBad, reportToServer]);

    // Initial-load watchdog.
    useEffect(() => {
        if (!active) return;
        if (loadTimer.current) clearTimeout(loadTimer.current);
        loadTimer.current = setTimeout(() => advance('auto-failed'), LOAD_GRACE_MS);
        return () => {
            if (loadTimer.current) clearTimeout(loadTimer.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSrc]);

    // Stall watchdog + postMessage listener. Any message from the iframe or
    // any pointer/keyboard activity resets the timer. When it fires we don't
    // auto-advance (a temporary buffer isn't a broken stream) — we just show
    // the "stuck?" nudge so the viewer decides.
    useEffect(() => {
        if (!active) return;
        setShowStall(false);
        lastActivity.current = Date.now();

        function ping() {
            lastActivity.current = Date.now();
            setShowStall(false);
            armStall();
        }
        function armStall() {
            if (stallTimer.current) clearTimeout(stallTimer.current);
            stallTimer.current = setTimeout(() => setShowStall(true), STALL_MS);
        }
        function onMsg() { ping(); } // any msg = activity
        function onInteract() { ping(); }

        window.addEventListener('message', onMsg);
        window.addEventListener('pointerdown', onInteract);
        window.addEventListener('keydown', onInteract);
        armStall();

        return () => {
            window.removeEventListener('message', onMsg);
            window.removeEventListener('pointerdown', onInteract);
            window.removeEventListener('keydown', onInteract);
            if (stallTimer.current) clearTimeout(stallTimer.current);
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
            {adblockOn && !adblockDismissed && (
                <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
                    <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <div className="font-semibold">Ad-blocker detected</div>
                        <div className="text-yellow-300/80 text-xs mt-0.5">
                            Many sports streams need ads to load. If your stream is stuck, try disabling your ad-blocker for this page.
                        </div>
                    </div>
                    <button
                        onClick={() => setAdblockDismissed(true)}
                        className="text-xs text-yellow-300 hover:text-yellow-100"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-gray-800">
                <iframe
                    key={activeSrc}
                    src={activeSrc}
                    title={title ?? 'Live stream'}
                    className="absolute inset-0 h-full w-full"
                    allow="encrypted-media; picture-in-picture; fullscreen; autoplay"
                    allowFullScreen
                    referrerPolicy="origin"
                    onLoad={onLoad}
                    onError={() => advance('auto-failed')}
                />

                {showStall && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/90 border border-yellow-500/40 px-4 py-2 shadow-xl">
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                        <span className="text-yellow-100 text-xs">Stream feels stuck?</span>
                        <button
                            onClick={() => advance('stall')}
                            className="ml-1 text-xs px-3 py-1 rounded-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-100 font-medium"
                        >
                            Try next
                        </button>
                        <button
                            onClick={() => setShowStall(false)}
                            className="text-yellow-300/60 hover:text-yellow-100 text-xs"
                        >
                            Dismiss
                        </button>
                    </div>
                )}
            </div>

            {/* Action row — Try next + Report broken up front */}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => advance('user-report')}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                    title="Report this stream as broken and skip to the next"
                >
                    <ThumbsDown className="h-3.5 w-3.5" /> Not working
                </button>
                {orderedSources.length > 1 && (
                    <button
                        onClick={() => advance('auto-failed')}
                        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-blue-500/40 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20"
                        title="Switch to the next source"
                    >
                        <SkipForward className="h-3.5 w-3.5" /> Try next
                    </button>
                )}
                <span className="ml-auto text-xs text-gray-500">
                    Source {activeIndex + 1} of {orderedSources.length}
                </span>
            </div>

            {/* Source chips */}
            <div className="flex flex-wrap items-center gap-2">
                {orderedSources.map((s, i) => {
                    const bad = isBad(sourceKeyOf(s));
                    return (
                        <button
                            key={`${s.provider ?? ''}-${s.id}-${s.streamNo}`}
                            onClick={() => setActiveIndex(i)}
                            className={
                                'text-xs px-3 py-1.5 rounded-md border transition-colors ' +
                                (i === activeIndex
                                    ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                                    : failed.has(i) || bad
                                        ? 'border-gray-800 bg-gray-900 text-gray-600 line-through hover:text-gray-400'
                                        : 'border-gray-800 bg-gray-900 text-gray-300 hover:border-blue-500/40 hover:text-blue-400')
                            }
                            title={bad ? 'Previously reported as broken' : undefined}
                        >
                            {label(s)}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
