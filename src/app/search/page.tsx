'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search as SearchIcon, Sparkles, TrendingUp } from 'lucide-react';
import { searchMulti, getTrending } from '@/lib/tmdb';
import { SearchResult, MediaItem } from '@/lib/api/tmdb';
import { Button } from '@/components/ui/button';
import MediaCard from '@/components/catalog/MediaCard';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import LoadingSpinner from '@/components/LoadingSpinner';
import { MediaGridSkeleton } from '@/components/ui/loading-skeletons';

type SearchSuggestion = {
    id: number;
    media_type: 'movie' | 'tv';
    title: string;
    poster_path: string | null;
};

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams?.get('q') || '';

    const [results, setResults] = useState<SearchResult[]>([]);
    const [trendingContent, setTrendingContent] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchInput, setSearchInput] = useState(query);
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [highlighted, setHighlighted] = useState<number>(-1);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const suggestDebounceRef = useRef<number | undefined>(undefined);

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
                (item: SearchResult) => item.media_type === 'movie' || item.media_type === 'tv'
            );
            setResults(filtered);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }

    // Autosuggest: debounced as user types (client-side)
    useEffect(() => {
        // Clear previous debounce
        if (suggestDebounceRef.current) {
            window.clearTimeout(suggestDebounceRef.current);
        }

        if (!searchInput || searchInput.trim().length < 2) {
            setSuggestions([]);
            return;
        }

        // debounce 300ms
        suggestDebounceRef.current = window.setTimeout(async () => {
            try {
                const res = await searchMulti(searchInput.trim(), 1);
                const items = (res.results || []).filter((it: SearchResult) => it.media_type === 'movie' || it.media_type === 'tv');
                // Map to simplified suggestion items and dedupe by id
                const uniques: SearchSuggestion[] = [];
                const seen = new Set();
                for (const it of items) {
                    const title = it.media_type === 'movie' ? it.title : it.name;
                    const key = `${it.media_type}-${it.id}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniques.push({ id: it.id, media_type: it.media_type, title, poster_path: it.poster_path });
                    }
                    if (uniques.length >= 8) break; // limit suggestions
                }
                setSuggestions(uniques);
            } catch (err) {
                console.error('Autosuggest error:', err);
                setSuggestions([]);
            }
        }, 300);

        return () => {
            if (suggestDebounceRef.current) window.clearTimeout(suggestDebounceRef.current);
        };
    }, [searchInput]);

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
                                Search Egfilm
                            </h1>
                        </div>
                        <p className="text-gray-400 mb-6">
                            Discover thousands of movies and TV shows
                        </p>

                        <form onSubmit={handleSearch} className="relative" autoComplete="off">
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchInput}
                                onChange={(e) => {
                                    setSearchInput(e.target.value);
                                    setHighlighted(-1);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
                                    } else if (e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        setHighlighted((h) => Math.max(h - 1, 0));
                                    } else if (e.key === 'Enter') {
                                        if (highlighted >= 0 && suggestions[highlighted]) {
                                            e.preventDefault();
                                            const sel = suggestions[highlighted];
                                            router.push(`/search?q=${encodeURIComponent(sel.title)}`);
                                            setSuggestions([]);
                                        }
                                    } else if (e.key === 'Escape') {
                                        setSuggestions([]);
                                    }
                                }}
                                placeholder="Search for movies, TV shows, actors..."
                                className="w-full bg-gray-800/50 backdrop-blur-sm text-white px-6 py-4 pr-14 rounded-full outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-800 transition-all text-lg placeholder:text-gray-500"
                                autoFocus
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90 p-3 rounded-full transition-colors"
                            >
                                <SearchIcon className="w-5 h-5 text-primary-foreground" />
                            </button>

                            {/* Suggestions dropdown */}
                            {suggestions.length > 0 && (
                                <ul
                                    role="listbox"
                                    className="absolute left-0 right-0 mt-2 bg-gray-900/90 border border-gray-800 rounded-xl shadow-lg z-50 max-h-72 overflow-auto"
                                >
                                    {suggestions.map((sugg, idx) => (
                                        <li
                                            key={`${sugg.media_type}-${sugg.id}`}
                                            role="option"
                                            aria-selected={highlighted === idx}
                                            onMouseDown={(e) => {
                                                // onMouseDown to prevent blur before click
                                                e.preventDefault();
                                                router.push(`/search?q=${encodeURIComponent(sugg.title)}`);
                                                setSuggestions([]);
                                            }}
                                            onMouseEnter={() => setHighlighted(idx)}
                                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-800 ${highlighted === idx ? 'bg-gray-800' : ''}`}
                                        >
                                            <Image
                                                src={sugg.poster_path ? `https://image.tmdb.org/t/p/w92${sugg.poster_path}` : '/placeholder-movie.jpg'}
                                                alt={sugg.title}
                                                width={40}
                                                height={56}
                                                className="w-10 h-14 object-cover rounded-md"
                                            />
                                            <div className="flex-1 text-left">
                                                <div className="text-white font-medium truncate">{sugg.title}</div>
                                                <div className="text-gray-400 text-sm">{sugg.media_type === 'movie' ? 'Movie' : 'TV Show'}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </form>
                    </div>
                </div>
            </div>

            {/* Results */}
            <main className="container mx-auto px-4 py-8">
                {loading ? (
                    <MediaGridSkeleton title="" count={12} />
                ) : results.length > 0 ? (
                    <div className="space-y-6">
                        {/* Results Header */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl md:text-3xl font-bold text-white">
                                Search Results for &ldquo;{query}&rdquo;
                            </h2>
                            <span className="text-gray-400 text-lg">
                                {results.length} {results.length === 1 ? 'result' : 'results'}
                            </span>
                        </div>

                        {/* Results Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-in scale-in">
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
                            No results found for &ldquo;{query}&rdquo;
                        </h2>
                        <p className="text-gray-400 mb-8 text-lg">
                            Try searching with different keywords or check for spelling
                        </p>
                        <Button
                            onClick={() => {
                                setSearchInput('');
                                router.push('/search');
                            }}
                            variant="default"
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
                                Enter a movie or TV show name above to find what you&apos;re looking for
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
