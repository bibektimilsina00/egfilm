/**
 * Notifications API Hooks with React Query
 * Centralized hooks for user notifications
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { notificationsApi, extractData } from '@/lib/api/client';

// =============================================================================
// Query Keys
// =============================================================================

export const notificationKeys = {
    all: ['notifications'] as const,
    list: () => [...notificationKeys.all, 'list'] as const,
    count: () => [...notificationKeys.all, 'count'] as const,
    unread: () => [...notificationKeys.all, 'unread'] as const,
};

// =============================================================================
// Type Definitions
// =============================================================================

export interface Notification {
    id: string;
    userId: string;
    type: 'watch_invite' | 'room_join' | 'system' | 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    roomCode?: string;
    data?: unknown;
}

// =============================================================================
// Notifications Hooks
// =============================================================================

export function useNotifications(options?: Omit<UseQueryOptions<Notification[], Error>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: notificationKeys.list(),
        queryFn: async () => {
            const response = await notificationsApi.get<{ notifications: Notification[] }>('');
            return extractData(response).notifications;
        },
        staleTime: 1000 * 30, // 30 seconds
        ...options,
    });
}

export function useUnreadNotificationsCount() {
    return useQuery({
        queryKey: notificationKeys.count(),
        queryFn: async () => {
            const response = await notificationsApi.get<{ count: number }>('?countOnly=true');
            return extractData(response).count;
        },
        staleTime: 1000 * 30, // 30 seconds
        refetchInterval: 1000 * 60, // Refetch every minute
    });
}

export function useMarkNotificationAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notificationId: string) => {
            const response = await notificationsApi.patch(`?id=${notificationId}`, { isRead: true });
            return extractData(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.count() });
        },
    });
}

export function useMarkAllNotificationsAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await notificationsApi.post('/mark-all-read');
            return extractData(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.count() });
        },
    });
}

export function useDeleteNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notificationId: string) => {
            const response = await notificationsApi.delete(`?id=${notificationId}`);
            return extractData(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.count() });
        },
    });
}

export function useClearAllNotifications() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await notificationsApi.delete('/clear-all');
            return extractData(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.count() });
        },
    });
}

export function useSendInviteNotification() {
    return useMutation({
        mutationFn: async (data: { userId: string; roomCode: string; mediaTitle: string }) => {
            const response = await notificationsApi.post('/invite', data);
            return extractData(response);
        },
    });
}
