'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMovieDetails } from '@/lib/hooks/useTMDb';
import { useState, useRef } from 'react';
import { useClickOutside } from '@/lib/hooks/useClickOutside';
import { ArrowLeft, ChevronDown, Star, Calendar, Clock, Info, Play } from 'lucide-react';
import { VIDEO_SOURCES } from '@/lib/videoSources';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import MediaCard from '@/components/catalog/MediaCard';

export default function WatchMoviePage() {
  const params = useParams();
  const router = useRouter();
  const movieId = Number(params?.id as string);

  const { data: movie, isLoading } = useMovieDetails(movieId);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [showSourceMenu, setShowSourceMenu] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const sourceDropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(sourceDropdownRef, () => setShowSourceMenu(false));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Skeleton className="w-full h-full bg-gray-900" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-2xl mb-4">Movie not found</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const currentSource = VIDEO_SOURCES[currentSourceIndex];
  const embedUrl = currentSource.embed(movieId, 'movie');

  return (
    <div className="min-h-screen bg-black">
      {/* Floating Controls */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
          }`}
        onMouseEnter={() => setIsHeaderVisible(true)}
      >
        <div className="bg-gradient-to-b from-black/95 via-black/80 to-black/30 backdrop-blur-md">
          <div className="px-4 py-3 flex items-center justify-between max-w-7xl mx-auto gap-4">
            {/* Back Button */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <button
                onClick={() => router.back()}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group border border-transparent hover:border-white/20"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium hidden sm:inline">Back</span>
              </button>

              <div className="flex-1 min-w-0">
                <h1 className="text-white text-lg sm:text-xl font-extrabold truncate">{movie.title}</h1>
                <p className="text-gray-400 text-xs sm:text-sm font-medium">{movie.release_date?.slice(0, 4)}</p>
              </div>
            </div>

            {/* Source Dropdown */}
            <div className="relative flex-shrink-0" ref={sourceDropdownRef}>
              <button
                onClick={() => setShowSourceMenu(!showSourceMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl border border-blue-500 shadow-lg shadow-blue-600/30 transition-colors duration-200"
              >
                <Play className="w-3 h-3" />
                <span className="font-semibold">{currentSource.name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showSourceMenu ? 'rotate-180' : ''}`} />
              </button>

              {showSourceMenu && (
                <div className="absolute top-full right-0 mt-3 bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-700/50 min-w-[200px] z-50 overflow-hidden p-1">
                  {VIDEO_SOURCES.map((source, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentSourceIndex(index);
                        setShowSourceMenu(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between text-base font-medium ${currentSourceIndex === index
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                    >
                      <span className="font-medium">{source.name}</span>
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        {source.quality}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div
        className="relative bg-black"
        onMouseMove={() => setIsHeaderVisible(true)}
        onMouseLeave={() => setIsHeaderVisible(false)}
      >
        {(showSourceMenu) && (
          <div
            className="absolute inset-0 z-40"
            onClick={() => setShowSourceMenu(false)}
          />
        )}
        <div className="w-full aspect-video max-h-screen">
          <iframe
            key={embedUrl}
            src={embedUrl}
            className="w-full h-full"
            frameBorder="0"
            scrolling="no"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            title={movie.title}
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="bg-black" onScroll={() => setIsHeaderVisible(true)}>
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          {/* Info Section */}
          <section className="space-y-4">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="flex items-center gap-3 text-white hover:text-blue-400 transition-colors group"
            >
              <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                <Info className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold">About {movie.title}</h2>
              <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${showInfo ? 'rotate-180' : ''}`} />
            </button>

            {showInfo && (
              <div className="bg-gradient-to-br from-gray-900/50 to-gray-900/30 rounded-xl p-6 border border-gray-800/50 backdrop-blur-sm space-y-6">
                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-6">
                  {movie.vote_average && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-yellow-500/10 rounded-lg">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        </div>
                        <div>
                          <span className="text-2xl font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                          <span className="text-gray-500 text-sm ml-1">/10</span>
                        </div>
                      </div>
                      <div className="h-8 w-px bg-gray-800"></div>
                    </>
                  )}

                  {movie.release_date && (
                    <>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">{new Date(movie.release_date).getFullYear()}</span>
                      </div>
                      <div className="h-8 w-px bg-gray-800"></div>
                    </>
                  )}

                  {movie.runtime && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{movie.runtime} min</span>
                    </div>
                  )}
                </div>

                {/* Genres */}
                {movie.genres && movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {movie.genres.map((genre) => (
                      <span
                        key={genre.id}
                        className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-full text-sm font-medium transition-colors cursor-default border border-white/10"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Overview */}
                {movie.overview && (
                  <div>
                    <h3 className="text-white font-semibold mb-3 text-lg">Synopsis</h3>
                    <p className="text-gray-400 leading-relaxed">{movie.overview}</p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Similar Movies */}
          {movie.similar?.results && movie.similar.results.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl md:text-3xl font-bold text-white">You May Also Like</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-gray-800 to-transparent"></div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {movie.similar.results.slice(0, 10).map((item) => (
                  <MediaCard key={item.id} item={item} type="movie" />
                ))}
              </div>
            </section>
          )}

          <div className="h-12" />
        </div>
      </div>
    </div>
  );
}
