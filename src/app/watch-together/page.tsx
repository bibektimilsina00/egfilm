'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Video, VideoOff, Mic, MicOff, Phone, MessageCircle, Users, Copy, Check, Send, X, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import io, { Socket } from 'socket.io-client';

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
    const [copied, setCopied] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true);
    const [error, setError] = useState('');
    const [roomData, setRoomData] = useState<any>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Clear localStorage and modal state if joining via notification link
        if (roomCode && username) {
            // Remove any localStorage backup for this room
            localStorage.removeItem(`room_${roomCode}`);
            // Optionally, clear any modal state here if you use a modal open state
            console.log('🧹 Cleared localStorage for room', roomCode, 'on notification join');
        }
    }, [roomCode, username]);

    useEffect(() => {
        if (!roomCode || !username) {
            setError('Missing room code or username');
            setIsConnecting(false);
            return;
        }
        // Only call initializeRoom if not already connected
        if (!socket || !socket.connected) {
            initializeRoom();
        } else {
            console.log('Socket already connected, skipping initializeRoom');
        }
        return () => {
            cleanup();
        };
    }, [roomCode, username]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const initializeRoom = async () => {
        try {
            // Prevent duplicate initialization
            if (socket && socket.connected) {
                console.log('Socket already connected, skipping initialization');
                return;
            }

            // Fetch room data from database
            const roomResponse = await fetch(`/api/watch-room?roomCode=${roomCode}`);
            if (roomResponse.ok) {
                const data = await roomResponse.json();
                setRoomData(data.room);
            } else {
                // Fallback to localStorage if room not in database
                const savedRoom = localStorage.getItem(`room_${roomCode}`);
                if (savedRoom) {
                    setRoomData(JSON.parse(savedRoom));
                }
            }

            // Get userId from database using session email
            let userId = null;
            if (session?.user?.email) {
                try {
                    const userResponse = await fetch('/api/auth/user');
                    if (userResponse.ok) {
                        const userData = await userResponse.json();
                        userId = userData.id;
                    }
                } catch (error) {
                    console.error('Failed to fetch user ID:', error);
                }
            }

            // Initialize socket connection
            await fetch('/api/socketio');
            socket = io({ path: '/api/socketio' });

            socket.on('connect', () => {
                console.log('Connected to socket');
                socket.emit('join-watch-together', { roomCode, username, userId });
            });

            socket.on('room-joined', (data) => {
                setParticipants(data.participants);
                setChatMessages(data.messages || []);
                setIsConnecting(false);
            });

            socket.on('participant-joined', (data) => {
                setParticipants(data.participants);
                addSystemMessage(`${data.newParticipant.username} joined the room`);
                // Initialize WebRTC connection with new participant
                initializePeerConnection(data.newParticipant.id);
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

            // Initialize local media
            await setupLocalMedia();

        } catch (err: any) {
            console.error('Error initializing room:', err);
            setError(err.message || 'Failed to join room');
            setIsConnecting(false);
        }
    };

    const setupLocalMedia = async () => {
        try {
            const constraints: MediaStreamConstraints = {
                video: isVideoEnabled,
                audio: isAudioEnabled
            };

            // Only try to get user media if in browser and mediaDevices is available
            if ((isVideoEnabled || isAudioEnabled) && typeof window !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                localStreamRef.current = stream;

                if (localVideoRef.current && isVideoEnabled) {
                    localVideoRef.current.srcObject = stream;
                }
            } else {
                localStreamRef.current = null;
            }
        } catch (error) {
            console.error('Error setting up local media:', error);
            localStreamRef.current = null;
        }
    };

    const initializePeerConnection = async (peerId: string) => {
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
            localStreamRef.current.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStreamRef.current!);
            });
        }

        // Handle incoming streams
        peerConnection.ontrack = (event) => {
            const [remoteStream] = event.streams;
            // Update participant stream
            setParticipants(prev => prev.map(p =>
                p.id === peerId ? { ...p, stream: remoteStream } : p
            ));
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

        // Create and send offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('webrtc-offer', {
            roomCode,
            to: peerId,
            offer
        });
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
        if (!localStreamRef.current) {
            // Enable video
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                const videoTrack = stream.getVideoTracks()[0];

                localStreamRef.current = stream;

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = localStreamRef.current;
                }

                // Add to all peer connections
                Object.values(peerConnections).forEach(pc => {
                    pc.addTrack(videoTrack, localStreamRef.current!);
                });

                setIsVideoEnabled(true);
            } catch (err) {
                console.error('Error enabling video:', err);
                addSystemMessage('Could not access camera');
            }
        } else {
            // Toggle existing video track
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoEnabled(videoTrack.enabled);
            }
        }

        socket.emit('update-media-status', {
            roomCode,
            hasVideo: !isVideoEnabled,
            hasAudio: isAudioEnabled
        });
    };

    const toggleAudio = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioEnabled(audioTrack.enabled);

                socket.emit('update-media-status', {
                    roomCode,
                    hasVideo: isVideoEnabled,
                    hasAudio: audioTrack.enabled
                });
            }
        }
    };

    const leaveRoom = () => {
        cleanup();
        router.push('/');
    };

    const cleanup = () => {
        console.log('🧹 Cleaning up watch together session');

        // Stop all media tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
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

        if (!socket) return;

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Emit typing event
        if (value.length > 0) {
            socket.emit('typing', { roomCode, username });

            // Set timeout to stop typing after 3 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stop-typing', { roomCode, username });
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
                    {/* Video Player */}
                    <div className="flex-1 flex items-center justify-center relative">
                        {roomData?.embedUrl ? (
                            <iframe
                                src={roomData.embedUrl}
                                className="w-full h-full"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                allowFullScreen
                                title={roomData.movieTitle}
                            />
                        ) : (
                            <div className="text-center">
                                <Video className="w-24 h-24 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400">No video selected</p>
                            </div>
                        )}

                        {/* Fullscreen Toggle */}
                        <button
                            onClick={toggleFullscreen}
                            className="absolute bottom-4 right-4 p-3 bg-gray-900/80 hover:bg-gray-800 rounded-full transition-colors z-10"
                        >
                            {isFullscreen ? (
                                <Minimize className="w-5 h-5 text-white" />
                            ) : (
                                <Maximize className="w-5 h-5 text-white" />
                            )}
                        </button>
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
                            className="rounded-full"
                        >
                            <MessageCircle className="w-6 h-6" />
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
                            className={`flex-1 py-3 px-4 font-semibold transition-colors ${showChat && !showParticipants ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <MessageCircle className="w-5 h-5 inline mr-2" />
                            Chat
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
                            <div className="bg-gray-800 rounded-lg p-3">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                        {username?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-semibold">{username} (You)</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            {isVideoEnabled ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
                                            {isAudioEnabled ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                                        </div>
                                    </div>
                                </div>
                                {isVideoEnabled && (
                                    <video
                                        ref={localVideoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        className="w-full aspect-video bg-gray-900 rounded object-cover"
                                    />
                                )}
                            </div>

                            {/* Other Participants */}
                            {participants.filter(p => p.username !== username).map((participant) => (
                                <div key={participant.id} className="bg-gray-800 rounded-lg p-3">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                            {participant.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white font-semibold">{participant.username}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                {participant.hasVideo ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
                                                {participant.hasAudio ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                                            </div>
                                        </div>
                                    </div>
                                    {participant.hasVideo && participant.stream && (
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
