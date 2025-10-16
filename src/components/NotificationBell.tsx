'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    roomCode?: string;
    mediaId?: number;
    mediaType?: string;
    mediaTitle?: string;
    embedUrl?: string;
    fromUser: {
        id: string;
        name: string;
        email: string;
    };
}

export default function NotificationBell() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [showDropdown, setShowDropdown] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchUnreadCount();
            // Poll for new notifications every 30 seconds
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [status]);

    useEffect(() => {
        if (showDropdown && status === 'authenticated') {
            fetchNotifications();
        }
    }, [showDropdown, status]);

    const fetchUnreadCount = async () => {
        try {
            const response = await fetch('/api/notifications?countOnly=true');
            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.count);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/notifications');
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const response = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId }),
            });

            if (response.ok) {
                setNotifications((prev) =>
                    prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAll: true }),
            });

            if (response.ok) {
                setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const deleteNotification = async (notificationId: string) => {
        try {
            const response = await fetch(`/api/notifications?id=${notificationId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
                fetchUnreadCount();
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const handleJoinRoom = async (notification: Notification) => {
        if (!notification.roomCode) return;

        // Mark as read
        await markAsRead(notification.id);

        // Navigate to watch together page
        const username = session?.user?.name || session?.user?.email?.split('@')[0] || 'User';
        router.push(`/watch-together?room=${notification.roomCode}&username=${encodeURIComponent(username)}`);
        setShowDropdown(false);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMinutes = Math.floor(diffInMs / 60000);
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInDays < 7) return `${diffInDays}d ago`;
        return date.toLocaleDateString();
    };

    if (status !== 'authenticated') {
        return null;
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-96 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-50 max-h-[600px] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-800">
                            <h3 className="text-lg font-semibold text-white">Notifications</h3>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-sm text-blue-400 hover:text-blue-300"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowDropdown(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center p-8">
                                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="text-center p-8 text-gray-400">
                                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-800">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 hover:bg-gray-800/50 transition-colors ${!notification.isRead ? 'bg-blue-900/10' : ''
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <h4 className="font-semibold text-white text-sm">
                                                            {notification.title}
                                                        </h4>
                                                        {!notification.isRead && (
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-300 mb-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatTime(notification.createdAt)}
                                                    </p>

                                                    {/* Action Buttons for Watch Invites */}
                                                    {notification.type === 'watch_invite' && notification.roomCode && (
                                                        <div className="mt-3 flex items-center gap-2">
                                                            <Button
                                                                onClick={() => handleJoinRoom(notification)}
                                                                className="bg-blue-600 hover:bg-blue-700 text-sm py-1 px-3 h-auto"
                                                            >
                                                                Join Now
                                                            </Button>
                                                            <button
                                                                onClick={() => markAsRead(notification.id)}
                                                                className="text-xs text-gray-400 hover:text-white"
                                                            >
                                                                Dismiss
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex gap-1">
                                                    {!notification.isRead && (
                                                        <button
                                                            onClick={() => markAsRead(notification.id)}
                                                            className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                                                            title="Mark as read"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => deleteNotification(notification.id)}
                                                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
