import { prisma } from '@/lib/prisma';
import type { BlogPost, Prisma } from '@prisma/client';

// Type for BlogPost with author relation
export type BlogPostWithAuthor = BlogPost & {
    author: {
        id: string;
        name: string | null;
        role: string;
    };
};

export interface CreateBlogPostInput {
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    ogImage?: string;
    mediaId?: number;
    mediaType?: 'movie' | 'tv';
    mediaTitle?: string;
    mediaPosterPath?: string;
    mediaBackdropPath?: string;
    mediaReleaseDate?: string;
    mediaGenres?: string[];
    mediaRating?: number;
    mediaOverview?: string;
    authorId: string;
    category?: string;
    tags?: string[];
    featuredImage?: string;
    readingTime?: number;
    status?: 'draft' | 'published' | 'archived';
}

export interface UpdateBlogPostInput extends Partial<CreateBlogPostInput> {
    id: string;
}

export interface BlogPostFilters {
    status?: 'draft' | 'published' | 'archived';
    category?: string;
    authorId?: string;
    mediaType?: 'movie' | 'tv';
    tag?: string;
    search?: string;
}

// Create a new blog post
export async function createBlogPost(data: CreateBlogPostInput): Promise<BlogPost> {
    return prisma.blogPost.create({
        data: {
            ...data,
            keywords: data.keywords || [],
            tags: data.tags || [],
            mediaGenres: data.mediaGenres || [],
            publishedAt: data.status === 'published' ? new Date() : null,
        },
    });
}

// Update a blog post
export async function updateBlogPost(data: UpdateBlogPostInput): Promise<BlogPost> {
    const { id, ...updateData } = data;

    const shouldUpdatePublishedAt =
        updateData.status === 'published' &&
        !(await prisma.blogPost.findUnique({ where: { id }, select: { publishedAt: true } }))?.publishedAt;

    return prisma.blogPost.update({
        where: { id },
        data: {
            ...updateData,
            publishedAt: shouldUpdatePublishedAt ? new Date() : undefined,
        },
    });
}

// Delete a blog post
export async function deleteBlogPost(id: string): Promise<void> {
    await prisma.blogPost.delete({ where: { id } });
}

// Get a blog post by ID
export async function getBlogPostById(id: string): Promise<BlogPost | null> {
    return prisma.blogPost.findUnique({
        where: { id },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
}

// Get a blog post by slug (for public pages)
export async function getBlogPostBySlug(slug: string): Promise<BlogPostWithAuthor | null> {
    const post = await prisma.blogPost.findUnique({
        where: { slug },
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                },
            },
        },
    });

    // Increment view count
    if (post && post.status === 'published') {
        await prisma.blogPost.update({
            where: { id: post.id },
            data: { viewCount: { increment: 1 } },
        });
    }

    return post;
}

// Get all blog posts with filters and pagination
export async function getBlogPosts(
    filters: BlogPostFilters = {},
    page: number = 1,
    limit: number = 10
): Promise<{ posts: BlogPostWithAuthor[]; total: number; pages: number }> {
    const where: Prisma.BlogPostWhereInput = {};

    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.authorId) where.authorId = filters.authorId;
    if (filters.mediaType) where.mediaType = filters.mediaType;
    if (filters.tag) where.tags = { has: filters.tag };
    if (filters.search) {
        where.OR = [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { excerpt: { contains: filters.search, mode: 'insensitive' } },
            { content: { contains: filters.search, mode: 'insensitive' } },
        ];
    }

    const [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
            where,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
            },
            orderBy: { publishedAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.blogPost.count({ where }),
    ]);

    return {
        posts,
        total,
        pages: Math.ceil(total / limit),
    };
}

// Get published blog posts only (for public pages)
export async function getPublishedBlogPosts(
    filters: Omit<BlogPostFilters, 'status'> = {},
    page: number = 1,
    limit: number = 10
): Promise<{ posts: BlogPostWithAuthor[]; total: number; pages: number }> {
    return getBlogPosts({ ...filters, status: 'published' }, page, limit);
}

// Get related blog posts (by media ID or tags)
export async function getRelatedBlogPosts(
    postId: string,
    limit: number = 3
): Promise<BlogPostWithAuthor[]> {
    const post = await prisma.blogPost.findUnique({
        where: { id: postId },
        select: { mediaId: true, mediaType: true, tags: true },
    });

    if (!post) return [];

    return prisma.blogPost.findMany({
        where: {
            AND: [
                { id: { not: postId } },
                { status: 'published' },
                {
                    OR: [
                        post.mediaId ? { mediaId: post.mediaId, mediaType: post.mediaType } : {},
                        post.tags.length > 0 ? { tags: { hasSome: post.tags } } : {},
                    ],
                },
            ],
        },
        orderBy: { publishedAt: 'desc' },
        take: limit,
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                },
            },
        },
    });
}

// Get popular blog posts
export async function getPopularBlogPosts(limit: number = 5): Promise<BlogPostWithAuthor[]> {
    return prisma.blogPost.findMany({
        where: { status: 'published' },
        orderBy: { viewCount: 'desc' },
        take: limit,
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                },
            },
        },
    });
}

// Get recent blog posts
export async function getRecentBlogPosts(limit: number = 5): Promise<BlogPostWithAuthor[]> {
    return prisma.blogPost.findMany({
        where: { status: 'published' },
        orderBy: { publishedAt: 'desc' },
        take: limit,
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                },
            },
        },
    });
}

// Publish a blog post
export async function publishBlogPost(id: string): Promise<BlogPost> {
    return prisma.blogPost.update({
        where: { id },
        data: {
            status: 'published',
            publishedAt: new Date(),
        },
    });
}

// Unpublish a blog post
export async function unpublishBlogPost(id: string): Promise<BlogPost> {
    return prisma.blogPost.update({
        where: { id },
        data: {
            status: 'draft',
        },
    });
}

// Check if slug is available
export async function isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    const existing = await prisma.blogPost.findUnique({
        where: { slug },
        select: { id: true },
    });

    if (!existing) return true;
    if (excludeId && existing.id === excludeId) return true;
    return false;
}

// Generate unique slug
export async function generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (!(await isSlugAvailable(slug))) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
}
