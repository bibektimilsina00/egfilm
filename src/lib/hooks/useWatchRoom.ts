/**
 * Watch Room API Hooks with React Query
 * Centralized hooks for Watch Together functionality
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { watchRoomApi, apiClient, extractData } from '@/lib/api/client';

// =============================================================================
// Query Keys
// =============================================================================

export const watchRoomKeys = {
    all: ['watchRoom'] as const,
    room: (code: string) => [...watchRoomKeys.all, 'room', code] as const,
    users: () => [...watchRoomKeys.all, 'users'] as const,
    userSearch: (query: string) => [...watchRoomKeys.users(), 'search', query] as const,
};

// =============================================================================
// Type Definitions
// =============================================================================

export interface WatchRoom {
    id: string;
    code: string;
    mediaId: string;
    mediaType: 'movie' | 'tv';
    mediaTitle: string;
    hostId: string;
    hostName: string;
    embedUrl: string;
    createdAt: string;
    expiresAt: string;
}

export interface UserSearchResult {
    id: string;
    name: string;
    email: string;
}

// =============================================================================
// Watch Room Hooks
// =============================================================================

export function useWatchRoom(code: string, options?: UseQueryOptions<WatchRoom>) {
    return useQuery({
        queryKey: watchRoomKeys.room(code),
        queryFn: async () => {
            const response = await watchRoomApi.get<{ room: WatchRoom }>(`?code=${code}`);
            return extractData(response).room;
        },
        enabled: !!code,
        staleTime: 1000 * 60 * 5, // 5 minutes
        ...options,
    });
}

export function useCreateWatchRoom() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            mediaId: string;
            mediaType: 'movie' | 'tv';
            mediaTitle: string;
            embedUrl: string;
        }) => {
            const response = await watchRoomApi.post<{ room: WatchRoom; code: string }>('', data);
            return extractData(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: watchRoomKeys.all });
        },
    });
}

// =============================================================================
// User Search Hooks
// =============================================================================

export function useSearchUsers(query: string) {
    return useQuery({
        queryKey: watchRoomKeys.userSearch(query),
        queryFn: async () => {
            const response = await apiClient.get<{ users: UserSearchResult[] }>(
                `/users/search?q=${encodeURIComponent(query)}`
            );
            return extractData(response).users;
        },
        enabled: query.length >= 2, // Only search if query is at least 2 characters
        staleTime: 1000 * 30, // 30 seconds
    });
}
