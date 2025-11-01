import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const videoProviders = [
  {
    name: 'VidLink Pro',
    slug: 'vidlink-pro',
    baseUrl: 'https://vidlink.pro',
    quality: '1080p',
    isEnabled: true,
    isDefault: true,
    sortOrder: 0,
    movieTemplate: 'https://vidlink.pro/movie/{tmdbId}',
    tvTemplate: 'https://vidlink.pro/tv/{tmdbId}/{season}/{episode}',
    supportsImdb: false,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'Biggest and fastest streaming API with 51K+ movies and 36K+ shows from 13+ sources',
    homepage: 'https://vidlink.pro',
  },
  {
    name: 'VidSrc.to',
    slug: 'vidsrc-to',
    baseUrl: 'https://vidsrc.to',
    quality: '1080p',
    isEnabled: true,
    isDefault: false,
    sortOrder: 1,
    movieTemplate: 'https://vidsrc.to/embed/movie/{tmdbId}',
    tvTemplate: 'https://vidsrc.to/embed/tv/{tmdbId}/{season}/{episode}',
    supportsImdb: true,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'Next generation video streaming API with auto-update and high quality links',
    homepage: 'https://vidsrc.to',
  },
  {
    name: 'AutoEmbed',
    slug: 'autoembed',
    baseUrl: 'https://player.autoembed.cc',
    quality: '1080p',
    isEnabled: true,
    isDefault: false,
    sortOrder: 2,
    movieTemplate: 'https://player.autoembed.cc/embed/movie/{tmdbId}',
    tvTemplate: 'https://player.autoembed.cc/embed/tv/{tmdbId}/{season}/{episode}',
    supportsImdb: true,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'Auto-updating embed player with WordPress theme integration support',
    homepage: 'https://autoembed.cc',
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
    description: 'Video streaming API with minimal ads, supports movies, TV shows, anime and manga',
    homepage: 'https://vidsrc.icu',
  },
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
    supportsImdb: false,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'Next generation video streaming with player events and custom subtitles support',
    homepage: 'https://vidsrc.cc',
  },
  {
    name: 'VidSrc.me (Official)',
    slug: 'vidsrc-me',
    baseUrl: 'https://vidsrcme.ru',
    quality: '1080p',
    isEnabled: false,
    isDefault: false,
    sortOrder: 5,
    movieTemplate: 'https://vidsrcme.ru/embed/movie/{tmdbId}',
    tvTemplate: 'https://vidsrcme.ru/embed/tv/{tmdbId}/{season}/{episode}',
    supportsImdb: false,
    supportsTmdb: true,
    hasMultiQuality: true,
    hasSubtitles: true,
    hasAutoplay: false,
    requiresAuth: false,
    description: 'Official VidSrc domain (currently disabled, check vidsrc.domains for updates)',
    homepage: 'https://vidsrc.domains',
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
