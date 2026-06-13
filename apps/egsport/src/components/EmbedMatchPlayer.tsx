'use client';

import { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, AlertTriangle } from 'lucide-react';
import { Button } from '@egfilm/ui/components/ui/button';

export default function EmbedMatchPlayer({
    embedUrl,
    title,
    fallbackSources,
}: {
    embedUrl: string | null;
    title?: string;
    fallbackSources?: Array<{ name?: string; url: string }>;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentUrl, setCurrentUrl] = useState<string | null>(embedUrl);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        setCurrentUrl(embedUrl);
    }, [embedUrl]);

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const toggleFullscreen = async () => {
        const el = containerRef.current;
        if (!el) return;
        if (document.fullscreenElement) {
            await document.exitFullscreen();
        } else {
            await el.requestFullscreen();
        }
    };

    if (!currentUrl) {
        return (
            <div className="aspect-video w-full flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground rounded-md border border-border">
                <AlertTriangle className="h-6 w-6" />
                <p className="text-sm">No stream available for this match.</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full aspect-video bg-black rounded-md overflow-hidden border border-border">
            <iframe
                key={currentUrl}
                src={currentUrl}
                title={title ?? 'Live match stream'}
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                referrerPolicy="origin"
                className="absolute inset-0 h-full w-full"
            />
            <div className="absolute right-2 top-2 flex gap-1">
                {fallbackSources && fallbackSources.length > 1 ? (
                    <select
                        className="rounded-md bg-black/70 px-2 py-1 text-xs text-white"
                        value={currentUrl ?? ''}
                        onChange={(e) => setCurrentUrl(e.target.value)}
                    >
                        {fallbackSources.map((s, i) => (
                            <option key={s.url} value={s.url}>{s.name ?? `Source ${i + 1}`}</option>
                        ))}
                    </select>
                ) : null}
                <Button variant="secondary" size="icon" className="h-7 w-7" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
                    {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </Button>
            </div>
        </div>
    );
}
