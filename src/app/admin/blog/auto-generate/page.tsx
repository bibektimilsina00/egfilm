'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Square, RefreshCw, Zap, Clock, Filter, Brain, Key, ExternalLink } from 'lucide-react';
import { AI_MODELS } from '@/lib/ai/aiModels';
import Link from 'next/link';
import { BlogGenerationProgress } from '@/components/admin/BlogGenerationProgress';
import {
    useGenerationStatus,
    useStartGeneration,
    useStopGeneration,
} from '@/lib/hooks/useBlog';
import { useAISettings } from '@/lib/hooks/useUserSettings';

type SortOption = 'popular' | 'top_rated' | 'upcoming' | 'now_playing' | 'trending_day' | 'trending_week' | 'on_the_air' | 'airing_today';
type GenerationMode = 'batch' | 'continuous';
type BlogCategory = 'review' | 'news' | 'guide' | 'analysis' | 'recommendation' | 'comparison';

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
    const [type, setType] = useState<'movie' | 'tv' | 'mixed'>('mixed');
    const [category, setCategory] = useState<BlogCategory | 'auto'>('auto');
    const [count, setCount] = useState(10);
    const [sortBy, setSortBy] = useState<SortOption>('popular');
    const [mode, setMode] = useState<GenerationMode>('batch');
    const [postsPerHour, setPostsPerHour] = useState(2);

    // AI Configuration
    const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');

    // Advanced filters
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [minRating, setMinRating] = useState<number | undefined>(undefined);
    const [includeAdult, setIncludeAdult] = useState(false);
    const [yearFrom, setYearFrom] = useState<number | undefined>(undefined);
    const [yearTo, setYearTo] = useState<number | undefined>(undefined);
    const [rotateCategories, setRotateCategories] = useState(true);
    const [rotateSortBy, setRotateSortBy] = useState(false);

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const logsEndRef = useRef<HTMLDivElement>(null);

    // React Query hooks
    const { data: aiSettings } = useAISettings();
    const { data: status } = useGenerationStatus();
    const startGenerationMutation = useStartGeneration();
    const stopGenerationMutation = useStopGeneration();

    // Check if user has configured API keys
    const hasApiKey = aiSettings
        ? (() => {
            const model = AI_MODELS.find((m) => m.id === selectedModel);
            if (!model) return false;
            const hasAIKey =
                (model.provider === 'gemini' && aiSettings.hasGeminiKey) ||
                (model.provider === 'openai' && aiSettings.hasOpenAIKey) ||
                (model.provider === 'anthropic' && aiSettings.hasAnthropicKey);
            return hasAIKey && aiSettings.hasTmdbKey;
        })()
        : false;

    // Set user's preferred model if available
    useEffect(() => {
        if (aiSettings?.preferredAiModel) {
            setSelectedModel(aiSettings.preferredAiModel);
        }
    }, [aiSettings]);

    // Auto-scroll logs to bottom when new logs arrive
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [status?.logs]);

    const handleStart = async () => {
        setError('');
        setSuccessMessage('');

        try {
            const payload: any = {
                count,
                type,
                sortBy,
                mode,
                category: category === 'auto' ? undefined : category,
                includeAdult,
                aiModel: selectedModel,
                rotateCategories: category === 'auto' ? true : rotateCategories,
                rotateSortBy,
            };

            if (mode === 'continuous') {
                payload.postsPerHour = postsPerHour;
            }

            if (minRating) payload.minRating = minRating;
            if (yearFrom) payload.yearFrom = yearFrom;
            if (yearTo) payload.yearTo = yearTo;

            await startGenerationMutation.mutateAsync(payload, {
                onSuccess: (data) => {
                    setSuccessMessage(data.message || 'Generation started successfully');
                },
                onError: (err: any) => {
                    setError(err.message || 'Failed to start generation');
                },
            });
        } catch (err: any) {
            setError(err.message || 'Failed to start generation');
        }
    };

    const handleStop = async () => {
        setError('');
        setSuccessMessage('');

        try {
            await stopGenerationMutation.mutateAsync(undefined, {
                onSuccess: (data) => {
                    setSuccessMessage(data.message || 'Generation stopped');
                },
                onError: (err: any) => {
                    setError(err.message || 'Failed to stop generation');
                },
            });
        } catch (err: any) {
            setError(err.message || 'Failed to stop generation');
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

    const sortOptions: { value: SortOption; label: string; description: string; types: string[] }[] = [
        { value: 'popular', label: 'Popular', description: 'Most popular currently', types: ['movie', 'tv', 'mixed'] },
        { value: 'top_rated', label: 'Top Rated', description: 'Highest rated of all time', types: ['movie', 'tv', 'mixed'] },
        { value: 'trending_day', label: 'Trending Today', description: 'Trending in last 24h', types: ['movie', 'tv', 'mixed'] },
        { value: 'trending_week', label: 'Trending This Week', description: 'Trending in last 7 days', types: ['movie', 'tv', 'mixed'] },
        { value: 'upcoming', label: 'Upcoming', description: 'Coming soon', types: ['movie', 'mixed'] },
        { value: 'now_playing', label: 'Now Playing', description: 'Currently in theaters', types: ['movie', 'mixed'] },
        { value: 'on_the_air', label: 'On The Air', description: 'Currently airing', types: ['tv', 'mixed'] },
        { value: 'airing_today', label: 'Airing Today', description: 'Episodes airing today', types: ['tv', 'mixed'] },
    ];

    const categoryOptions: { value: BlogCategory | 'auto'; label: string; icon: string; description: string }[] = [
        { value: 'auto', label: 'Auto-Select', icon: '🎯', description: 'Intelligently choose category' },
        { value: 'review', label: 'Review', icon: '⭐', description: 'Comprehensive reviews' },
        { value: 'news', label: 'News', icon: '📰', description: 'Latest releases & updates' },
        { value: 'guide', label: 'Guide', icon: '📖', description: 'Viewing guides & tips' },
        { value: 'analysis', label: 'Analysis', icon: '🔍', description: 'In-depth analysis' },
        { value: 'recommendation', label: 'Recommendation', icon: '👍', description: 'What to watch' },
        { value: 'comparison', label: 'Comparison', icon: '⚖️', description: 'Compare similar content' },
    ];

    // Filter sort options based on selected type
    const availableSortOptions = sortOptions.filter(opt => opt.types.includes(type));

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

            {/* New Features Info Banner */}
            {!status?.isRunning && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                        <Brain className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <div className="text-blue-400 font-medium mb-2">
                                ✨ Advanced Blog Generation Features
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
                                <div>• <span className="text-gray-300">6 Blog Categories</span>: Reviews, News, Guides, Analysis, Recommendations, Comparisons</div>
                                <div>• <span className="text-gray-300">Mixed Mode</span>: Generate from both Movies & TV Shows in one run</div>
                                <div>• <span className="text-gray-300">Smart Rotation</span>: Auto-diversify categories & content sources</div>
                                <div>• <span className="text-gray-300">Cast Integration</span>: Automatically includes actor & crew information</div>
                                <div>• <span className="text-gray-300">New Release Detection</span>: Prioritizes recent content</div>
                                <div>• <span className="text-gray-300">Progress Tracking</span>: Never regenerate same content twice</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                    disabled={status?.isRunning}
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
                                    disabled={status?.isRunning}
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
                                    onChange={(e) => {
                                        const newType = e.target.value as 'movie' | 'tv' | 'mixed';
                                        setType(newType);
                                        // Reset sort option if not compatible
                                        if (!availableSortOptions.find(opt => opt.value === sortBy)) {
                                            setSortBy('popular');
                                        }
                                    }}
                                    disabled={status?.isRunning}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                >
                                    <option value="movie">🎬 Movies Only</option>
                                    <option value="tv">📺 TV Shows Only</option>
                                    <option value="mixed">🎭 Mixed (Movies + TV)</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    {type === 'mixed' ? 'Generates both movies and TV shows' : `Generates ${type === 'movie' ? 'movie' : 'TV show'} content only`}
                                </p>
                            </div>

                            {/* Blog Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Blog Category
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as BlogCategory | 'auto')}
                                    disabled={status?.isRunning}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                >
                                    {categoryOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.icon} {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    {categoryOptions.find(o => o.value === category)?.description}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Sort By */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Content Source
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                                    disabled={status?.isRunning}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                >
                                    {availableSortOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    {availableSortOptions.find(o => o.value === sortBy)?.description}
                                </p>
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
                                        max="100"
                                        value={count}
                                        onChange={(e) => setCount(Number(e.target.value))}
                                        disabled={status?.isRunning}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Max 100 posts {type === 'mixed' && '(50 movies + 50 TV)'}</p>
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
                                        disabled={status?.isRunning}
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
                                disabled={status?.isRunning}
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
                                disabled={status?.isRunning}
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
                            disabled={status?.isRunning}
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
                                        disabled={status?.isRunning}
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
                                        disabled={status?.isRunning}
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
                                        disabled={status?.isRunning}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={includeAdult}
                                            onChange={(e) => setIncludeAdult(e.target.checked)}
                                            disabled={status?.isRunning}
                                            className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                                        />
                                        Include Adult Content
                                    </label>
                                </div>

                                {/* Rotation Options */}
                                <div className="md:col-span-2 pt-4 border-t border-gray-700">
                                    <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                                        <RefreshCw className="w-4 h-4" />
                                        Smart Rotation (Auto-Diversify Content)
                                    </h4>
                                    <div className="space-y-3">
                                        <label className="flex items-start gap-3 text-sm text-gray-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={rotateCategories}
                                                onChange={(e) => setRotateCategories(e.target.checked)}
                                                disabled={status?.isRunning || category !== 'auto'}
                                                className="w-4 h-4 mt-0.5 rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900 disabled:opacity-50"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium">Auto-Rotate Categories</div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    Automatically cycle through different blog categories (reviews, news, guides, etc.) to create diverse content
                                                    {category !== 'auto' && <span className="text-yellow-500 ml-1">(Only available with Auto-Select category)</span>}
                                                </div>
                                            </div>
                                        </label>
                                        <label className="flex items-start gap-3 text-sm text-gray-300 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={rotateSortBy}
                                                onChange={(e) => setRotateSortBy(e.target.checked)}
                                                disabled={status?.isRunning}
                                                className="w-4 h-4 mt-0.5 rounded border-gray-700 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900 disabled:opacity-50"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium">Auto-Rotate Content Sources</div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    Cycle between popular, trending, top-rated, and new releases to maximize content variety
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            {!status?.isRunning ? (
                                <button
                                    onClick={handleStart}
                                    disabled={startGenerationMutation.isPending}
                                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Play className="w-5 h-5" />
                                    {startGenerationMutation.isPending ? 'Starting...' : 'Start Generation'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleStop}
                                    disabled={stopGenerationMutation.isPending}
                                    className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Square className="w-5 h-5" />
                                    {stopGenerationMutation.isPending ? 'Stopping...' : 'Stop Generation'}
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
                            <div className="mb-4 flex flex-wrap items-center gap-2">
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
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300">
                                    {status.sortBy.replace('_', ' ')}
                                </span>
                                {type === 'mixed' && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/30">
                                        🎭 Mixed Mode
                                    </span>
                                )}
                                {category !== 'auto' && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                                        {categoryOptions.find(c => c.value === category)?.icon} {category}
                                    </span>
                                )}
                                {rotateCategories && category === 'auto' && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400">
                                        <RefreshCw className="w-3 h-3" /> Auto-Category
                                    </span>
                                )}
                                {rotateSortBy && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-pink-500/20 text-pink-400">
                                        <RefreshCw className="w-3 h-3" /> Auto-Rotate
                                    </span>
                                )}
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

            {/* Generation Progress Tracker */}
            <div className="mt-6">
                <BlogGenerationProgress />
            </div>
        </div>
    );
}
