import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const videoProviders = [
  // ⭐ MINIMAL ADS - Best User Experience (Default: VidSrc ICU)
  {
    name: 'VidSrc ICU',
    slug: 'vidsrc-icu',
    baseUrl: 'https://vidsrc.icu',
    quality: '1080p',
    isEnabled: true,
    isDefault: true,
    sortOrder: 0,
    movieTemplate: 'https://vidsrc.icu/embed/movie/{tmdbId}',
    tvTemplate: 'https://vidsrc.icu/embed/tv/{tmdbId}/{season}/{episode}',
    supportsImdb: true,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'BEST - Clean interface with minimal ads, supports movies, TV shows, anime and manga',
    homepage: 'https://vidsrc.icu',
  },
  {
    name: 'VidSrc.cc',
    slug: 'vidsrc-cc',
    baseUrl: 'https://vidsrc.cc',
    quality: '1080p',
    isEnabled: true,
    isDefault: false,
    sortOrder: 1,
    movieTemplate: 'https://vidsrc.cc/v2/embed/movie/{tmdbId}',
    tvTemplate: 'https://vidsrc.cc/v2/embed/tv/{tmdbId}/{season}/{episode}',
    supportsImdb: false,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'V2 player with custom subtitles, player events and minimal ads',
    homepage: 'https://vidsrc.cc',
  },
  {
    name: 'VidLink Pro',
    slug: 'vidlink-pro',
    baseUrl: 'https://vidlink.pro',
    quality: '1080p',
    isEnabled: true,
    isDefault: false,
    sortOrder: 2,
    movieTemplate: 'https://vidlink.pro/movie/{tmdbId}',
    tvTemplate: 'https://vidlink.pro/tv/{tmdbId}/{season}/{episode}',
    supportsImdb: false,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'MASSIVE LIBRARY - 250K+ titles from 13+ sources with minimal ads',
    homepage: 'https://vidlink.pro',
  },
  {
    name: 'VidSrc.to',
    slug: 'vidsrc-to',
    baseUrl: 'https://vidsrc.to',
    quality: '1080p',
    isEnabled: true,
    isDefault: false,
    sortOrder: 3,
    movieTemplate: 'https://vidsrc.to/embed/movie/{tmdbId}',
    tvTemplate: 'https://vidsrc.to/embed/tv/{tmdbId}/{season}/{episode}',
    supportsImdb: true,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'Next-gen API with auto-update links and minimal ads',
    homepage: 'https://vidsrc.to',
  },
  {
    name: 'VidSrc.net',
    slug: 'vidsrc-net',
    baseUrl: 'https://vidsrc.net',
    quality: '1080p',
    isEnabled: true,
    isDefault: false,
    sortOrder: 4,
    movieTemplate: 'https://vidsrc.net/embed/movie/{tmdbId}',
    tvTemplate: 'https://vidsrc.net/embed/tv/{tmdbId}/{season}/{episode}',
    supportsImdb: true,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'Official VidSrc mirror with reliable uptime and minimal ads',
    homepage: 'https://vidsrc.net',
  },
  {
    name: 'VidSrc.me',
    slug: 'vidsrc-me',
    baseUrl: 'https://vidsrc.me',
    quality: '1080p',
    isEnabled: true,
    isDefault: false,
    sortOrder: 5,
    movieTemplate: 'https://vidsrc.me/embed/movie?tmdb={tmdbId}',
    tvTemplate: 'https://vidsrc.me/embed/tv?tmdb={tmdbId}&season={season}&episode={episode}',
    supportsImdb: false,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'Original VidSrc with query-based URLs and minimal ads',
    homepage: 'https://vidsrc.me',
  },

  // 📺 STANDARD ADS - Reliable Resources (Acceptable Experience)
  {
    name: 'VidSrc NEW',
    slug: 'vidsrc-new',
    baseUrl: 'https://vidsrcme.ru',
    quality: '1080p',
    isEnabled: true,
    isDefault: false,
    sortOrder: 6,
    movieTemplate: 'https://vidsrcme.ru/embed/movie/{tmdbId}',
    tvTemplate: 'https://vidsrcme.ru/embed/tv/{tmdbId}/{season}/{episode}',
    supportsImdb: false,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'Official VidSrc domain (replaces .me/.xyz/.net) with standard ads',
    homepage: 'https://vidsrc.domains',
  },
  {
    name: 'VidSrc.xyz',
    slug: 'vidsrc-xyz',
    baseUrl: 'https://vidsrc.xyz',
    quality: '1080p',
    isEnabled: true,
    isDefault: false,
    sortOrder: 7,
    movieTemplate: 'https://vidsrc.xyz/embed/movie/{tmdbId}',
    tvTemplate: 'https://vidsrc.xyz/embed/tv/{tmdbId}/{season}/{episode}',
    supportsImdb: true,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'Legacy VidSrc domain with standard ads (may redirect)',
    homepage: 'https://vidsrc.xyz',
  },
  {
    name: 'SuperEmbed',
    slug: 'superembed',
    baseUrl: 'https://multiembed.mov',
    quality: '1080p',
    isEnabled: true,
    isDefault: false,
    sortOrder: 8,
    movieTemplate: 'https://multiembed.mov/?video_id={tmdbId}&tmdb=1',
    tvTemplate: 'https://multiembed.mov/?video_id={tmdbId}&tmdb=1&s={season}&e={episode}',
    supportsImdb: true,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'Multi-source aggregator with standard ads',
    homepage: 'https://multiembed.mov',
  },
  {
    name: 'MoviesAPI',
    slug: 'moviesapi',
    baseUrl: 'https://moviesapi.club',
    quality: '1080p',
    isEnabled: true,
    isDefault: false,
    sortOrder: 9,
    movieTemplate: 'https://moviesapi.club/movie/{tmdbId}',
    tvTemplate: 'https://moviesapi.club/tv/{tmdbId}-{season}-{episode}',
    supportsImdb: false,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'RESTful API with excellent coverage and standard ads',
    homepage: 'https://moviesapi.club',
  },
  {
    name: 'VidSrc VIP',
    slug: 'vidsrc-vip',
    baseUrl: 'https://vidsrc.vip',
    quality: '1080p',
    isEnabled: true,
    isDefault: false,
    sortOrder: 10,
    movieTemplate: 'https://vidsrc.vip/embed/movie/{tmdbId}',
    tvTemplate: 'https://vidsrc.vip/embed/tv/{tmdbId}/{season}/{episode}',
    supportsImdb: true,
    supportsTmdb: true,
    description: 'Premium-styled mirror with fast CDN and standard ads',
    homepage: 'https://vidsrc.vip',
  },
  {
    name: 'Smashystream',
    slug: 'smashystream',
    baseUrl: 'https://embed.smashystream.com',
    quality: '1080p',
    isEnabled: true,
    isDefault: false,
    sortOrder: 11,
    movieTemplate: 'https://embed.smashystream.com/playere.php?tmdb={tmdbId}',
    tvTemplate: 'https://embed.smashystream.com/playere.php?tmdb={tmdbId}&season={season}&episode={episode}',
    supportsImdb: false,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'Alternative embed with good compatibility and standard ads',
    homepage: 'https://embed.smashystream.com',
  },
];

