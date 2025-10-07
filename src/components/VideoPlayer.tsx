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
    AlertCircle
} from 'lucide-react';

interface VideoPlayerProps {
    videoUrl: string;
    title: string;
    onClose: () => void;
    onProgress?: (progress: number) => void;
}

export default function VideoPlayer({
    videoUrl,
    title,
    onClose,
    onProgress
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [videoError, setVideoError] = useState('');
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showSettings, setShowSettings] = useState(false);

    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Helper function to format time
    const formatTime = (seconds: number): string => {
        if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Load video
    useEffect(() => {
        if (videoUrl && videoRef.current) {
            const video = videoRef.current;
            video.src = videoUrl;
            setIsLoading(true);
            setVideoError('');

            const handleCanPlay = () => {
                setIsLoading(false);
            };

            const handleError = () => {
                setVideoError('Failed to load video. Please check the URL and try again.');
                setIsLoading(false);
            };

            video.addEventListener('canplay', handleCanPlay);
            video.addEventListener('error', handleError);

            return () => {
                video.removeEventListener('canplay', handleCanPlay);
                video.removeEventListener('error', handleError);
            };
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
            {isLoading && !videoError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-10">
                    <div className="text-center max-w-md p-8">
                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
                        <p className="text-blue-400 font-medium mb-4">Loading video...</p>
                        <p className="text-gray-500 text-sm mt-6">Please wait while we load the video...</p>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {videoError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
                    <div className="text-center max-w-lg p-8 bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl border border-red-900/50">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Unable to Load Video</h3>
                        <p className="text-gray-300 mb-6 leading-relaxed">{videoError}</p>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-500">Possible solutions:</p>
                            <ul className="text-xs text-gray-400 text-left space-y-1 max-w-sm mx-auto">
                                <li>• Verify the video URL is correct and accessible</li>
                                <li>• Check if the video format is supported (MP4, WebM, etc.)</li>
                                <li>• Try a different video URL</li>
                                <li>• Check your internet connection</li>
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
