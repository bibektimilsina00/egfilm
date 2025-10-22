'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { CheckCircle, AlertCircle, Power } from 'lucide-react';

interface VideoSource {
    id: string;
    name: string;
    quality: string;
    isActive: boolean;
    lastChecked: string;
    status: 'healthy' | 'degraded' | 'offline';
    responseTime: number;
}

export default function ContentPage() {
    const queryClient = useQueryClient();
    const [testingSource, setTestingSource] = useState<string | null>(null);

    // Fetch video sources
    const { data: sources = [], isLoading } = useQuery({
        queryKey: ['admin', 'content', 'sources'],
        queryFn: async () => {
            const res = await axios.get('/api/admin/content/sources');
            return res.data.sources || [];
        },
        staleTime: 1000 * 60,
    });

    // Toggle source mutation
    const toggleSourceMutation = useMutation({
        mutationFn: async ({ sourceId, isActive }: { sourceId: string; isActive: boolean }) => {
            await axios.patch(`/api/admin/content/sources/${sourceId}`, { isActive });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'sources'] });
        },
    });

    // Test source mutation
    const testSourceMutation = useMutation({
        mutationFn: async (sourceId: string) => {
            setTestingSource(sourceId);
            const res = await axios.post(`/api/admin/content/sources/${sourceId}/test`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'sources'] });
            setTestingSource(null);
        },
        onError: () => {
            setTestingSource(null);
        },
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
                return <CheckCircle size={20} className="text-green-400" />;
            case 'degraded':
                return <AlertCircle size={20} className="text-yellow-400" />;
            case 'offline':
                return <AlertCircle size={20} className="text-red-400" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'degraded':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'offline':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Content Management</h1>
                <p className="text-gray-400 mt-2">Manage video sources and playback providers</p>
            </div>

            {/* Sources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    sources.map((source: VideoSource) => (
                        <div
                            key={source.id}
                            className="bg-gray-900 rounded-lg border border-gray-800 p-6 hover:border-gray-700 transition-colors"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{source.name}</h3>
                                    <p className="text-sm text-gray-400 mt-1">{source.quality}</p>
                                </div>
                                <button
                                    onClick={() =>
                                        toggleSourceMutation.mutate({
                                            sourceId: source.id,
                                            isActive: !source.isActive,
                                        })
                                    }
                                    className={`p-2 rounded-lg transition-colors ${source.isActive
                                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                            : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                                        }`}
                                    title={source.isActive ? 'Disable source' : 'Enable source'}
                                >
                                    <Power size={20} />
                                </button>
                            </div>

                            {/* Status */}
                            <div className="mb-4 space-y-2">
                                <div className="flex items-center space-x-2">
                                    {getStatusIcon(source.status)}
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(source.status)}`}>
                                        {source.status.charAt(0).toUpperCase() + source.status.slice(1)}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-400">
                                    Response: <span className="text-white">{source.responseTime}ms</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                    Last checked: {new Date(source.lastChecked).toLocaleTimeString()}
                                </div>
                            </div>

                            {/* Test Button */}
                            <button
                                onClick={() => testSourceMutation.mutate(source.id)}
                                disabled={testingSource === source.id}
                                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium text-sm transition-colors"
                            >
                                {testingSource === source.id ? 'Testing...' : 'Test Source'}
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-300">Video Source Health Monitoring</h4>
                <p className="text-sm text-blue-200 mt-2">
                    Sources are automatically tested every 5 minutes. You can manually test any source to check its current status. Disabled sources won't be available to users.
                </p>
            </div>
        </div>
    );
}
