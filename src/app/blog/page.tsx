import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { Clock, Calendar, User, Tag, Film, Tv } from 'lucide-react';
import { getPublishedBlogPosts } from '@/lib/services/blogService';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
    title: 'Blog - Movie & TV Show Reviews, News & Guides | Egfilm',
    description: 'Discover in-depth movie reviews, TV show analysis, streaming guides, and entertainment news. Expert insights on the latest releases and timeless classics.',
    keywords: 'movie reviews, TV show reviews, film analysis, streaming guides, movie news, entertainment blog',
    openGraph: {
        title: 'Egfilm Blog - Movie & TV Show Reviews',
        description: 'In-depth reviews, analysis, and guides for movies and TV shows',
        type: 'website',
        siteName: 'Egfilm',
    },
    alternates: {
        canonical: '/blog',
    },
};

interface PageProps {
    searchParams: Promise<{
        page?: string;
        category?: string;
    }>;
}

export default async function BlogPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const page = parseInt(params.page || '1');
    const category = params.category;

    const { posts, total, pages } = await getPublishedBlogPosts(
        category ? { category } : {},
        page,
        12
    );

    const categories = [
        { value: 'all', label: 'All Posts', icon: Tag },
        { value: 'review', label: 'Reviews', icon: Film },
        { value: 'news', label: 'News', icon: Calendar },
        { value: 'guide', label: 'Guides', icon: Tv },
        { value: 'analysis', label: 'Analysis', icon: User },
    ];

    return (
        <div className="min-h-screen bg-gray-950">
            <Navigation />

            {/* Hero Section */}
            <div className="bg-gradient-to-b from-blue-950/20 to-gray-950 border-b border-gray-800">
                <div className="container mx-auto px-4 py-12 md:py-16">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Egfilm Blog
                        </h1>
                        <p className="text-xl text-gray-300">
                            In-depth reviews, analysis, and guides for movies and TV shows
                        </p>
                    </div>
                </div>
            </div>

            {/* Category Filters */}
            <div className="border-b border-gray-800 sticky top-[73px] bg-gray-950/95 backdrop-blur-md z-40">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {categories.map((cat) => {
                            const Icon = cat.icon;
                            const isActive = category === cat.value || (!category && cat.value === 'all');
                            return (
                                <Link
                                    key={cat.value}
                                    href={cat.value === 'all' ? '/blog' : `/blog?category=${cat.value}`}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-300 hover:bg-blue-600/20 hover:text-blue-200'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {cat.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8 md:py-12">
                {posts.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Film className="w-12 h-12 text-gray-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">No posts found</h2>
                        <p className="text-gray-400">Check back soon for new content!</p>
                    </div>
                ) : (
                    <>
                        {/* Blog Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                            {posts.map((post: any) => (
                                <article
                                    key={post.id}
                                    className="group bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800 hover:border-blue-500/50 transition-all duration-300"
                                >
                                    <Link href={`/blog/${post.slug}`}>
                                        {/* Featured Image */}
                                        <div className="relative h-48 bg-gray-800 overflow-hidden">
                                            {post.featuredImage || post.mediaBackdropPath ? (
                                                <Image
                                                    src={
                                                        post.featuredImage ||
                                                        `https://image.tmdb.org/t/p/w500${post.mediaBackdropPath}`
                                                    }
                                                    alt={post.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Film className="w-16 h-16 text-gray-600" />
                                                </div>
                                            )}
                                            {/* Category Badge */}
                                            <div className="absolute top-3 left-3">
                                                <span className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                                                    {post.category}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5">
                                            {/* Meta Info */}
                                            <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {post.readingTime} min read
                                                </div>
                                            </div>

                                            {/* Title */}
                                            <h2 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                                                {post.title}
                                            </h2>

                                            {/* Excerpt */}
                                            <p className="text-gray-400 text-sm line-clamp-3 mb-4">{post.excerpt}</p>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <User className="w-4 h-4" />
                                                    {post.author.name}
                                                </div>
                                                {post.mediaType && (
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        {post.mediaType === 'movie' ? (
                                                            <Film className="w-3 h-3" />
                                                        ) : (
                                                            <Tv className="w-3 h-3" />
                                                        )}
                                                        {post.mediaTitle}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </article>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pages > 1 && (
                            <div className="flex justify-center gap-2">
                                {page > 1 && (
                                    <Link
                                        href={`/blog?page=${page - 1}${category ? `&category=${category}` : ''}`}
                                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        Previous
                                    </Link>
                                )}
                                <div className="flex items-center gap-2">
                                    {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                                        const pageNum = i + 1;
                                        return (
                                            <Link
                                                key={pageNum}
                                                href={`/blog?page=${pageNum}${category ? `&category=${category}` : ''}`}
                                                className={`px-4 py-2 rounded-lg transition-colors ${page === pageNum
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                    }`}
                                            >
                                                {pageNum}
                                            </Link>
                                        );
                                    })}
                                </div>
                                {page < pages && (
                                    <Link
                                        href={`/blog?page=${page + 1}${category ? `&category=${category}` : ''}`}
                                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        Next
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* Total Posts */}
                        <div className="text-center mt-8 text-gray-400">
                            Showing {(page - 1) * 12 + 1}-{Math.min(page * 12, total)} of {total} posts
                        </div>
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}
