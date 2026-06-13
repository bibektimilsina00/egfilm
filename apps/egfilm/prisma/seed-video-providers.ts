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
    description: 'Biggest library: 51K+ movies and 36K+ shows from 13+ sources with minimal ads',
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

  // 📺 STANDARD ADS - Acceptable Experience
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
    name: '2Embed',
    slug: '2embed',
    baseUrl: 'https://www.2embed.cc',
    quality: '1080p',
    isEnabled: true,
    isDefault: false,
    sortOrder: 8,
    movieTemplate: 'https://www.2embed.cc/embed/{tmdbId}',
    tvTemplate: 'https://www.2embed.cc/embedtv/{tmdbId}&s={season}&e={episode}',
    supportsImdb: true,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'Popular embed with multiple servers and standard ads',
    homepage: 'https://2embed.cc',
  },
  {
    name: 'SuperEmbed',
    slug: 'superembed',
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
    sortOrder: 10,
    movieTemplate: 'https://moviesapi.club/movie/{tmdbId}',
    tvTemplate: 'https://moviesapi.club/tv/{tmdbId}-{season}-{episode}',
    supportsImdb: false,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'RESTful API with embed support and standard ads',
    homepage: 'https://moviesapi.club',
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

  // ⚠️ HEAVY ADS - Use as Last Resort
  {
    name: 'NontonGo',
    slug: 'nontongo',
    baseUrl: 'https://www.NontonGo.win',
    quality: '720p',
    isEnabled: false,
    isDefault: false,
    sortOrder: 12,
    movieTemplate: 'https://www.NontonGo.win/embed/movie/{tmdbId}',
    tvTemplate: 'https://www.NontonGo.win/embed/tv/{tmdbId}/{season}/{episode}',
    supportsImdb: false,
    supportsTmdb: true,
    hasMultiQuality: false,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'Indonesian provider with heavy ads (disabled by default)',
    homepage: 'https://nontongo.win',
  },
];

async function main() {
  console.log('🌱 Seeding video providers...');

  for (const provider of videoProviders) {
    const existing = await prisma.videoProvider.findUnique({
      where: { slug: provider.slug },
    });

    if (existing) {
      console.log(`   ⏭️  Skipping ${provider.name} (already exists)`);
      continue;
    }

    await prisma.videoProvider.create({
      data: provider,
    });

    console.log(`   ✅ Created ${provider.name}`);
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
