/**
 * Blog API Hooks with React Query
 * Centralized hooks for blog posts, likes, comments, auto-generation
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { blogApi, apiClient, extractData } from '@/lib/api/client';

// =============================================================================
// Query Keys
// =============================================================================

export const blogKeys = {
    all: ['blog'] as const,
    posts: () => [...blogKeys.all, 'posts'] as const,
    postsList: (page?: number, status?: string, search?: string) =>
        [...blogKeys.posts(), 'list', page, status, search] as const,
    post: (id: string) => [...blogKeys.posts(), 'detail', id] as const,
    postBySlug: (slug: string) => [...blogKeys.posts(), 'slug', slug] as const,
    likes: (slug: string) => [...blogKeys.all, 'likes', slug] as const,
    comments: (slug: string) => [...blogKeys.all, 'comments', slug] as const,
    autoGenerate: () => [...blogKeys.all, 'auto-generate'] as const,
    generationStatus: () => [...blogKeys.autoGenerate(), 'status'] as const,
    progress: () => [...blogKeys.all, 'progress'] as const,
    progressList: () => [...blogKeys.progress(), 'list'] as const,
};

// =============================================================================
// Type Definitions
// =============================================================================

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    coverImage?: string;
    authorId: string;
    authorName?: string;
    status: 'draft' | 'published';
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
    tags?: string[];
    views?: number;
    tmdbId?: string;
    mediaType?: 'movie' | 'tv';
}

export interface BlogLike {
    count: number;
    isLiked: boolean;
}

export interface BlogComment {
    id: string;
    content: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    createdAt: string;
    parentId?: string;
    replies?: BlogComment[];
    user?: {
        name: string;
    };
}

export interface GenerationStatus {
    isRunning: boolean;
    mode: 'batch' | 'continuous';
    sortBy: string;
    total: number;
    completed: number;
    failed: number;
    skipped: number;
    currentMovie?: string;
    errors: string[];
    logs: string[];
    startTime?: string;
    lastGeneratedAt?: string;
    postsPerHour?: number;
    nextScheduledAt?: string;
}

export interface BlogGenerationProgress {
    id: string;
    userId: string;
    mediaType: 'movie' | 'tv';
    sortBy: string;
    currentPage: number;
    lastItemIndex: number;
    currentIndex?: number; // Alias for lastItemIndex
    totalProcessed: number;
    totalGenerated?: number; // Alias for totalProcessed
    lastMediaId?: string;
    lastUpdated?: string;
    updatedAt: string;
}

// =============================================================================
// Blog Posts Hooks
// =============================================================================

export function useBlogPosts(page?: number, status?: string, search?: string) {
    return useQuery({
        queryKey: blogKeys.postsList(page, status, search),
        queryFn: async () => {
            const params = new URLSearchParams();
            if (page) params.append('page', String(page));
            if (status) params.append('status', status);
            if (search) params.append('search', search);

            const response = await apiClient.get<{ posts: BlogPost[]; total: number }>(
                `/admin/blog?${params}`
            );
            return extractData(response);
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}

export function useBlogPost(id: string, options?: UseQueryOptions<BlogPost>) {
    return useQuery({
        queryKey: blogKeys.post(id),
        queryFn: async () => {
            const response = await apiClient.get<{ post: BlogPost }>(`/admin/blog?id=${id}`);
            return extractData(response).post;
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5, // 5 minutes
        ...options,
    });
}

export function useCreateBlogPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (post: Partial<BlogPost>) => {
            const response = await apiClient.post('/admin/blog', post);
            return extractData(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: blogKeys.posts() });
        },
    });
}

export function useUpdateBlogPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<BlogPost> }) => {
            const response = await apiClient.put('/admin/blog', { id, ...data });
            return extractData(response);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: blogKeys.posts() });
            queryClient.invalidateQueries({ queryKey: blogKeys.post(variables.id) });
        },
    });
}

export function useDeleteBlogPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.delete(`/admin/blog?id=${id}`);
            return extractData(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: blogKeys.posts() });
        },
    });
}

export function usePublishBlogPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.post(`/admin/blog/publish?id=${id}`);
            return extractData(response);
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: blogKeys.posts() });
            queryClient.invalidateQueries({ queryKey: blogKeys.post(id) });
        },
    });
}

export function useUnpublishBlogPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.post(`/admin/blog/unpublish?id=${id}`);
            return extractData(response);
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: blogKeys.posts() });
            queryClient.invalidateQueries({ queryKey: blogKeys.post(id) });
        },
    });
}

// =============================================================================
// Blog Likes Hooks
// =============================================================================

export function useBlogLikes(slug: string) {
    return useQuery({
        queryKey: blogKeys.likes(slug),
        queryFn: async () => {
            const response = await blogApi.get<{ liked: boolean; likeCount: number }>(`/${slug}/like`);
            const data = extractData(response);
            // Map API response to BlogLike format
            return {
                isLiked: data.liked,
                count: data.likeCount,
            };
        },
        enabled: !!slug,
        staleTime: 1000 * 30, // 30 seconds
    });
}

export function useToggleBlogLike(slug: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            // API POST handles both like and unlike (toggle)
            const response = await blogApi.post(`/${slug}/like`);
            return extractData(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: blogKeys.likes(slug) });
        },
    });
}

// =============================================================================
// Blog Comments Hooks
// =============================================================================

export function useBlogComments(slug: string) {
    return useQuery({
        queryKey: blogKeys.comments(slug),
        queryFn: async () => {
            const response = await blogApi.get<{ comments: BlogComment[] }>(`/${slug}/comments`);
            return extractData(response).comments;
        },
        enabled: !!slug,
        staleTime: 1000 * 30, // 30 seconds
    });
}

export function useCreateBlogComment(slug: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (comment: { content: string; parentId?: string }) => {
            const response = await blogApi.post(`/${slug}/comments`, comment);
            return extractData(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: blogKeys.comments(slug) });
        },
    });
}

// =============================================================================
// Auto-Generate Hooks
// =============================================================================

export function useGenerationStatus() {
    return useQuery({
        queryKey: blogKeys.generationStatus(),
        queryFn: async () => {
            const response = await apiClient.get<{ status: GenerationStatus }>(
                '/admin/blog/auto-generate/status'
            );
            return extractData(response).status;
        },
        staleTime: 0, // Always fetch fresh data
        refetchInterval: (query) => {
            const data = query.state.data;
            // Refetch every 2 seconds if generation is running
            return data?.isRunning ? 2000 : false;
        },
    });
}

export function useStartGeneration() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (config: {
            count: number;
            type: 'movie' | 'tv';
            sortBy: string;
            mode: 'batch' | 'continuous';
            postsPerHour?: number;
            minRating?: number;
            includeAdult?: boolean;
            yearFrom?: number;
            yearTo?: number;
            aiModel?: string;
        }) => {
            const response = await apiClient.post('/admin/blog/auto-generate', config);
            return extractData(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: blogKeys.generationStatus() });
            queryClient.invalidateQueries({ queryKey: blogKeys.posts() });
        },
    });
}

export function useStopGeneration() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await apiClient.post('/admin/blog/auto-generate/stop');
            return extractData(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: blogKeys.generationStatus() });
        },
    });
}

// =============================================================================
// Progress Tracking Hooks
// =============================================================================

export function useBlogGenerationProgress() {
    return useQuery({
        queryKey: blogKeys.progressList(),
        queryFn: async () => {
            const response = await apiClient.get<{ progressRecords: BlogGenerationProgress[] }>(
                '/blog/reset-progress'
            );
            return extractData(response).progressRecords;
        },
        staleTime: 1000 * 60, // 1 minute
    });
}

export function useResetBlogProgress() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (progressId: string) => {
            const response = await apiClient.post('/blog/reset-progress', { progressId });
            return extractData(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: blogKeys.progressList() });
        },
    });
}
