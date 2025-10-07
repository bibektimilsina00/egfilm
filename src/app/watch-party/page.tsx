'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import io, { Socket } from 'socket.io-client';
import { Users, Copy, Check, MessageCircle, Play, Pause, Volume2, VolumeX, Maximize, Settings, Download, Loader2 } from 'lucide-react';

interface User {
    id: string;
    name: string;
}

interface ChatMessage {
    message: string;
    userName: string;
    timestamp: number;
}

let socket: Socket;

export default function WatchPartyPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();

    const [partyId, setPartyId] = useState<string | null>(searchParams.get('id'));
    const [users, setUsers] = useState<User[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [copied, setCopied] = useState(false);
    const [showChat, setShowChat] = useState(true);

    // Video player states
    const [magnetLink, setMagnetLink] = useState('');
    const [movieTitle, setMovieTitle] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);

    // Torrent states
    const [torrentProgress, setTorrentProgress] = useState(0);
    const [downloadSpeed, setDownloadSpeed] = useState(0);
    const [numPeers, setNumPeers] = useState(0);
    const [isLoadingTorrent, setIsLoadingTorrent] = useState(false);
    const [torrentError, setTorrentError] = useState('');

    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressBarRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const [socketInitialized, setSocketInitialized] = useState(false);
    const isSyncing = useRef(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        const initSocket = async () => {
            await fetch('/api/socketio');
            socket = io({
                path: '/api/socketio',
            });

            socket.on('connect', () => {
                console.log('Connected to socket');
                setSocketInitialized(true);
            });

            socket.on('party-created', ({ partyId: newPartyId, partyData }) => {
                setPartyId(newPartyId);
                setUsers(partyData.users);
                setMagnetLink(partyData.magnetLink);
                setMovieTitle(partyData.movieTitle);
                router.push(`/watch-party?id=${newPartyId}`);
            });

            socket.on('party-joined', ({ partyData }) => {
                setUsers(partyData.users);
                setMagnetLink(partyData.magnetLink);
                setMovieTitle(partyData.movieTitle);
                setCurrentTime(partyData.currentTime);
                setIsPlaying(partyData.isPlaying);
            });

            socket.on('user-joined', ({ user, users: updatedUsers }) => {
                setUsers(updatedUsers);
                setChatMessages(prev => [...prev, {
                    message: `${user.name} joined the party`,
                    userName: 'System',
                    timestamp: Date.now(),
                }]);
            });

            socket.on('user-left', ({ userName, users: updatedUsers }) => {
                setUsers(updatedUsers);
                setChatMessages(prev => [...prev, {
                    message: `${userName} left the party`,
                    userName: 'System',
                    timestamp: Date.now(),
                }]);
            });

            socket.on('sync-play-pause', ({ isPlaying: playing, currentTime: time }) => {
                if (!isSyncing.current && videoRef.current) {
                    isSyncing.current = true;
                    videoRef.current.currentTime = time;
                    if (playing) {
                        videoRef.current.play();
                    } else {
                        videoRef.current.pause();
                    }
                    setIsPlaying(playing);
                    setTimeout(() => {
                        isSyncing.current = false;
                    }, 500);
                }
            });

            socket.on('sync-seek', ({ currentTime: time }) => {
                if (!isSyncing.current && videoRef.current) {
                    isSyncing.current = true;
                    videoRef.current.currentTime = time;
                    setCurrentTime(time);
                    setTimeout(() => {
                        isSyncing.current = false;
                    }, 500);
                }
            });

            socket.on('chat-message', (message) => {
                setChatMessages(prev => [...prev, message]);
            });

            socket.on('party-error', ({ message }) => {
                alert(message);
                router.push('/');
            });
        };

        initSocket();

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [router]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const createParty = () => {
        const title = prompt('Enter movie title:');
        const magnet = prompt('Enter magnet link:');

        if (!title || !magnet || !magnet.startsWith('magnet:')) {
            alert('Please enter a valid movie title and magnet link');
            return;
        }

        socket.emit('create-party', {
            movieTitle: title,
            magnetLink: magnet,
            userName: session?.user?.name || 'Guest',
        });
    };

    const joinParty = () => {
        const id = prompt('Enter party ID:');
        if (!id) return;

        socket.emit('join-party', {
            partyId: id,
            userName: session?.user?.name || 'Guest',
        });
    };

    const copyPartyLink = () => {
        const link = `${window.location.origin}/watch-party?id=${partyId}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePlayPause = () => {
        if (!videoRef.current || !partyId || isSyncing.current) return;

        const video = videoRef.current;
        const newIsPlaying = !isPlaying;

        if (newIsPlaying) {
            video.play();
        } else {
            video.pause();
        }

        setIsPlaying(newIsPlaying);
        socket.emit('play-pause', {
            partyId,
            isPlaying: newIsPlaying,
            currentTime: video.currentTime,
        });
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!videoRef.current || !progressBarRef.current || !partyId || isSyncing.current) return;

        const rect = progressBarRef.current.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = percent * duration;

        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);

        socket.emit('seek', {
            partyId,
            currentTime: newTime,
        });
    };

    const sendChatMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !partyId) return;

        socket.emit('chat-message', {
            partyId,
            message: chatInput,
            userName: session?.user?.name || 'Guest',
        });

        setChatInput('');
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (partyId && socketInitialized && !magnetLink) {
            socket.emit('join-party', {
                partyId,
                userName: session?.user?.name || 'Guest',
            });
        }
    }, [partyId, socketInitialized, magnetLink, session]);

    // Load WebTorrent when magnetLink is set
    useEffect(() => {
        if (!magnetLink || !videoRef.current) return;

        setIsLoadingTorrent(true);
        setTorrentError('');

        if (typeof window !== 'undefined' && (window as any).WebTorrent) {
            const WebTorrent = (window as any).WebTorrent;
            const client = new WebTorrent();

            client.add(magnetLink, (torrent: any) => {
                const videoFile = torrent.files.find((file: any) =>
                    /\.(mp4|mkv|avi|mov|webm)$/i.test(file.name)
                );

                if (!videoFile) {
                    setTorrentError('No video file found in torrent');
                    setIsLoadingTorrent(false);
                    return;
                }

                videoFile.renderTo(videoRef.current!, {
                    autoplay: false,
                    controls: false,
                });

                setIsLoadingTorrent(false);

                torrent.on('download', () => {
                    setTorrentProgress(parseFloat((torrent.progress * 100).toFixed(1)));
                    setDownloadSpeed(parseFloat((torrent.downloadSpeed / 1024 / 1024).toFixed(2)));
                    setNumPeers(torrent.numPeers);
                });
            });

            return () => {
                client.destroy();
            };
        }
    }, [magnetLink]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={48} />
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <>
            <script src="https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js"></script>

            <div className="min-h-screen bg-gray-950 text-white">
                {!partyId ? (
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="max-w-md w-full space-y-8">
                            <div className="text-center">
                                <Users size={64} className="mx-auto text-blue-500 mb-4" />
                                <h1 className="text-4xl font-bold mb-2">Watch Together</h1>
                                <p className="text-gray-400">Watch movies with friends in sync</p>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={createParty}
                                    className="w-full py-4 px-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors duration-200"
                                >
                                    Create Watch Party
                                </button>

                                <button
                                    onClick={joinParty}
                                    className="w-full py-4 px-6 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors duration-200 border border-gray-700"
                                >
                                    Join Watch Party
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex h-screen">
                        {/* Video Player */}
                        <div className={`flex-1 flex flex-col ${showChat ? '' : 'w-full'}`}>
                            {/* Header */}
                            <div className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
                                <div>
                                    <h1 className="text-xl font-bold">{movieTitle}</h1>
                                    <p className="text-sm text-gray-400">{users.length} viewer{users.length !== 1 ? 's' : ''}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={copyPartyLink}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                                    >
                                        {copied ? <Check size={18} /> : <Copy size={18} />}
                                        {copied ? 'Copied!' : 'Share Link'}
                                    </button>
                                    <button
                                        onClick={() => setShowChat(!showChat)}
                                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        <MessageCircle size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Video Container */}
                            <div className="flex-1 bg-black relative">
                                {isLoadingTorrent ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
                                            <p className="text-white">Loading torrent...</p>
                                            {torrentProgress > 0 && (
                                                <p className="text-gray-400 mt-2">{torrentProgress}%</p>
                                            )}
                                        </div>
                                    </div>
                                ) : torrentError ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center text-red-500">
                                            <p>Error: {torrentError}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        ref={containerRef}
                                        className="relative h-full group"
                                        onMouseMove={() => setShowControls(true)}
                                    >
                                        <video
                                            ref={videoRef}
                                            className="w-full h-full"
                                            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                                            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                                            onEnded={() => setIsPlaying(false)}
                                        />

                                        {/* Video Controls */}
                                        {showControls && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
                                                {/* Progress Bar */}
                                                <div
                                                    ref={progressBarRef}
                                                    onClick={handleSeek}
                                                    className="w-full h-2 bg-gray-700 rounded-full cursor-pointer mb-4 hover:h-3 transition-all"
                                                >
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full relative"
                                                        style={{ width: `${(currentTime / duration) * 100}%` }}
                                                    >
                                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full" />
                                                    </div>
                                                </div>

                                                {/* Controls Row */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <button onClick={handlePlayPause} className="hover:text-blue-500 transition-colors">
                                                            {isPlaying ? <Pause size={28} /> : <Play size={28} />}
                                                        </button>

                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setIsMuted(!isMuted);
                                                                    if (videoRef.current) videoRef.current.muted = !isMuted;
                                                                }}
                                                                className="hover:text-blue-500 transition-colors"
                                                            >
                                                                {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                                            </button>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="1"
                                                                step="0.1"
                                                                value={volume}
                                                                onChange={(e) => {
                                                                    const newVolume = parseFloat(e.target.value);
                                                                    setVolume(newVolume);
                                                                    if (videoRef.current) videoRef.current.volume = newVolume;
                                                                }}
                                                                className="w-20"
                                                            />
                                                        </div>

                                                        <span className="text-sm">
                                                            {formatTime(currentTime)} / {formatTime(duration)}
                                                        </span>

                                                        {numPeers > 0 && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                                <Download size={16} />
                                                                <span>{downloadSpeed} MB/s</span>
                                                                <Users size={16} />
                                                                <span>{numPeers}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <button
                                                                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                                                className="hover:text-blue-500 transition-colors"
                                                            >
                                                                <Settings size={24} />
                                                            </button>
                                                            {showSpeedMenu && (
                                                                <div className="absolute bottom-full right-0 mb-2 bg-gray-900 rounded-lg shadow-xl p-2 min-w-[100px]">
                                                                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                                                                        <button
                                                                            key={speed}
                                                                            onClick={() => {
                                                                                setPlaybackSpeed(speed);
                                                                                if (videoRef.current) videoRef.current.playbackRate = speed;
                                                                                setShowSpeedMenu(false);
                                                                            }}
                                                                            className={`w-full text-left px-3 py-2 hover:bg-gray-800 rounded ${playbackSpeed === speed ? 'text-blue-500' : ''
                                                                                }`}
                                                                        >
                                                                            {speed}x
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <button
                                                            onClick={() => {
                                                                if (document.fullscreenElement) {
                                                                    document.exitFullscreen();
                                                                    setIsFullscreen(false);
                                                                } else {
                                                                    containerRef.current?.requestFullscreen();
                                                                    setIsFullscreen(true);
                                                                }
                                                            }}
                                                            className="hover:text-blue-500 transition-colors"
                                                        >
                                                            <Maximize size={24} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Chat Sidebar */}
                        {showChat && (
                            <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col">
                                {/* Users List */}
                                <div className="p-4 border-b border-gray-800">
                                    <h3 className="text-sm font-semibold text-gray-400 mb-2">VIEWERS ({users.length})</h3>
                                    <div className="space-y-1">
                                        {users.map((user) => (
                                            <div key={user.id} className="flex items-center gap-2 text-sm">
                                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                {user.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Chat Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {chatMessages.map((msg, idx) => (
                                        <div key={idx} className="text-sm">
                                            <span className={`font-semibold ${msg.userName === 'System' ? 'text-gray-500' : 'text-blue-500'}`}>
                                                {msg.userName}:
                                            </span>{' '}
                                            <span className="text-gray-300">{msg.message}</span>
                                        </div>
                                    ))}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Chat Input */}
                                <form onSubmit={sendChatMessage} className="p-4 border-t border-gray-800">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Type a message..."
                                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </form>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
