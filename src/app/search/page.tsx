'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search as SearchIcon, Sparkles, TrendingUp } from 'lucide-react';
import { searchMulti, getTrending } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import MediaCard from '@/components/catalog/MediaCard';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import LoadingSpinner from '@/components/LoadingSpinner';

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams?.get('q') || '';

    const [results, setResults] = useState<any[]>([]);
    const [trendingContent, setTrendingContent] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchInput, setSearchInput] = useState(query);

    // Load trending content for empty state
    useEffect(() => {
        loadTrending();
    }, []);

    // Debounced search effect
    useEffect(() => {
        if (query) {
            setSearchInput(query);
            performSearch(query);
        }
    }, [query]);

    async function loadTrending() {
        try {
            const data = await getTrending('all', 'day');
            setTrendingContent(data.slice(0, 12));
        } catch (error) {
            console.error('Error loading trending:', error);
        }
    }

    async function performSearch(searchQuery: string) {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        try {
            setLoading(true);
            const data = await searchMulti(searchQuery);
            const filtered = data.results.filter(
                (item: any) => item.media_type === 'movie' || item.media_type === 'tv'
            );
            setResults(filtered);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchInput.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Navigation */}
            <Navigation />

            {/* Search Hero Section */}
            <div className="bg-gradient-to-b from-blue-950/20 to-gray-950 border-b border-gray-800">
                <div className="container mx-auto px-4 py-8 md:py-12">
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Sparkles className="w-8 h-8 text-blue-400" />
                            <h1 className="text-3xl md:text-4xl font-bold text-white">
                                Search StreamFlix
                            </h1>
                        </div>
                        <p className="text-gray-400 mb-6">
                            Discover thousands of movies and TV shows
                        </p>

                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search for movies, TV shows, actors..."
                                className="w-full bg-gray-800/50 backdrop-blur-sm text-white px-6 py-4 pr-14 rounded-full outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-800 transition-all text-lg placeholder:text-gray-500"
                                autoFocus
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 p-3 rounded-full transition-colors"
                            >
                                <SearchIcon className="w-5 h-5 text-white" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Results */}
            <main className="container mx-auto px-4 py-8">
                {loading ? (
                    <LoadingSpinner size="lg" />
                ) : results.length > 0 ? (
                    <div className="space-y-6">
                        {/* Results Header */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl md:text-3xl font-bold text-white">
                                Search Results for "{query}"
                            </h2>
                            <span className="text-gray-400 text-lg">
                                {results.length} {results.length === 1 ? 'result' : 'results'}
                            </span>
                        </div>

                        {/* Results Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-in scale-in">
                            {results.map((item) => (
                                <MediaCard
                                    key={`${item.media_type}-${item.id}`}
                                    item={item}
                                    type={item.media_type as 'movie' | 'tv'}
                                />
                            ))}
                        </div>
                    </div>
                ) : query ? (
                    <div className="text-center py-20 animate-in scale-in">
                        <div className="mb-6 relative">
                            <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto">
                                <SearchIcon className="w-12 h-12 text-gray-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                            No results found for "{query}"
                        </h2>
                        <p className="text-gray-400 mb-8 text-lg">
                            Try searching with different keywords or check for spelling
                        </p>
                        <Button
                            onClick={() => {
                                setSearchInput('');
                                router.push('/search');
                            }}
                            variant="primary"
                        >
                            Clear Search
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-12 animate-in slide-in-from-bottom">
                        {/* Empty State */}
                        <div className="text-center py-12">
                            <div className="mb-6 relative">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                                    <SearchIcon className="w-12 h-12 text-white" />
                                </div>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                                Start Your Search
                            </h2>
                            <p className="text-gray-400 text-lg">
                                Enter a movie or TV show name above to find what you're looking for
                            </p>
                        </div>

                        {/* Trending Section */}
                        {trendingContent.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <TrendingUp className="w-8 h-8 text-blue-500" />
                                    <h2 className="text-2xl md:text-3xl font-bold text-white">
                                        Trending Now
                                    </h2>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {trendingContent.map((item) => (
                                        <MediaCard
                                            key={`${item.media_type}-${item.id}`}
                                            item={item}
                                            type={item.media_type as 'movie' | 'tv'}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <SearchContent />
        </Suspense>
    );
}
