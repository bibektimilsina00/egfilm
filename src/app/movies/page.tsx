'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Film, TrendingUp, Star, Calendar } from 'lucide-react';
import { getPopular, getTopRated, getTrending, getGenres } from '@/lib/tmdb';
import MediaCard from '@/components/catalog/MediaCard';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function MoviesPage() {
    const [movies, setMovies] = useState<any[]>([]);
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
        loadMovies();
    }, [filter, page]);

    async function loadGenres() {
        try {
            const data = await getGenres('movie');
            setGenres(data);
        } catch (error) {
            console.error('Error loading genres:', error);
        }
    }

    async function loadMovies() {
        try {
            setLoading(true);
            let data: any;

            if (filter === 'trending') {
                data = await getTrending('movie', 'week');
                setMovies(prev => page === 1 ? data : [...prev, ...data]);
                setHasMore(false);
            } else if (filter === 'popular') {
                data = await getPopular('movie', page);
                setMovies(prev => page === 1 ? data.results : [...prev, ...data.results]);
                setHasMore(data.page < data.total_pages);
            } else {
                data = await getTopRated('movie', page);
                setMovies(prev => page === 1 ? data.results : [...prev, ...data.results]);
                setHasMore(data.page < data.total_pages);
            }
        } catch (error) {
            console.error('Error loading movies:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredMovies = selectedGenre
        ? movies.filter((movie) => movie.genre_ids?.includes(selectedGenre))
        : movies;

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
                                variant={filter === 'popular' ? 'primary' : 'outline'}
                                size="sm"
                                className="gap-2 whitespace-nowrap"
                            >
                                <Star className="w-4 h-4" />
                                Popular
                            </Button>
                            <Button
                                onClick={() => { setFilter('top_rated'); setPage(1); }}
                                variant={filter === 'top_rated' ? 'primary' : 'outline'}
                                size="sm"
                                className="gap-2 whitespace-nowrap"
                            >
                                <Calendar className="w-4 h-4" />
                                Top Rated
                            </Button>
                            <Button
                                onClick={() => { setFilter('trending'); setPage(1); }}
                                variant={filter === 'trending' ? 'primary' : 'outline'}
                                size="sm"
                                className="gap-2 whitespace-nowrap"
                            >
                                <TrendingUp className="w-4 h-4" />
                                Trending
                            </Button>
                        </div>

                        {/* Genre Filter */}
                        <div className="flex gap-2 overflow-x-auto flex-1">
                            <Button
                                onClick={() => setSelectedGenre(null)}
                                variant={selectedGenre === null ? 'primary' : 'ghost'}
                                size="sm"
                                className="whitespace-nowrap"
                            >
                                All Genres
                            </Button>
                            {genres.slice(0, 8).map((genre) => (
                                <Button
                                    key={genre.id}
                                    onClick={() => setSelectedGenre(genre.id)}
                                    variant={selectedGenre === genre.id ? 'primary' : 'ghost'}
                                    size="sm"
                                    className="whitespace-nowrap"
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
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
                    {filter === 'popular' && 'Popular Movies'}
                    {filter === 'top_rated' && 'Top Rated Movies'}
                    {filter === 'trending' && 'Trending Movies'}
                    {selectedGenre && (
                        <span className="text-blue-400 ml-3">
                            • {genres.find(g => g.id === selectedGenre)?.name}
                        </span>
                    )}
                </h1>

                {loading && page === 1 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {filteredMovies.map((movie) => (
                                <MediaCard key={movie.id} item={movie} type="movie" />
                            ))}
                        </div>

                        {/* Load More */}
                        {hasMore && !loading && (
                            <div className="flex justify-center mt-12">
                                <Button
                                    onClick={() => setPage(p => p + 1)}
                                    variant="primary"
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
