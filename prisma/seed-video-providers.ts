import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Video Providers - Ranked by quality and ad experience
 * All providers verified working as of Feb 2026
 */
const videoProviders = [
  // ⭐ TIER 1 — Minimal Ads, Best Quality
  {
    name: 'VidLink Pro',
    slug: 'vidlink-pro',
    baseUrl: 'https://vidlink.pro',
    quality: '1080p',
    isEnabled: true,
    isDefault: true,
    sortOrder: 1,
    movieTemplate: 'https://vidlink.pro/movie/{tmdbId}',
    tvTemplate: 'https://vidlink.pro/tv/{tmdbId}/{season}/{episode}',
    supportsImdb: false,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: true,
    requiresAuth: false,
    description: 'Fastest streaming with minimal ads - 250K+ titles',
    homepage: 'https://vidlink.pro',
  },
  {
    name: 'VidRock',
    slug: 'vidrock',
    baseUrl: 'https://vidrock.net',
    quality: '1080p',
    isEnabled: true,
    isDefault: false,
    sortOrder: 2,
    movieTemplate: 'https://vidrock.net/movie/{tmdbId}',
    tvTemplate: 'https://vidrock.net/tv/{tmdbId}/{season}/{episode}',
    supportsImdb: true,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'Clean player with TMDB/IMDB support',
    homepage: 'https://vidrock.net',
  },
  {
    name: 'VidSrc ICU',
    slug: 'vidsrc-icu',
    baseUrl: 'https://vidsrc.icu',
    quality: '1080p',
    isEnabled: true,
    isDefault: false,
    sortOrder: 3,
    movieTemplate: 'https://vidsrc.icu/embed/movie/{tmdbId}',
    tvTemplate: 'https://vidsrc.icu/embed/tv/{tmdbId}/{season}/{episode}',
    supportsImdb: true,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'Movies, TV shows, anime and manga support',
    homepage: 'https://vidsrc.icu',
  },

  // 🎬 TIER 2 — Good Quality, Some Ads
  {
    name: 'VidSrc.cc',
    slug: 'vidsrc-cc',
    baseUrl: 'https://vidsrc.cc',
    quality: '1080p',
    isEnabled: true,
    isDefault: false,
    sortOrder: 4,
    movieTemplate: 'https://vidsrc.cc/v2/embed/movie/{tmdbId}',
    tvTemplate: 'https://vidsrc.cc/v2/embed/tv/{tmdbId}/{season}/{episode}',
    supportsImdb: true,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'V2 player with custom subtitles and events',
    homepage: 'https://vidsrc.cc',
  },
  {
    name: 'VidSrc.to',
    slug: 'vidsrc-to',
    baseUrl: 'https://vidsrc.to',
    quality: '1080p',
    isEnabled: true,
    isDefault: false,
    sortOrder: 5,
    movieTemplate: 'https://vidsrc.to/embed/movie/{tmdbId}',
    tvTemplate: 'https://vidsrc.to/embed/tv/{tmdbId}/{season}/{episode}',
    supportsImdb: true,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'Next-gen API with auto-update links',
    homepage: 'https://vidsrc.to',
  },
  {
    name: 'VidSrc Embed',
    slug: 'vidsrc-embed',
    baseUrl: 'https://vidsrc-embed.ru',
    quality: '1080p',
    isEnabled: true,
    isDefault: false,
    sortOrder: 6,
    movieTemplate: 'https://vidsrc-embed.ru/embed/movie/{tmdbId}',
    tvTemplate: 'https://vidsrc-embed.ru/embed/tv/{tmdbId}',
    supportsImdb: true,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'Season/episode selection in player UI',
    homepage: 'https://vidsrc-embed.ru',
  },

  // 📺 TIER 3 — Standard Experience
  {
    name: 'Smashystream',
    slug: 'smashystream',
    baseUrl: 'https://player.smashy.stream',
    quality: '1080p',
    isEnabled: true,
    isDefault: false,
    sortOrder: 7,
    movieTemplate: 'https://player.smashy.stream/movie/{tmdbId}',
    tvTemplate: 'https://player.smashy.stream/tv/{tmdbId}?s={season}&e={episode}',
    supportsImdb: true,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'Customizable player with multiple sources',
    homepage: 'https://player.smashy.stream',
  },
  {
    name: 'MoviesAPI',
    slug: 'moviesapi',
    baseUrl: 'https://moviesapi.club',
    quality: '1080p',
    isEnabled: true,
    isDefault: false,
    sortOrder: 8,
    movieTemplate: 'https://moviesapi.club/movie/{tmdbId}',
    tvTemplate: 'https://moviesapi.club/tv/{tmdbId}-{season}-{episode}',
    supportsImdb: true,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'RESTful API with wide coverage',
    homepage: 'https://moviesapi.club',
  },
  {
    name: 'MultiEmbed',
    slug: 'multiembed',
    baseUrl: 'https://multiembed.mov',
    quality: '1080p',
    isEnabled: true,
    isDefault: false,
    sortOrder: 9,
    movieTemplate: 'https://multiembed.mov/?video_id={tmdbId}&tmdb=1',
    tvTemplate: 'https://multiembed.mov/?video_id={tmdbId}&tmdb=1&s={season}&e={episode}',
    supportsImdb: true,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'Multi-source aggregator',
    homepage: 'https://multiembed.mov',
  },
];

async function main() {
  console.log('🗑️  Clearing existing video providers...');
  await prisma.videoProvider.deleteMany({});

  console.log('🌱 Seeding video providers...');

  for (const provider of videoProviders) {
    await prisma.videoProvider.create({ data: provider });
    console.log(`   ✅ Added: ${provider.name}`);
  }

  console.log('');
  console.log('✨ Seeding complete!');
  console.log('');
  console.log('📊 Summary:');
  const total = await prisma.videoProvider.count();
  const defaultProvider = await prisma.videoProvider.findFirst({ where: { isDefault: true } });

  console.log(`   Total providers: ${total}`);
  console.log(`   Default provider: ${defaultProvider?.name || 'None'}`);
  console.log('');
  console.log('🏆 Provider Ranking:');
  console.log('   Tier 1 (Best): VidLink Pro, VidRock, VidSrc ICU');
  console.log('   Tier 2 (Good): VidSrc.cc, VidSrc.to, VidSrc Embed');
  console.log('   Tier 3 (Standard): Smashystream, MoviesAPI, MultiEmbed');
}

main()
  .catch((e) => {
    console.error('Error seeding video providers:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
