'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, SkipForward } from 'lucide-react';
import { resolveEmbedUrl, type MatchSource } from '@/lib/sportsrc';
import { useBadSources } from '@/lib/hooks/useBadSources';

/**
 * Multi-source player with automatic + user-driven failover.
 *
 * Reliability signals:
 *  - LOAD_GRACE_MS: if the iframe never signals a load within this window, treat
 *    the source as dead and advance (auto-report).
 *  - STALL_MS: after the initial load, if we see no postMessage from the iframe
 *    AND no user interaction for this long, show a "stream stuck?" nudge. If
 *    the viewer clicks the nudge's "Try next", that's a strong signal → report.
 *  - Manual "Try next" click in the action row just switches; NO report and
 *    NO local blacklist (viewers churn sources for lots of reasons — bandwidth,
 *    language pref, curiosity — reporting each click would spam the ranker).
 *  - useBadSources(matchKey): sources demoted for this user (localStorage) or
 *    demoted globally (server rankings) sort to the back and render struck-through.
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

    /** Move to next unfailed source. Optionally record this source as bad. */
    const advance = useCallback((opts: { report: 'auto-failed' | 'stall' | null }) => {
        setFailed((prev) => {
            const next = new Set(prev).add(activeIndex);
            const candidate = orderedSources.findIndex((_, i) => !next.has(i));
            if (candidate !== -1) setActiveIndex(candidate);
            return next;
        });
        if (opts.report && active && effectiveMatchKey) {
            markBad(activeKey);
            reportToServer(activeKey, active.provider ?? 'unknown', opts.report);
        }
        setShowStall(false);
    }, [activeIndex, orderedSources, active, activeKey, effectiveMatchKey, markBad, reportToServer]);

    const autoAdvance = useCallback((reason: 'auto-failed' | 'stall') => advance({ report: reason }), [advance]);
    const manualSwitch = useCallback(() => advance({ report: null }), [advance]);

    // Initial-load watchdog.
    useEffect(() => {
        if (!active) return;
        if (loadTimer.current) clearTimeout(loadTimer.current);
        loadTimer.current = setTimeout(() => autoAdvance('auto-failed'), LOAD_GRACE_MS);
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
        function onMsg() { ping(); }
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
                    onError={() => autoAdvance('auto-failed')}
                />

                {showStall && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-black/90 border border-yellow-500/40 px-4 py-2 shadow-xl">
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                        <span className="text-yellow-100 text-xs">Stream feels stuck?</span>
                        <button
                            onClick={() => autoAdvance('stall')}
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

            {/* Action row */}
            <div className="flex flex-wrap items-center gap-2">
                {orderedSources.length > 1 && (
                    <button
                        onClick={manualSwitch}
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
                            title={bad ? 'Previously flagged as broken' : undefined}
                        >
                            {label(s)}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
