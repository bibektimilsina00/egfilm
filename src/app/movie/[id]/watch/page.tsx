'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMovieDetails } from '@/lib/hooks/useTMDb';
import { useState } from 'react';
import { ArrowLeft, ChevronDown, Loader2 } from 'lucide-react';
import { VIDEO_SOURCES } from '@/lib/videoSources';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Dedicated movie watch page with embedded player
 */
export default function WatchMoviePage() {
  const params = useParams();
  const router = useRouter();
  const movieId = Number(params?.id as string);

  const { data: movie, isLoading } = useMovieDetails(movieId);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [showSourceMenu, setShowSourceMenu] = useState(false);
  const [isPlayerLoading, setIsPlayerLoading] = useState(true);

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
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex-1">
            <h2 className="text-white text-xl font-semibold truncate">
              {movie.title}
            </h2>
            {movie.release_date && (
              <p className="text-gray-400 text-sm">
                {new Date(movie.release_date).getFullYear()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Source Selector */}
          <div className="relative">
            <button
              onClick={() => setShowSourceMenu(!showSourceMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <span className="text-sm">
                {currentSource.name}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showSourceMenu && (
              <div className="absolute top-full right-0 mt-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 min-w-[200px] z-50">
                <div className="p-2">
                  <div className="text-xs text-gray-400 px-3 py-2">
                    Select Server
                  </div>
                  {VIDEO_SOURCES.map((source, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setIsPlayerLoading(true);
                        setCurrentSourceIndex(index);
                        setShowSourceMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-gray-700 transition-colors ${currentSourceIndex === index
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{source.name}</span>
                        <span className="text-xs bg-green-600 px-2 py-0.5 rounded">
                          {source.quality}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="flex-1 bg-black relative">
        {isPlayerLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-white text-lg">Loading player...</p>
              <p className="text-gray-400 text-sm mt-2">If player doesn't load, try switching servers</p>
            </div>
          </div>
        )}
        <iframe
          key={embedUrl} // Force re-render when source changes
          src={embedUrl}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          title={movie.title}
          referrerPolicy="origin"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
          onLoad={() => setIsPlayerLoading(false)}
          onError={() => setIsPlayerLoading(false)}
        />
      </div>
    </div>
  );
}