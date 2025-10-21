'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTVDetails } from '@/lib/hooks/useTMDb';
import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { VIDEO_SOURCES } from '@/lib/videoSources';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Dedicated TV show watch page with embedded player and episode selection
 */
export default function WatchTVPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tvId = Number(params?.id as string);

  // Get season and episode from URL params or default to 1
  const initialSeason = Number(searchParams?.get('season')) || 1;
  const initialEpisode = Number(searchParams?.get('episode')) || 1;

  const { data: tv, isLoading } = useTVDetails(tvId);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [showSourceMenu, setShowSourceMenu] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  const [selectedEpisode, setSelectedEpisode] = useState(initialEpisode);

  // Update URL when season/episode changes
  useEffect(() => {
    const newUrl = `/tv/${tvId}/watch?season=${selectedSeason}&episode=${selectedEpisode}`;
    router.replace(newUrl, { scroll: false });
  }, [selectedSeason, selectedEpisode, tvId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Skeleton className="w-full h-full bg-gray-900" />
      </div>
    );
  }

  if (!tv) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-2xl mb-4">TV Show not found</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const currentSource = VIDEO_SOURCES[currentSourceIndex];
  const embedUrl = currentSource.embed(tvId, 'tv', selectedSeason, selectedEpisode);

  // Get current season data
  const currentSeasonData = tv.seasons?.find(s => s.season_number === selectedSeason);
  const episodeCount = currentSeasonData?.episode_count || 20; // Default to 20 if not found

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-white hover:bg-gray-800 flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex-1 min-w-0">
            <h2 className="text-white text-lg md:text-xl font-semibold truncate">
              {tv.name}
            </h2>
            <p className="text-gray-400 text-sm">
              Season {selectedSeason}, Episode {selectedEpisode}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Season Selector */}
          <Select
            value={selectedSeason.toString()}
            onValueChange={(value) => {
              setSelectedSeason(Number(value));
              setSelectedEpisode(1); // Reset to episode 1 when changing season
            }}
          >
            <SelectTrigger className="w-[120px] bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Season" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {tv.seasons
                ?.filter(season => season.season_number > 0) // Exclude specials (season 0)
                .map((season) => (
                  <SelectItem
                    key={season.id}
                    value={season.season_number.toString()}
                    className="text-white hover:bg-gray-700"
                  >
                    Season {season.season_number}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {/* Episode Selector */}
          <Select
            value={selectedEpisode.toString()}
            onValueChange={(value) => setSelectedEpisode(Number(value))}
          >
            <SelectTrigger className="w-[120px] bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Episode" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 max-h-[300px]">
              {Array.from({ length: episodeCount }, (_, i) => i + 1).map((ep) => (
                <SelectItem
                  key={ep}
                  value={ep.toString()}
                  className="text-white hover:bg-gray-700"
                >
                  Episode {ep}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Source Selector */}
          <div className="relative hidden sm:block">
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
        <iframe
          key={embedUrl} // Force re-render when source/episode changes
          src={embedUrl}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          title={`${tv.name} - S${selectedSeason}E${selectedEpisode}`}
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}