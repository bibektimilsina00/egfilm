/**
 * AI Blog Generator Service
 * Generates blog posts using TMDb data + AI models (Gemini, OpenAI, Anthropic)
 * Now with BullMQ queue support for background processing
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { prisma } from '@/lib/prisma';
import { createAIClient, getAPIKey, AI_MODELS } from '@/lib/ai/aiModels';
import type { AIClient } from '@/lib/ai/aiModels';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
// Remove global TMDB_API_KEY - will be fetched per-user from database

// Fallback Gemini client (for backward compatibility)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export type SortOption = 'popular' | 'top_rated' | 'upcoming' | 'now_playing' | 'trending_day' | 'trending_week' | 'on_the_air' | 'airing_today';
export type GenerationMode = 'batch' | 'continuous';
export type BlogCategory = 'review' | 'news' | 'guide' | 'analysis' | 'recommendation' | 'comparison';

export interface GenerationConfig {
    count: number;
    type: 'movie' | 'tv' | 'mixed'; // Added 'mixed' for both movies and TV
    sortBy: SortOption;
    category: BlogCategory; // Which type of blog to generate
    mode: GenerationMode;
    postsPerHour?: number; // For continuous mode
    minRating?: number; // Skip items below this rating
    includeAdult?: boolean; // Include adult content
    genres?: number[]; // Filter by genre IDs
    yearFrom?: number; // Filter by release year
    yearTo?: number;
    aiModel?: string; // AI model ID (e.g., 'gemini-1.5-flash', 'gpt-4')
    apiKey?: string; // User's API key (optional, will fetch from DB if not provided)
    rotateCategories?: boolean; // Auto-rotate between categories for variety
    rotateSortBy?: boolean; // Auto-rotate between sort options
}

export interface GenerationStatus {
    isRunning: boolean;
    mode: GenerationMode;
    sortBy: SortOption;
    total: number;
    completed: number;
    failed: number;
    skipped: number;
    currentMovie?: string;
    errors: string[];
    logs: string[]; // Activity logs for real-time monitoring
    startTime?: Date;
    lastGeneratedAt?: Date;
    postsPerHour?: number;
    nextScheduledAt?: Date;
    userId?: string; // Track which user is running generation
}

// User-specific status storage (key: userId, value: status)
// Import Redis for cross-process status sharing
import IORedis from 'ioredis';

// Redis connection for status sharing between Next.js server and worker
const redis = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
});

const userShouldStop = new Map<string, boolean>();
const userContinuousInterval = new Map<string, NodeJS.Timeout>();

// Helper to get Redis key for user status
function getStatusKey(userId: string): string {
    return `blog:generation:status:${userId}`;
}

// Helper to get user-specific status from Redis
async function getUserStatus(userId: string): Promise<GenerationStatus> {
    try {
        const key = getStatusKey(userId);
        const cached = await redis.get(key);

        if (cached) {
            return JSON.parse(cached);
        }
    } catch (error) {
        console.error('Redis getUserStatus error:', error);
    }

    // Default status if nothing in Redis
    return {
        isRunning: false,
        mode: 'batch',
        sortBy: 'popular',
        total: 0,
        completed: 0,
        failed: 0,
        skipped: 0,
        errors: [],
        logs: [],
        userId,
    };
}

// Helper to set user status in Redis
async function setUserStatus(userId: string, status: GenerationStatus): Promise<void> {
    try {
        const key = getStatusKey(userId);
        await redis.setex(key, 3600, JSON.stringify(status)); // Expire after 1 hour
    } catch (error) {
        console.error('Redis setUserStatus error:', error);
    }
}

// Persist status to database
async function persistStatus(userId: string, status: GenerationStatus) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                // Store as JSON in a metadata field (you may need to add this field)
                // For now, we'll use the in-memory Map which persists during server runtime
            },
        });
    } catch (error) {
        console.error('Failed to persist status:', error);
    }
}

// Helper function to add timestamped logs
async function addLog(userId: string, message: string, emoji: string = '📝') {
    const status = await getUserStatus(userId);
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${emoji} ${message}`;
    status.logs.push(logMessage);
    console.log(logMessage); // Also log to console

    // Keep only last 50 logs to prevent memory issues
    if (status.logs.length > 50) {
        status.logs = status.logs.slice(-50);
    }

    await setUserStatus(userId, status);
}

export async function getGenerationStatus(userId: string): Promise<GenerationStatus> {
    return getUserStatus(userId);
}

export async function stopGeneration(userId: string) {
    userShouldStop.set(userId, true);
    await addLog(userId, 'Generation stopped by user', '🛑');

    const interval = userContinuousInterval.get(userId);
    if (interval) {
        clearInterval(interval);
        userContinuousInterval.delete(userId);
    }

    const status = await getUserStatus(userId);
    status.isRunning = false;
    await setUserStatus(userId, status);
}

/**
 * Get TMDb endpoint based on sort option
 */
