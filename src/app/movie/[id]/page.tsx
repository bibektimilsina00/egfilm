'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { Play, ArrowLeft, Star, Calendar, Clock, Heart, Share2, Plus, Check } from 'lucide-react';
import { getMovieDetails, getImageUrl, MediaDetail } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import { formatVoteAverage, formatRuntime, formatDate } from '@/lib/utils';
import MediaCard from '@/components/catalog/MediaCard';
import { addToWatchlist, removeFromWatchlist, isInWatchlist, addToHistory, addToContinueWatching } from '@/lib/storage';
import VideoPlayer from '@/components/VideoPlayer';

export default function MovieDetailPage() {
    const params = useParams();
    const router = useRouter();
    const movieId = params?.id as string;

    const [movie, setMovie] = useState<MediaDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showPlayer, setShowPlayer] = useState(false);
    const [inWatchlist, setInWatchlist] = useState(false);
    const [magnetLink, setMagnetLink] = useState('');
    const [webTorrentReady, setWebTorrentReady] = useState(false);

    useEffect(() => {
        if (movieId) {
            loadMovieDetails();
        }
    }, [movieId]);

    useEffect(() => {
        if (movie) {
            setInWatchlist(isInWatchlist(movie.id, 'movie'));
            addToHistory(movie, 'movie');
        }
    }, [movie]);

    const toggleWatchlist = () => {
        if (!movie) return;

        if (inWatchlist) {
            removeFromWatchlist(movie.id, 'movie');
            setInWatchlist(false);
        } else {
            addToWatchlist(movie, 'movie');
            setInWatchlist(true);
        }
    };

    async function loadMovieDetails() {
        try {
            setLoading(true);
            const data = await getMovieDetails(Number(movieId));
            setMovie(data);
        } catch (err) {
            console.error('Error loading movie:', err);
            setError('Failed to load movie details');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !movie) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Movie Not Found</h1>
                    <Button onClick={() => router.push('/')} variant="primary">
                        Go Home
                    </Button>
                </div>
            </div>
        );
    }

    const trailer = movie.videos?.results?.find(
        (video) => video.type === 'Trailer' && video.site === 'YouTube'
    );

    const handlePlayClick = () => {
        // Prompt for magnet link if not provided
        const magnet = prompt(
            'Enter magnet link for this movie:\n\n' +
            'You can find magnet links from torrent sites.\n' +
            'Example: magnet:?xt=urn:btih:...'
        );

        if (magnet && magnet.trim().startsWith('magnet:')) {
            setMagnetLink(magnet.trim());
            setShowPlayer(true);
        } else if (magnet) {
            alert('Invalid magnet link. Please enter a valid magnet link starting with "magnet:"');
        }
    };

    return (
        <>
            {/* Load WebTorrent CDN */}
            <Script
                src="https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js"
                onLoad={() => setWebTorrentReady(true)}
                strategy="afterInteractive"
            />

            <div className="min-h-screen bg-gray-950">
                {/* Back Button */}
                <div className="fixed top-4 left-4 z-50">
                    <Button
                        onClick={() => router.back()}
                        variant="outline"
                        size="icon"
                        className="bg-black/50 backdrop-blur-sm border-gray-700 hover:bg-black/70"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Button>
                </div>

                {/* Hero Section */}
                <div className="relative h-[60vh] md:h-[70vh]">
                    {/* Backdrop Image */}
                    <div className="absolute inset-0">
                        <Image
                            src={getImageUrl(movie.backdrop_path || movie.poster_path, 'original')}
                            alt={movie.title}
                            fill
                            priority
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/40 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="relative h-full flex items-end">
                        <div className="container mx-auto px-4 pb-12">
                            <div className="flex flex-col md:flex-row gap-8 items-end">
                                {/* Poster */}
                                <div className="hidden md:block w-48 lg:w-64 flex-shrink-0">
                                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-2xl">
                                        <Image
                                            src={getImageUrl(movie.poster_path, 'w500')}
                                            alt={movie.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                                        {movie.title}
                                    </h1>

                                    {/* Meta Info */}
                                    <div className="flex flex-wrap items-center gap-4 mb-6">
                                        {movie.vote_average > 0 && (
                                            <div className="flex items-center gap-1 bg-yellow-500/20 px-3 py-1 rounded-full">
                                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                <span className="text-yellow-400 font-semibold">
                                                    {formatVoteAverage(movie.vote_average)}
                                                </span>
                                            </div>
                                        )}

                                        {movie.release_date && (
                                            <div className="flex items-center gap-2 text-gray-300">
                                                <Calendar className="w-4 h-4" />
                                                <span>{new Date(movie.release_date).getFullYear()}</span>
                                            </div>
                                        )}

                                        {movie.runtime && (
                                            <div className="flex items-center gap-2 text-gray-300">
                                                <Clock className="w-4 h-4" />
                                                <span>{formatRuntime(movie.runtime)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Genres */}
                                    {movie.genres && movie.genres.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {movie.genres.map((genre) => (
                                                <span
                                                    key={genre.id}
                                                    className="px-3 py-1 bg-gray-800/80 backdrop-blur-sm text-gray-300 rounded-full text-sm"
                                                >
                                                    {genre.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Overview */}
                                    <p className="text-gray-300 text-lg mb-8 max-w-3xl leading-relaxed">
                                        {movie.overview}
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-4">
                                        <Button
                                            onClick={() => setShowPlayer(true)}
                                            variant="primary"
                                            size="lg"
                                            className="gap-2"
                                        >
                                            <Play className="w-5 h-5 fill-white" />
                                            Play Now
                                        </Button>

                                        {trailer && (
                                            <Button
                                                onClick={() => window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank')}
                                                variant="outline"
                                                size="lg"
                                                className="gap-2 text-white border-white hover:bg-white/10"
                                            >
                                                <Play className="w-5 h-5" />
                                                Watch Trailer
                                            </Button>
                                        )}

                                        <Button
                                            onClick={toggleWatchlist}
                                            variant="outline"
                                            size="lg"
                                            className={`gap-2 ${inWatchlist ? 'text-pink-500 border-pink-500 hover:bg-pink-500/10' : 'text-white border-white hover:bg-white/10'}`}
                                            title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                                        >
                                            {inWatchlist ? (
                                                <>
                                                    <Check className="w-5 h-5" />
                                                    <span className="hidden sm:inline">In Watchlist</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Heart className="w-5 h-5" />
                                                    <span className="hidden sm:inline">Watchlist</span>
                                                </>
                                            )}
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="text-white border-white hover:bg-white/10"
                                            onClick={() => {
                                                if (navigator.share) {
                                                    navigator.share({
                                                        title: movie.title,
                                                        text: movie.overview,
                                                        url: window.location.href,
                                                    });
                                                }
                                            }}
                                        >
                                            <Share2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="container mx-auto px-4 py-12 space-y-12">
                    {/* Cast */}
                    {movie.credits?.cast && movie.credits.cast.length > 0 && (
                        <section>
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Top Cast</h2>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                                {movie.credits.cast.slice(0, 16).map((person) => (
                                    <div key={person.id} className="group cursor-pointer">
                                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 bg-gray-800 group-hover:ring-2 group-hover:ring-blue-500 transition-all">
                                            {person.profile_path ? (
                                                <Image
                                                    src={getImageUrl(person.profile_path, 'w185')}
                                                    alt={person.name}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-white font-medium text-xs truncate" title={person.name}>{person.name}</p>
                                        <p className="text-gray-400 text-xs truncate" title={person.character}>{person.character}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Similar Movies */}
                    {movie.similar?.results && movie.similar.results.length > 0 && (
                        <section>
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Similar Movies</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {movie.similar.results.slice(0, 10).map((item: any) => (
                                    <MediaCard key={item.id} item={item} type="movie" />
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Video Player Modal */}
                {showPlayer && movie && (
                    <VideoPlayer
                        title={movie.title}
                        magnetLink={magnetLink}
                        onClose={() => setShowPlayer(false)}
                        onProgress={(progress) => {
                            addToContinueWatching(movie, 'movie', progress);
                        }}
                    />
                )}
            </div>
        </>
    );
}
