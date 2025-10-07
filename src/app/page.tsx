'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
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

interface TorrentStats {
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  peers: number;
}

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

  // Torrent streamer state
  const [magnetLink, setMagnetLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [stats, setStats] = useState<TorrentStats | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [webTorrentReady, setWebTorrentReady] = useState(false);
  const clientRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Acceptable video extensions for streaming detection
  const videoExtensions = [
    '.mp4',
    '.mkv',
    '.avi',
    '.mov',
    '.wmv',
    '.flv',
    '.webm',
    '.m4v',
    '.mpg',
    '.mpeg',
    '.m2ts',
    '.ts',
  ];

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
        // eslint-disable-next-line no-console
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

  // Simple magnet validation
  const isValidMagnet = (link: string) => link.trim().startsWith('magnet:?');

  // Start streaming using global WebTorrent (loaded from CDN)
  const startStreaming = async () => {
    setError('');
    setStats(null);
    setVideoSrc(null);

    if (!isValidMagnet(magnetLink)) {
      setError('Please enter a valid magnet link.');
      return;
    }
    if (!webTorrentReady) {
      setError('WebTorrent not loaded yet. Please wait a moment.');
      return;
    }

    setIsLoading(true);
    setStatus('Initializing WebTorrent client...');
    try {
      const WebTorrent = (window as any).WebTorrent;
      if (!WebTorrent) throw new Error('WebTorrent not available on window');

      // cleanup previous client if any
      if (clientRef.current) {
        try {
          clientRef.current.destroy();
        } catch (e) {
          // ignore
        }
        clientRef.current = null;
      }

      const client = new WebTorrent();
      clientRef.current = client;

      // Set a connection timeout to catch dead torrents
      const timeout = setTimeout(() => {
        if (isLoading) {
          setError('Connection timeout. The torrent may have too few seeders or be invalid.');
          setIsLoading(false);
          setStatus('');
          try {
            client.destroy();
          } catch (e) {
            // ignore
          }
        }
      }, 60_000); // 60 seconds

      client.on('error', (err: any) => {
        // eslint-disable-next-line no-console
        console.error('Client error:', err);
        setError('Client error: ' + (err?.message || String(err)));
        setIsLoading(false);
        setStatus('');
        clearTimeout(timeout);
      });

      const torrent = client.add(magnetLink, { destroyStoreOnDestroy: true });

      torrent.on('infoHash', () => {
        setStatus('Info hash received, fetching metadata...');
      });

      torrent.on('wire', () => {
        setStatus(`Connected to ${torrent.numPeers} peer(s), fetching metadata...`);
      });

      torrent.on('metadata', () => {
        setStatus('Metadata received, preparing video...');
      });

      torrent.on('ready', () => {
        setStatus('Torrent ready, loading video files...');
        clearTimeout(timeout);

        // find video files
        const videoFiles = torrent.files.filter((file: any) =>
          videoExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
        );

        if (videoFiles.length === 0) {
          setError('No playable video files found in this torrent.');
          setIsLoading(false);
          setStatus('');
          client.destroy();
          return;
        }

        const file = videoFiles[0];
        setStatus(`Loading ${file.name}...`);

        file.getBlobURL((err: any, url: string) => {
          if (err) {
            // eslint-disable-next-line no-console
            console.error('Error creating video stream:', err);
            setError('Error creating video stream: ' + (err?.message || String(err)));
            setIsLoading(false);
            setStatus('');
            client.destroy();
            return;
          }

          setVideoSrc(url);
          setIsLoading(false);
          setStatus('');

          // stats updater
          const updateStats = () => {
            setStats({
              progress: (torrent.progress || 0) * 100,
              downloadSpeed: torrent.downloadSpeed || 0,
              uploadSpeed: torrent.uploadSpeed || 0,
              peers: torrent.numPeers || 0,
            });
          };
          updateStats();
          const interval = setInterval(updateStats, 1000);
          torrent.on('done', () => {
            clearInterval(interval);
          });
        });
      });

      torrent.on('error', (err: any) => {
        // eslint-disable-next-line no-console
        console.error('Torrent error:', err);
        setError('Torrent error: ' + (err?.message || String(err)));
        setIsLoading(false);
        setStatus('');
        client.destroy();
      });

      torrent.on('warning', (err: any) => {
        // eslint-disable-next-line no-console
        console.warn('Torrent warning:', err);
      });
    } catch (err: any) {
      setError('Failed to load WebTorrent: ' + (err?.message || String(err)));
      setIsLoading(false);
      setStatus('');
    }
  };

  // cleanup torrent client on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        try {
          clientRef.current.destroy();
        } catch (e) {
          // ignore
        }
      }
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
      {/* Load WebTorrent CDN */}
      <Script
        src="https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js"
        onLoad={() => setWebTorrentReady(true)}
        onError={() => setError('Failed to load WebTorrent library from CDN')}
        strategy="afterInteractive"
      />

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

          {/* Torrent Streamer UI */}
          <section>
            <div className="mb-6 flex items-center gap-3">
              <div className="text-blue-500">
                {/* icon */}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">Torrent Video Streamer</h2>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <div className="mb-4">
                <label htmlFor="magnet" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Magnet Link
                </label>
                <input
                  id="magnet"
                  type="text"
                  value={magnetLink}
                  onChange={(e) => setMagnetLink(e.target.value)}
                  placeholder="Paste your magnet link here..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  aria-describedby="magnet-help"
                />
                <p id="magnet-help" className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Enter a valid magnet link to start streaming. Use only legal/public-domain files or files you own.
                </p>
              </div>

              <button
                onClick={startStreaming}
                disabled={isLoading || !magnetLink.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Start streaming the torrent"
              >
                {isLoading ? 'Loading...' : 'Start Streaming'}
              </button>
            </div>

            {error && (
              <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            {status && (
              <div className="bg-blue-100 dark:bg-blue-900 border border-blue-400 text-blue-700 dark:text-blue-200 px-4 py-3 rounded mb-6" role="status">
                <span className="block sm:inline">
                  <svg className="animate-spin inline-block h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {status}
                </span>
              </div>
            )}

            {stats && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Streaming Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.progress.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{(stats.downloadSpeed / 1024).toFixed(1)} KB/s</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Download</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{(stats.uploadSpeed / 1024).toFixed(1)} KB/s</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Upload</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.peers}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Peers</div>
                  </div>
                </div>
              </div>
            )}

            {videoSrc && (
              <div className="bg-black rounded-lg overflow-hidden">
                <video ref={videoRef} src={videoSrc} controls autoPlay className="w-full h-auto" />
              </div>
            )}

            <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>
                ⚠️ <strong>Legal Warning:</strong> This tool is for educational purposes only. Use with public domain content or files you own. Streaming copyrighted material is illegal.
              </p>
            </div>
          </section>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}