function getEndpoint(type: 'movie' | 'tv', sortBy: SortOption): string {
    if (sortBy === 'trending_day' || sortBy === 'trending_week') {
        const timeWindow = sortBy === 'trending_day' ? 'day' : 'week';
        return `/trending/${type}/${timeWindow}`;
    }

    const endpoints: Record<string, Record<string, string>> = {
        movie: {
            popular: '/movie/popular',
            top_rated: '/movie/top_rated',
            upcoming: '/movie/upcoming',
            now_playing: '/movie/now_playing',
        },
        tv: {
            popular: '/tv/popular',
            top_rated: '/tv/top_rated',
            on_the_air: '/tv/on_the_air',
            airing_today: '/tv/airing_today',
        },
    };

    // Map similar options between movie and TV
    if (type === 'tv') {
        if (sortBy === 'now_playing') return endpoints.tv.on_the_air;
        if (sortBy === 'upcoming') return endpoints.tv.on_the_air;
    }

    return endpoints[type][sortBy] || endpoints[type].popular;
}

/**
 * Get or create blog generation progress tracker
 */
async function getGenerationProgress(
    userId: string,
    mediaType: 'movie' | 'tv',
    sortBy: SortOption
) {
    let progress = await prisma.blogGenerationProgress.findUnique({
        where: {
            userId_mediaType_sortBy: {
                userId,
                mediaType,
                sortBy,
            },
        },
    });

    if (!progress) {
        progress = await prisma.blogGenerationProgress.create({
            data: {
                userId,
                mediaType,
                sortBy,
                currentPage: 1,
                currentIndex: 0,
                totalGenerated: 0,
            },
        });
    }

    return progress;
}

/**
 * Update generation progress
 */
async function updateGenerationProgress(
    userId: string,
    mediaType: 'movie' | 'tv',
    sortBy: SortOption,
    updates: {
        currentPage?: number;
        currentIndex?: number;
        lastMediaId?: number;
        incrementGenerated?: boolean;
    }
) {
    const data: any = {};

    if (updates.currentPage !== undefined) data.currentPage = updates.currentPage;
    if (updates.currentIndex !== undefined) data.currentIndex = updates.currentIndex;
    if (updates.lastMediaId !== undefined) data.lastMediaId = updates.lastMediaId;
    if (updates.incrementGenerated) {
        data.totalGenerated = { increment: 1 };
    }

    await prisma.blogGenerationProgress.update({
        where: {
            userId_mediaType_sortBy: {
                userId,
                mediaType,
                sortBy,
            },
        },
        data,
    });
}

/**
 * Fetch media items with progress tracking
 */
async function fetchMediaWithProgress(
    type: 'movie' | 'tv',
    sortBy: SortOption,
    tmdbApiKey: string,
    userId: string,
    count: number,
    filters?: Pick<GenerationConfig, 'minRating' | 'includeAdult' | 'genres' | 'yearFrom' | 'yearTo'>
) {
    // Get current progress
    const progress = await getGenerationProgress(userId, type, sortBy);

    const allResults: any[] = [];
    let currentPage = progress.currentPage;
    let currentIndex = progress.currentIndex;
    let fetched = 0;

    console.log(`📍 Resuming from page ${currentPage}, index ${currentIndex}`);
    console.log(`📊 Total generated so far: ${progress.totalGenerated}`);

    while (fetched < count) {
        // Fetch the current page
        const results = await fetchMedia(type, sortBy, tmdbApiKey, currentPage, filters);

        if (!results || results.length === 0) {
            // No more results, reset to page 1
            console.log('📄 No more results on current page, moving to next page');
            currentPage++;
            currentIndex = 0;

            // If we've tried too many empty pages, start over
            if (currentPage > progress.currentPage + 5) {
                console.log('🔄 Resetting to page 1');
                currentPage = 1;
                currentIndex = 0;
            }
            continue;
        }

        // Get items from current index onwards
        const remainingOnPage = results.slice(currentIndex);
        const neededFromThisPage = Math.min(remainingOnPage.length, count - fetched);

        allResults.push(...remainingOnPage.slice(0, neededFromThisPage));
        fetched += neededFromThisPage;

        // Update position
        currentIndex += neededFromThisPage;

        // If we've consumed all items on this page, move to next page
        if (currentIndex >= results.length) {
            currentPage++;
            currentIndex = 0;
        }

        // Update progress in database
        await updateGenerationProgress(userId, type, sortBy, {
            currentPage,
            currentIndex,
        });
    }

    return { results: allResults, finalPage: currentPage, finalIndex: currentIndex };
}

