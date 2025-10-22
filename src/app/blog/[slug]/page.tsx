import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getBlogPostBySlug, getRelatedBlogPosts } from '@/lib/services/blogService';
import { generateBlogMetadata, structuredData } from '@/lib/seo';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import BlogPostClient from '@/components/blog/BlogPostClient';

// Force dynamic rendering to ensure view count updates on each visit
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);

    if (!post) {
        return {
            title: 'Post Not Found | Egfilm',
        };
    }

    const siteUrl = process.env.NEXTAUTH_URL || 'https://egfilm.com';
    const imageUrl = post.ogImage || post.featuredImage || post.mediaBackdropPath
        ? `https://image.tmdb.org/t/p/original${post.mediaBackdropPath}`
        : `${siteUrl}/og-image.jpg`;

    return generateBlogMetadata({
        title: post.metaTitle || post.title,
        description: post.metaDescription || post.excerpt,
        slug: post.slug,
        imageUrl: imageUrl,
        publishedAt: post.publishedAt?.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        author: post.author.name,
        category: post.category,
        tags: post.tags,
    });
}

export default async function BlogPostPage({ params }: PageProps) {
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);

    if (!post || post.status !== 'published') {
        notFound();
    }

    const relatedPosts = await getRelatedBlogPosts(post.id, 3);
    const siteUrl = process.env.NEXTAUTH_URL || 'https://egfilm.com';
    const postUrl = `${siteUrl}/blog/${post.slug}`;

    // Generate appropriate structured data based on content type
    let postStructuredData;
    if (post.mediaId && post.mediaType === 'movie' && post.category === 'review') {
        postStructuredData = structuredData.review({
            mediaType: 'movie',
            mediaTitle: post.mediaTitle!,
            mediaImage: post.mediaBackdropPath
                ? `https://image.tmdb.org/t/p/original${post.mediaBackdropPath}`
                : '',
            mediaUrl: `${siteUrl}/movie/${post.mediaId}`,
            rating: post.mediaRating,
            author: post.author.name,
            content: post.excerpt,
            publishedAt: post.publishedAt!.toISOString(),
        });
    } else if (post.mediaId && post.mediaType === 'tv' && post.category === 'review') {
        postStructuredData = structuredData.review({
            mediaType: 'tv',
            mediaTitle: post.mediaTitle!,
            mediaImage: post.mediaBackdropPath
                ? `https://image.tmdb.org/t/p/original${post.mediaBackdropPath}`
                : '',
            mediaUrl: `${siteUrl}/tv/${post.mediaId}`,
            rating: post.mediaRating,
            author: post.author.name,
            content: post.excerpt,
            publishedAt: post.publishedAt!.toISOString(),
        });
    } else {
        postStructuredData = structuredData.blogPost({
            title: post.title,
            description: post.excerpt,
            author: post.author.name,
            publishedAt: post.publishedAt!.toISOString(),
            updatedAt: post.updatedAt.toISOString(),
            imageUrl: post.featuredImage || '',
            slug: post.slug,
            tags: post.tags,
            category: post.category,
        });
    }

    // Generate breadcrumb structured data
    const breadcrumbData = structuredData.breadcrumbList([
        { name: 'Home', url: '/' },
        { name: 'Blog', url: '/blog' },
        { name: post.title, url: `/blog/${post.slug}` },
    ]);

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Add structured data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(postStructuredData) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
            />

            <Navigation />

            <BlogPostClient post={post} relatedPosts={relatedPosts} postUrl={postUrl} />

            <Footer />
        </div>
    );
}
