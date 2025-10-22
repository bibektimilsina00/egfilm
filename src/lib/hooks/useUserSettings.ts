/**
 * User Settings API Hooks with React Query
 * Centralized hooks for user AI configuration and settings
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { userApi, extractData } from '@/lib/api/client';

// =============================================================================
// Query Keys
// =============================================================================

export const userSettingsKeys = {
    all: ['userSettings'] as const,
    aiSettings: () => [...userSettingsKeys.all, 'ai'] as const,
};

// =============================================================================
// Type Definitions
// =============================================================================

export interface AISettings {
    geminiApiKey: string | null;
    openaiApiKey: string | null;
    anthropicApiKey: string | null;
    tmdbApiKey: string | null;
    preferredAiModel: string;
    hasGeminiKey: boolean;
    hasOpenAIKey: boolean;
    hasAnthropicKey: boolean;
    hasTmdbKey: boolean;
}

export interface AISettingsUpdate {
    geminiApiKey?: string;
    openaiApiKey?: string;
    anthropicApiKey?: string;
    tmdbApiKey?: string;
    preferredAiModel?: string;
}

// =============================================================================
// AI Settings Hooks
// =============================================================================

export function useAISettings(options?: UseQueryOptions<AISettings>) {
    return useQuery({
        queryKey: userSettingsKeys.aiSettings(),
        queryFn: async () => {
            const response = await userApi.get<{ settings: AISettings }>('/ai-settings');
            return extractData(response).settings;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        ...options,
    });
}

export function useUpdateAISettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (settings: AISettingsUpdate) => {
            const response = await userApi.post('/ai-settings', settings);
            return extractData(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userSettingsKeys.aiSettings() });
        },
    });
}
