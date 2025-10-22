/**
 * Admin API Hooks with React Query
 * Centralized hooks for all admin-related data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { adminApi, extractData } from '@/lib/api/client';

// =============================================================================
// Query Keys
// =============================================================================

export const adminKeys = {
    all: ['admin'] as const,
    stats: () => [...adminKeys.all, 'stats'] as const,
    statsOverview: () => [...adminKeys.stats(), 'overview'] as const,
    users: () => [...adminKeys.all, 'users'] as const,
    usersList: (page?: number, search?: string) =>
        [...adminKeys.users(), 'list', page, search] as const,
    content: () => [...adminKeys.all, 'content'] as const,
    contentSources: () => [...adminKeys.content(), 'sources'] as const,
    rooms: () => [...adminKeys.all, 'rooms'] as const,
    roomsList: () => [...adminKeys.rooms(), 'list'] as const,
    analytics: () => [...adminKeys.all, 'analytics'] as const,
    notifications: () => [...adminKeys.all, 'notifications'] as const,
    notificationsList: () => [...adminKeys.notifications(), 'list'] as const,
    unreadNotifications: () => [...adminKeys.notifications(), 'unread'] as const,
    settings: () => [...adminKeys.all, 'settings'] as const,
    settingsGeneral: () => [...adminKeys.settings(), 'general'] as const,
    settingsSystem: () => [...adminKeys.settings(), 'system'] as const,
    activity: () => [...adminKeys.all, 'activity'] as const,
    activityRecent: () => [...adminKeys.activity(), 'recent'] as const,
};

// =============================================================================
// Type Definitions
// =============================================================================

export interface StatsOverview {
    totalUsers: number;
    totalMovies: number;
    totalTVShows: number;
    activeRooms: number;
    totalWatchHours: number;
    newUsersThisWeek: number;
    sessionsToday?: number;
    platformHealth?: number;
    userTrend?: string;
    roomTrend?: string;
    sessionTrend?: string;
    popularMovies: Array<{ id: number; title: string; views: number }>;
    recentActivity: Array<{ id: string; type: string; timestamp: string }>;
}

export interface User {
    id: string;
    name: string | null;
    email: string;
    role?: 'admin' | 'moderator' | 'user';
    isAdmin: boolean;
    isBanned: boolean;
    isActive?: boolean;
    createdAt: string;
    lastLogin?: string;
}

export interface ContentSource {
    id: string;
    name: string;
    url: string;
    quality?: string;
    isActive: boolean;
    lastChecked?: string;
    status?: 'healthy' | 'degraded' | 'offline' | 'online' | 'unknown';
    responseTime?: number;
}

export interface WatchRoom {
    id: string;
    code: string;
    mediaId: string;
    mediaType: 'movie' | 'tv';
    hostId: string;
    hostName?: string;
    createdAt: string;
    participants: number;
}

export interface AdminNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    targetUserId?: string;
    createdAt: string;
    sentAt?: string;
}

export interface AdminSettings {
    siteName: string;
    siteDescription: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    emailVerificationRequired: boolean;
}

export interface SystemSettings {
    version: string;
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    databaseSize: number;
}

export interface RecentActivity {
    id: string;
    userId: string;
    userName: string;
    action: string;
    details: string;
    timestamp: string;
}

// =============================================================================
// Stats Hooks
// =============================================================================

export function useStatsOverview(options?: UseQueryOptions<StatsOverview>) {
    return useQuery({
        queryKey: adminKeys.statsOverview(),
        queryFn: async (): Promise<StatsOverview> => {
            try {
                const response = await adminApi.get<StatsOverview>('/stats/overview');
                const data = extractData(response);

                // Ensure we always return a valid object
                if (!data) {
                    // Return default stats if no data
                    return {
                        totalUsers: 0,
                        totalMovies: 0,
                        totalTVShows: 0,
                        activeRooms: 0,
                        totalWatchHours: 0,
                        newUsersThisWeek: 0,
                        sessionsToday: 0,
                        platformHealth: 0,
                        userTrend: '+0%',
                        roomTrend: '+0%',
                        sessionTrend: '+0%',
                        popularMovies: [],
                        recentActivity: [],
                    };
                }

                return data;
            } catch (error) {
                console.error('Error fetching stats overview:', error);
                // Re-throw to let React Query handle the error state
                throw error;
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 2,
        // Only run this query if user is likely on admin page
        enabled: options?.enabled !== false,
        ...options,
    });
}

// =============================================================================
// Users Hooks
// =============================================================================

export function useUsers(page?: number, search?: string) {
    return useQuery({
        queryKey: adminKeys.usersList(page, search),
        queryFn: async () => {
            const params = new URLSearchParams();
            if (page) params.append('page', String(page));
            if (search) params.append('search', search);

            const response = await adminApi.get<{ users: User[]; total: number }>(
                `/users?${params}`
            );
            return extractData(response);
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            const response = await adminApi.delete(`/users/${userId}`);
            return extractData(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.users() });
            queryClient.invalidateQueries({ queryKey: adminKeys.statsOverview() });
        },
    });
}

export function useUpdateUserBanStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, isBanned }: { userId: string; isBanned: boolean }) => {
            const response = await adminApi.patch(`/users/${userId}`, { isBanned });
            return extractData(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.users() });
        },
    });
}

// =============================================================================
// Content Hooks
// =============================================================================

export function useContentSources() {
    return useQuery({
        queryKey: adminKeys.contentSources(),
        queryFn: async () => {
            const response = await adminApi.get<{ sources: ContentSource[] }>('/content/sources');
            return extractData(response).sources;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useUpdateContentSource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ sourceId, isActive }: { sourceId: string; isActive: boolean }) => {
            const response = await adminApi.patch(`/content/sources/${sourceId}`, { isActive });
            return extractData(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.contentSources() });
        },
    });
}

export function useTestContentSource() {
    return useMutation({
        mutationFn: async (sourceId: string) => {
            const response = await adminApi.post<{ status: string; message: string }>(
                `/content/sources/${sourceId}/test`
            );
            return extractData(response);
        },
    });
}

// =============================================================================
// Rooms Hooks
// =============================================================================

export function useWatchRooms() {
    return useQuery({
        queryKey: adminKeys.roomsList(),
        queryFn: async () => {
            const response = await adminApi.get<{ rooms: WatchRoom[] }>('/rooms');
            return extractData(response).rooms;
        },
        staleTime: 1000 * 60, // 1 minute (rooms change frequently)
    });
}

export function useDeleteWatchRoom() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (roomId: string) => {
            const response = await adminApi.delete(`/rooms/${roomId}`);
            return extractData(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.roomsList() });
            queryClient.invalidateQueries({ queryKey: adminKeys.statsOverview() });
        },
    });
}

// =============================================================================
// Analytics Hooks
// =============================================================================

export function useAnalytics() {
    return useQuery({
        queryKey: adminKeys.analytics(),
        queryFn: async () => {
            const response = await adminApi.get('/analytics');
            return extractData(response);
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}

// =============================================================================
// Notifications Hooks
// =============================================================================

export function useAdminNotifications() {
    return useQuery({
        queryKey: adminKeys.notificationsList(),
        queryFn: async () => {
            const response = await adminApi.get<{ notifications: AdminNotification[] }>(
                '/notifications'
            );
            return extractData(response).notifications;
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}

export function useUnreadNotificationsCount() {
    return useQuery({
        queryKey: adminKeys.unreadNotifications(),
        queryFn: async () => {
            const response = await adminApi.get<{ count: number }>('/notifications/unread');
            return extractData(response).count;
        },
        staleTime: 1000 * 30, // 30 seconds
        refetchInterval: 1000 * 60, // Refetch every minute
    });
}

export function useCreateAdminNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notification: {
            type: string;
            title: string;
            message: string;
            targetUserId?: string;
        }) => {
            const response = await adminApi.post('/notifications', notification);
            return extractData(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.notificationsList() });
        },
    });
}

export function useDeleteAdminNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notificationId: string) => {
            const response = await adminApi.delete(`/notifications/${notificationId}`);
            return extractData(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.notificationsList() });
        },
    });
}

// =============================================================================
// Settings Hooks
// =============================================================================

export function useAdminSettings() {
    return useQuery({
        queryKey: adminKeys.settingsGeneral(),
        queryFn: async () => {
            const response = await adminApi.get<{ settings: AdminSettings }>('/settings');
            return extractData(response).settings;
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}

export function useSystemSettings() {
    return useQuery({
        queryKey: adminKeys.settingsSystem(),
        queryFn: async () => {
            const response = await adminApi.get<{ system: SystemSettings }>('/settings/system');
            return extractData(response).system;
        },
        staleTime: 1000 * 60, // 1 minute
    });
}

export function useUpdateAdminSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (settings: Partial<AdminSettings>) => {
            const response = await adminApi.post('/settings', settings);
            return extractData(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.settingsGeneral() });
        },
    });
}

// =============================================================================
// Activity Hooks
// =============================================================================

export function useRecentActivity() {
    return useQuery({
        queryKey: adminKeys.activityRecent(),
        queryFn: async () => {
            const response = await adminApi.get<{ activities: RecentActivity[] }>(
                '/activity/recent'
            );
            return extractData(response).activities;
        },
        staleTime: 1000 * 60, // 1 minute
    });
}
