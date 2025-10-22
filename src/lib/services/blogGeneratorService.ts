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

export type SortOption = 'popular' | 'top_rated' | 'upcoming' | 'now_playing' | 'trending_day' | 'trending_week';
export type GenerationMode = 'batch' | 'continuous';

export interface GenerationConfig {
    count: number;
    type: 'movie' | 'tv';
    sortBy: SortOption;
    mode: GenerationMode;
    postsPerHour?: number; // For continuous mode
    minRating?: number; // Skip items below this rating
    includeAdult?: boolean; // Include adult content
    genres?: number[]; // Filter by genre IDs
    yearFrom?: number; // Filter by release year
    yearTo?: number;
    aiModel?: string; // AI model ID (e.g., 'gemini-1.5-flash', 'gpt-4')
    apiKey?: string; // User's API key (optional, will fetch from DB if not provided)
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
const userGenerationStatus = new Map<string, GenerationStatus>();
const userShouldStop = new Map<string, boolean>();
const userContinuousInterval = new Map<string, NodeJS.Timeout>();

// Helper to get user-specific status
function getUserStatus(userId: string): GenerationStatus {
    if (!userGenerationStatus.has(userId)) {
        userGenerationStatus.set(userId, {
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
        });
    }
    return userGenerationStatus.get(userId)!;
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
function addLog(userId: string, message: string, emoji: string = '📝') {
    const status = getUserStatus(userId);
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${emoji} ${message}`;
    status.logs.push(logMessage);
    console.log(logMessage); // Also log to console

    // Keep only last 50 logs to prevent memory issues
    if (status.logs.length > 50) {
        status.logs = status.logs.slice(-50);
    }
}

export function getGenerationStatus(userId: string): GenerationStatus {
    return { ...getUserStatus(userId) };
}

export function stopGeneration(userId: string) {
    userShouldStop.set(userId, true);
    addLog(userId, 'Generation stopped by user', '🛑');

    const interval = userContinuousInterval.get(userId);
    if (interval) {
        clearInterval(interval);
        userContinuousInterval.delete(userId);
    }

    const status = getUserStatus(userId);
    status.isRunning = false;
}

/**
 * Get TMDb endpoint based on sort option
 */
function getEndpoint(type: 'movie' | 'tv', sortBy: SortOption): string {
    if (sortBy === 'trending_day' || sortBy === 'trending_week') {
        const timeWindow = sortBy === 'trending_day' ? 'day' : 'week';
        return `/trending/${type}/${timeWindow}`;
    }

    const endpoints: Record<string, string> = {
        popular: type === 'movie' ? '/movie/popular' : '/tv/popular',
        top_rated: type === 'movie' ? '/movie/top_rated' : '/tv/top_rated',
        upcoming: '/movie/upcoming', // TV doesn't have upcoming
        now_playing: '/movie/now_playing', // TV uses on_the_air
    };

    if (type === 'tv' && sortBy === 'now_playing') {
        return '/tv/on_the_air';
    }

    return endpoints[sortBy] || endpoints.popular;
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
            throw new Error('❌ Invalid TMDB API key. Please check your NEXT_PUBLIC_TMDB_API_KEY in .env.local file.');
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
            cast: credits.data.cast.slice(0, 10).map((c: any) => c.name),
        };
    } catch (error: any) {
        if (error.response?.status === 401) {
            throw new Error('❌ Invalid TMDB API key. Please check your NEXT_PUBLIC_TMDB_API_KEY in .env.local file.');
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
    aiClient?: AIClient
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
    const cast = media.cast?.join(', ') || '';

    const prompt = `
Write a detailed, engaging blog post review for the ${type} "${title}".

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
        const model = genAI!.getGenerativeModel({ model: 'gemini-1.5-flash' });
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
        const model = genAI!.getGenerativeModel({ model: 'gemini-1.5-flash' });
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
async function createBlogPost(media: any, generatedContent: any, type: 'movie' | 'tv', authorId: string) {
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
            category: 'review',
            readingTime,

            // Media info
            mediaId: media.id,
            mediaType: type,
            mediaTitle: title,
            mediaPosterPath: media.poster_path,
            mediaBackdropPath: media.backdrop_path,
            mediaReleaseDate: media.release_date || media.first_air_date,
            mediaGenres: media.genres?.map((g: any) => g.name) || [],
            mediaRating: media.vote_average,
            mediaOverview: media.overview,
            mediaCast: media.cast || [],

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
 * Batch mode: Generate a fixed number of posts
 * @deprecated This function is legacy - use generateBlogsWithQueue instead
 */
async function runBatchMode(
    config: GenerationConfig,
    authorId: string
): Promise<void> {
    throw new Error('Legacy function runBatchMode() is deprecated. Use generateBlogsWithQueue() instead.');

}

/**
 * Continuous mode: Generate posts continuously at a specified rate
 */
async function runContinuousMode(
    config: GenerationConfig,
    authorId: string
): Promise<void> {
    const postsPerHour = config.postsPerHour || 1;
    const intervalMs = (60 * 60 * 1000) / postsPerHour; // Convert to milliseconds
    const status = getUserStatus(authorId);

    addLog(authorId, `Starting continuous mode: ${postsPerHour} posts/hour (every ${Math.round(intervalMs / 1000 / 60)} minutes)`, '⏰');

    // Generate first post immediately
    await generateSinglePost(config, authorId);

    // Schedule subsequent posts
    const interval = setInterval(async () => {
        if (userShouldStop.get(authorId)) {
            clearInterval(interval);
            userContinuousInterval.delete(authorId);
            status.isRunning = false;
            return;
        }

        status.nextScheduledAt = new Date(Date.now() + intervalMs);
        addLog(authorId, `Next post scheduled in ${Math.round(intervalMs / 1000 / 60)} minutes`, '⏱️');
        await generateSinglePost(config, authorId);
    }, intervalMs);

    userContinuousInterval.set(authorId, interval);
}

/**
 * Generate a single post (used in continuous mode)
 * @deprecated This function is legacy - use generateBlogsWithQueue instead
 */
async function generateSinglePost(
    config: GenerationConfig,
    authorId: string
): Promise<void> {
    throw new Error('Legacy function generateSinglePost() is deprecated. Use generateBlogsWithQueue() instead.');

}

/**
 * Main generation function with all features
 */
export async function generateBlogs(
    config: GenerationConfig,
    authorId: string
): Promise<void> {
    const status = getUserStatus(authorId);

    if (status.isRunning) {
        throw new Error('Generation is already running for this user');
    }

    // Reset and initialize status
    const newStatus: GenerationStatus = {
        isRunning: true,
        mode: config.mode,
        sortBy: config.sortBy,
        total: config.mode === 'batch' ? config.count : 0,
        completed: 0,
        failed: 0,
        skipped: 0,
        errors: [],
        logs: [],
        startTime: new Date(),
        postsPerHour: config.postsPerHour,
        userId: authorId,
    };

    userGenerationStatus.set(authorId, newStatus);
    userShouldStop.set(authorId, false);

    // Add initial logs
    const timestamp = new Date().toLocaleTimeString();
    newStatus.logs.push(`[${timestamp}] 🚀 Starting ${config.mode} mode generation`);
    newStatus.logs.push(`[${timestamp}] 📊 Source: ${config.sortBy} ${config.type}`);
    if (config.mode === 'batch') {
        newStatus.logs.push(`[${timestamp}] 🎯 Target: ${config.count} posts`);
    } else {
        newStatus.logs.push(`[${timestamp}] ⏰ Rate: ${config.postsPerHour} posts/hour`);
    }
    if (config.minRating) {
        newStatus.logs.push(`[${timestamp}] ⭐ Min rating: ${config.minRating}`);
    }
    if (config.yearFrom || config.yearTo) {
        newStatus.logs.push(`[${timestamp}] 📅 Years: ${config.yearFrom || 'any'} - ${config.yearTo || 'any'}`);
    }

    try {
        if (config.mode === 'batch') {
            await runBatchMode(config, authorId);
        } else {
            await runContinuousMode(config, authorId);
        }
    } catch (error: any) {
        console.error('Generation error:', error);
        newStatus.isRunning = false;
        newStatus.currentMovie = undefined;
        throw error;
    }
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

    // Create AI client
    let aiClient: AIClient | undefined;
    const modelId = config.aiModel || user.preferredAiModel || 'gemini-1.5-flash';
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
    aiClient = createAIClient(modelId, apiKey);

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

    userGenerationStatus.set(authorId, newStatus);
    userShouldStop.set(authorId, false);

    // Add initial logs
    addLog(authorId, `Starting ${config.mode} mode generation (Job: ${jobId})`, '🚀');
    addLog(authorId, `Using AI Model: ${model.name}`, '🤖');
    addLog(authorId, `Source: ${config.sortBy} ${config.type}`, '📊');

    await updateProgress(10);

    try {
        if (config.mode === 'batch') {
            // Batch mode with progress tracking
            addLog(authorId, `Fetching ${config.count} media items...`, '🔍');
            const mediaItems = await fetchMediaItems(config, config.count, user.tmdbApiKey);

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
                addLog(authorId, `Processing: ${title}`, '🎬');

                try {
                    // Check for duplicates
                    const isDuplicate = await checkDuplicate(mediaItem.id, config.type);
                    if (isDuplicate) {
                        addLog(authorId, `Skipped: ${title} (already exists)`, '⏭️');
                        newStatus.skipped++;
                        continue;
                    }

                    // Get detailed info
                    addLog(authorId, `Fetching details for ${title}...`, '📥');
                    const details = await getMediaDetails(config.type, mediaItem.id, user.tmdbApiKey);

                    // Generate content with AI
                    addLog(authorId, `Generating content with AI...`, '🤖');
                    const content = await generateBlogContent(details, config.type, aiClient);

                    // Create blog post
                    addLog(authorId, `Creating blog post...`, '💾');
                    await createBlogPost(details, content, config.type, authorId);

                    newStatus.completed++;
                    newStatus.lastGeneratedAt = new Date();
                    addLog(authorId, `Created: ${title} (${newStatus.completed}/${newStatus.total})`, '✅');

                    // Update progress
                    const progress = 20 + Math.floor((i / config.count) * 70);
                    await updateProgress(progress);

                    // Delay between generations
                    await new Promise(resolve => setTimeout(resolve, 2000));

                } catch (error: any) {
                    console.error(`Error processing ${title}:`, error);
                    newStatus.failed++;
                    newStatus.errors.push(`${title}: ${error.message}`);
                    addLog(authorId, `Failed: ${title} - ${error.message}`, '❌');
                }
            }

            await updateProgress(95);
            addLog(authorId, `Batch generation completed! Created: ${newStatus.completed}, Skipped: ${newStatus.skipped}, Failed: ${newStatus.failed}`, '🎉');
        } else {
            // Continuous mode - not recommended for queue-based processing
            throw new Error('Continuous mode should use in-memory processing, not queue');
        }

        newStatus.isRunning = false;
        newStatus.currentMovie = undefined;
        await updateProgress(100);

    } catch (error: any) {
        console.error('Generation error:', error);
        newStatus.isRunning = false;
        newStatus.currentMovie = undefined;
        addLog(authorId, `Error: ${error.message}`, '❌');
        throw error;
    }
}