'use client';

import { useEffect, useState, useCallback } from 'react';
import { Tv, TrendingUp, Star, Calendar } from 'lucide-react';
import { getPopular, getTopRated, getTrending, getGenres } from '@/lib/tmdb';
import MediaCard from '@/components/catalog/MediaCard';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { BaseTVShow } from '@/lib/api/tmdb';
import { MediaGridSkeleton } from '@/components/ui/loading-skeletons';

export default function TVShowsPage() {
    const [shows, setShows] = useState<BaseTVShow[]>([]);
    const [genres, setGenres] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'popular' | 'top_rated' | 'trending'>('popular');
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        loadGenres();
    }, []);

    useEffect(() => {
        loadShows();
    }, [filter, page]);

    async function loadGenres() {
        try {
            const data = await getGenres('tv');
            setGenres(data);
        } catch (error) {
            console.error('Error loading genres:', error);
        }
    }

    const loadShows = useCallback(async () => {
        try {
            setLoading(true);

            if (filter === 'trending') {
                const data = await getTrending('tv', 'week');
                setShows(prev => page === 1 ? data : [...prev, ...data]);
                setHasMore(false);
            } else if (filter === 'popular') {
                const data = await getPopular('tv', page);
                setShows(prev => page === 1 ? data.results : [...prev, ...data.results]);
                setHasMore(data.page < data.total_pages);
            } else {
                const data = await getTopRated('tv', page);
                setShows(prev => page === 1 ? data.results : [...prev, ...data.results]);
                setHasMore(data.page < data.total_pages);
            }
        } catch (error) {
            console.error('Error loading TV shows:', error);
        } finally {
            setLoading(false);
        }
    }, [filter, page]);

    useEffect(() => {
        loadShows();
    }, [loadShows]);

    const filteredShows = selectedGenre
        ? shows.filter((show) => show.genre_ids?.includes(selectedGenre))
        : shows;

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Navigation */}
            <Navigation />

            {/* Filters */}
            <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-[73px] z-40">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Filter Buttons */}
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                            <Button
                                onClick={() => { setFilter('popular'); setPage(1); }}
                                variant="ghost"
                                size="sm"
                                className={`gap-2 whitespace-nowrap ${filter === 'popular'
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'text-gray-300 hover:bg-blue-600/20 hover:text-blue-200'
                                    }`}
                            >
                                <Star className="w-4 h-4" />
                                Popular
                            </Button>
                            <Button
                                onClick={() => { setFilter('top_rated'); setPage(1); }}
                                variant="ghost"
                                size="sm"
                                className={`gap-2 whitespace-nowrap ${filter === 'top_rated'
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'text-gray-300 hover:bg-blue-600/20 hover:text-blue-200'
                                    }`}
                            >
                                <Calendar className="w-4 h-4" />
                                Top Rated
                            </Button>
                            <Button
                                onClick={() => { setFilter('trending'); setPage(1); }}
                                variant="ghost"
                                size="sm"
                                className={`gap-2 whitespace-nowrap ${filter === 'trending'
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'text-gray-300 hover:bg-blue-600/20 hover:text-blue-200'
                                    }`}
                            >
                                <TrendingUp className="w-4 h-4" />
                                Trending
                            </Button>
                        </div>

                        {/* Genre Filter */}
                        <div className="flex gap-2 overflow-x-auto flex-1">
                            <Button
                                onClick={() => setSelectedGenre(null)}
                                variant={selectedGenre === null ? 'default' : 'ghost'}
                                size="sm"
                                className={`whitespace-nowrap ${selectedGenre === null
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'text-gray-300 hover:bg-blue-600/20 hover:text-blue-200'
                                    }`}
                            >
                                All Genres
                            </Button>
                            {genres.slice(0, 8).map((genre) => (
                                <Button
                                    key={genre.id}
                                    onClick={() => setSelectedGenre(genre.id)}
                                    variant={selectedGenre === genre.id ? 'default' : 'ghost'}
                                    size="sm"
                                    className={`whitespace-nowrap ${selectedGenre === genre.id
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                            : 'text-gray-300 hover:bg-blue-600/20 hover:text-blue-200'
                                        }`}
                                >
                                    {genre.name}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 flex items-center gap-3">
                    <Tv className="w-10 h-10 text-blue-500" />
                    {filter === 'popular' && 'Popular TV Shows'}
                    {filter === 'top_rated' && 'Top Rated TV Shows'}
                    {filter === 'trending' && 'Trending TV Shows'}
                    {selectedGenre && (
                        <span className="text-blue-400 ml-3">
                            • {genres.find(g => g.id === selectedGenre)?.name}
                        </span>
                    )}
                </h1>

                {loading && page === 1 ? (
                    <MediaGridSkeleton title="" count={12} />
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredShows.map((show) => (
                                <MediaCard key={show.id} item={show} type="tv" />
                            ))}
                        </div>

                        {/* Load More */}
                        {hasMore && !loading && (
                            <div className="flex justify-center mt-12">
                                <Button
                                    onClick={() => setPage(p => p + 1)}
                                    variant="default"
                                    size="lg"
                                >
                                    Load More
                                </Button>
                            </div>
                        )}

                        {loading && page > 1 && (
                            <div className="flex justify-center mt-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}
