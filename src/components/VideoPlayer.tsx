'use client';

import { useEffect, useRef, useState } from 'react';
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    SkipBack,
    SkipForward,
    Settings,
    X,
    Loader2,
    Download,
    Users,
    AlertCircle
} from 'lucide-react';

interface VideoPlayerProps {
    videoUrl?: string;
    magnetLink?: string;
    title: string;
    onClose: () => void;
    onProgress?: (progress: number) => void;
}

export default function VideoPlayer({
    videoUrl,
    magnetLink,
    title,
    onClose,
    onProgress
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const clientRef = useRef<any>(null);
    const torrentRef = useRef<any>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Initializing...');
    const [torrentProgress, setTorrentProgress] = useState(0);
    const [downloadSpeed, setDownloadSpeed] = useState(0);
    const [uploadSpeed, setUploadSpeed] = useState(0);
    const [peers, setPeers] = useState(0);
    const [torrentError, setTorrentError] = useState('');
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showSettings, setShowSettings] = useState(false);
    const [buffered, setBuffered] = useState(0);

    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const progressUpdateRef = useRef<NodeJS.Timeout | null>(null);

    // Helper functions
    const formatSpeed = (bytesPerSecond: number): string => {
        if (bytesPerSecond === 0) return '0 B/s';
        const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
        const i = Math.floor(Math.log(bytesPerSecond) / Math.log(1024));
        return `${(bytesPerSecond / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
    };

    const formatTime = (seconds: number): string => {
        if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
    };

    // WebTorrent setup - Proper implementation
    useEffect(() => {
        if (!magnetLink) {
            if (videoUrl) {
                setIsLoading(false);
            }
            return;
        }

        let isMounted = true;

        const loadTorrent = async () => {
            try {
                setIsLoading(true);
                setTorrentError('');
                setLoadingMessage('Connecting to WebTorrent network...');

                // Check if WebTorrent is loaded
                // @ts-ignore - WebTorrent is loaded via CDN
                if (typeof WebTorrent === 'undefined') {
                    setTorrentError('WebTorrent not loaded. Please refresh the page.');
                    setIsLoading(false);
                    return;
                }

                // Create WebTorrent client
                // @ts-ignore
                const client = new WebTorrent();
                clientRef.current = client;

                setLoadingMessage('Fetching torrent metadata...');

                // Add torrent
                client.add(magnetLink, {
                    // Announce trackers for better peer discovery
                    announce: [
                        'wss://tracker.openwebtorrent.com',
                        'wss://tracker.btorrent.xyz',
                        'wss://tracker.fastcast.nz',
                    ]
                }, (torrent: any) => {
                    if (!isMounted) return;

                    torrentRef.current = torrent;
                    console.log('✅ Torrent loaded:', torrent.name);
                    console.log('📦 Files:', torrent.files.length);

                    setLoadingMessage('Finding video file...');

                    // Find the largest video file
                    const videoFile = torrent.files
                        .filter((file: any) => {
                            const ext = file.name.split('.').pop()?.toLowerCase();
                            return ['mp4', 'mkv', 'avi', 'mov', 'webm', 'm4v', 'flv', 'wmv'].includes(ext || '');
                        })
                        .sort((a: any, b: any) => b.length - a.length)[0];

                    if (!videoFile) {
                        setTorrentError('No video file found in torrent. Available files: ' +
                            torrent.files.map((f: any) => f.name).join(', '));
                        setIsLoading(false);
                        return;
                    }

                    console.log('🎬 Selected file:', videoFile.name, `(${(videoFile.length / 1024 / 1024).toFixed(2)} MB)`);
                    setLoadingMessage(`Loading ${videoFile.name}...`);

                    // Stream to video element using appendTo
                    if (videoRef.current) {
                        videoFile.appendTo(videoRef.current, {
                            autoplay: false,
                            controls: false,
                            maxBlobLength: 200 * 1000 * 1000 // 200 MB
                        }, (err: Error) => {
                            if (err) {
                                console.error('Error appending video:', err);
                                setTorrentError('Failed to load video: ' + err.message);
                                setIsLoading(false);
                                return;
                            }

                            console.log('✅ Video ready to play');
                            setIsLoading(false);
                        });
                    }

                    // Update torrent stats
                    const updateStats = setInterval(() => {
                        if (!isMounted || !torrent) return;

                        setTorrentProgress(Math.round(torrent.progress * 100));
                        setDownloadSpeed(torrent.downloadSpeed || 0);
                        setUploadSpeed(torrent.uploadSpeed || 0);
                        setPeers(torrent.numPeers || 0);

                        // Log progress for debugging
                        if (torrent.progress < 1) {
                            console.log(`📥 Progress: ${(torrent.progress * 100).toFixed(1)}% | 
                                Speed: ${formatSpeed(torrent.downloadSpeed)} | 
                                Peers: ${torrent.numPeers}`);
                        }
                    }, 1000);

                    // Cleanup stats interval
                    return () => clearInterval(updateStats);
                });

                // Handle client errors
                client.on('error', (err: Error) => {
                    console.error('❌ WebTorrent error:', err);
                    if (isMounted) {
                        setTorrentError('Connection error: ' + err.message);
                        setIsLoading(false);
                    }
                });

            } catch (error: any) {
                console.error('❌ Failed to load torrent:', error);
                if (isMounted) {
                    setTorrentError(error.message || 'Failed to load torrent');
                    setIsLoading(false);
                }
            }
        };

        loadTorrent();

        // Cleanup
        return () => {
            isMounted = false;
            if (clientRef.current) {
                console.log('🧹 Cleaning up WebTorrent client');
                clientRef.current.destroy();
                clientRef.current = null;
            }
        };
    }, [magnetLink, videoUrl]);

    // Direct video URL setup
    useEffect(() => {
        if (videoUrl && videoRef.current) {
            videoRef.current.src = videoUrl;
            setIsLoading(false);
        }
    }, [videoUrl]);

    // Video event listeners
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleLoadedMetadata = () => {
            setDuration(video.duration);
            setIsLoading(false);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);

            // Update progress for continue watching
            if (onProgress && video.duration > 0) {
                const progress = (video.currentTime / video.duration) * 100;
                onProgress(progress);
            }
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleEnded = () => setIsPlaying(false);
        const handleWaiting = () => setIsLoading(true);
        const handleCanPlay = () => setIsLoading(false);

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('canplay', handleCanPlay);

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('waiting', handleWaiting);
            video.removeEventListener('canplay', handleCanPlay);
        };
    }, [onProgress]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!videoRef.current) return;

            switch (e.key.toLowerCase()) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    togglePlayPause();
                    break;
                case 'arrowleft':
                    e.preventDefault();
                    skip(-10);
                    break;
                case 'arrowright':
                    e.preventDefault();
                    skip(10);
                    break;
                case 'arrowup':
                    e.preventDefault();
                    changeVolume(0.1);
                    break;
                case 'arrowdown':
                    e.preventDefault();
                    changeVolume(-0.1);
                    break;
                case 'f':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 'm':
                    e.preventDefault();
                    toggleMute();
                    break;
                case 'escape':
                    if (isFullscreen) {
                        toggleFullscreen();
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    // Auto-hide controls
    const resetControlsTimeout = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    };

    const togglePlayPause = () => {
        if (!videoRef.current) return;

        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
    };

    const skip = (seconds: number) => {
        if (!videoRef.current) return;
        videoRef.current.currentTime += seconds;
    };

    const changeVolume = (delta: number) => {
        if (!videoRef.current) return;
        const newVolume = Math.max(0, Math.min(1, volume + delta));
        setVolume(newVolume);
        videoRef.current.volume = newVolume;
        if (newVolume === 0) {
            setIsMuted(true);
        } else if (isMuted) {
            setIsMuted(false);
        }
    };

    const toggleMute = () => {
        if (!videoRef.current) return;
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        videoRef.current.muted = newMuted;
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!videoRef.current || !progressBarRef.current) return;

        const rect = progressBarRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        videoRef.current.currentTime = percentage * duration;
    };

    const changePlaybackRate = (rate: number) => {
        if (!videoRef.current) return;
        setPlaybackRate(rate);
        videoRef.current.playbackRate = rate;
        setShowSettings(false);
    };

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onMouseMove={resetControlsTimeout}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                onClick={togglePlayPause}
            />

            {/* Loading Overlay */}
            {/* Loading Indicator - Improved */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
                    <div className="text-center max-w-md p-8">
                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
                        <p className="text-blue-400 font-medium mb-4">{loadingMessage}</p>

                        {magnetLink && torrentProgress > 0 && (
                            <div className="space-y-3">
                                <div className="text-gray-300 flex items-center justify-center gap-2">
                                    <Download className="w-4 h-4" />
                                    <span>Downloading: {torrentProgress}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
                                        style={{ width: `${torrentProgress}%` }}
                                    />
                                </div>
                                <div className="flex items-center justify-center gap-4 text-gray-400 text-sm">
                                    {downloadSpeed > 0 && (
                                        <div className="flex items-center gap-1">
                                            <Download className="w-3 h-3" />
                                            <span>{formatSpeed(downloadSpeed)}</span>
                                        </div>
                                    )}
                                    {peers > 0 && (
                                        <div className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            <span>{peers} {peers === 1 ? 'peer' : 'peers'}</span>
                                        </div>
                                    )}
                                </div>
                                {torrentRef.current && (
                                    <div className="text-xs text-gray-500 mt-2">
                                        {formatBytes(torrentRef.current.downloaded)} / {formatBytes(torrentRef.current.length)}
                                    </div>
                                )}
                            </div>
                        )}

                        <p className="text-gray-500 text-sm mt-6">Please wait while we load the video...</p>
                    </div>
                </div>
            )}

            {/* Error Message - Improved */}
            {torrentError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
                    <div className="text-center max-w-lg p-8 bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl border border-red-900/50">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Unable to Load Video</h3>
                        <p className="text-gray-300 mb-6 leading-relaxed">{torrentError}</p>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-500">Possible solutions:</p>
                            <ul className="text-xs text-gray-400 text-left space-y-1 max-w-sm mx-auto">
                                <li>• Verify the magnet link is correct</li>
                                <li>• Check if the torrent has seeders</li>
                                <li>• Try a different torrent or magnet link</li>
                                <li>• Refresh the page and try again</li>
                            </ul>
                        </div>
                        <button
                            onClick={onClose}
                            className="mt-6 px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105"
                        >
                            Close Player
                        </button>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {torrentError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="text-center max-w-md p-8 bg-gray-900 rounded-lg">
                        <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Error</h3>
                        <p className="text-gray-300 mb-4">{torrentError}</p>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                        >
                            Close Player
                        </button>
                    </div>
                </div>
            )}

            {/* Controls Overlay */}
            <div
                className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
            >
                {/* Top Bar */}
                <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
                    <h2 className="text-white text-xl font-semibold truncate flex-1 mr-4">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                {/* Center Play Button */}
                {!isPlaying && !isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <button
                            onClick={togglePlayPause}
                            className="w-20 h-20 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                        >
                            <Play className="w-10 h-10 text-white ml-1" fill="white" />
                        </button>
                    </div>
                )}

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                    {/* Progress Bar */}
                    <div
                        ref={progressBarRef}
                        className="h-1.5 bg-gray-600 rounded-full cursor-pointer group hover:h-2 transition-all"
                        onClick={handleProgressBarClick}
                    >
                        <div
                            className="h-full bg-blue-500 rounded-full relative group-hover:bg-blue-400 transition-colors"
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Play/Pause */}
                            <button
                                onClick={togglePlayPause}
                                className="p-2 hover:bg-white/20 rounded-full transition"
                            >
                                {isPlaying ? (
                                    <Pause className="w-6 h-6 text-white" fill="white" />
                                ) : (
                                    <Play className="w-6 h-6 text-white" fill="white" />
                                )}
                            </button>

                            {/* Skip Back */}
                            <button
                                onClick={() => skip(-10)}
                                className="p-2 hover:bg-white/20 rounded-full transition"
                            >
                                <SkipBack className="w-5 h-5 text-white" />
                            </button>

                            {/* Skip Forward */}
                            <button
                                onClick={() => skip(10)}
                                className="p-2 hover:bg-white/20 rounded-full transition"
                            >
                                <SkipForward className="w-5 h-5 text-white" />
                            </button>

                            {/* Volume */}
                            <div className="flex items-center gap-2 group">
                                <button
                                    onClick={toggleMute}
                                    className="p-2 hover:bg-white/20 rounded-full transition"
                                >
                                    {isMuted || volume === 0 ? (
                                        <VolumeX className="w-5 h-5 text-white" />
                                    ) : (
                                        <Volume2 className="w-5 h-5 text-white" />
                                    )}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={isMuted ? 0 : volume}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        changeVolume(val - volume);
                                    }}
                                    className="w-0 group-hover:w-20 transition-all opacity-0 group-hover:opacity-100"
                                />
                            </div>

                            {/* Time */}
                            <div className="text-white text-sm font-medium">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Settings */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="p-2 hover:bg-white/20 rounded-full transition"
                                >
                                    <Settings className="w-5 h-5 text-white" />
                                </button>

                                {showSettings && (
                                    <div className="absolute bottom-full right-0 mb-2 bg-gray-900 rounded-lg shadow-lg p-2 min-w-[150px]">
                                        <div className="text-gray-400 text-xs mb-2 px-2">Playback Speed</div>
                                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                            <button
                                                key={rate}
                                                onClick={() => changePlaybackRate(rate)}
                                                className={`w-full text-left px-3 py-2 rounded hover:bg-gray-800 transition ${playbackRate === rate ? 'text-blue-400' : 'text-white'
                                                    }`}
                                            >
                                                {rate}x
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Fullscreen */}
                            <button
                                onClick={toggleFullscreen}
                                className="p-2 hover:bg-white/20 rounded-full transition"
                            >
                                {isFullscreen ? (
                                    <Minimize className="w-5 h-5 text-white" />
                                ) : (
                                    <Maximize className="w-5 h-5 text-white" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
