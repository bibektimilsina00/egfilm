'use client';

import { useState, useEffect } from 'react';
import { Save, Key, Brain, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { AI_MODELS } from '@/lib/ai/aiModels';
import { useAISettings, useUpdateAISettings } from '@/lib/hooks/useUserSettings';

export default function AISettingsPage() {
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form state
    const [geminiKey, setGeminiKey] = useState('');
    const [openaiKey, setOpenaiKey] = useState('');
    const [anthropicKey, setAnthropicKey] = useState('');
    const [tmdbKey, setTmdbKey] = useState('');
    const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');

    // Visibility toggles
    const [showGemini, setShowGemini] = useState(false);
    const [showOpenAI, setShowOpenAI] = useState(false);
    const [showAnthropic, setShowAnthropic] = useState(false);
    const [showTmdb, setShowTmdb] = useState(false);

    // React Query hooks
    const { data: settings, isLoading } = useAISettings();
    const updateSettingsMutation = useUpdateAISettings();

    useEffect(() => {
        if (settings) {
            setSelectedModel(settings.preferredAiModel || 'gemini-2.5-flash');
        }
    }, [settings]);

    const handleSave = async () => {
        setMessage(null);

        try {
            const payload: any = {
                preferredAiModel: selectedModel,
            };

            // Only send keys if they're entered (not masked)
            if (geminiKey && !geminiKey.startsWith('****')) {
                payload.geminiApiKey = geminiKey;
            }
            if (openaiKey && !openaiKey.startsWith('****')) {
                payload.openaiApiKey = openaiKey;
            }
            if (anthropicKey && !anthropicKey.startsWith('****')) {
                payload.anthropicApiKey = anthropicKey;
            }
            if (tmdbKey && !tmdbKey.startsWith('****')) {
                payload.tmdbApiKey = tmdbKey;
            }

            await updateSettingsMutation.mutateAsync(payload, {
                onSuccess: () => {
                    setMessage({ type: 'success', text: 'Settings saved successfully!' });
                    // Clear input fields after save
                    setGeminiKey('');
                    setOpenaiKey('');
                    setAnthropicKey('');
                    setTmdbKey('');
                },
                onError: (err: any) => {
                    setMessage({ type: 'error', text: err.message || 'Failed to save settings' });
                },
            });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to save settings' });
        }
    };

    const getProviderForModel = (modelId: string) => {
        const model = AI_MODELS.find(m => m.id === modelId);
        return model?.provider || 'gemini';
    };

    const selectedProvider = getProviderForModel(selectedModel);
    const modelsByProvider = AI_MODELS.reduce((acc, model) => {
        if (!acc[model.provider]) {
            acc[model.provider] = [];
        }
        acc[model.provider].push(model);
        return acc;
    }, {} as Record<string, typeof AI_MODELS>);

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-800 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-800 rounded w-2/3 mb-8"></div>
                    <div className="space-y-4">
                        <div className="h-32 bg-gray-800 rounded"></div>
                        <div className="h-32 bg-gray-800 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Brain className="w-8 h-8 text-blue-400" />
                    AI Configuration
                </h1>
                <p className="text-gray-400">
                    Configure your AI model preferences and API keys for blog generation
                </p>
            </div>

            {/* Status Messages */}
            {message && (
                <div className={`mb-6 p-4 rounded-lg border ${message.type === 'success'
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                    } flex items-center gap-3`}>
                    {message.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    {message.text}
                </div>
            )}

            {/* AI Model Selection */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-400" />
                    Preferred AI Model
                </h2>
                <p className="text-sm text-gray-400 mb-4">
                    Choose which AI model to use for generating blog content. You can override this per generation.
                </p>

                <div className="space-y-4">
                    {Object.entries(modelsByProvider).map(([provider, models]) => (
                        <div key={provider}>
                            <h3 className="text-sm font-medium text-gray-300 mb-2 capitalize">
                                {provider === 'gemini' && '🔵 Google Gemini'}
                                {provider === 'openai' && '🟢 OpenAI'}
                                {provider === 'anthropic' && '🟣 Anthropic Claude'}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {models.map((model) => (
                                    <button
                                        key={model.id}
                                        onClick={() => setSelectedModel(model.id)}
                                        className={`p-4 rounded-lg border-2 transition-all text-left ${selectedModel === model.id
                                            ? 'border-blue-500 bg-blue-500/10'
                                            : 'border-gray-700 hover:border-gray-600'
                                            }`}
                                    >
                                        <div className="font-medium text-white mb-1">{model.name}</div>
                                        <div className="text-xs text-gray-400">{model.description}</div>
                                        <div className="text-xs text-gray-500 mt-2">
                                            Max tokens: {model.maxTokens.toLocaleString()}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* API Keys Configuration */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Key className="w-5 h-5 text-yellow-400" />
                    API Keys
                </h2>
                <p className="text-sm text-gray-400 mb-6">
                    Store your API keys securely. Keys are encrypted and only used for your blog generation tasks.
                </p>

                {/* Selected Provider Warning */}
                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-300">
                            <strong>Currently selected: {AI_MODELS.find(m => m.id === selectedModel)?.name}</strong>
                            <br />
                            You need a {selectedProvider} API key to use this model.
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Gemini API Key */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Google Gemini API Key
                            {settings?.hasGeminiKey && (
                                <span className="ml-2 text-xs text-green-400">✓ Saved</span>
                            )}
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type={showGemini ? 'text' : 'password'}
                                    value={geminiKey || (settings?.hasGeminiKey ? settings.geminiApiKey || '' : '')}
                                    onChange={(e) => setGeminiKey(e.target.value)}
                                    placeholder={settings?.hasGeminiKey ? 'Key saved (enter new to update)' : 'AIzaSy...'}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowGemini(!showGemini)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Get your key from: <a href="https://makersuite.google.com/app/apikey" target="_blank" className="text-blue-400 hover:underline">Google AI Studio</a>
                        </p>
                    </div>

                    {/* OpenAI API Key */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            OpenAI API Key
                            {settings?.hasOpenAIKey && (
                                <span className="ml-2 text-xs text-green-400">✓ Saved</span>
                            )}
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type={showOpenAI ? 'text' : 'password'}
                                    value={openaiKey || (settings?.hasOpenAIKey ? settings.openaiApiKey || '' : '')}
                                    onChange={(e) => setOpenaiKey(e.target.value)}
                                    placeholder={settings?.hasOpenAIKey ? 'Key saved (enter new to update)' : 'sk-...'}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOpenAI(!showOpenAI)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    {showOpenAI ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Get your key from: <a href="https://platform.openai.com/api-keys" target="_blank" className="text-blue-400 hover:underline">OpenAI Platform</a>
                        </p>
                    </div>

                    {/* Anthropic API Key */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Anthropic API Key
                            {settings?.hasAnthropicKey && (
                                <span className="ml-2 text-xs text-green-400">✓ Saved</span>
                            )}
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type={showAnthropic ? 'text' : 'password'}
                                    value={anthropicKey || (settings?.hasAnthropicKey ? settings.anthropicApiKey || '' : '')}
                                    onChange={(e) => setAnthropicKey(e.target.value)}
                                    placeholder={settings?.hasAnthropicKey ? 'Key saved (enter new to update)' : 'sk-ant-...'}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowAnthropic(!showAnthropic)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    {showAnthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Get your key from: <a href="https://console.anthropic.com/settings/keys" target="_blank" className="text-blue-400 hover:underline">Anthropic Console</a>
                        </p>
                    </div>

                    {/* TMDB API Key */}
                    <div className="pt-6 border-t border-gray-800">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            TMDb API Key (Required for Blog Generation)
                            {settings?.hasTmdbKey && (
                                <span className="ml-2 text-xs text-green-400">✓ Saved</span>
                            )}
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type={showTmdb ? 'text' : 'password'}
                                    value={tmdbKey || (settings?.hasTmdbKey ? settings.tmdbApiKey || '' : '')}
                                    onChange={(e) => setTmdbKey(e.target.value)}
                                    placeholder={settings?.hasTmdbKey ? 'Key saved (enter new to update)' : 'Your TMDb API key'}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowTmdb(!showTmdb)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    {showTmdb ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Get your key from: <a href="https://www.themoviedb.org/settings/api" target="_blank" className="text-blue-400 hover:underline">TMDb API Settings</a>
                        </p>
                        <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <p className="text-xs text-yellow-300">
                                <strong>Required:</strong> Blog generation requires a TMDb API key to fetch movie/TV show data. This is separate from the AI API keys.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={updateSettingsMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
                <Save className="w-5 h-5" />
                {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
            </button>

            {/* Information */}
            <div className="mt-6 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
                <h3 className="text-sm font-semibold text-white mb-2">ℹ️ About AI Models</h3>
                <ul className="text-sm text-gray-400 space-y-1">
                    <li>• API keys are encrypted and stored securely in the database</li>
                    <li>• You can use environment variables as fallback (set in .env.local)</li>
                    <li>• Each AI model has different capabilities and pricing</li>
                    <li>• You can override the default model when starting generation</li>
                    <li>• Without an API key, generation will fail for that provider</li>
                </ul>
            </div>
        </div>
    );
}
