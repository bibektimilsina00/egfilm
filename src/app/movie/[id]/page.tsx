'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Play, ArrowLeft, Star, Calendar, Clock, Heart, Share2, Users, Check } from 'lucide-react';

import { useMovieDetails } from '@/lib/hooks/useTMDb';
import { getImageUrl, formatVoteAverage, formatRuntime } from '@/lib/api/tmdb';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import MediaCard from '@/components/catalog/MediaCard';
import { addToWatchlist, removeFromWatchlist, isInWatchlist, addToHistory } from '@/lib/storage';
import { getMovieEmbedUrl } from '@/lib/videoSources';
import WatchTogetherModal from '@/components/WatchTogetherModal';
import { ErrorState } from '@/components/ui/error-states';

/**
 * Loading skeleton for movie details page
 */
function MovieDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Section Skeleton */}
      <div className="relative h-[60vh] md:h-[70vh]">
        <div className="absolute inset-0">
          <Skeleton className="w-full h-full bg-gray-800" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/40 to-transparent" />
        </div>

        <div className="relative h-full flex items-end">
          <div className="container mx-auto px-4 pb-12">
            <div className="flex flex-col md:flex-row gap-8 items-end">
              {/* Poster Skeleton */}
              <div className="hidden md:block w-48 lg:w-64 flex-shrink-0">
                <Skeleton className="aspect-[2/3] rounded-lg bg-gray-700" />
              </div>

              {/* Info Skeleton */}
              <div className="flex-1 space-y-4">
                <Skeleton className="h-12 md:h-16 w-3/4 bg-gray-700" />
                <div className="flex gap-4">
                  <Skeleton className="h-8 w-20 bg-gray-700" />
                  <Skeleton className="h-8 w-16 bg-gray-700" />
                  <Skeleton className="h-8 w-20 bg-gray-700" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 bg-gray-700" />
                  <Skeleton className="h-6 w-20 bg-gray-700" />
                  <Skeleton className="h-6 w-14 bg-gray-700" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full bg-gray-700" />
                  <Skeleton className="h-4 w-4/5 bg-gray-700" />
                  <Skeleton className="h-4 w-3/5 bg-gray-700" />
                </div>
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-32 bg-gray-700" />
                  <Skeleton className="h-12 w-40 bg-gray-700" />
                  <Skeleton className="h-12 w-28 bg-gray-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-12 space-y-12">
        <div>
          <Skeleton className="h-8 w-32 mb-6 bg-gray-800" />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[2/3] rounded-lg bg-gray-800" />
                <Skeleton className="h-3 w-full bg-gray-800" />
                <Skeleton className="h-3 w-4/5 bg-gray-800" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Cast member card component
 */
function CastCard({ person }: { person: any }) {
  return (
    <Card className="group cursor-pointer bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
      <CardContent className="p-0">
        <div className="relative aspect-[2/3] rounded-t-lg overflow-hidden bg-gray-800">
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
        <div className="p-3">
          <p className="text-white font-medium text-xs truncate" title={person.name}>
            {person.name}
          </p>
          <p className="text-gray-400 text-xs truncate" title={person.character}>
            {person.character}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Movie details page component
 */
export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const movieId = Number(params?.id as string);
  const { data: session, status } = useSession();

  // React Query hook for movie details
  const {
    data: movie,
    isLoading,
    error,
    refetch
  } = useMovieDetails(movieId);

  // Local state
  const [inWatchlist, setInWatchlist] = useState(false);
  const [showWatchTogether, setShowWatchTogether] = useState(false);

  // Update watchlist status and add to history
  useEffect(() => {
    if (movie) {
      setInWatchlist(isInWatchlist(movie.id, 'movie'));
      addToHistory(movie, 'movie');
    }
  }, [movie]);

  // Watchlist toggle handler
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

  // Loading state
  if (isLoading) {
    return <MovieDetailsSkeleton />;
  }

  // Error state
  if (error || !movie) {
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

        <div className="flex items-center justify-center min-h-screen">
          <ErrorState
            title="Movie Not Found"
            message="We couldn't load this movie. Please try again or go back to browse other content."
            onRetry={() => refetch()}
          />
        </div>
      </div>
    );
  }

  const trailer = movie.videos?.results?.find(
    (video) => video.type === 'Trailer' && video.site === 'YouTube'
  );

  return (
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
                <Card className="overflow-hidden shadow-2xl border-0">
                  <div className="relative aspect-[2/3]">
                    <Image
                      src={getImageUrl(movie.poster_path, 'w500')}
                      alt={movie.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </Card>
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                  {movie.title}
                </h1>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  {movie.vote_average > 0 && (
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      <Star className="w-4 h-4 mr-1 fill-yellow-400" />
                      {formatVoteAverage(movie.vote_average)}
                    </Badge>
                  )}

                  {movie.release_date && (
                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(movie.release_date).getFullYear()}
                    </Badge>
                  )}

                  {movie.runtime && (
                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatRuntime(movie.runtime)}
                    </Badge>
                  )}
                </div>

                {/* Genres */}
                {movie.genres && movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {movie.genres.map((genre) => (
                      <Badge
                        key={genre.id}
                        variant="secondary"
                        className="bg-gray-800/80 text-gray-300 border-gray-700"
                      >
                        {genre.name}
                      </Badge>
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
                    onClick={() => router.push(`/movie/${movieId}/watch`)}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    Play Now
                  </Button>

                  <Button
                    onClick={() => {
                      if (status === 'unauthenticated') {
                        router.push('/login');
                      } else {
                        setShowWatchTogether(true);
                      }
                    }}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    size="lg"
                  >
                    <Users className="w-5 h-5" />
                    Watch Together
                  </Button>

                  {trailer && (
                    <Button
                      size="lg"
                      onClick={() => window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank')}
                      variant="secondary"

                    >
                      <Play className="w-5 h-5 fill-black" />
                      Watch Trailer
                    </Button>
                  )}

                  <Button
                    onClick={toggleWatchlist}
                    size="lg"
                    className={`gap-2 ${inWatchlist
                      ? 'text-pink-500 border-pink-500 hover:bg-pink-500/10'
                      : 'text-white border-white hover:bg-white/10'
                      }`}
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
                    variant="destructive"
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
      <div className="container mx-auto py-8 space-y-16">
        {/* Cast Section */}
        <section>
          <h2 className="text-3xl font-bold text-white mb-8">Cast</h2>
          {movie.credits?.cast && movie.credits.cast.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {movie.credits.cast.slice(0, 16).map((person) => (
                <CastCard key={person.id} person={person} />
              ))}
            </div>
          ) : (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-8 text-center">
                <p className="text-gray-400">No cast information available</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Similar Movies Section */}
        <section>
          <h2 className="text-3xl font-bold text-white mb-8">Similar Movies</h2>
          {movie.similar?.results && movie.similar.results.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {movie.similar.results.slice(0, 12).map((item: any) => (
                <MediaCard key={item.id} item={item} type="movie" />
              ))}
            </div>
          ) : (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-8 text-center">
                <p className="text-gray-400">No similar movies found</p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      {/* Watch Together Modal */}
      {showWatchTogether && movie && (
        <WatchTogetherModal
          isOpen={showWatchTogether}
          onClose={() => setShowWatchTogether(false)}
          movieTitle={movie.title}
          movieId={movieId}
          embedUrl={getMovieEmbedUrl(movieId)}
          type="movie"
        />
      )}
    </div>
  );
}