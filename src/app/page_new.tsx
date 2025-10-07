'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Info, Search, TrendingUp, Star, Tv, Film } from 'lucide-react';
import { MediaCard } from '@/components/media-card';
import { Button } from '@/components/ui/button';
import { getTrending, getPopular, getTopRated, MediaItem, getImageUrl } from '@/lib/tmdb';
import { formatVoteAverage } from '@/lib/utils';

export default function HomePage() {
    const [heroMedia, setHeroMedia] = useState<MediaItem | null>(null);
    const [trendingMovies, setTrendingMovies] = useState<MediaItem[]>([]);
    const [trendingTV, setTrendingTV] = useState<MediaItem[]>([]);
    const [popularMovies, setPopularMovies] = useState<MediaItem[]>([]);
    const [topRatedMovies, setTopRatedMovies] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);

                const [trending, movies, tv, popular, topRated] = await Promise.all([
                    getTrending('all', 'day'),
                    getTrending('movie', 'week'),
                    getTrending('tv', 'week'),
                    getPopular('movie'),
                    getTopRated('movie'),
                ]);

                if (trending && trending.length > 0) {
                    setHeroMedia(trending[0]);
                }

                setTrendingMovies(movies.slice(0, 10));
                setTrendingTV(tv.slice(0, 10));
                setPopularMovies(popular.results.slice(0, 10));
                setTopRatedMovies(topRated.results.slice(0, 10));
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const heroTitle = heroMedia && ('title' in heroMedia ? heroMedia.title : heroMedia.name);
    const heroType = heroMedia?.media_type || ('title' in (heroMedia || {}) ? 'movie' : 'tv');

    return (
        <div className="min-h-screen bg-gray-950">
            <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black to-transparent">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Film className="w-8 h-8 text-blue-500" />
                        <span className="text-white text-2xl font-bold">StreamFlix</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-6">
                        <Link href="/" className="text-white hover:text-blue-400 transition">Home</Link>
                        <Link href="/movies" className="text-white hover:text-blue-400 transition">Movies</Link>
                        <Link href="/tv" className="text-white hover:text-blue-400 transition">TV Shows</Link>
                        <Link href="/live" className="text-white hover:text-blue-400 transition">Live TV</Link>
                    </nav>

                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            className="bg-gray-800/50 text-white px-4 py-2 pr-10 rounded-full outline-none focus:ring-2 focus:ring-blue-500 w-48 md:w-64"
                        />
                        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Search className="w-5 h-5 text-gray-400" />
                        </button>
                    </form>
                </div>
            </header>

            {heroMedia && (
                <section className="relative h-[70vh] md:h-[80vh] flex items-end">
                    <div className="absolute inset-0">
                        <Image
                            src={getImageUrl(heroMedia.backdrop_path || heroMedia.poster_path, 'original')}
                            alt={heroTitle || 'Hero'}
                            fill
                            priority
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-transparent to-transparent" />
                    </div>

                    <div className="relative container mx-auto px-4 pb-16 md:pb-24">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-5 h-5 text-blue-500" />
                                <span className="text-blue-400 font-semibold uppercase text-sm">Trending Now</span>
                            </div>

                            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{heroTitle}</h1>

                            {heroMedia.vote_average > 0 && (
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="flex items-center gap-1 bg-yellow-500/20 px-3 py-1 rounded-full">
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        <span className="text-yellow-400 font-semibold">{formatVoteAverage(heroMedia.vote_average)}</span>
                                    </div>
                                    <span className="text-gray-300 text-sm uppercase">{heroType === 'movie' ? 'Movie' : 'TV Show'}</span>
                                </div>
                            )}

                            <p className="text-gray-300 text-lg mb-8 line-clamp-3">{heroMedia.overview}</p>

                            <div className="flex flex-wrap gap-4">
                                <Link href={`/${heroType}/${heroMedia.id}`}>
                                    <Button variant="primary" size="lg" className="gap-2">
                                        <Play className="w-5 h-5 fill-white" />
                                        Play Now
                                    </Button>
                                </Link>
                                <Link href={`/${heroType}/${heroMedia.id}`}>
                                    <Button variant="outline" size="lg" className="gap-2 text-white border-white hover:bg-white/10">
                                        <Info className="w-5 h-5" />
                                        More Info
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <div className="container mx-auto px-4 py-12 space-y-12">
                <Section title="Trending Movies" icon={<TrendingUp className="w-6 h-6" />}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {trendingMovies.map((media) => (
                            <MediaCard key={media.id} media={media} mediaType="movie" />
                        ))}
                    </div>
                </Section>

                <Section title="Trending TV Shows" icon={<Tv className="w-6 h-6" />}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {trendingTV.map((media) => (
                            <MediaCard key={media.id} media={media} mediaType="tv" />
                        ))}
                    </div>
                </Section>

                <Section title="Popular Movies" icon={<Film className="w-6 h-6" />}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {popularMovies.map((media) => (
                            <MediaCard key={media.id} media={media} mediaType="movie" />
                        ))}
                    </div>
                </Section>

                <Section title="Top Rated Movies" icon={<Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {topRatedMovies.map((media) => (
                            <MediaCard key={media.id} media={media} mediaType="movie" />
                        ))}
                    </div>
                </Section>
            </div>

            <footer className="bg-gray-900 border-t border-gray-800 py-8 mt-16">
                <div className="container mx-auto px-4 text-center text-gray-400">
                    <p className="mb-2">
                        <span className="font-semibold text-white">StreamFlix</span> - Your Ultimate Streaming Platform
                    </p>
                    <p className="text-sm">⚠️ For educational purposes only. Use legal content sources.</p>
                    <p className="text-xs mt-4">
                        Data provided by <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">TMDb</a>
                    </p>
                </div>
            </footer>
        </div>
    );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <section>
            <div className="flex items-center gap-3 mb-6">
                {icon && <div className="text-blue-500">{icon}</div>}
                <h2 className="text-2xl md:text-3xl font-bold text-white">{title}</h2>
            </div>
            {children}
        </section>
    );
}
