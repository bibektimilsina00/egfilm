'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Video, VideoOff, Mic, MicOff, Phone, MessageCircle, Users, Copy, Check, Send, X, Maximize, Minimize, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import io, { Socket } from 'socket.io-client';
import { VIDEO_SOURCES } from '@/lib/videoSources';

interface Participant {
    id: string;
    username: string;
    hasVideo: boolean;
    hasAudio: boolean;
    stream?: MediaStream;
}

interface ChatMessage {
    id: string;
    username: string;
    message: string;
    timestamp: number;
}

let socket: Socket;
let peerConnections: { [key: string]: RTCPeerConnection } = {};

function WatchTogetherContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const roomCode = searchParams?.get('room');
    const username = searchParams?.get('username');

    const [participants, setParticipants] = useState<Participant[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [showChat, setShowChat] = useState(true);
    const [showParticipants, setShowParticipants] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [copied, setCopied] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true);
    const [error, setError] = useState('');
    const [roomData, setRoomData] = useState<any>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
    const [showSourceMenu, setShowSourceMenu] = useState(false);
    const [currentEmbedUrl, setCurrentEmbedUrl] = useState('');

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const isInitializedRef = useRef(false); // Track initialization to prevent double mount

    useEffect(() => {
        // Clear localStorage and modal state if joining via notification link
        if (roomCode && username) {
            localStorage.removeItem(`room_${roomCode}`);
        }
    }, [roomCode, username]);

    useEffect(() => {
        if (!roomCode || !username) {
            setError('Missing room code or username');
            setIsConnecting(false);
            return;
        }

        // Prevent double initialization in React Strict Mode
        if (isInitializedRef.current) {
            return;
        }

        // Only call initializeRoom if not already connected
        if (!socket || !socket.connected) {
            isInitializedRef.current = true;
            initializeRoom();
        }

        return () => {
            // Only cleanup on actual unmount (when component is being destroyed)
            // Don't cleanup during Strict Mode development double-mount
            // The cleanup will happen when user explicitly leaves the room
        };
    }, [roomCode, username]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Reset unread count when chat is opened
    useEffect(() => {
        if (showChat && !showParticipants) {
            setUnreadCount(0);
        }
    }, [showChat, showParticipants]);

    const initializeRoom = async () => {
        try {
            // Prevent duplicate initialization
            if (socket && socket.connected) {
                return;
            }

            // Fetch room data from database
            const roomResponse = await fetch(`/api/watch-room?roomCode=${roomCode}`);
            if (roomResponse.ok) {
                const data = await roomResponse.json();
                setRoomData(data.room);
                setCurrentEmbedUrl(data.room.embedUrl);
            } else {
                // Fallback to localStorage if room not in database
                const savedRoom = localStorage.getItem(`room_${roomCode}`);
                if (savedRoom) {
                    const parsedRoom = JSON.parse(savedRoom);
                    setRoomData(parsedRoom);
                    setCurrentEmbedUrl(parsedRoom.embedUrl);
                }
            }

            // Get userId from database using session email
            let userId: string | null = null;
            if (session?.user?.email) {
                try {
                    const userResponse = await fetch('/api/auth/user');
                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        userId = userData.id;
                    }
                } catch (error) {
                    // Failed to fetch user ID, will join as guest
                }
            }

            // Initialize socket connection AFTER getting userId
            socket = io({
                path: '/api/socketio',
                autoConnect: false  // Don't connect immediately, wait for listeners
            });

            // Set up all event listeners BEFORE connecting
            socket.on('connect', () => {
                socket.emit('join-watch-together', { roomCode, username, userId });
            });

            socket.on('connect_error', (error) => {
                setError('Failed to connect to server');
                setIsConnecting(false);
            });

            socket.on('room-joined', (data) => {
                setParticipants(data.participants);
                setChatMessages(data.messages || []);
                setIsConnecting(false);

                // Initialize WebRTC connections with all existing participants
                // Only create offers if we're the one joining (to avoid both sides sending offers)
                data.participants.forEach((participant: Participant) => {
                    if (participant.id !== socket.id) {
                        initializePeerConnection(participant.id, true); // Send offer to existing participants
                    }
                });
            });

            socket.on('participant-joined', (data) => {
                setParticipants(data.participants);
                addSystemMessage(`${data.newParticipant.username} joined the room`);
                // Don't initialize connection here - the new participant will send offers
            });

            socket.on('participant-left', (data) => {
                setParticipants(data.participants);
                addSystemMessage(`${data.username} left the room`);
                // Close peer connection
                if (peerConnections[data.participantId]) {
                    peerConnections[data.participantId].close();
                    delete peerConnections[data.participantId];
                }
            });

            socket.on('chat-message', (message: ChatMessage) => {
                setChatMessages(prev => [...prev, message]);
                // Increment unread count if chat is not visible and message is not from current user or system
                if (message.username !== username && message.username !== 'System') {
                    setShowChat(currentShowChat => {
                        setShowParticipants(currentShowParticipants => {
                            if (!currentShowChat || currentShowParticipants) {
                                setUnreadCount(prev => prev + 1);
                            }
                            return currentShowParticipants;
                        });
                        return currentShowChat;
                    });
                }
            });

            // Typing indicator events
            socket.on('user-typing', ({ username: typingUsername }) => {
                if (typingUsername !== username) {
                    setTypingUsers(prev => {
                        if (!prev.includes(typingUsername)) {
                            return [...prev, typingUsername];
                        }
                        return prev;
                    });
                }
            });

            socket.on('user-stopped-typing', ({ username: typingUsername }) => {
                setTypingUsers(prev => prev.filter(u => u !== typingUsername));
            });

            socket.on('webrtc-offer', async ({ from, offer }) => {
                await handleOffer(from, offer);
            });

            socket.on('webrtc-answer', async ({ from, answer }) => {
                await handleAnswer(from, answer);
            });

            socket.on('webrtc-ice-candidate', async ({ from, candidate }) => {
                await handleIceCandidate(from, candidate);
            });

            socket.on('participant-updated', ({ participantId, hasVideo, hasAudio }) => {
                setParticipants(prev => prev.map(p =>
                    p.id === participantId ? { ...p, hasVideo, hasAudio } : p
                ));
            });

            // Initialize local media BEFORE connecting socket
            await setupLocalMedia();

            // Now connect the socket (this will trigger the 'connect' event)
            socket.connect();

        } catch (err: any) {
            setError(err.message || 'Failed to join room');
            setIsConnecting(false);
        }
    };

    const setupLocalMedia = async () => {
        try {
            // Check if mediaDevices is available
            if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                const errorMsg = '⚠️ Camera/microphone access is not available in your browser';
                addSystemMessage(errorMsg);
                localStreamRef.current = null;
                return;
            }

            // Request BOTH camera and microphone permissions upfront
            // This shows the browser permission dialog
            const constraints: MediaStreamConstraints = {
                video: true,  // Always request video permission
                audio: true   // Always request audio permission
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStreamRef.current = stream;

            // Set initial states (video OFF, audio ON by default)
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = false; // Start with video OFF
            }

            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = true; // Start with audio ON
            }

            // Update UI states to match
            setIsVideoEnabled(false);
            setIsAudioEnabled(true);

            // Set local video element but don't show video initially
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            addSystemMessage('✅ Camera and microphone permissions granted');
        } catch (error: any) {
            localStreamRef.current = null;
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                addSystemMessage('❌ Camera/microphone access denied. Please allow permissions in your browser.');
            } else if (error.name === 'NotFoundError') {
                addSystemMessage('❌ No camera or microphone found on your device.');
            } else {
                addSystemMessage('❌ Failed to access camera/microphone: ' + error.message);
            }
        }
    };

    const initializePeerConnection = async (peerId: string, shouldCreateOffer: boolean = false) => {
        const configuration: RTCConfiguration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };

        const peerConnection = new RTCPeerConnection(configuration);
        peerConnections[peerId] = peerConnection;

        // Add local stream tracks
        if (localStreamRef.current) {
            const tracks = localStreamRef.current.getTracks();
            tracks.forEach(track => {
                peerConnection.addTrack(track, localStreamRef.current!);
            });
        }

        // Handle incoming streams
        peerConnection.ontrack = (event) => {
            const [remoteStream] = event.streams;
            setParticipants(prev => prev.map(p =>
                p.id === peerId ? { ...p, stream: remoteStream } : p
            ));
        };

        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
            // Connection state tracking
        };

        // Handle ICE connection state
        peerConnection.oniceconnectionstatechange = () => {
            // ICE state tracking
        };

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('webrtc-ice-candidate', {
                    roomCode,
                    to: peerId,
                    candidate: event.candidate
                });
            }
        };

        // Only create and send offer if explicitly requested
        if (shouldCreateOffer) {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.emit('webrtc-offer', {
                roomCode,
                to: peerId,
                offer
            });
        }
    };

    const handleOffer = async (from: string, offer: RTCSessionDescriptionInit) => {
        if (!peerConnections[from]) {
            await initializePeerConnection(from);
        }

        const peerConnection = peerConnections[from];
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit('webrtc-answer', {
            roomCode,
            to: from,
            answer
        });
    };

    const handleAnswer = async (from: string, answer: RTCSessionDescriptionInit) => {
        const peerConnection = peerConnections[from];
        if (peerConnection) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        }
    };

    const handleIceCandidate = async (from: string, candidate: RTCIceCandidateInit) => {
        const peerConnection = peerConnections[from];
        if (peerConnection) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
    };

    const toggleVideo = async () => {
        try {
            if (!socket || !socket.connected) {
                addSystemMessage('❌ Not connected to room. Please reload the page.');
                return;
            }

            if (!localStreamRef.current) {
                addSystemMessage('❌ No media stream available. Please reload the page.');
                return;
            }

            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (!videoTrack) {
                addSystemMessage('❌ No camera track found. Please reload the page.');
                return;
            }

            // Simply toggle the enabled state
            videoTrack.enabled = !videoTrack.enabled;
            const newVideoState = videoTrack.enabled;
            setIsVideoEnabled(newVideoState);

            console.log('📹 Video toggled:', newVideoState, 'localVideoRef:', !!localVideoRef.current, 'srcObject:', !!localVideoRef.current?.srcObject);

            // Notify other participants
            socket.emit('update-media-status', {
                roomCode,
                hasVideo: newVideoState,
                hasAudio: isAudioEnabled
            });

            addSystemMessage(newVideoState ? '📹 Camera enabled' : '📹 Camera disabled');
        } catch (err: any) {
            addSystemMessage('❌ Could not toggle camera: ' + err.message);
        }
    };

    const toggleAudio = () => {
        try {
            if (!socket || !socket.connected) {
                addSystemMessage('❌ Not connected to room. Please reload the page.');
                return;
            }

            if (!localStreamRef.current) {
                addSystemMessage('❌ No media stream available. Please reload the page.');
                return;
            }

            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (!audioTrack) {
                addSystemMessage('❌ No microphone track found. Please reload the page.');
                return;
            }

            // Simply toggle the enabled state
            audioTrack.enabled = !audioTrack.enabled;
            const newAudioState = audioTrack.enabled;
            setIsAudioEnabled(newAudioState);

            // Notify other participants
            socket.emit('update-media-status', {
                roomCode,
                hasVideo: isVideoEnabled,
                hasAudio: newAudioState
            });

            addSystemMessage(newAudioState ? '🎤 Microphone enabled' : '🎤 Microphone muted');
        } catch (err: any) {
            addSystemMessage('❌ Could not toggle microphone: ' + err.message);
        }
    };

    const changeVideoSource = (index: number) => {
        if (!roomData) return;

        setCurrentSourceIndex(index);
        const source = VIDEO_SOURCES[index];

        // Generate new embed URL based on media type
        let newUrl: string;
        if (roomData.type === 'tv' && roomData.season && roomData.episode) {
            newUrl = source.embed(roomData.movieId, 'tv', roomData.season, roomData.episode);
        } else {
            newUrl = source.embed(roomData.movieId, 'movie');
        }

        setCurrentEmbedUrl(newUrl);
        setShowSourceMenu(false);

        addSystemMessage(`📺 Switched to ${source.name}`);
    };

    const leaveRoom = () => {
        cleanup();
        router.push('/');
    };

    const cleanup = () => {
        // Stop all media tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        }

        // Close all peer connections
        Object.values(peerConnections).forEach(pc => pc.close());
        peerConnections = {};

        // Disconnect socket
        if (socket) {
            socket.emit('leave-watch-together', { roomCode, username });
            socket.removeAllListeners(); // Remove all event listeners
            socket.disconnect();
            socket = null as any; // Clear the socket reference
        }
    };

    const sendMessage = () => {
        if (!chatInput.trim()) return;

        if (!socket || !socket.connected) {
            addSystemMessage('❌ Not connected to room. Cannot send message.');
            return;
        }

        const message: ChatMessage = {
            id: Date.now().toString(),
            username: username || 'Anonymous',
            message: chatInput,
            timestamp: Date.now()
        };

        socket.emit('send-chat-message', { roomCode, message });
        setChatInput('');

        // Stop typing indicator
        socket.emit('stop-typing', { roomCode, username });
    };

    const handleTyping = (value: string) => {
        setChatInput(value);

        if (!socket || !socket.connected) return;

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Emit typing event
        if (value.length > 0) {
            socket.emit('typing', { roomCode, username });

            // Set timeout to stop typing after 3 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                if (socket && socket.connected) {
                    socket.emit('stop-typing', { roomCode, username });
                }
            }, 3000);
        } else {
            socket.emit('stop-typing', { roomCode, username });
        }
    };

    const addSystemMessage = (text: string) => {
        const message: ChatMessage = {
            id: Date.now().toString(),
            username: 'System',
            message: text,
            timestamp: Date.now()
        };
        setChatMessages(prev => [...prev, message]);
    };

    const handleCopyRoomCode = () => {
        navigator.clipboard.writeText(roomCode || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleFullscreen = () => {
        if (!videoContainerRef.current) return;

        if (!document.fullscreenElement) {
            videoContainerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    if (isConnecting) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg">Joining room...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
                <div className="bg-red-900/20 border border-red-500 rounded-lg p-8 max-w-md text-center">
                    <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
                    <p className="text-gray-300 mb-6">{error}</p>
                    <Button onClick={() => router.push('/')} className="bg-blue-600 hover:bg-blue-700">
                        Go Back Home
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col">
            {/* Header */}
            <div className="bg-gray-900 border-b border-gray-800 p-4">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-white text-xl font-bold">
                            {roomData?.movieTitle || 'Watch Together'}
                        </h1>
                        <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-lg">
                            <span className="text-gray-400 text-sm">Room:</span>
                            <span className="text-white font-mono">{roomCode}</span>
                            <button
                                onClick={handleCopyRoomCode}
                                className="p-1 hover:bg-gray-700 rounded transition-colors"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                    <Copy className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                        </div>
                    </div>
                    <Button
                        onClick={leaveRoom}
                        variant="outline"
                        className="gap-2 text-red-500 border-red-500 hover:bg-red-500/10"
                    >
                        <Phone className="w-5 h-5 rotate-135" />
                        Leave
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Video Area */}
                <div className="flex-1 flex flex-col bg-black relative" ref={videoContainerRef}>
                    {/* Video Player Controls - Top Right */}
                    <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                        {/* Source Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setShowSourceMenu(!showSourceMenu)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-900/90 backdrop-blur-sm hover:bg-gray-800/90 text-white rounded-lg transition-colors border border-gray-700 shadow-lg"
                            >
                                <span className="text-sm font-medium">
                                    {VIDEO_SOURCES[currentSourceIndex].name}
                                </span>
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {showSourceMenu && (
                                <div className="absolute top-full right-0 mt-2 bg-gray-900/95 backdrop-blur-md rounded-lg shadow-2xl border border-gray-700 min-w-[220px] z-50">
                                    <div className="p-2">
                                        <div className="text-xs text-gray-400 px-3 py-2 font-semibold">
                                            Select Video Server
                                        </div>
                                        {VIDEO_SOURCES.map((source, index) => (
                                            <button
                                                key={index}
                                                onClick={() => changeVideoSource(index)}
                                                className={`w-full text-left px-3 py-2 rounded transition-colors ${currentSourceIndex === index
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-gray-300 hover:bg-gray-800'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">{source.name}</span>
                                                    <span className="text-xs bg-green-600 px-2 py-0.5 rounded font-semibold">
                                                        {source.quality}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Fullscreen Button */}
                        <button
                            onClick={toggleFullscreen}
                            className="p-2.5 bg-gray-900/90 backdrop-blur-sm hover:bg-gray-800/90 text-white rounded-lg transition-colors border border-gray-700 shadow-lg"
                            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        >
                            {isFullscreen ? (
                                <Minimize className="w-5 h-5" />
                            ) : (
                                <Maximize className="w-5 h-5" />
                            )}
                        </button>
                    </div>

                    {/* Video Player */}
                    <div className="flex-1 flex items-center justify-center relative">
                        {currentEmbedUrl ? (
                            <iframe
                                key={currentEmbedUrl}
                                src={currentEmbedUrl}
                                className="w-full h-full"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                allowFullScreen
                                title={roomData?.movieTitle}
                            />
                        ) : (
                            <div className="text-center">
                                <Video className="w-24 h-24 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400">Loading video player...</p>
                            </div>
                        )}

                        {/* Floating Video Grid - Shows all participants with active video */}
                        <div className="absolute top-20 right-4 z-10 space-y-2 max-w-xs">
                            {/* Your Video */}
                            {isVideoEnabled && (
                                <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg overflow-hidden shadow-2xl border border-gray-700">
                                    <div className="relative">
                                        <video
                                            ref={localVideoRef}
                                            autoPlay
                                            muted
                                            playsInline
                                            className="w-48 h-36 object-cover"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-white text-xs font-semibold truncate">{username} (You)</p>
                                                <div className="flex items-center gap-1">
                                                    {isAudioEnabled ? (
                                                        <Mic className="w-3 h-3 text-green-400" />
                                                    ) : (
                                                        <MicOff className="w-3 h-3 text-red-400" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Other Participants' Videos */}
                            {participants
                                .filter(p => p.username !== username && p.hasVideo && p.stream)
                                .map((participant) => (
                                    <div key={participant.id} className="bg-gray-900/90 backdrop-blur-sm rounded-lg overflow-hidden shadow-2xl border border-gray-700">
                                        <div className="relative">
                                            <video
                                                autoPlay
                                                playsInline
                                                ref={(video) => {
                                                    if (video && participant.stream) {
                                                        video.srcObject = participant.stream;
                                                    }
                                                }}
                                                className="w-48 h-36 object-cover"
                                            />
                                            {/* Hidden audio element for this participant */}
                                            <audio
                                                autoPlay
                                                playsInline
                                                ref={(audio) => {
                                                    if (audio && participant.stream) {
                                                        audio.srcObject = participant.stream;
                                                    }
                                                }}
                                            />
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-white text-xs font-semibold truncate">{participant.username}</p>
                                                    <div className="flex items-center gap-1">
                                                        {participant.hasAudio ? (
                                                            <Mic className="w-3 h-3 text-green-400" />
                                                        ) : (
                                                            <MicOff className="w-3 h-3 text-red-400" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                            {/* Audio-only participants (no video but audio is on) */}
                            {participants
                                .filter(p => p.username !== username && !p.hasVideo && p.stream)
                                .map((participant) => (
                                    <div key={participant.id}>
                                        {/* Just audio element, no visual */}
                                        <audio
                                            autoPlay
                                            playsInline
                                            ref={(audio) => {
                                                if (audio && participant.stream) {
                                                    audio.srcObject = participant.stream;
                                                }
                                            }}
                                        />
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Video Call Controls */}
                    <div className="bg-gray-900 p-4 flex items-center justify-center gap-4">
                        <Button
                            onClick={toggleVideo}
                            variant="outline"
                            size="lg"
                            className={`rounded-full ${!isVideoEnabled ? 'bg-red-600 hover:bg-red-700 border-red-600' : ''}`}
                        >
                            {isVideoEnabled ? (
                                <Video className="w-6 h-6" />
                            ) : (
                                <VideoOff className="w-6 h-6" />
                            )}
                        </Button>
                        <Button
                            onClick={toggleAudio}
                            variant="outline"
                            size="lg"
                            className={`rounded-full ${!isAudioEnabled ? 'bg-red-600 hover:bg-red-700 border-red-600' : ''}`}
                        >
                            {isAudioEnabled ? (
                                <Mic className="w-6 h-6" />
                            ) : (
                                <MicOff className="w-6 h-6" />
                            )}
                        </Button>
                        <Button
                            onClick={() => setShowChat(!showChat)}
                            variant="outline"
                            size="lg"
                            className="rounded-full relative"
                        >
                            <MessageCircle className="w-6 h-6" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </Button>
                        <Button
                            onClick={() => setShowParticipants(!showParticipants)}
                            variant="outline"
                            size="lg"
                            className="rounded-full"
                        >
                            <Users className="w-6 h-6" />
                            <span className="ml-2">{participants.length}</span>
                        </Button>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="w-80 bg-gray-900 flex flex-col border-l border-gray-800">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-800">
                        <button
                            onClick={() => { setShowChat(true); setShowParticipants(false); }}
                            className={`flex-1 py-3 px-4 font-semibold transition-colors relative ${showChat && !showParticipants ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <MessageCircle className="w-5 h-5 inline mr-2" />
                            Chat
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => { setShowParticipants(true); setShowChat(false); }}
                            className={`flex-1 py-3 px-4 font-semibold transition-colors ${showParticipants && !showChat ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Users className="w-5 h-5 inline mr-2" />
                            People ({participants.length})
                        </button>
                    </div>

                    {/* Content */}
                    {showChat && !showParticipants && (
                        <>
                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {chatMessages.map((msg) => (
                                    <div key={msg.id} className={`${msg.username === 'System' ? 'text-center' : ''}`}>
                                        {msg.username === 'System' ? (
                                            <p className="text-xs text-gray-500 italic">{msg.message}</p>
                                        ) : (
                                            <div className="bg-gray-800 rounded-lg p-3">
                                                <p className="text-sm font-semibold text-blue-400 mb-1">
                                                    {msg.username}
                                                </p>
                                                <p className="text-gray-300 text-sm break-words">{msg.message}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Typing Indicator */}
                                {typingUsers.length > 0 && (
                                    <div className="flex items-center gap-2 text-gray-400 text-sm italic">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </div>
                                        <span>
                                            {typingUsers.length === 1
                                                ? `${typingUsers[0]} is typing...`
                                                : typingUsers.length === 2
                                                    ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
                                                    : `${typingUsers.length} people are typing...`}
                                        </span>
                                    </div>
                                )}

                                <div ref={chatEndRef} />
                            </div>

                            {/* Chat Input */}
                            <div className="p-4 border-t border-gray-800">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => handleTyping(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <Button onClick={sendMessage} className="bg-blue-600 hover:bg-blue-700">
                                        <Send className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}

                    {showParticipants && !showChat && (
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {/* Local User Video */}
                            <div className="bg-gray-800 rounded-lg p-3 relative">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                        {username?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-semibold">{username} (You)</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            {isVideoEnabled ? (
                                                <span className="flex items-center gap-1 text-green-400">
                                                    <Video className="w-3 h-3" /> Camera On
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-400">
                                                    <VideoOff className="w-3 h-3" /> Camera Off
                                                </span>
                                            )}
                                            {isAudioEnabled ? (
                                                <span className="flex items-center gap-1 text-green-400">
                                                    <Mic className="w-3 h-3" /> Mic On
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-400">
                                                    <MicOff className="w-3 h-3" /> Muted
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {isVideoEnabled ? (
                                    <video
                                        ref={localVideoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        className="w-full aspect-video bg-gray-900 rounded object-cover"
                                    />
                                ) : (
                                    <div className="w-full aspect-video bg-gray-900 rounded flex items-center justify-center">
                                        <VideoOff className="w-12 h-12 text-gray-600" />
                                    </div>
                                )}
                            </div>

                            {/* Other Participants */}
                            {participants.filter(p => p.username !== username).map((participant) => (
                                <div key={participant.id} className="bg-gray-800 rounded-lg p-3 relative">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                            {participant.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-semibold">{participant.username}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                {participant.hasVideo ? (
                                                    <span className="flex items-center gap-1 text-green-400">
                                                        <Video className="w-3 h-3" /> Camera On
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-red-400">
                                                        <VideoOff className="w-3 h-3" /> Camera Off
                                                    </span>
                                                )}
                                                {participant.hasAudio ? (
                                                    <span className="flex items-center gap-1 text-green-400">
                                                        <Mic className="w-3 h-3" /> Mic On
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-red-400">
                                                        <MicOff className="w-3 h-3" /> Muted
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {participant.hasVideo && participant.stream ? (
                                        <video
                                            autoPlay
                                            playsInline
                                            ref={(video) => {
                                                if (video && participant.stream) {
                                                    video.srcObject = participant.stream;
                                                }
                                            }}
                                            className="w-full aspect-video bg-gray-900 rounded object-cover"
                                        />
                                    ) : (
                                        <div className="w-full aspect-video bg-gray-900 rounded flex items-center justify-center">
                                            <div className="text-center">
                                                <VideoOff className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                                                <p className="text-gray-500 text-sm">Camera off</p>
                                            </div>
                                        </div>
                                    )}
                                    {/* Audio element for remote audio (hidden but active) */}
                                    {participant.stream && (
                                        <audio
                                            autoPlay
                                            playsInline
                                            ref={(audio) => {
                                                if (audio && participant.stream) {
                                                    audio.srcObject = participant.stream;
                                                }
                                            }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function WatchTogetherPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading...</p>
                </div>
            </div>
        }>
            <WatchTogetherContent />
        </Suspense>
    );
}