/**
 * Fetch movies/TV shows from TMDb with various filters
 */
async function fetchMedia(
    type: 'movie' | 'tv',
    sortBy: SortOption,
    tmdbApiKey: string,
    page: number = 1,
    filters?: Pick<GenerationConfig, 'minRating' | 'includeAdult' | 'genres' | 'yearFrom' | 'yearTo'>
) {
    // Validate API key before making request
    if (!tmdbApiKey) {
        throw new Error('❌ TMDB API key is required. Please add your TMDb API key in Settings → AI Configuration.');
    }

    const endpoint = getEndpoint(type, sortBy);
    const params: any = {
        api_key: tmdbApiKey,
        page,
        language: 'en-US',
    };

    // Add filters
    if (filters?.includeAdult === false) {
        params.include_adult = false;
    }
    if (filters?.genres && filters.genres.length > 0) {
        params.with_genres = filters.genres.join(',');
    }
    if (filters?.yearFrom) {
        params['primary_release_date.gte'] = `${filters.yearFrom}-01-01`;
    }
    if (filters?.yearTo) {
        params['primary_release_date.lte'] = `${filters.yearTo}-12-31`;
    }

    try {
        const response = await axios.get(`${TMDB_BASE_URL}${endpoint}`, { params });
        let results = response.data.results;

        // Filter by rating if specified
        if (filters?.minRating !== undefined) {
            results = results.filter((item: any) => item.vote_average >= filters.minRating!);
        }

        return results;
    } catch (error: any) {
        if (error.response?.status === 401) {
            throw new Error('❌ Invalid TMDB API key. Please check your TMDB_API_KEY in .env.local file.');
        }
        throw error;
    }
}

/**
 * Get detailed info including cast
 */
async function getMediaDetails(type: 'movie' | 'tv', id: number, tmdbApiKey: string) {
    // Validate API key
    if (!tmdbApiKey) {
        throw new Error('❌ TMDB API key is required. Please add your TMDb API key in Settings → AI Configuration.');
    }

    try {
        const [details, credits] = await Promise.all([
            axios.get(`${TMDB_BASE_URL}/${type}/${id}`, {
                params: { api_key: tmdbApiKey },
            }),
            axios.get(`${TMDB_BASE_URL}/${type}/${id}/credits`, {
                params: { api_key: tmdbApiKey },
            }),
        ]);

        return {
            ...details.data,
            cast: credits.data.cast.slice(0, 10).map((c: any) => ({
                name: c.name,
                character: c.character,
                profile_path: c.profile_path,
            })),
        };
    } catch (error: any) {
        if (error.response?.status === 401) {
            throw new Error('❌ Invalid TMDB API key. Please check your TMDB_API_KEY in .env.local file.');
        }
        throw error;
    }
}

/**
 * Check if blog post already exists for this media
 */
async function checkDuplicate(mediaId: number, mediaType: string): Promise<boolean> {
    const existing = await prisma.blogPost.findFirst({
        where: {
            mediaId,
            mediaType,
        },
    });
    return !!existing;
}

/**
 * Generate blog content using AI (supports multiple providers)
 */
