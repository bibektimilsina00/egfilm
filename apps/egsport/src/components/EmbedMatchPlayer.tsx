'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { resolveEmbedUrl, type MatchSource } from '@/lib/sportsrc';

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

    const active = sources?.[activeIndex] ?? null;
    const activeSrc = active ? resolveEmbedUrl(active) : '';

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
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-gray-800">
                <iframe
                    key={activeSrc}
                    src={activeSrc}
                    title={title ?? 'Live stream'}
                    className="absolute inset-0 h-full w-full"
                    allow="encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    referrerPolicy="no-referrer"
                />
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
