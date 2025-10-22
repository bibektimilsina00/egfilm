'use client';

import { useState, useMemo } from 'react';
import { Tv, TrendingUp, Star, Calendar } from 'lucide-react';

import MediaCard from '@/components/catalog/MediaCard';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import {
    useTrending,
    usePopular,
    useTopRated,
    useGenres,
    useDiscoverByGenre
} from '@/lib/hooks/useTMDb';
import Pagination from '@/components/ui/pagination';

export default function TVShowsPage() {
    const [filter, setFilter] = useState<'popular' | 'top_rated' | 'trending'>('popular');
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
    const [page, setPage] = useState(1);

    // Fetch genres
    const { data: genres = [], isLoading: genresLoading } = useGenres('tv');

    // Fetch TV shows
    const trendingQuery = useTrending('tv', 'week', { enabled: filter === 'trending' && !selectedGenre });
    const popularQuery = usePopular('tv', page, { enabled: filter === 'popular' && !selectedGenre });
    const topRatedQuery = useTopRated('tv', page, { enabled: filter === 'top_rated' && !selectedGenre });
    const discoverQuery = useDiscoverByGenre('tv', selectedGenre!, page, { enabled: !!selectedGenre });

    const activeQuery = selectedGenre
        ? discoverQuery
        : filter === 'trending'
            ? trendingQuery
            : filter === 'popular'
                ? popularQuery
                : topRatedQuery;

    const { data, isLoading, isError, error } = activeQuery;

    // Extract shows
    const shows = useMemo(() => {
        if (!data) return [];

        if (filter === 'trending' && !selectedGenre) return Array.isArray(data) ? data : [];

        return Array.isArray(data) ? data : (data.results || []);
    }, [data, filter, selectedGenre]);

    const currentPage = data && 'page' in data ? data.page : 1;
    const totalPages = data && 'total_pages' in data ? data.total_pages : 1;

    const handleFilterChange = (newFilter: 'popular' | 'top_rated' | 'trending') => {
        setFilter(newFilter);
        setPage(1);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleGenreChange = (genreId: number | null) => {
        setSelectedGenre(genreId);
        setPage(1);
        if (filter === 'trending' && genreId !== null) setFilter('popular');
    };

    const isTrendingDisabled = !!selectedGenre;

    const getPageTitle = () => {
        if (filter === 'popular') return 'Popular TV Shows';
        if (filter === 'top_rated') return 'Top Rated TV Shows';
        if (filter === 'trending') return 'Trending TV Shows';
        return '';
    };

    const getSelectedGenreName = () => {
        if (selectedGenre) return genres.find(g => g.id === selectedGenre)?.name;
    };

    return (
        <div className="min-h-screen bg-gray-950">
            <Navigation />

            {/* Filters */}
            <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-[73px] z-40">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Filter Buttons */}
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                            <Button
                                onClick={() => handleFilterChange('popular')}
                                variant={filter === 'popular' ? 'default' : 'outline'}
                                size="sm"
                                className="gap-2 whitespace-nowrap"
                                disabled={isLoading}
                            >
                                <Star className="w-4 h-4" />
                                Popular
                            </Button>
                            <Button
                                onClick={() => handleFilterChange('top_rated')}
                                variant={filter === 'top_rated' ? 'default' : 'outline'}
                                size="sm"
                                className="gap-2 whitespace-nowrap"
                                disabled={isLoading}
                            >
                                <Calendar className="w-4 h-4" />
                                Top Rated
                            </Button>
                            <Button
                                onClick={() => handleFilterChange('trending')}
                                variant={filter === 'trending' ? 'default' : 'outline'}
                                size="sm"
                                className="gap-2 whitespace-nowrap"
                                disabled={isLoading || isTrendingDisabled}
                                title={isTrendingDisabled ? 'Trending not available with genre filter' : ''}
                            >
                                <TrendingUp className="w-4 h-4" />
                                Trending
                            </Button>
                        </div>

                        {/* Genre Buttons */}
                        <div className="flex gap-2 overflow-x-auto flex-1">
                            <Button
                                onClick={() => handleGenreChange(null)}
                                variant={selectedGenre === null ? 'default' : 'ghost'}
                                size="sm"
                                className="whitespace-nowrap text-white"
                                disabled={genresLoading || isLoading}
                            >
                                All Genres
                            </Button>
                            {genres.slice(0, 8).map((genre) => (
                                <Button
                                    key={genre.id}
                                    onClick={() => handleGenreChange(genre.id)}
                                    variant={selectedGenre === genre.id ? 'default' : 'ghost'}
                                    size="sm"
                                    className="whitespace-nowrap text-white"
                                    disabled={genresLoading || isLoading}
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
                <div className='flex gap-4 items-center mb-8'>
                    <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-2">
                        <Tv className="w-8 h-8 text-blue-500" />
                        {getPageTitle()}
                    </h1>
                    {selectedGenre && (
                        <p className="text-blue-600 text-2xl">{getSelectedGenreName()}</p>
                    )}
                    {!isLoading && shows.length > 0 && 'total_results' in (data || {}) && (
                        <span className="text-gray-400 text-lg">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {(data as any).total_results?.toLocaleString()} shows
                        </span>
                    )}
                </div>

                {isError && (
                    <div className="bg-red-900/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
                        <p className="font-semibold">Failed to load TV shows</p>
                        <p className="text-sm mt-1">
                            {error instanceof Error ? error.message : 'Please try again later'}
                        </p>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                        <p className="text-gray-400">Loading TV shows...</p>
                    </div>
                ) : (
                    <>
                        {shows.length > 0 ? (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {shows.map((show: any) => (
                                        <MediaCard
                                            key={`${show.id}-${show.name}`}
                                            item={show}
                                            type="tv"
                                        />
                                    ))}
                                </div>

                                <div className='mt-12'>
                                    {filter !== 'trending' && totalPages > 1 && (
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            onPageChange={handlePageChange}
                                            isLoading={isLoading}
                                            showFirstLast={true}
                                            maxVisiblePages={7}
                                        />
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="text-gray-500 text-6xl mb-4">📺</div>
                                <p className="text-gray-400 text-lg">No TV shows found</p>
                                <p className="text-gray-500 text-sm mt-2">
                                    Try changing your filters
                                </p>
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}