async function generateBlogContent(
    media: any,
    type: 'movie' | 'tv',
    aiClient?: AIClient,
    category: BlogCategory = 'review'
) {
    // Use provided AI client or fall back to Gemini
    if (!aiClient && !genAI) {
        throw new Error('No AI client available. Please provide API key.');
    }

    const title = media.title || media.name;
    const overview = media.overview;
    const releaseDate = media.release_date || media.first_air_date;
    const rating = media.vote_average;
    const genres = media.genres?.map((g: any) => g.name).join(', ') || '';
    const cast = media.cast?.map((c: any) => `${c.name}${c.character ? ` as ${c.character}` : ''}`).join(', ') || '';

    // Category-specific prompts
    const categoryPrompts = {
        review: `Write a detailed, engaging blog post review for the ${type} "${title}".`,
        news: `Write a news article about the ${type} "${title}".`,
        guide: `Write a comprehensive viewing guide for the ${type} "${title}".`,
        analysis: `Write an in-depth analysis of the ${type} "${title}".`,
        recommendation: `Write a recommendation post for the ${type} "${title}".`,
        comparison: `Write a comparison piece featuring the ${type} "${title}".`,
    };

    const prompt = `
${categoryPrompts[category] || categoryPrompts.review}

Movie/Show Details:
- Title: ${title}
- Release Date: ${releaseDate}
- Rating: ${rating}/10
- Genres: ${genres}
- Overview: ${overview}
- Cast: ${cast}

Requirements:
1. Write in an engaging, conversational tone
2. Include an introduction that hooks the reader
3. Discuss the plot WITHOUT major spoilers
4. Analyze the performances, direction, and cinematography
5. Talk about what makes it worth watching
6. Include a conclusion with a recommendation
7. Use HTML formatting: <h2>, <h3>, <p>, <strong>, <em>, <ul>, <li>
8. Make it 800-1200 words
9. Be SEO-friendly with natural keyword usage
10. Make it sound human-written, not AI-generated

Return ONLY the HTML content, no markdown code blocks.
`;

    let content: string;
    if (aiClient) {
        content = await aiClient.generateContent(prompt);
    } else {
        const model = genAI!.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        content = result.response.text();
    }

    // Generate title and excerpt
    const metaPrompt = `
For the ${type} "${title}", generate:
1. SEO Title (50-60 characters, engaging and clickable)
2. Meta Description (150-160 characters)
3. Excerpt (200-250 characters, exciting summary)
4. 5-7 relevant keywords (comma-separated)
5. 3-5 tags (comma-separated, one or two words each)

Format your response EXACTLY as:
TITLE: [your title]
META: [your meta description]
EXCERPT: [your excerpt]
KEYWORDS: [keyword1, keyword2, keyword3, ...]
TAGS: [tag1, tag2, tag3, ...]
`;

    let metaText: string;
    if (aiClient) {
        metaText = await aiClient.generateContent(metaPrompt);
    } else {
        const model = genAI!.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const metaResult = await model.generateContent(metaPrompt);
        metaText = metaResult.response.text();
    }

    // Parse meta information
    const titleMatch = metaText.match(/TITLE:\s*(.+)/);
    const metaMatch = metaText.match(/META:\s*(.+)/);
    const excerptMatch = metaText.match(/EXCERPT:\s*(.+)/);
    const keywordsMatch = metaText.match(/KEYWORDS:\s*(.+)/);
    const tagsMatch = metaText.match(/TAGS:\s*(.+)/);

    return {
        title: titleMatch?.[1]?.trim() || `${title} - Review and Analysis`,
        metaDescription: metaMatch?.[1]?.trim() || overview.substring(0, 160),
        excerpt: excerptMatch?.[1]?.trim() || overview.substring(0, 250),
        keywords: keywordsMatch?.[1]?.split(',').map(k => k.trim()) || [],
        tags: tagsMatch?.[1]?.split(',').map(t => t.trim()) || [],
        content: content.trim(),
    };
}

/**
 * Calculate reading time from HTML content
 */
function calculateReadingTime(htmlContent: string): number {
    const text = htmlContent.replace(/<[^>]*>/g, '');
    const words = text.split(/\s+/).length;
    return Math.ceil(words / 200); // Average reading speed: 200 words/minute
}

/**
 * Generate slug from title
 */
function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

/**
 * Create blog post in database
 */
