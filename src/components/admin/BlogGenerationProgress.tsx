'use client';

import { useState } from 'react';
import { RotateCcw, TrendingUp, Info } from 'lucide-react';
import { useBlogGenerationProgress, useResetBlogProgress } from '@/lib/hooks/useBlog';

interface ProgressRecord {
    id: string;
    mediaType: string;
    sortBy: string;
    currentPage: number;
    currentIndex: number;
    totalGenerated: number;
    lastMediaId: number | null;
    lastUpdated: string;
}

export function BlogGenerationProgress() {
    const [resetLoading, setResetLoading] = useState<string | null>(null);

    // React Query hooks
    const { data: progressRecords = [], isLoading, refetch } = useBlogGenerationProgress();
    const resetProgressMutation = useResetBlogProgress();

    const handleReset = async (progressId: string, mediaType: string, sortBy: string) => {
        const key = `${mediaType}-${sortBy}`;
        setResetLoading(key);

        try {
            await resetProgressMutation.mutateAsync(progressId, {
                onSuccess: () => {
                    refetch();
                },
            });
        } catch (error) {
            console.error('Failed to reset progress:', error);
        } finally {
            setResetLoading(null);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-800 rounded w-1/4 mb-4"></div>
                    <div className="h-20 bg-gray-800 rounded"></div>
                </div>
            </div>
        );
    }

    if (progressRecords.length === 0) {
        return (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Generation Progress</h3>
                </div>
                <div className="text-center py-8 text-gray-500">
                    <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No generation history yet</p>
                    <p className="text-sm mt-1">Progress will appear after your first generation run</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Generation Progress</h3>
            </div>
            <div className="text-sm text-gray-400 mb-4">
                Continue from where you left off. Each configuration remembers its position.
            </div>

            <div className="space-y-3">
                {progressRecords.map((record) => (
                    <div
                        key={record.id}
                        className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <div className="font-medium text-white">
                                    {record.mediaType === 'movie' ? '🎬 Movies' : '📺 TV Shows'} - {record.sortBy.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Last updated: {record.lastUpdated ? new Date(record.lastUpdated).toLocaleString() : 'Never'}
                                </div>
                            </div>
                            <button
                                onClick={() => handleReset(record.id, record.mediaType, record.sortBy)}
                                disabled={resetLoading === `${record.mediaType}-${record.sortBy}`}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                                title="Reset to page 1"
                            >
                                <RotateCcw
                                    className={`w-4 h-4 text-gray-400 ${resetLoading === `${record.mediaType}-${record.sortBy}` ? 'animate-spin' : ''
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <div className="text-gray-500 text-xs">Current Position</div>
                                <div className="text-white font-medium mt-1">
                                    Page {record.currentPage}, Item {record.currentIndex}
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-500 text-xs">Total Generated</div>
                                <div className="text-green-400 font-medium mt-1">
                                    {record.totalGenerated} posts
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-500 text-xs">Last Media ID</div>
                                <div className="text-blue-400 font-medium mt-1">
                                    {record.lastMediaId || 'N/A'}
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-700">
                            <div className="text-xs text-gray-500">
                                ℹ️ Next generation will continue from <span className="text-blue-400">page {record.currentPage}, item {record.currentIndex}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
