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
    magnetLink: string;
    users: Map<string, { id: string; name: string }>;
    currentTime: number;
    isPlaying: boolean;
}

const watchParties = new Map<string, WatchParty>();

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
            socket.on('create-party', ({ movieTitle, magnetLink, userName }) => {
                const partyId = Math.random().toString(36).substring(7);
                const party: WatchParty = {
                    id: partyId,
                    host: socket.id,
                    movieTitle,
                    magnetLink,
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
            });
        });
    }
    res.end();
};

export default SocketHandler;