async function createBlogPost(
    media: any,
    generatedContent: any,
    type: 'movie' | 'tv',
    authorId: string,
    category: BlogCategory = 'review'
) {
    const title = media.title || media.name;
    const slug = generateSlug(generatedContent.title);

    // Check if slug already exists, make it unique
    const existingSlug = await prisma.blogPost.findUnique({ where: { slug } });
    const finalSlug = existingSlug ? `${slug}-${media.id}` : slug;

    const readingTime = calculateReadingTime(generatedContent.content);

    return await prisma.blogPost.create({
        data: {
            title: generatedContent.title,
            slug: finalSlug,
            excerpt: generatedContent.excerpt,
            content: generatedContent.content,
            metaTitle: generatedContent.title,
            metaDescription: generatedContent.metaDescription,
            keywords: generatedContent.keywords,
            tags: generatedContent.tags,
            category, // Use provided category

            readingTime,

            // Media info with cast details
            mediaId: media.id,
            mediaType: type,
            mediaTitle: title,
            mediaPosterPath: media.poster_path,
            mediaBackdropPath: media.backdrop_path,
            mediaReleaseDate: media.release_date || media.first_air_date,
            mediaGenres: media.genres?.map((g: any) => g.name) || [],
            mediaRating: media.vote_average,
            mediaOverview: media.overview,
            mediaCast: media.cast || [], // Store cast array from TMDb

            // Featured image (use backdrop)
            featuredImage: media.backdrop_path
                ? `https://image.tmdb.org/t/p/original${media.backdrop_path}`
                : undefined,
            ogImage: media.backdrop_path
                ? `https://image.tmdb.org/t/p/original${media.backdrop_path}`
                : undefined,

            // Author
            authorId,

            // Auto-publish
            status: 'published',
            publishedAt: new Date(),
        },
    });
}

/**
 * Process a single batch of blog posts
 * @deprecated This function is legacy - use generateBlogsWithQueue instead
 */
async function processBatch(
    config: GenerationConfig,
    authorId: string,
    mediaToProcess: any[]
): Promise<void> {
    throw new Error('Legacy function processBatch() is deprecated. Use generateBlogsWithQueue() instead.');

}

/**
 * Fetch media items based on configuration
 */
async function fetchMediaItems(
    config: GenerationConfig,
    targetCount: number,
    tmdbApiKey: string
): Promise<any[]> {
    const { type, sortBy, minRating, includeAdult, genres, yearFrom, yearTo } = config;

    // Handle 'mixed' type by fetching both movies and TV shows
    if (type === 'mixed') {
        const movieCount = Math.ceil(targetCount / 2);
        const tvCount = Math.floor(targetCount / 2);

        const [movies, tvShows] = await Promise.all([
            fetchMediaItems({ ...config, type: 'movie' }, movieCount, tmdbApiKey),
            fetchMediaItems({ ...config, type: 'tv' }, tvCount, tmdbApiKey),
        ]);

        return [...movies, ...tvShows];
    }

    const mediaToProcess: any[] = [];
    let page = 1;

    // Fetch enough media items
    while (mediaToProcess.length < targetCount && page <= 20) {
        const media = await fetchMedia(type, sortBy, tmdbApiKey, page, {
            minRating,
            includeAdult,
            genres,
            yearFrom,
            yearTo,
        });
        mediaToProcess.push(...media);
        page++;

        // Delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 250));
    }

    return mediaToProcess;
}

/**
 * Main generation function - now delegates to queue system
 * @deprecated Direct generation is deprecated. All generation should go through the queue.
 * This function is kept for backward compatibility but immediately throws an error.
 */
export async function generateBlogs(
    config: GenerationConfig,
    authorId: string
): Promise<void> {
    throw new Error(
        'Direct generation is no longer supported. Please use generateBlogsWithQueue() through the queue system. ' +
        'Call POST /api/admin/blog/auto-generate/start instead.'
    );
}

/**
 * Queue-compatible blog generation function for BullMQ worker
 * This version accepts progress callback and uses user-provided AI settings
 */
