'use client';

import { useState } from 'react';
import { X, Maximize, Minimize, ChevronDown } from 'lucide-react';
import { VIDEO_SOURCES } from '@/lib/videoSources';

interface EmbeddedPlayerProps {
    title: string;
    embedUrl: string;
    onClose: () => void;
    type: 'movie' | 'tv';
    tmdbId: number;
    season?: number;
    episode?: number;
}

export default function EmbeddedPlayer({
    title,
    embedUrl: initialUrl,
    onClose,
    type,
    tmdbId,
    season,
    episode
}: EmbeddedPlayerProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
    const [showSourceMenu, setShowSourceMenu] = useState(false);
    const [embedUrl, setEmbedUrl] = useState(initialUrl);

    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const changeSource = (index: number) => {
        setCurrentSourceIndex(index);
        const source = VIDEO_SOURCES[index];
        const newUrl = source.embed(tmdbId, type, season, episode);
        setEmbedUrl(newUrl);
        setShowSourceMenu(false);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Header */}
            <div className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
                <div className="flex-1">
                    <h2 className="text-white text-xl font-semibold truncate">
                        {title}
                    </h2>
                    {type === 'tv' && season && episode && (
                        <p className="text-gray-400 text-sm">
                            Season {season}, Episode {episode}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Source Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSourceMenu(!showSourceMenu)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                            <span className="text-sm">
                                {VIDEO_SOURCES[currentSourceIndex].name}
                            </span>
                            <ChevronDown className="w-4 h-4" />
                        </button>

                        {showSourceMenu && (
                            <div className="absolute top-full right-0 mt-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 min-w-[200px] z-50">
                                <div className="p-2">
                                    <div className="text-xs text-gray-400 px-3 py-2">
                                        Select Server
                                    </div>
                                    {VIDEO_SOURCES.map((source, index) => (
                                        <button
                                            key={index}
                                            onClick={() => changeSource(index)}
                                            className={`w-full text-left px-3 py-2 rounded hover:bg-gray-700 transition-colors ${currentSourceIndex === index
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>{source.name}</span>
                                                <span className="text-xs bg-green-600 px-2 py-0.5 rounded">
                                                    {source.quality}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Fullscreen */}
                    <button
                        onClick={handleFullscreen}
                        className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                        title="Toggle Fullscreen"
                    >
                        {isFullscreen ? (
                            <Minimize className="w-5 h-5 text-white" />
                        ) : (
                            <Maximize className="w-5 h-5 text-white" />
                        )}
                    </button>

                    {/* Close */}
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                        title="Close Player"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>
            </div>

            {/* Video Player */}
            <div className="flex-1 bg-black relative">
                <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    title={title}
                    referrerPolicy="no-referrer"
                />
            </div>
        </div>
    );
}
