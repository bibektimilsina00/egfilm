'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Play, ArrowLeft, Star, Calendar, Tv as TvIcon, Heart, Share2, Check, Users } from 'lucide-react';
import { getTVDetails, getImageUrl, MediaDetail } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import { PlayButton } from '@/components/ui/play-button';
import { formatVoteAverage } from '@/lib/api/tmdb';
import MediaCard from '@/components/catalog/MediaCard';
import { addToWatchlist, removeFromWatchlist, isInWatchlist, addToHistory } from '@/lib/storage';
import { getTVEmbedUrl } from '@/lib/videoSources';
import WatchTogetherModal from '@/components/WatchTogetherModal';
import Breadcrumb from '@/components/Breadcrumb';

export default function TVDetailPage() {
    const params = useParams();
    const router = useRouter();
    const tvId = params?.id as string;
    const { data: session, status } = useSession();

    const [tv, setTv] = useState<MediaDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [inWatchlist, setInWatchlist] = useState(false);
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [selectedEpisode, setSelectedEpisode] = useState(1);
    const [showWatchTogether, setShowWatchTogether] = useState(false);

    useEffect(() => {
        if (tvId) {
            loadTVDetails();
        }
    }, [tvId]);

    useEffect(() => {
        if (tv) {
            setInWatchlist(isInWatchlist(tv.id, 'tv'));
            addToHistory(tv, 'tv');
        }
    }, [tv]);

    const toggleWatchlist = () => {
        if (!tv) return;

        if (inWatchlist) {
            removeFromWatchlist(tv.id, 'tv');
            setInWatchlist(false);
        } else {
            addToWatchlist(tv, 'tv');
            setInWatchlist(true);
        }
    };

    async function loadTVDetails() {
        try {
            setLoading(true);
            const data = await getTVDetails(Number(tvId));
            setTv(data);
        } catch (err) {
            console.error('Error loading TV show:', err);
            setError('Failed to load TV show details');
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

    if (error || !tv) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">TV Show Not Found</h1>
                    <Button onClick={() => router.push('/')} variant="default">
                        Go Home
                    </Button>
                </div>
            </div>
        );
    }

    const trailer = tv.videos?.results?.find(
        (video: any) => video.type === 'Trailer' && video.site === 'YouTube'
    );

    return (
        <div className="min-h-screen bg-gray-950">
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

            <div className="relative h-[60vh] md:h-[70vh]">
                <div className="absolute inset-0">
                    <Image
                        src={getImageUrl(tv.backdrop_path || tv.poster_path, 'original')}
                        alt={(tv as any).name || 'TV Show'}
                        fill
                        priority
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/40 to-transparent" />
                </div>

                <div className="relative h-full flex items-end">
                    <div className="container mx-auto px-4 pb-12">
                        <div className="flex flex-col md:flex-row gap-8 items-end">
                            <div className="hidden md:block w-48 lg:w-64 flex-shrink-0">
                                <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-2xl">
                                    <Image
                                        src={getImageUrl(tv.poster_path, 'w500')}
                                        alt={(tv as any).name || 'TV Show'}
                                        fill
                                        className="object-cover object-center"
                                        priority
                                        quality={85}
                                    />
                                </div>
                            </div>

                            <div className="flex-1">
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                                    {(tv as any).name}
                                </h1>

                                <div className="flex flex-wrap items-center gap-4 mb-6">
                                    {tv.vote_average > 0 && (
                                        <div className="flex items-center gap-1 bg-yellow-500/20 px-3 py-1 rounded-full">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            <span className="text-yellow-400 font-semibold">
                                                {formatVoteAverage(tv.vote_average)}
                                            </span>
                                        </div>
                                    )}

                                    {(tv as any).first_air_date && (
                                        <div className="flex items-center gap-2 text-gray-300">
                                            <Calendar className="w-4 h-4" />
                                            <span>{new Date((tv as any).first_air_date).getFullYear()}</span>
                                        </div>
                                    )}

                                    {(tv as any).number_of_seasons && (
                                        <div className="flex items-center gap-2 text-gray-300">
                                            <TvIcon className="w-4 h-4" />
                                            <span>{(tv as any).number_of_seasons} Season{(tv as any).number_of_seasons > 1 ? 's' : ''}</span>
                                        </div>
                                    )}
                                </div>

                                {tv.genres && tv.genres.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {tv.genres.map((genre: any) => (
                                            <span
                                                key={genre.id}
                                                className="px-3 py-1 bg-gray-800/80 backdrop-blur-sm text-gray-300 rounded-full text-sm"
                                            >
                                                {genre.name}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <p className="text-gray-300 text-lg mb-8 max-w-3xl leading-relaxed">
                                    {tv.overview}
                                </p>

                                {/* Season and Episode Selectors */}
                                <div className="flex flex-wrap gap-4 mb-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm text-gray-400">Season</label>
                                        <select
                                            value={selectedSeason}
                                            onChange={(e) => setSelectedSeason(Number(e.target.value))}
                                            className="px-4 py-2 bg-gray-800/80 backdrop-blur-sm text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {Array.from({ length: (tv as any).number_of_seasons || 1 }, (_, i) => i + 1).map((season) => (
                                                <option key={season} value={season}>
                                                    Season {season}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm text-gray-400">Episode</label>
                                        <select
                                            value={selectedEpisode}
                                            onChange={(e) => setSelectedEpisode(Number(e.target.value))}
                                            className="px-4 py-2 bg-gray-800/80 backdrop-blur-sm text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {Array.from({ length: 20 }, (_, i) => i + 1).map((episode) => (
                                                <option key={episode} value={episode}>
                                                    Episode {episode}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4">
                                    <PlayButton
                                        onClick={() => router.push(`/tv/${tvId}/watch?season=${selectedSeason}&episode=${selectedEpisode}`)}
                                    >
                                        Watch Now
                                    </PlayButton>

                                    <Button
                                        onClick={() => {
                                            if (status === 'unauthenticated') {
                                                router.push('/login');
                                            } else {
                                                setShowWatchTogether(true);
                                            }
                                        }}
                                        variant="secondary"
                                        size="lg"
                                        className="gap-2"
                                    >
                                        <Users className="w-5 h-5" />
                                        Watch Together
                                    </Button>

                                    {trailer && (
                                        <Button
                                            onClick={() => window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank')}
                                            variant="outline"
                                            size="lg"
                                            className="gap-2"
                                        >
                                            <Play className="w-5 h-5" />
                                            Watch Trailer
                                        </Button>
                                    )}

                                    <Button
                                        onClick={toggleWatchlist}
                                        variant="outline"
                                        size="lg"
                                        className="gap-2"
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
                                        className="gap-2"
                                        onClick={() => {
                                            if (navigator.share) {
                                                navigator.share({
                                                    title: (tv as any).name,
                                                    text: tv.overview,
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

            <div className="container mx-auto px-4 py-12 space-y-12">
                {/* Breadcrumbs */}
                <Breadcrumb
                    items={[
                        { name: 'TV Shows', url: '/tv' },
                        { name: (tv as any).name, url: `/tv/${tvId}` },
                    ]}
                />

                {tv.credits?.cast && tv.credits.cast.length > 0 && (
                    <section>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Top Cast</h2>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                            {tv.credits.cast.slice(0, 16).map((person: any) => (
                                <div key={person.id} className="group cursor-pointer">
                                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2 bg-gray-800 group-hover:ring-2 group-hover:ring-blue-500 transition-all">
                                        {person.profile_path ? (
                                            <Image
                                                src={getImageUrl(person.profile_path, 'w185')}
                                                alt={person.name}
                                                fill
                                                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, (max-width: 1280px) 16vw, 12vw"
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

                {tv.similar?.results && tv.similar.results.length > 0 && (
                    <section>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Similar Shows</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {tv.similar.results.slice(0, 10).map((item: any) => (
                                <MediaCard key={item.id} item={item} type="tv" />
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Watch Together Modal */}
            {showWatchTogether && tv && (
                <WatchTogetherModal
                    isOpen={showWatchTogether}
                    onClose={() => setShowWatchTogether(false)}
                    movieTitle={`${(tv as any).name} - S${selectedSeason}E${selectedEpisode}`}
                    movieId={Number(tvId)}
                    embedUrl={getTVEmbedUrl(Number(tvId), selectedSeason, selectedEpisode)}
                    type="tv"
                />
            )}
        </div>
    );
}
