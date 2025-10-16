import { prisma } from '../prisma';

export interface CreateNotificationData {
    type: 'watch_invite' | 'room_join' | 'system';
    title: string;
    message: string;
    fromUserId: string;
    toUserId: string;
    roomCode?: string;
    mediaId?: number;
    mediaType?: 'movie' | 'tv';
    mediaTitle?: string;
    embedUrl?: string;
}

/**
 * Create a new notification
 */
export async function createNotification(data: CreateNotificationData) {
    try {
        console.log('💾 Creating notification:', {
            type: data.type,
            fromUserId: data.fromUserId,
            toUserId: data.toUserId,
            title: data.title
        });

        const notification = await prisma.notification.create({
            data: {
                type: data.type,
                title: data.title,
                message: data.message,
                fromUserId: data.fromUserId,
                toUserId: data.toUserId,
                roomCode: data.roomCode,
                mediaId: data.mediaId,
                mediaType: data.mediaType,
                mediaTitle: data.mediaTitle,
                embedUrl: data.embedUrl,
            },
            include: {
                fromUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        console.log('✅ Notification saved to database with ID:', notification.id);

        return notification;
    } catch (error) {
        console.error('❌ Error creating notification:', error);
        throw new Error('Failed to create notification');
    }
}

/**
 * Get user's notifications
 */
export async function getUserNotifications(userId: string, unreadOnly = false) {
    try {
        const notifications = await prisma.notification.findMany({
            where: {
                toUserId: userId,
                ...(unreadOnly ? { isRead: false } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                fromUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return notifications;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw new Error('Failed to fetch notifications');
    }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string) {
    try {
        const count = await prisma.notification.count({
            where: {
                toUserId: userId,
                isRead: false,
            },
        });

        return count;
    } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
    try {
        const notification = await prisma.notification.update({
            where: {
                id: notificationId,
                toUserId: userId, // Ensure user owns this notification
            },
            data: {
                isRead: true,
            },
        });

        return notification;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw new Error('Failed to mark notification as read');
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string) {
    try {
        const result = await prisma.notification.updateMany({
            where: {
                toUserId: userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        return { count: result.count };
    } catch (error) {
        console.error('Error marking all as read:', error);
        throw new Error('Failed to mark all as read');
    }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string, userId: string) {
    try {
        await prisma.notification.delete({
            where: {
                id: notificationId,
                toUserId: userId,
            },
        });

        return { success: true };
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw new Error('Failed to delete notification');
    }
}

/**
 * Send watch together invite notification
 * @param fromUserEmail - Email of the user sending the invite (from session)
 * @param toUserId - ID of the user receiving the invite
 */
export async function sendWatchInvite(
    fromUserEmail: string,
    toUserId: string,
    roomCode: string,
    mediaTitle: string,
    mediaId: number,
    mediaType: 'movie' | 'tv',
    embedUrl: string
) {
    try {
        console.log('🔍 Looking up from user:', fromUserEmail);

        // Look up the from user by email to get their ID
        const fromUser = await prisma.user.findUnique({
            where: { email: fromUserEmail },
            select: { id: true, name: true },
        });

        if (!fromUser) {
            console.error('❌ From user not found:', fromUserEmail);
            throw new Error('From user not found');
        }

        console.log('✅ From user found:', fromUser.name, '(ID:', fromUser.id, ')');
        console.log('📝 Creating notification for user:', toUserId);

        const notification = await createNotification({
            type: 'watch_invite',
            title: 'Watch Together Invitation',
            message: `${fromUser.name} invited you to watch "${mediaTitle}" together!`,
            fromUserId: fromUser.id, // Use the actual user ID, not email
            toUserId,
            roomCode,
            mediaId,
            mediaType,
            mediaTitle,
            embedUrl,
        });

        console.log('✅ Notification created successfully:', notification.id);

        return notification;
    } catch (error) {
        console.error('❌ Error sending watch invite:', error);
        throw new Error('Failed to send watch invite');
    }
}

/**
 * Search users for invites (exclude self)
 * PostgreSQL supports case-insensitive search with mode: 'insensitive'
 * @param currentUserEmail - Email of the current user (from session)
 */
export async function searchUsersForInvite(query: string, currentUserEmail: string) {
    try {
        // Look up current user by email to get their ID
        const currentUser = await prisma.user.findUnique({
            where: { email: currentUserEmail },
            select: { id: true },
        });

        if (!currentUser) {
            throw new Error('Current user not found');
        }

        // Use PostgreSQL case-insensitive search
        const users = await prisma.user.findMany({
            where: {
                id: { not: currentUser.id }, // Exclude current user by ID
                OR: [
                    {
                        name: {
                            contains: query,
                            mode: 'insensitive', // PostgreSQL case-insensitive search
                        },
                    },
                    {
                        email: {
                            contains: query,
                            mode: 'insensitive', // PostgreSQL case-insensitive search
                        },
                    },
                ],
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
            take: 10, // Limit to 10 results at database level
        });

        return users;
    } catch (error) {
        console.error('Error searching users:', error);
        throw new Error('Failed to search users');
    }
}