export async function generateBlogsWithQueue(params: {
    config: GenerationConfig;
    authorId: string;
    userId: string;
    jobId: string;
    updateProgress: (progress: number) => Promise<void>;
}) {
    const { config, authorId, userId, jobId, updateProgress } = params;

    // Handle 'mixed' type by splitting into two separate generations
    if (config.type === 'mixed') {
        const movieConfig = { ...config, type: 'movie' as const, count: Math.ceil(config.count / 2) };
        const tvConfig = { ...config, type: 'tv' as const, count: Math.floor(config.count / 2) };

        await generateBlogsWithQueue({ ...params, config: movieConfig });
        await generateBlogsWithQueue({ ...params, config: tvConfig });
        return;
    }

    // Get user's AI settings including TMDB API key
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            geminiApiKey: true,
            openaiApiKey: true,
            anthropicApiKey: true,
            tmdbApiKey: true,
            preferredAiModel: true,
        },
    });

    if (!user) {
        throw new Error('User not found');
    }

    // Validate TMDB API key
    if (!user.tmdbApiKey) {
        throw new Error('❌ TMDb API key not configured. Please add your TMDb API key in Settings → AI Configuration.');
    }

    // Determine AI model and get API key
    const modelId = config.aiModel || user.preferredAiModel || 'gemini-2.5-flash';
    const model = AI_MODELS.find(m => m.id === modelId);

    if (!model) {
        throw new Error(`Unknown AI model: ${modelId}`);
    }

    // Get API key (from config, user settings, or environment)
    let apiKey: string | undefined = config.apiKey;
    if (!apiKey) {
        const fetchedKey = await getAPIKey(userId, model.provider);
        apiKey = fetchedKey || undefined;
    }

    if (!apiKey) {
        throw new Error(`No API key found for ${model.provider}. Please configure your API keys.`);
    }

    // Create AI client
    const aiClient = createAIClient(modelId, apiKey);

    // Initialize status
    const newStatus: GenerationStatus = {
        isRunning: true,
        mode: config.mode,
        sortBy: config.sortBy,
        total: config.count,
        completed: 0,
        failed: 0,
        skipped: 0,
        errors: [],
        logs: [],
        startTime: new Date(),
        postsPerHour: config.postsPerHour,
        userId: authorId,
    };

    await setUserStatus(authorId, newStatus);
    userShouldStop.set(authorId, false);

    // Add initial logs
    addLog(authorId, `Starting ${config.mode} mode generation (Job: ${jobId})`, '🚀');
    addLog(authorId, `Using AI Model: ${model.name}`, '🤖');
    addLog(authorId, `Source: ${config.sortBy} ${config.type}`, '📊');
    addLog(authorId, `Category: ${config.category || 'auto'}`, '📝');

    await updateProgress(10);

    try {
        if (config.mode === 'batch') {
            // Batch mode with progress tracking
            addLog(authorId, `Fetching ${config.count} media items with progress tracking...`, '🔍');

            // Fetch media with progress continuation
            const { results: mediaItems, finalPage, finalIndex } = await fetchMediaWithProgress(
                config.type,
                config.sortBy,
                user.tmdbApiKey,
                userId,
                config.count,
                {
                    minRating: config.minRating,
                    includeAdult: config.includeAdult,
                    genres: config.genres,
                    yearFrom: config.yearFrom,
                    yearTo: config.yearTo,
                }
            );

            await updateProgress(20);
            addLog(authorId, `Found ${mediaItems.length} items, starting generation...`, '📋');

            const shouldStop = userShouldStop.get(authorId) || false;
            for (let i = 0; i < Math.min(config.count, mediaItems.length); i++) {
                if (userShouldStop.get(authorId)) {
                    addLog(authorId, 'Generation stopped by user', '🛑');
                    break;
                }

                const mediaItem = mediaItems[i];
                const title = mediaItem.title || mediaItem.name;
                newStatus.currentMovie = title;
                await setUserStatus(authorId, newStatus); // Sync status
                addLog(authorId, `Processing: ${title}`, '🎬');

                try {
                    // Check for duplicates
                    const isDuplicate = await checkDuplicate(mediaItem.id, config.type);
                    if (isDuplicate) {
                        addLog(authorId, `Skipped: ${title} (already exists)`, '⏭️');
                        newStatus.skipped++;
                        await setUserStatus(authorId, newStatus); // Sync status
                        continue;
                    }

                    // Get detailed info with cast
                    addLog(authorId, `Fetching details and cast for ${title}...`, '📥');
                    const details = await getMediaDetails(config.type, mediaItem.id, user.tmdbApiKey);

                    // Generate content with AI (using category if provided)
                    const category = config.category || 'review';
                    addLog(authorId, `Generating ${category} content with AI...`, '🤖');
                    const content = await generateBlogContent(details, config.type, aiClient, category);

                    // Create blog post with cast details and category
                    addLog(authorId, `Creating blog post...`, '💾');
                    await createBlogPost(details, content, config.type, authorId, category);

                    newStatus.completed++;
                    newStatus.lastGeneratedAt = new Date();
                    await setUserStatus(authorId, newStatus); // Sync status
                    addLog(authorId, `Created: ${title} (${newStatus.completed}/${newStatus.total})`, '✅');

                    // Update progress in database (track successful generation)
                    await updateGenerationProgress(userId, config.type, config.sortBy, {
                        lastMediaId: mediaItem.id,
                        incrementGenerated: true,
                    });

                    // Update job progress
                    const progress = 20 + Math.floor((i / config.count) * 70);
                    await updateProgress(progress);

                    // Delay between generations
                    await new Promise(resolve => setTimeout(resolve, 2000));

                } catch (error: any) {
                    console.error(`Error processing ${title}:`, error);
                    newStatus.failed++;
                    newStatus.errors.push(`${title}: ${error.message}`);
                    await setUserStatus(authorId, newStatus); // Sync status
                    addLog(authorId, `Failed: ${title} - ${error.message}`, '❌');
                }
            }

            await updateProgress(95);
            addLog(authorId, `Batch generation completed! Created: ${newStatus.completed}, Skipped: ${newStatus.skipped}, Failed: ${newStatus.failed}`, '🎉');
        } else if (config.mode === 'continuous') {
            // Continuous mode: Generate one post per job execution
            // The job will be repeated by BullMQ at the specified interval
            addLog(authorId, `Continuous mode: Generating single post...`, '🔄');
            await updateProgress(20);

            try {
                // Fetch one media item with progress tracking
                const { results: mediaItems, finalPage, finalIndex } = await fetchMediaWithProgress(
                    config.type,
                    config.sortBy,
                    user.tmdbApiKey,
                    userId,
                    1, // Only fetch 1 item per execution
                    {
                        minRating: config.minRating,
                        includeAdult: config.includeAdult,
                        genres: config.genres,
                        yearFrom: config.yearFrom,
                        yearTo: config.yearTo,
                    }
                );

                if (mediaItems.length === 0) {
                    addLog(authorId, `No more items available. Continuous generation will retry later.`, '⏸️');
                    await updateProgress(100);
                    return;
                }

                const mediaItem = mediaItems[0];
                const title = mediaItem.title || mediaItem.name;
                addLog(authorId, `Processing: ${title}`, '🎬');
                await updateProgress(40);

                // Check for duplicates
                const isDuplicate = await checkDuplicate(mediaItem.id, config.type);
                if (isDuplicate) {
                    addLog(authorId, `Skipped: ${title} (already exists)`, '⏭️');
                    newStatus.skipped++;
                    await setUserStatus(authorId, newStatus);
                    await updateProgress(100);
                    return;
                }

                // Get detailed info with cast
                addLog(authorId, `Fetching details and cast for ${title}...`, '📥');
                const details = await getMediaDetails(config.type, mediaItem.id, user.tmdbApiKey);
                await updateProgress(60);

                // Generate content with AI (using category if provided)
                const category = config.category || 'review';
                addLog(authorId, `Generating ${category} content with AI...`, '🤖');
                const content = await generateBlogContent(details, config.type, aiClient, category);
                await updateProgress(80);

                // Create blog post with cast details and category
                addLog(authorId, `Creating blog post...`, '💾');
                await createBlogPost(details, content, config.type, authorId, category);

                newStatus.completed++;
                newStatus.lastGeneratedAt = new Date();
                await setUserStatus(authorId, newStatus);
                addLog(authorId, `Created: ${title}`, '✅');

                // Update progress in database
                await updateGenerationProgress(userId, config.type, config.sortBy, {
                    lastMediaId: mediaItem.id,
                    incrementGenerated: true,
                });

                await updateProgress(100);
                addLog(authorId, `Continuous mode: Post created successfully! Next post will be generated at the scheduled interval.`, '🎉');

            } catch (error: any) {
                console.error(`Error in continuous mode:`, error);
                newStatus.failed++;
                newStatus.errors.push(`${error.message}`);
                await setUserStatus(authorId, newStatus);
                addLog(authorId, `Failed: ${error.message}`, '❌');
                throw error;
            }
        }

        newStatus.isRunning = false;
        newStatus.currentMovie = undefined;
        await setUserStatus(authorId, newStatus); // Final status sync
        await updateProgress(100);

    } catch (error: any) {
        console.error('Generation error:', error);
        newStatus.isRunning = false;
        newStatus.currentMovie = undefined;
        await setUserStatus(authorId, newStatus); // Error status sync
        addLog(authorId, `Error: ${error.message}`, '❌');
        throw error;
    }
}