import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '@/types/socket';

export const config = {
    api: {
        bodyParser: false,
    },
};

interface WatchParty {
    id: string;
    host: string;
    movieTitle: string;
    videoUrl: string;
    users: Map<string, { id: string; name: string }>;
    currentTime: number;
    isPlaying: boolean;
}

interface WatchTogetherRoom {
    roomCode: string;
    hostUsername: string;
    movieTitle: string;
    embedUrl: string;
    participants: Map<string, {
        id: string;
        username: string;
        hasVideo: boolean;
        hasAudio: boolean;
    }>;
    messages: Array<{
        id: string;
        username: string;
        message: string;
        timestamp: number;
    }>;
    createdAt: number;
}

const watchParties = new Map<string, WatchParty>();
const watchTogetherRooms = new Map<string, WatchTogetherRoom>();

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
    if (res.socket.server.io) {
        console.log('Socket is already running');
    } else {
        console.log('Socket is initializing');
        const httpServer: NetServer = res.socket.server as any;
        const io = new SocketIOServer(httpServer, {
            path: '/api/socketio',
            addTrailingSlash: false,
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });
        res.socket.server.io = io;

        io.on('connection', (socket) => {
            console.log('New client connected:', socket.id);

            // Create a new watch party
            socket.on('create-party', ({ movieTitle, videoUrl, userName }) => {
                const partyId = Math.random().toString(36).substring(7);
                const party: WatchParty = {
                    id: partyId,
                    host: socket.id,
                    movieTitle,
                    videoUrl,
                    users: new Map([[socket.id, { id: socket.id, name: userName }]]),
                    currentTime: 0,
                    isPlaying: false,
                };

                watchParties.set(partyId, party);
                socket.join(partyId);

                socket.emit('party-created', {
                    partyId,
                    partyData: {
                        ...party,
                        users: Array.from(party.users.values()),
                    },
                });

                console.log(`Party created: ${partyId}`);
            });

            // Join an existing watch party
            socket.on('join-party', ({ partyId, userName }) => {
                const party = watchParties.get(partyId);

                if (!party) {
                    socket.emit('party-error', { message: 'Party not found' });
                    return;
                }

                party.users.set(socket.id, { id: socket.id, name: userName });
                socket.join(partyId);

                // Notify user who joined
                socket.emit('party-joined', {
                    partyId,
                    partyData: {
                        ...party,
                        users: Array.from(party.users.values()),
                    },
                });

                // Notify other users in the party
                socket.to(partyId).emit('user-joined', {
                    user: { id: socket.id, name: userName },
                    users: Array.from(party.users.values()),
                });

                console.log(`User ${userName} joined party: ${partyId}`);
            });

            // Sync play/pause
            socket.on('play-pause', ({ partyId, isPlaying, currentTime }) => {
                const party = watchParties.get(partyId);
                if (!party) return;

                party.isPlaying = isPlaying;
                party.currentTime = currentTime;

                socket.to(partyId).emit('sync-play-pause', { isPlaying, currentTime });
            });

            // Sync seek
            socket.on('seek', ({ partyId, currentTime }) => {
                const party = watchParties.get(partyId);
                if (!party) return;

                party.currentTime = currentTime;
                socket.to(partyId).emit('sync-seek', { currentTime });
            });

            // Send chat message
            socket.on('chat-message', ({ partyId, message, userName }) => {
                io.to(partyId).emit('chat-message', {
                    message,
                    userName,
                    timestamp: Date.now(),
                });
            });

            // Watch Together - Join room
            socket.on('join-watch-together', ({ roomCode, username }) => {
                console.log(`User ${username} joining room ${roomCode}`);

                let room = watchTogetherRooms.get(roomCode);

                if (!room) {
                    // Create room if it doesn't exist
                    room = {
                        roomCode,
                        hostUsername: username,
                        movieTitle: '',
                        embedUrl: '',
                        participants: new Map(),
                        messages: [],
                        createdAt: Date.now()
                    };
                    watchTogetherRooms.set(roomCode, room);
                }

                // Add participant
                room.participants.set(socket.id, {
                    id: socket.id,
                    username,
                    hasVideo: false,
                    hasAudio: true
                });

                socket.join(roomCode);

                // Send room data to the user
                socket.emit('room-joined', {
                    roomCode,
                    participants: Array.from(room.participants.values()),
                    messages: room.messages
                });

                // Notify others
                socket.to(roomCode).emit('participant-joined', {
                    participants: Array.from(room.participants.values()),
                    newParticipant: {
                        id: socket.id,
                        username
                    }
                });
            });

            // Watch Together - Leave room
            socket.on('leave-watch-together', ({ roomCode, username }) => {
                const room = watchTogetherRooms.get(roomCode);
                if (!room) return;

                room.participants.delete(socket.id);
                socket.leave(roomCode);

                // Notify others
                socket.to(roomCode).emit('participant-left', {
                    participants: Array.from(room.participants.values()),
                    participantId: socket.id,
                    username
                });

                // Delete room if empty
                if (room.participants.size === 0) {
                    watchTogetherRooms.delete(roomCode);
                    console.log(`Watch Together room deleted: ${roomCode}`);
                }
            });

            // Watch Together - Send chat message
            socket.on('send-chat-message', ({ roomCode, message }) => {
                const room = watchTogetherRooms.get(roomCode);
                if (!room) return;

                room.messages.push(message);
                io.to(roomCode).emit('chat-message', message);
            });

            // Watch Together - Update media status
            socket.on('update-media-status', ({ roomCode, hasVideo, hasAudio }) => {
                const room = watchTogetherRooms.get(roomCode);
                if (!room) return;

                const participant = room.participants.get(socket.id);
                if (participant) {
                    participant.hasVideo = hasVideo;
                    participant.hasAudio = hasAudio;

                    // Notify others
                    socket.to(roomCode).emit('participant-updated', {
                        participantId: socket.id,
                        hasVideo,
                        hasAudio
                    });
                }
            });

            // Watch Together - WebRTC Signaling
            socket.on('webrtc-offer', ({ roomCode, to, offer }) => {
                socket.to(to).emit('webrtc-offer', {
                    from: socket.id,
                    offer
                });
            });

            socket.on('webrtc-answer', ({ roomCode, to, answer }) => {
                socket.to(to).emit('webrtc-answer', {
                    from: socket.id,
                    answer
                });
            });

            socket.on('webrtc-ice-candidate', ({ roomCode, to, candidate }) => {
                socket.to(to).emit('webrtc-ice-candidate', {
                    from: socket.id,
                    candidate
                });
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);

                // Remove user from all parties
                watchParties.forEach((party, partyId) => {
                    if (party.users.has(socket.id)) {
                        const user = party.users.get(socket.id);
                        party.users.delete(socket.id);

                        // Notify other users
                        socket.to(partyId).emit('user-left', {
                            userId: socket.id,
                            userName: user?.name,
                            users: Array.from(party.users.values()),
                        });

                        // Delete party if empty
                        if (party.users.size === 0) {
                            watchParties.delete(partyId);
                            console.log(`Party deleted: ${partyId}`);
                        }
                    }
                });

                // Remove from Watch Together rooms
                watchTogetherRooms.forEach((room, roomCode) => {
                    if (room.participants.has(socket.id)) {
                        const participant = room.participants.get(socket.id);
                        room.participants.delete(socket.id);

                        // Notify others
                        socket.to(roomCode).emit('participant-left', {
                            participants: Array.from(room.participants.values()),
                            participantId: socket.id,
                            username: participant?.username
                        });

                        // Delete room if empty
                        if (room.participants.size === 0) {
                            watchTogetherRooms.delete(roomCode);
                            console.log(`Watch Together room deleted: ${roomCode}`);
                        }
                    }
                });
            });
        });
    }
    res.end();
};

export default SocketHandler;
