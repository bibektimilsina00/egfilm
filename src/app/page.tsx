'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Info, TrendingUp, Star, Tv, Film, Clock } from 'lucide-react';

import {
  useTrending,
  usePopular,
  useTopRated
} from '@/lib/hooks/useTMDb';
import { getImageUrl, formatVoteAverage } from '@/lib/api/tmdb';
import MediaCard from '@/components/catalog/MediaCard';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getContinueWatching } from '@/lib/storage';
import { HomePageSkeleton, MediaGridSkeleton } from '@/components/ui/loading-skeletons';
import { ErrorState } from '@/components/ui/error-states';
import type { MediaItem } from '@/lib/api/tmdb';

/**
 * Reusable section component with icon and title
 */
function Section({
  title,
  icon,
  children
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
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

/**
 * Hero section component with trending content
 */
function HeroSection({ media }: { media: MediaItem | undefined }) {
  if (!media) return null;

  const heroTitle = 'title' in media ? media.title : media.name;
  const heroType = media.media_type || ('title' in media ? 'movie' : 'tv');

  return (
    <section className="relative h-[70vh] md:h-[80vh] flex items-end">
      <div className="absolute inset-0">
        <Image
          src={getImageUrl(media.backdrop_path || media.poster_path, 'original')}
          alt={heroTitle || 'Hero'}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-transparent to-transparent" />
      </div>

      <div className="relative container mx-auto px-4 pb-16 md:pb-24 z-10">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span className="text-blue-400 font-semibold uppercase text-sm">Trending Now</span>
          </div>

          <h1 className="mb-4 max-w-2xl text-5xl font-bold text-white md:text-6xl">{heroTitle}</h1>
          <p className="mb-6 max-w-2xl text-lg text-gray-200 line-clamp-3">{media.overview}</p>

          <div className="flex flex-wrap gap-4">
            <Link href={`/${heroType}/${media.id}`}>
              <Button size={'lg'} className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Play className="w-5 h-5 fill-white" />
                Play Now
              </Button>
            </Link>

            <Link href={`/${heroType}/${media.id}`}>
              <Button variant="secondary" size={'lg'}>
                <Info className="w-5 h-5" />
                More Info
              </Button>
            </Link>

            {media.vote_average > 0 && (
              <div className="ml-4 inline-flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-full">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-semibold">{formatVoteAverage(media.vote_average)}</span>
                <span className="text-gray-300 text-sm uppercase">{heroType === 'movie' ? 'Movie' : 'TV Show'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Media grid component with error handling and loading states
 */
function MediaGrid({
  data,
  isLoading,
  error,
  title,
  icon,
  type,
  onRetry
}: {
  data: MediaItem[] | undefined;
  isLoading: boolean;
  error: Error | null;
  title: string;
  icon: React.ReactNode;
  type: 'movie' | 'tv';
  onRetry: () => void;
}) {
  if (isLoading) {
    return <MediaGridSkeleton title={title} />;
  }

  if (error) {
    return (
      <Section title={title} icon={icon}>
        <ErrorState
          title="Failed to load content"
          message="We couldn't load this section. Please try again."
          onRetry={onRetry}
        />
      </Section>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Section title={title} icon={icon}>
        <div className="text-center py-12">
          <p className="text-gray-400">No content available</p>
        </div>
      </Section>
    );
  }

  return (
    <Section title={title} icon={icon}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {data.slice(0, 12).map((media) => (
          <MediaCard key={media.id} item={media as any} type={type} />
        ))}
      </div>
    </Section>
  );
}

/**
 * Main homepage component with React Query integration
 */
export default function HomePage() {
  // Continue watching state (local storage)
  const [continueWatching, setContinueWatching] = useState<any[]>([]);

  // React Query hooks for different content sections
  const trendingAll = useTrending('all', 'day');
  const trendingMovies = useTrending('movie', 'week');
  const trendingTV = useTrending('tv', 'week');
  const popularMovies = usePopular('movie', 1);
  const topRatedMovies = useTopRated('movie', 1);

  // Load continue watching from localStorage
  useEffect(() => {
    const continueData = getContinueWatching();
    setContinueWatching(continueData);
  }, []);

  // Show initial loading state when all critical data is loading
  const isInitialLoading = trendingAll.isLoading && trendingMovies.isLoading && trendingTV.isLoading;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navigation />
        <HomePageSkeleton />
        <Footer />
      </div>
    );
  }

  const heroMedia = trendingAll.data?.[0];

  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation />

      {/* Hero Section */}
      <HeroSection media={heroMedia} />

      {/* Content Sections */}
      <main className="container mx-auto px-4 py-12 space-y-12">
        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <Section title="Continue Watching" icon={<Clock className="w-6 h-6" />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {continueWatching.slice(0, 10).map((item) => (
                <div key={`${item.media_type}-${item.id}`} className="relative">
                  <MediaCard item={item} type={item.media_type} />
                  {/* Progress Bar */}
                  {item.progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Trending Movies */}
        <MediaGrid
          data={trendingMovies.data}
          isLoading={trendingMovies.isLoading}
          error={trendingMovies.error}
          title="Trending Movies"
          icon={<TrendingUp className="w-6 h-6" />}
          type="movie"
          onRetry={() => trendingMovies.refetch()}
        />

        {/* Trending TV Shows */}
        <MediaGrid
          data={trendingTV.data}
          isLoading={trendingTV.isLoading}
          error={trendingTV.error}
          title="Trending TV Shows"
          icon={<Tv className="w-6 h-6" />}
          type="tv"
          onRetry={() => trendingTV.refetch()}
        />

        {/* Popular Movies */}
        <MediaGrid
          data={popularMovies.data?.results}
          isLoading={popularMovies.isLoading}
          error={popularMovies.error}
          title="Popular Movies"
          icon={<Film className="w-6 h-6" />}
          type="movie"
          onRetry={() => popularMovies.refetch()}
        />

        {/* Top Rated Movies */}
        <MediaGrid
          data={topRatedMovies.data?.results}
          isLoading={topRatedMovies.isLoading}
          error={topRatedMovies.error}
          title="Top Rated Movies"
          icon={<Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />}
          type="movie"
          onRetry={() => topRatedMovies.refetch()}
        />
      </main>

      <Footer />
    </div>
  );
}