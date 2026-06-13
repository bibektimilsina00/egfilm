'use client';

import { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, AlertTriangle } from 'lucide-react';
import type { MatchSource } from '@/lib/sportsrc';

export default function EmbedMatchPlayer({
    sources,
    title,
    initialIndex = 0,
}: {
    sources: MatchSource[];
    title?: string;
    initialIndex?: number;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const active = sources?.[activeIndex] ?? null;

    const toggleFullscreen = async () => {
        const el = containerRef.current;
        if (!el) return;
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        } else {
            await el.requestFullscreen();
        }
    };

    if (!sources || sources.length === 0 || !active) {
        return (
            <div className="aspect-video w-full flex flex-col items-center justify-center gap-2 bg-gray-900 text-gray-400 rounded-xl border border-gray-800">
                <AlertTriangle className="h-6 w-6" />
                <p className="text-sm">No stream available for this match.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div ref={containerRef} className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-gray-800">
                <iframe
                    key={active.embedUrl}
                    src={active.embedUrl}
                    title={title ?? 'Live match stream'}
                    allowFullScreen
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    referrerPolicy="origin"
                    className="absolute inset-0 h-full w-full"
                />
                <button
                    onClick={toggleFullscreen}
                    className="absolute right-2 top-2 inline-flex items-center justify-center h-8 w-8 rounded-md bg-black/60 hover:bg-black/80 text-white"
                    aria-label="Toggle fullscreen"
                >
                    {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </button>
            </div>

            {sources.length > 1 ? (
                <div className="flex flex-wrap gap-2">
                    {sources.map((s, i) => (
                        <button
                            key={`${s.id}-${s.streamNo}`}
                            onClick={() => setActiveIndex(i)}
                            className={
                                'text-xs px-3 py-1.5 rounded-md border transition-colors ' +
                                (i === activeIndex
                                    ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                                    : 'border-gray-800 bg-gray-900 text-gray-300 hover:border-blue-500/40 hover:text-blue-400')
                            }
                        >
                            #{s.streamNo} · {s.language}{s.hd ? ' · HD' : ''}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