async function main() {
  console.log('🌱 Seeding video providers...');

  for (const provider of videoProviders) {
    const result = await prisma.videoProvider.upsert({
      where: { slug: provider.slug },
      update: provider,
      create: provider,
    });

    console.log(`   ✅ ${result ? 'Processed' : 'Error'} ${provider.name}`);
  }

  // Synchronize database: Remove providers not in the seed list
  const seedSlugs = videoProviders.map(p => p.slug);
  const deleteResult = await prisma.videoProvider.deleteMany({
    where: {
      slug: { notIn: seedSlugs }
    }
  });

  if (deleteResult.count > 0) {
    console.log(`   🗑️  Removed ${deleteResult.count} obsolete providers from database`);
  }

  console.log('');
  console.log('✨ Seeding complete!');
  console.log('');
  console.log('📊 Summary:');
  const total = await prisma.videoProvider.count();
  const enabled = await prisma.videoProvider.count({ where: { isEnabled: true } });
  const defaultProvider = await prisma.videoProvider.findFirst({ where: { isDefault: true } });

  console.log(`   Total providers: ${total}`);
  console.log(`   Enabled providers: ${enabled}`);
  console.log(`   Default provider: ${defaultProvider?.name || 'None'}`);
}

main()
  .catch((e) => {
    console.error('Error seeding video providers:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
