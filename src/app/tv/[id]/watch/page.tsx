'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTVDetails } from '@/lib/hooks/useTMDb';
import { useState, useEffect, useRef } from 'react';
import { useClickOutside } from '@/lib/hooks/useClickOutside';
import { ArrowLeft, ChevronDown, Play, Star, Calendar, Info } from 'lucide-react';
import { VIDEO_SOURCES } from '@/lib/videoSources';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MediaCard } from '@/components/media-card';

export default function WatchTVPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tvId = Number(params?.id as string);

  const initialSeason = Number(searchParams?.get('season')) || 1;
  const initialEpisode = Number(searchParams?.get('episode')) || 1;

  const { data: tv, isLoading } = useTVDetails(tvId);

  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  const [selectedEpisode, setSelectedEpisode] = useState(initialEpisode);
  const [showInfo, setShowInfo] = useState(true);

  const [showSeasonMenu, setShowSeasonMenu] = useState(false);
  const [showEpisodeMenu, setShowEpisodeMenu] = useState(false);
  const [showSourceMenu, setShowSourceMenu] = useState(false);

  const handleDropdownClose = () => {
    setShowSeasonMenu(false)
    setShowEpisodeMenu(false)
    setShowSeasonMenu(false)
  }
  const seasonDropdownRef = useRef<HTMLDivElement>(null);
  const episodeDropdownRef = useRef<HTMLDivElement>(null);
  const sourceDropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(seasonDropdownRef, () => {
    setShowSeasonMenu(false);
  });
  useClickOutside(episodeDropdownRef, () => {
    setShowEpisodeMenu(false);
  });
  useClickOutside(sourceDropdownRef, () => {
    setShowSourceMenu(false);
  });

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
  const currentSeasonData = tv.seasons?.find(s => s.season_number === selectedSeason);
  const episodeCount = currentSeasonData?.episode_count || 20;

  return (
    <div className="min-h-screen bg-black">
      {/* Floating Controls */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
          }`}
        onMouseEnter={() => setIsHeaderVisible(true)}
      >
        <div className="bg-gradient-to-b from-black/95 via-black/80 to-black/30 backdrop-blur-md ">
          <div className="px-4 py-3 flex items-center justify-between max-w-7xl mx-auto gap-4">
            {/* Back Button & Title */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <button
                onClick={() => router.back()}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group border border-transparent hover:border-white/20"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium hidden sm:inline">Back</span>
              </button>

              <div className="flex-1 min-w-0">
                <h1 className="text-white text-lg sm:text-xl font-extrabold truncate">{tv.name}</h1>
                <p className="text-gray-400 text-xs sm:text-sm font-medium">S{selectedSeason} E{selectedEpisode}</p>
              </div>
            </div>

            {/* Dropdowns */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Season Dropdown */}
              <div className="relative" ref={seasonDropdownRef}>
                <button
                  onClick={() => { setShowSeasonMenu(!showSeasonMenu); setShowEpisodeMenu(false); setShowSourceMenu(false); }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl border border-white/20 transition-colors duration-200 min-w-[140px] justify-between shadow-lg shadow-black/30"
                >
                  <span className="font-semibold">Season {selectedSeason}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSeasonMenu ? 'rotate-180' : ''}`} />
                </button>
                {showSeasonMenu && (
                  <div className="absolute top-full right-0 mt-3 bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-700/50 min-w-[180px] max-h-[300px] overflow-y-auto z-50 p-1">
                    {tv.seasons?.filter(s => s.season_number > 0).map(season => (
                      <button
                        key={season.id}
                        onClick={() => { setSelectedSeason(season.season_number); setSelectedEpisode(1); setShowSeasonMenu(false); }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between text-base font-medium ${selectedSeason === season.season_number ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          }`}
                      >
                        <span>Season {season.season_number}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Episode Dropdown */}
              <div className="relative" ref={episodeDropdownRef}>
                <button
                  onClick={() => { setShowEpisodeMenu(!showEpisodeMenu); setShowSeasonMenu(false); setShowSourceMenu(false); }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl border border-white/20 transition-colors duration-200 min-w-[140px] justify-between shadow-lg shadow-black/30"
                >
                  <span className="font-semibold">Episode {selectedEpisode}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showEpisodeMenu ? 'rotate-180' : ''}`} />
                </button>
                {showEpisodeMenu && (
                  <div className="absolute top-full right-0 mt-3 bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-700/50 min-w-[180px] max-h-[300px] overflow-y-auto z-50 p-1">
                    {Array.from({ length: episodeCount }, (_, i) => i + 1).map(ep => (
                      <button
                        key={ep}
                        onClick={() => { setSelectedEpisode(ep); setShowEpisodeMenu(false); }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between text-base font-medium ${selectedEpisode === ep ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          }`}
                      >
                        <span>Episode {ep}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>


              {/* Source Dropdown */}
              <div className="relative hidden sm:block" ref={sourceDropdownRef}>
                <button
                  onClick={() => { setShowSourceMenu(!showSourceMenu); setShowSeasonMenu(false); setShowEpisodeMenu(false); }}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl border border-blue-500 shadow-lg shadow-blue-600/30 transition-colors duration-200"
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
                        onClick={() => { setCurrentSourceIndex(index); setShowSourceMenu(false); }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${currentSourceIndex === index ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{source.name}</span>
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{source.quality}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div
        className="relative bg-black"
        onMouseMove={() => setIsHeaderVisible(true)}
        onMouseLeave={() => setIsHeaderVisible(false)}
        onClick={handleDropdownClose}
      >
        {(showSeasonMenu || showEpisodeMenu || showSourceMenu) && (
          <div
            className="absolute inset-0 z-40"
            onClick={handleDropdownClose}
          />
        )}

        <div className="w-full aspect-video max-h-screen">
          <iframe
            key={embedUrl}
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            scrolling='no'
            title={`${tv.name} - S${selectedSeason}E${selectedEpisode}`}
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="bg-black" onScroll={() => setIsHeaderVisible(true)}>
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          {/* About Section */}
          <section className="space-y-4">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="flex items-center gap-3 text-white hover:text-blue-400 transition-colors group"
            >
              <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                <Info className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold">About {tv.name}</h2>
              <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${showInfo ? 'rotate-180' : ''}`} />
            </button>

            {showInfo && (
              <div className="bg-gradient-to-br from-gray-900/50 to-gray-900/30 rounded-xl p-6 border border-gray-800/50 backdrop-blur-sm space-y-6">
                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-6">
                  {tv.vote_average && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-yellow-500/10 rounded-lg">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        </div>
                        <div>
                          <span className="text-2xl font-bold text-white">{tv.vote_average.toFixed(1)}</span>
                          <span className="text-gray-500 text-sm ml-1">/10</span>
                        </div>
                      </div>
                      <div className="h-8 w-px bg-gray-800"></div>
                    </>
                  )}

                  {tv.first_air_date && (
                    <>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">{new Date(tv.first_air_date).getFullYear()}</span>
                      </div>
                      <div className="h-8 w-px bg-gray-800"></div>
                    </>
                  )}

                  {tv.number_of_seasons && (
                    <div className="text-gray-400">
                      <span className="font-medium">{tv.number_of_seasons} Season{tv.number_of_seasons > 1 ? 's' : ''}</span>
                    </div>
                  )}

                  {tv.number_of_episodes && (
                    <>
                      <div className="h-8 w-px bg-gray-800"></div>
                      <div className="text-gray-400">
                        <span className="font-medium">{tv.number_of_episodes} Episodes</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Genres */}
                {tv.genres && tv.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tv.genres.map((genre) => (
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
                {tv.overview && (
                  <div>
                    <h3 className="text-white font-semibold mb-3 text-lg">Synopsis</h3>
                    <p className="text-gray-400 leading-relaxed">{tv.overview}</p>
                  </div>
                )}

                {/* Current Episode Info */}
                {currentSeasonData && (
                  <div className="pt-4 border-t border-gray-800">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                      <Play className="w-4 h-4" />
                      <span className="font-semibold text-sm">Currently Watching</span>
                    </div>
                    <p className="text-gray-300">
                      Season {selectedSeason}, Episode {selectedEpisode}
                    </p>
                    {currentSeasonData.name && (
                      <p className="text-gray-500 text-sm mt-1">{currentSeasonData.name}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Similar Shows */}
          {tv.similar?.results && tv.similar.results.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl md:text-3xl font-bold text-white">Similar Shows</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-gray-800 to-transparent"></div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {tv.similar.results.slice(0, 10).map((item) => (
                  <MediaCard key={item.id} media={item} mediaType="tv" />
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
