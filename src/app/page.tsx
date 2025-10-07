'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Info, TrendingUp, Star, Tv, Film, Clock } from 'lucide-react';

import { getTrending, getPopular, getTopRated, MediaItem } from '@/lib/tmdb';
import { getImageUrl } from '@/lib/tmdb';
import { formatVoteAverage } from '@/lib/utils';
import MediaCard from '@/components/catalog/MediaCard';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getContinueWatching } from '@/lib/storage';

// --- Types (adapt if your project defines them elsewhere) ---
type Movie = any;
type TVShow = any;

// --- Small Section helper component ---
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

// --- Main page component ---
export default function HomePage() {
  // Content state
  const [heroMedia, setHeroMedia] = useState<MediaItem | null>(null);
  const [trendingMovies, setTrendingMovies] = useState<MediaItem[]>([]);
  const [trendingTV, setTrendingTV] = useState<MediaItem[]>([]);
  const [popularMovies, setPopularMovies] = useState<MediaItem[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<MediaItem[]>([]);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch content (trending/popular/top rated)
  useEffect(() => {
    let cancelled = false;
    const loadContent = async () => {
      setLoading(true);
      try {
        // Load continue watching from localStorage
        const continueData = getContinueWatching();
        setContinueWatching(continueData);

        // Fetch several endpoints in parallel
        const [trendingAll, trendingMoviesResp, trendingTVResp, popularMoviesResp, topRatedResp] = await Promise.all([
          getTrending('all', 'day'),
          getTrending('movie', 'week'),
          getTrending('tv', 'week'),
          getPopular('movie', 1),
          getTopRated('movie', 1),
        ]);

        if (cancelled) return;

        // getTrending returns array directly, getPopular/getTopRated return objects with results
        if (trendingAll && trendingAll.length > 0) {
          setHeroMedia(trendingAll[0]);
        }

        setTrendingMovies(trendingMoviesResp || []);
        setTrendingTV(trendingTVResp || []);
        setPopularMovies((popularMoviesResp && popularMoviesResp.results) || []);
        setTopRatedMovies((topRatedResp && topRatedResp.results) || []);
      } catch (err) {
        // Keep console error for debugging
         
        console.error('Error loading content:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadContent();
    return () => {
      cancelled = true;
    };
  }, []);

  // Render loading state early
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-16 w-16 animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-4 text-gray-400">Loading amazing content...</p>
        </div>
      </div>
    );
  }

  // helper for hero titles
  const heroTitle = heroMedia ? ('title' in heroMedia ? heroMedia.title : heroMedia.name) : null;
  const heroType = heroMedia ? (heroMedia.media_type || ('title' in heroMedia ? 'movie' : 'tv')) : 'movie';

  return (
    <>
      <div className="min-h-screen bg-gray-950">
        {/* Navigation */}
        <Navigation />

        {/* Hero */}
        {heroMedia && (
          <section className="relative h-[70vh] md:h-[80vh] flex items-end">
            <div className="absolute inset-0">
              <Image
                src={getImageUrl(heroMedia.backdrop_path || heroMedia.poster_path, 'original')}
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
                <p className="mb-6 max-w-2xl text-lg text-gray-200 line-clamp-3">{heroMedia.overview}</p>

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

                  {heroMedia.vote_average > 0 && (
                    <div className="ml-4 inline-flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-full">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 font-semibold">{formatVoteAverage(heroMedia.vote_average)}</span>
                      <span className="text-gray-300 text-sm uppercase">{heroType === 'movie' ? 'Movie' : 'TV Show'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Content */}
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
          <Section title="Trending Movies" icon={<TrendingUp className="w-6 h-6" />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {trendingMovies.slice(0, 12).map((media) => (
                <MediaCard key={media.id} item={media as any} type="movie" />
              ))}
            </div>
          </Section>

          {/* Trending TV */}
          <Section title="Trending TV Shows" icon={<Tv className="w-6 h-6" />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {trendingTV.slice(0, 12).map((media) => (
                <MediaCard key={media.id} item={media as any} type="tv" />
              ))}
            </div>
          </Section>

          {/* Popular Movies */}
          <Section title="Popular Movies" icon={<Film className="w-6 h-6" />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {popularMovies.slice(0, 12).map((media) => (
                <MediaCard key={media.id} item={media as any} type="movie" />
              ))}
            </div>
          </Section>

          {/* Top Rated */}
          <Section title="Top Rated Movies" icon={<Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {topRatedMovies.slice(0, 12).map((media) => (
                <MediaCard key={media.id} item={media as any} type="movie" />
              ))}
            </div>
          </Section>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}
