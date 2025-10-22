/**
 * Advanced Blog Generator Service
 * 
 * Features:
 * - Supports all media types (movies & TV shows)
 * - Handles all sort options (popular, trending, upcoming, etc.)
 * - Multi-category blog generation (review, news, guide, analysis, etc.)
 * - Stores cast details from TMDb
 * - Rotation system for variety
 * - Future-proof pagination with progress tracking
 * - Handles new releases automatically
 */

import { prisma } from '@/lib/prisma';
import axios from 'axios';
import type { AIClient } from '@/lib/ai/aiModels';
import type { SortOption, BlogCategory } from './blogGeneratorService';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Content rotation strategies for comprehensive coverage
 */
export const CONTENT_STRATEGIES = {
    movie: ['popular', 'top_rated', 'upcoming', 'now_playing', 'trending_day', 'trending_week'] as SortOption[],
    tv: ['popular', 'top_rated', 'on_the_air', 'airing_today', 'trending_day', 'trending_week'] as SortOption[],
};

export const BLOG_CATEGORIES: BlogCategory[] = [
    'review',
    'news',
    'guide',
    'analysis',
    'recommendation',
    'comparison',
];

/**
 * Category-specific blog prompts
 */
function getCategoryPrompt(category: BlogCategory, media: any, type: 'movie' | 'tv'): string {
    const title = media.title || media.name;
    const releaseDate = media.release_date || media.first_air_date;
    const rating = media.vote_average;
    const genres = media.genres?.map((g: any) => g.name).join(', ') || '';
    const cast = media.cast?.slice(0, 10).join(', ') || '';
    const overview = media.overview;

    const prompts: Record<BlogCategory, string> = {
        review: `
Write a comprehensive review for the ${type} "${title}".

Details:
- Title: ${title}
- Release Date: ${releaseDate}
- Rating: ${rating}/10
- Genres: ${genres}
- Cast: ${cast}
- Overview: ${overview}

Write a detailed review covering:
1. Introduction with hook
2. Plot summary (no major spoilers)
3. Performance analysis of main cast
4. Direction and cinematography
5. Strengths and weaknesses
6. Who should watch this
7. Final verdict and rating

Use HTML formatting. Make it 1000-1500 words.`,

        news: `
Write a news article about the ${type} "${title}".

Details:
- Title: ${title}
- Release Date: ${releaseDate}
- Rating: ${rating}/10
- Genres: ${genres}
- Cast: ${cast}

Write a news-style article covering:
1. Catchy headline-style intro
2. Release information and availability
3. Cast and crew highlights
4. What fans can expect
5. Critical reception
6. Box office/streaming performance (if applicable)
7. What's next for the franchise/actors

Use HTML formatting. Make it 600-900 words.`,

        guide: `
Write a comprehensive guide for watching "${title}".

Details:
- Title: ${title}
- Type: ${type}
- Genres: ${genres}
- Overview: ${overview}

Create a helpful guide covering:
1. What to know before watching
2. Episode/watching order (for series)
3. Key themes and motifs
4. Easter eggs and references
5. Similar ${type}s to watch
6. Discussion points
7. Where to watch

Use HTML formatting with lists. Make it 800-1200 words.`,

        analysis: `
Write an in-depth analysis of "${title}".

Details:
- Title: ${title}
- Release Date: ${releaseDate}
- Genres: ${genres}
- Overview: ${overview}
- Cast: ${cast}

Provide deep analysis covering:
1. Thematic exploration
2. Character development and arcs
3. Symbolism and metaphors
4. Cinematographic choices
5. Social/cultural commentary
6. Genre conventions and subversions
7. Legacy and impact

Use HTML formatting. Make it 1200-1800 words.`,

        recommendation: `
Write a recommendation post for "${title}".

Details:
- Title: ${title}
- Genres: ${genres}
- Rating: ${rating}/10
- Overview: ${overview}

Create an engaging recommendation covering:
1. Why you should watch this
2. Perfect audience for this ${type}
3. Mood and vibe
4. Standout moments
5. Similar titles you'll love
6. When to watch (time of day, season, mood)
7. Call to action

Use HTML formatting. Make it 600-1000 words.`,

        comparison: `
Write a comparison piece featuring "${title}".

Details:
- Title: ${title}
- Genres: ${genres}
- Overview: ${overview}
- Cast: ${cast}

Create a comparison covering:
1. How it compares to similar ${type}s in the genre
2. What it does better/differently
3. Evolution of the genre
4. Cast comparison with similar works
5. Production quality comparison
6. Why choose this over alternatives
7. Final recommendation

Use HTML formatting with comparison tables. Make it 1000-1400 words.`,
    };

    return prompts[category];
}

/**
 * Fetch media with cast details from TMDb
 */
export async function fetchMediaWithCast(
    type: 'movie' | 'tv',
    id: number,
    tmdbApiKey: string
) {
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
            cast: credits.data.cast.slice(0, 15).map((c: any) => c.name), // Store top 15 cast members
            crew: credits.data.crew.slice(0, 5).map((c: any) => ({
                name: c.name,
                job: c.job,
            })),
        };
    } catch (error: any) {
        console.error(`Error fetching ${type} ${id}:`, error);
        throw error;
    }
}

/**
 * Generate blog content with category-specific prompts
 */
