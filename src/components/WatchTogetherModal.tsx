'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { X, Users, Search, Copy, Check, Video, Mic, MicOff, VideoOff, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WatchTogetherModalProps {
    isOpen: boolean;
    onClose: () => void;
    movieTitle: string;
    movieId: number;
    embedUrl: string;
    type: 'movie' | 'tv';
}

interface User {
    id: string;
    username: string;
    avatar?: string;
}

export default function WatchTogetherModal({
    isOpen,
    onClose,
    movieTitle,
    movieId,
    embedUrl,
    type
}: WatchTogetherModalProps) {
    const { data: session } = useSession();
    const [mode, setMode] = useState<'create' | 'join'>('create');
    const [username, setUsername] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [copied, setCopied] = useState(false);
    const [generatedRoomCode, setGeneratedRoomCode] = useState('');

    // Settings
    const [enableVideo, setEnableVideo] = useState(false);
    const [enableAudio, setEnableAudio] = useState(true);

    useEffect(() => {
        if (isOpen) {
            // Generate room code when modal opens
            setGeneratedRoomCode(generateRoomCode());

            // Use session user's name if available, otherwise try localStorage
            if (session?.user?.name) {
                setUsername(session.user.name);
            } else if (session?.user?.email) {
                // Use email username if name not available
                setUsername(session.user.email.split('@')[0]);
            } else {
                const savedUsername = localStorage.getItem('watchTogether_username');
                if (savedUsername) {
                    setUsername(savedUsername);
                }
            }
        }
    }, [isOpen]);

    const generateRoomCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(generatedRoomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCreateRoom = () => {
        if (!username.trim()) {
            alert('Please enter your username');
            return;
        }

        // Save username for future use
        localStorage.setItem('watchTogether_username', username);

        // Create room with settings
        const roomData = {
            roomCode: generatedRoomCode,
            hostUsername: username,
            movieTitle,
            movieId,
            embedUrl,
            type,
            enableVideo,
            enableAudio,
            invitedUsers: selectedUsers,
            timestamp: Date.now()
        };

        // Store in localStorage (will be replaced with proper backend later)
        localStorage.setItem(`room_${generatedRoomCode}`, JSON.stringify(roomData));

        // Navigate to watch party page
        window.location.href = `/watch-together?room=${generatedRoomCode}&username=${encodeURIComponent(username)}`;
    };

    const handleJoinRoom = () => {
        if (!username.trim()) {
            alert('Please enter your username');
            return;
        }

        if (!roomCode.trim()) {
            alert('Please enter a room code');
            return;
        }

        // Save username
        localStorage.setItem('watchTogether_username', username);

        // Navigate to watch party page
        window.location.href = `/watch-together?room=${roomCode.toUpperCase()}&username=${encodeURIComponent(username)}`;
    };

    const handleAddUser = (user: User) => {
        if (!selectedUsers.find(u => u.id === user.id)) {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const handleRemoveUser = (userId: string) => {
        setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
    };

    // Mock user search - replace with actual API call
    const searchUsers = (query: string): User[] => {
        if (!query) return [];

        // Mock data
        const mockUsers: User[] = [
            { id: '1', username: 'john_doe' },
            { id: '2', username: 'jane_smith' },
            { id: '3', username: 'movie_lover' },
            { id: '4', username: 'netflix_fan' },
        ];

        return mockUsers.filter(u =>
            u.username.toLowerCase().includes(query.toLowerCase())
        );
    };

    const searchResults = searchUsers(searchQuery);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-800">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Users className="w-8 h-8 text-white" />
                            <div>
                                <h2 className="text-2xl font-bold text-white">Watch Together</h2>
                                <p className="text-blue-100 text-sm">{movieTitle}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {/* Mode Selector */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setMode('create')}
                            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${mode === 'create'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            Create Room
                        </button>
                        <button
                            onClick={() => setMode('join')}
                            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${mode === 'join'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            Join Room
                        </button>
                    </div>

                    {mode === 'create' ? (
                        <div className="space-y-6">
                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Your Username
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>

                            {/* Room Code */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Room Code
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={generatedRoomCode}
                                        readOnly
                                        className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 font-mono text-lg"
                                    />
                                    <Button
                                        onClick={handleCopyCode}
                                        variant="outline"
                                        className="px-4"
                                    >
                                        {copied ? (
                                            <Check className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <Copy className="w-5 h-5" />
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Share this code with friends to invite them
                                </p>
                            </div>

                            {/* Call Settings */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                    Call Settings
                                </label>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={enableVideo}
                                            onChange={(e) => setEnableVideo(e.target.checked)}
                                            className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                        />
                                        <Video className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-300">Enable Video Call</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={enableAudio}
                                            onChange={(e) => setEnableAudio(e.target.checked)}
                                            className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                        />
                                        <Mic className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-300">Enable Voice Call</span>
                                    </label>
                                </div>
                            </div>

                            {/* Invite Users */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Invite Friends (Optional)
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search username..."
                                        className="w-full pl-10 pr-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Search Results */}
                                {searchQuery && searchResults.length > 0 && (
                                    <div className="mt-2 bg-gray-800 rounded-lg border border-gray-700 max-h-40 overflow-y-auto">
                                        {searchResults.map(user => (
                                            <button
                                                key={user.id}
                                                onClick={() => handleAddUser(user)}
                                                className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors flex items-center justify-between"
                                                disabled={selectedUsers.some(u => u.id === user.id)}
                                            >
                                                <span className="text-white">{user.username}</span>
                                                {selectedUsers.some(u => u.id === user.id) && (
                                                    <Check className="w-4 h-4 text-green-500" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Selected Users */}
                                {selectedUsers.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {selectedUsers.map(user => (
                                            <div
                                                key={user.id}
                                                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-full"
                                            >
                                                <span className="text-sm">{user.username}</span>
                                                <button
                                                    onClick={() => handleRemoveUser(user.id)}
                                                    className="hover:bg-blue-700 rounded-full p-0.5"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Create Button */}
                            <Button
                                onClick={handleCreateRoom}
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all"
                            >
                                <Users className="w-5 h-5 mr-2" />
                                Create Watch Party
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Your Username
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Room Code */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Room Code
                                </label>
                                <input
                                    type="text"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                    placeholder="Enter 6-digit room code"
                                    className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg"
                                    maxLength={6}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Ask the host for the room code
                                </p>
                            </div>

                            {/* Call Settings */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                    Join With
                                </label>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={enableVideo}
                                            onChange={(e) => setEnableVideo(e.target.checked)}
                                            className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                        />
                                        <Video className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-300">Enable Video</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={enableAudio}
                                            onChange={(e) => setEnableAudio(e.target.checked)}
                                            className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                        />
                                        <Mic className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-300">Enable Audio</span>
                                    </label>
                                </div>
                            </div>

                            {/* Join Button */}
                            <Button
                                onClick={handleJoinRoom}
                                className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all"
                            >
                                <Phone className="w-5 h-5 mr-2" />
                                Join Watch Party
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
