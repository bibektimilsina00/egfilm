'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Square, RefreshCw, Zap, Clock, Filter, Brain, Key, ExternalLink } from 'lucide-react';
import { AI_MODELS } from '@/lib/ai/aiModels';
import Link from 'next/link';

type SortOption = 'popular' | 'top_rated' | 'upcoming' | 'now_playing' | 'trending_day' | 'trending_week';
type GenerationMode = 'batch' | 'continuous';

interface GenerationStatus {
    isRunning: boolean;
    mode: GenerationMode;
    sortBy: SortOption;
    total: number;
    completed: number;
    failed: number;
    skipped: number;
    currentMovie?: string;
    errors: string[];
    logs: string[]; // Activity logs
    startTime?: string;
    lastGeneratedAt?: string;
    postsPerHour?: number;
    nextScheduledAt?: string;
}

export default function AutoGeneratePage() {
    const [type, setType] = useState<'movie' | 'tv'>('movie');
    const [count, setCount] = useState(10);
    const [sortBy, setSortBy] = useState<SortOption>('popular');
    const [mode, setMode] = useState<GenerationMode>('batch');
    const [postsPerHour, setPostsPerHour] = useState(2);

    // AI Configuration
    const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');
    const [hasApiKey, setHasApiKey] = useState(false);

    // Advanced filters
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [minRating, setMinRating] = useState<number | undefined>(undefined);
    const [includeAdult, setIncludeAdult] = useState(false);
    const [yearFrom, setYearFrom] = useState<number | undefined>(undefined);
    const [yearTo, setYearTo] = useState<number | undefined>(undefined);

    const [status, setStatus] = useState<GenerationStatus | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Check if user has configured API keys
    useEffect(() => {
        const checkApiKeys = async () => {
            try {
                const response = await fetch('/api/user/ai-settings');
                if (response.ok) {
                    const data = await response.json();
                    const model = AI_MODELS.find(m => m.id === selectedModel);
                    if (model) {
                        const hasAIKey =
                            (model.provider === 'gemini' && data.settings.hasGeminiKey) ||
                            (model.provider === 'openai' && data.settings.hasOpenAIKey) ||
                            (model.provider === 'anthropic' && data.settings.hasAnthropicKey);
                        // Both AI key and TMDB key are required
                        setHasApiKey(hasAIKey && data.settings.hasTmdbKey);
                    }
                    // Set user's preferred model if available
                    if (data.settings.preferredAiModel) {
                        setSelectedModel(data.settings.preferredAiModel);
                    }
                }
            } catch (error) {
                console.error('Failed to check API keys:', error);
            }
        };
        checkApiKeys();
    }, [selectedModel]);

    // Auto-scroll logs to bottom when new logs arrive
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [status?.logs]);

    // Poll for status updates when generation is running
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const fetchStatus = async () => {
            try {
                const response = await fetch('/api/admin/blog/auto-generate/status');
                if (response.ok) {
                    const data = await response.json();
                    setStatus(data.status);
                }
            } catch (err) {
                console.error('Failed to fetch status:', err);
            }
        };

        if (status?.isRunning) {
            interval = setInterval(fetchStatus, 2000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [status?.isRunning]);

    // Initial status fetch
    useEffect(() => {
        const fetchInitialStatus = async () => {
            try {
                const response = await fetch('/api/admin/blog/auto-generate/status');
                if (response.ok) {
                    const data = await response.json();
                    setStatus(data.status);
                }
            } catch (err) {
                console.error('Failed to fetch initial status:', err);
            }
        };

        fetchInitialStatus();
    }, []);

    const handleStart = async () => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const payload: any = {
                count,
                type,
                sortBy,
                mode,
                includeAdult,
                aiModel: selectedModel, // Add AI model selection
            };

            if (mode === 'continuous') {
                payload.postsPerHour = postsPerHour;
            }

            if (minRating) payload.minRating = minRating;
            if (yearFrom) payload.yearFrom = yearFrom;
            if (yearTo) payload.yearTo = yearTo;

            const response = await fetch('/api/admin/blog/auto-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage(data.message);
            } else {
                setError(data.error || 'Failed to start generation');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to start generation');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStop = async () => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await fetch('/api/admin/blog/auto-generate/stop', {
                method: 'POST',
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage(data.message);
            } else {
                setError(data.error || 'Failed to stop generation');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to stop generation');
        } finally {
            setIsLoading(false);
        }
    };

    const getProgress = () => {
        if (!status || status.mode === 'continuous') return 0;
        const processed = status.completed + status.failed + status.skipped;
        return status.total > 0 ? (processed / status.total) * 100 : 0;
    };

    const formatTimeAgo = (dateString?: string) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return `${Math.floor(seconds / 3600)}h ago`;
    };

    const formatNextScheduled = (dateString?: string) => {
        if (!dateString) return 'Not scheduled';
        const date = new Date(dateString);
        const seconds = Math.floor((date.getTime() - Date.now()) / 1000);

        if (seconds < 0) return 'Soon';
        if (seconds < 60) return `in ${seconds}s`;
        if (seconds < 3600) return `in ${Math.floor(seconds / 60)}m`;
        return `in ${Math.floor(seconds / 3600)}h`;
    };

    const sortOptions: { value: SortOption; label: string; description: string }[] = [
        { value: 'popular', label: 'Popular', description: 'Most popular currently' },
        { value: 'top_rated', label: 'Top Rated', description: 'Highest rated of all time' },
        { value: 'trending_day', label: 'Trending Today', description: 'Trending in last 24h' },
        { value: 'trending_week', label: 'Trending This Week', description: 'Trending in last 7 days' },
        { value: 'upcoming', label: 'Upcoming', description: 'Coming soon (movies only)' },
        { value: 'now_playing', label: 'Now Playing', description: 'Currently in theaters/airing' },
    ];

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                    AI Blog Auto-Generator
                </h1>
                <p className="text-gray-400">
                    Automatically generate SEO-optimized blog posts with advanced controls
                </p>
            </div>

            {/* Running Status Banner */}
            {status?.isRunning && (
                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center gap-3">
                        <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                        <div>
                            <div className="text-blue-400 font-medium">
                                Generation in Progress
                            </div>
                            <div className="text-sm text-gray-400 mt-1">
                                {status.mode === 'batch'
                                    ? `Generating ${status.total} posts (${status.completed} completed)`
                                    : `Continuous mode active (${status.postsPerHour} posts/hour)`
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Messages */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                    {error}
                </div>
            )}
            {successMessage && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
                    {successMessage}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Panel */}
                <div className="lg:col-span-2">
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Configuration</h2>

                        {/* Generation Mode */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                                Generation Mode
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setMode('batch')}
                                    disabled={status?.isRunning || isLoading}
                                    className={`p-4 rounded-lg border-2 transition-all ${mode === 'batch'
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-gray-700 hover:border-gray-600'
                                        } disabled:opacity-50`}
                                >
                                    <Zap className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                                    <div className="text-white font-medium">Batch Mode</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Generate fixed number of posts
                                    </div>
                                </button>
                                <button
                                    onClick={() => setMode('continuous')}
                                    disabled={status?.isRunning || isLoading}
                                    className={`p-4 rounded-lg border-2 transition-all ${mode === 'continuous'
                                        ? 'border-purple-500 bg-purple-500/10'
                                        : 'border-gray-700 hover:border-gray-600'
                                        } disabled:opacity-50`}
                                >
                                    <Clock className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                                    <div className="text-white font-medium">Continuous Mode</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Generate posts per hour
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Media Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Media Type
                                </label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as 'movie' | 'tv')}
                                    disabled={status?.isRunning || isLoading}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                >
                                    <option value="movie">Movies</option>
                                    <option value="tv">TV Shows</option>
                                </select>
                            </div>

                            {/* Count or Rate */}
                            {mode === 'batch' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Number of Posts
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={count}
                                        onChange={(e) => setCount(Number(e.target.value))}
                                        disabled={status?.isRunning || isLoading}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Max 50 posts</p>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Posts Per Hour
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={postsPerHour}
                                        onChange={(e) => setPostsPerHour(Number(e.target.value))}
                                        disabled={status?.isRunning || isLoading}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Max 10 posts/hour</p>
                                </div>
                            )}
                        </div>

                        {/* AI Model Selection */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    AI Model
                                </label>
                                <Link
                                    href="/admin/settings/ai"
                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                >
                                    <Key className="w-3 h-3" />
                                    Configure API Keys
                                    <ExternalLink className="w-3 h-3" />
                                </Link>
                            </div>

                            {!hasApiKey && (
                                <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-sm flex items-start gap-2">
                                    <Brain className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <strong>API Key Required:</strong> Configure your API key in settings before generating.
                                    </div>
                                </div>
                            )}

                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                disabled={status?.isRunning || isLoading}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                            >
                                <optgroup label="🔵 Google Gemini">
                                    {AI_MODELS.filter(m => m.provider === 'gemini').map((model) => (
                                        <option key={model.id} value={model.id}>
                                            {model.name} - {model.description}
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label="🟢 OpenAI">
                                    {AI_MODELS.filter(m => m.provider === 'openai').map((model) => (
                                        <option key={model.id} value={model.id}>
                                            {model.name} - {model.description}
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label="🟣 Anthropic Claude">
                                    {AI_MODELS.filter(m => m.provider === 'anthropic').map((model) => (
                                        <option key={model.id} value={model.id}>
                                            {model.name} - {model.description}
                                        </option>
                                    ))}
                                </optgroup>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                {AI_MODELS.find(m => m.id === selectedModel)?.description}
                            </p>
                        </div>

                        {/* Sort By */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Content Source
                            </label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                disabled={status?.isRunning || isLoading}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                            >
                                {sortOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label} - {option.description}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Advanced Filters Toggle */}
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            disabled={status?.isRunning || isLoading}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 disabled:opacity-50"
                        >
                            <Filter className="w-4 h-4" />
                            {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
                        </button>

                        {/* Advanced Filters */}
                        {showAdvanced && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800/50 rounded-lg mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Minimum Rating
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        step="0.1"
                                        value={minRating || ''}
                                        onChange={(e) =>
                                            setMinRating(e.target.value ? Number(e.target.value) : undefined)
                                        }
                                        placeholder="Any"
                                        disabled={status?.isRunning || isLoading}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Year From
                                    </label>
                                    <input
                                        type="number"
                                        min="1900"
                                        max={new Date().getFullYear() + 2}
                                        value={yearFrom || ''}
                                        onChange={(e) =>
                                            setYearFrom(e.target.value ? Number(e.target.value) : undefined)
                                        }
                                        placeholder="Any"
                                        disabled={status?.isRunning || isLoading}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Year To
                                    </label>
                                    <input
                                        type="number"
                                        min="1900"
                                        max={new Date().getFullYear() + 2}
                                        value={yearTo || ''}
                                        onChange={(e) =>
                                            setYearTo(e.target.value ? Number(e.target.value) : undefined)
                                        }
                                        placeholder="Any"
                                        disabled={status?.isRunning || isLoading}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={includeAdult}
                                            onChange={(e) => setIncludeAdult(e.target.checked)}
                                            disabled={status?.isRunning || isLoading}
                                            className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                                        />
                                        Include Adult Content
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            {!status?.isRunning ? (
                                <button
                                    onClick={handleStart}
                                    disabled={isLoading}
                                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Play className="w-5 h-5" />
                                    Start Generation
                                </button>
                            ) : (
                                <button
                                    onClick={handleStop}
                                    disabled={isLoading}
                                    className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Square className="w-5 h-5" />
                                    Stop Generation
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status Panel */}
                <div className="lg:col-span-1">
                    {status && (
                        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 sticky top-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-white">Status</h2>
                                {status.isRunning && (
                                    <div className="flex items-center gap-2 text-blue-400">
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">Running</span>
                                    </div>
                                )}
                            </div>

                            {/* Mode Badge */}
                            <div className="mb-4">
                                <span
                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${status.mode === 'continuous'
                                        ? 'bg-purple-500/20 text-purple-400'
                                        : 'bg-blue-500/20 text-blue-400'
                                        }`}
                                >
                                    {status.mode === 'continuous' ? (
                                        <Clock className="w-3 h-3" />
                                    ) : (
                                        <Zap className="w-3 h-3" />
                                    )}
                                    {status.mode === 'continuous' ? 'Continuous' : 'Batch'}
                                </span>
                                <span className="ml-2 text-xs text-gray-400">
                                    {status.sortBy.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Progress Bar (Batch Mode Only) */}
                            {status.mode === 'batch' && (
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                                        <span>Progress</span>
                                        <span>{Math.round(getProgress())}%</span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-blue-600 to-blue-500 h-full transition-all duration-500"
                                            style={{ width: `${getProgress()}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Continuous Mode Info */}
                            {status.mode === 'continuous' && status.postsPerHour && (
                                <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                    <div className="text-sm text-gray-400">Rate:</div>
                                    <div className="text-lg font-semibold text-purple-400">
                                        {status.postsPerHour} posts/hour
                                    </div>
                                    {status.nextScheduledAt && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            Next: {formatNextScheduled(status.nextScheduledAt)}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Current Item */}
                            {status.currentMovie && (
                                <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                    <p className="text-xs text-gray-400">Currently Processing:</p>
                                    <p className="text-sm text-white font-medium mt-1">{status.currentMovie}</p>
                                </div>
                            )}

                            {/* Statistics */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {status.mode === 'batch' && (
                                    <div className="text-center p-3 bg-gray-800 rounded-lg">
                                        <div className="text-xl font-bold text-white">{status.total}</div>
                                        <div className="text-xs text-gray-400">Total</div>
                                    </div>
                                )}
                                <div className="text-center p-3 bg-gray-800 rounded-lg">
                                    <div className="text-xl font-bold text-green-400">{status.completed}</div>
                                    <div className="text-xs text-gray-400">Created</div>
                                </div>
                                <div className="text-center p-3 bg-gray-800 rounded-lg">
                                    <div className="text-xl font-bold text-yellow-400">{status.skipped}</div>
                                    <div className="text-xs text-gray-400">Skipped</div>
                                </div>
                                <div className="text-center p-3 bg-gray-800 rounded-lg">
                                    <div className="text-xl font-bold text-red-400">{status.failed}</div>
                                    <div className="text-xs text-gray-400">Failed</div>
                                </div>
                            </div>

                            {/* Timing Info */}
                            {status.lastGeneratedAt && (
                                <div className="text-xs text-gray-500 mb-2">
                                    Last post: {formatTimeAgo(status.lastGeneratedAt)}
                                </div>
                            )}

                            {/* Activity Logs */}
                            {status.logs && status.logs.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="text-sm font-semibold text-white mb-2">Activity Log</h3>
                                    <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 max-h-64 overflow-y-auto font-mono text-xs">
                                        {status.logs.slice(-20).map((log, index) => (
                                            <div
                                                key={index}
                                                className={`py-1 ${log.includes('❌') || log.includes('Failed')
                                                    ? 'text-red-400'
                                                    : log.includes('✅') || log.includes('Created')
                                                        ? 'text-green-400'
                                                        : log.includes('⏭️') || log.includes('Skipped')
                                                            ? 'text-yellow-400'
                                                            : log.includes('🚀') || log.includes('Starting')
                                                                ? 'text-blue-400'
                                                                : 'text-gray-400'
                                                    }`}
                                            >
                                                {log}
                                            </div>
                                        ))}
                                        <div ref={logsEndRef} />
                                    </div>
                                </div>
                            )}

                            {/* Errors */}
                            {status.errors.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="text-sm font-semibold text-white mb-2">Recent Errors</h3>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {status.errors.slice(-3).map((error, index) => (
                                            <div
                                                key={index}
                                                className="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400"
                                            >
                                                {error}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-6 bg-gray-900/50 border border-gray-800 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
                    <div>
                        <h4 className="text-white font-medium mb-2">Batch Mode</h4>
                        <ul className="space-y-1">
                            <li>• Generate fixed number of posts</li>
                            <li>• Perfect for one-time content creation</li>
                            <li>• Completes then stops automatically</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-medium mb-2">Continuous Mode</h4>
                        <ul className="space-y-1">
                            <li>• Generate posts at regular intervals</li>
                            <li>• Set posts per hour (1-10)</li>
                            <li>• Runs until manually stopped</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-medium mb-2">Content Sources</h4>
                        <ul className="space-y-1">
                            <li>• Popular, Top Rated, Trending</li>
                            <li>• Upcoming releases</li>
                            <li>• Now Playing / On The Air</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-medium mb-2">Advanced Filters</h4>
                        <ul className="space-y-1">
                            <li>• Filter by minimum rating</li>
                            <li>• Filter by release year range</li>
                            <li>• Include/exclude adult content</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