export async function generateCategoryBlogContent(
    media: any,
    type: 'movie' | 'tv',
    category: BlogCategory,
    aiClient: AIClient
) {
    const prompt = getCategoryPrompt(category, media, type);

    const content = await aiClient.generateContent(prompt);

    // Generate SEO metadata
    const title = media.title || media.name;
    const metaPrompt = `
For the ${category} about ${type} "${title}", generate:
1. SEO Title (50-60 characters)
2. Meta Description (150-160 characters)
3. Excerpt (200-250 characters)
4. 6-8 Keywords (comma-separated, ${category}-focused)
5. 4-6 Tags (comma-separated)

Format:
TITLE: [title]
META: [meta]
EXCERPT: [excerpt]
KEYWORDS: [keywords]
TAGS: [tags]
`;

    const metaText = await aiClient.generateContent(metaPrompt);

    // Parse metadata
    const titleMatch = metaText.match(/TITLE:\s*(.+)/);
    const metaMatch = metaText.match(/META:\s*(.+)/);
    const excerptMatch = metaText.match(/EXCERPT:\s*(.+)/);
    const keywordsMatch = metaText.match(/KEYWORDS:\s*(.+)/);
    const tagsMatch = metaText.match(/TAGS:\s*(.+)/);

    return {
        title: titleMatch?.[1]?.trim() || `${title} - ${category.charAt(0).toUpperCase() + category.slice(1)}`,
        metaDescription: metaMatch?.[1]?.trim() || media.overview?.substring(0, 160) || '',
        excerpt: excerptMatch?.[1]?.trim() || media.overview?.substring(0, 250) || '',
        keywords: keywordsMatch?.[1]?.split(',').map(k => k.trim()) || [],
        tags: tagsMatch?.[1]?.split(',').map(t => t.trim()) || [],
        content: content.trim(),
        category,
    };
}

/**
 * Smart content rotation - cycles through all strategies
 */
export async function getNextContentStrategy(
    userId: string
): Promise<{ type: 'movie' | 'tv'; sortBy: SortOption; category: BlogCategory }> {
    // Get all progress records for user
    const allProgress = await prisma.blogGenerationProgress.findMany({
        where: { userId },
        orderBy: { updatedAt: 'asc' },
    });

    if (allProgress.length === 0) {
        // First time - start with popular movies, review category
        return {
            type: 'movie',
            sortBy: 'popular',
            category: 'review',
        };
    }

    // Find the least recently updated combination
    const leastRecent = allProgress[0];

    // Determine next strategy
    const currentType = leastRecent.mediaType as 'movie' | 'tv';
    const currentSortBy = leastRecent.sortBy as SortOption;

    // Get available strategies for current type
    const strategies = CONTENT_STRATEGIES[currentType];
    const currentIndex = strategies.indexOf(currentSortBy);

    // Move to next sort option
    if (currentIndex < strategies.length - 1) {
        return {
            type: currentType,
            sortBy: strategies[currentIndex + 1],
            category: BLOG_CATEGORIES[Math.floor(Math.random() * BLOG_CATEGORIES.length)],
        };
    }

    // Switch media type and restart sort options
    const nextType = currentType === 'movie' ? 'tv' : 'movie';
    return {
        type: nextType,
        sortBy: CONTENT_STRATEGIES[nextType][0],
        category: BLOG_CATEGORIES[Math.floor(Math.random() * BLOG_CATEGORIES.length)],
    };
}

/**
 * Check if media is recent (released in last 90 days)
 */
export function isRecentRelease(media: any): boolean {
    const releaseDate = media.release_date || media.first_air_date;
    if (!releaseDate) return false;

    const release = new Date(releaseDate);
    const now = new Date();
    const daysDiff = (now.getTime() - release.getTime()) / (1000 * 60 * 60 * 24);

    return daysDiff >= 0 && daysDiff <= 90; // Released within last 90 days
}

/**
 * Prioritize new releases for news-style posts
 */
export function categorizeBySuitability(media: any, defaultCategory: BlogCategory): BlogCategory {
    if (isRecentRelease(media)) {
        // New releases are perfect for news and reviews
        return Math.random() > 0.5 ? 'news' : 'review';
    }

    // Older content is better for analysis, guides, and comparisons
    const suitableCategories: BlogCategory[] = ['review', 'guide', 'analysis', 'recommendation', 'comparison'];
    return suitableCategories[Math.floor(Math.random() * suitableCategories.length)];
}

/**
 * Create blog post with full cast and category info
 */
export async function createAdvancedBlogPost(
    media: any,
    content: {
        title: string;
        metaDescription: string;
        excerpt: string;
        keywords: string[];
        tags: string[];
        content: string;
        category: BlogCategory;
    },
    type: 'movie' | 'tv',
    authorId: string
) {
    const slug = `${content.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    // Calculate reading time
    const wordCount = content.content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

    return await prisma.blogPost.create({
        data: {
            slug,
            title: content.title,
            excerpt: content.excerpt,
            content: content.content,
            metaTitle: content.title,
            metaDescription: content.metaDescription,
            keywords: content.keywords,
            tags: content.tags,
            category: content.category,

            // Media details
            mediaId: media.id,
            mediaType: type,
            mediaTitle: media.title || media.name,
            mediaPosterPath: media.poster_path,
            mediaBackdropPath: media.backdrop_path,
            mediaReleaseDate: media.release_date || media.first_air_date,
            mediaGenres: media.genres?.map((g: any) => g.name) || [],
            mediaRating: media.vote_average,
            mediaOverview: media.overview,
            mediaCast: media.cast || [], // Store cast array

            authorId,
            readingTime,
            status: 'published',
            publishedAt: new Date(),
        },
    });
}
