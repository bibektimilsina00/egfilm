import { Metadata } from 'next';
import { Tag, Film, Calendar, User, Tv } from 'lucide-react';
import { getPublishedBlogPosts } from '@/lib/services/blogService';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import BlogCard from '@/components/blog/BlogCard';
import BlogFilters from '@/components/blog/BlogFilters';
import Link from 'next/link';

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
        search?: string;
        mediaType?: string;
    }>;
}

export default async function BlogPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const page = parseInt(params.page || '1');
    const category = params.category;
    const search = params.search;
    const mediaType = params.mediaType as 'movie' | 'tv' | undefined;

    const filters: any = {};
    if (category) filters.category = category;
    if (search) filters.search = search;
    if (mediaType) filters.mediaType = mediaType;

    const { posts, total, pages } = await getPublishedBlogPosts(
        filters,
        page,
        12
    );

    const categories = [
        { value: 'all', label: 'All Posts', icon: 'Tag' },
        { value: 'review', label: 'Reviews', icon: 'Film' },
        { value: 'news', label: 'News', icon: 'Calendar' },
        { value: 'guide', label: 'Guides', icon: 'Tv' },
        { value: 'analysis', label: 'Analysis', icon: 'User' },
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

            {/* Filters Bar - Categories, Media Type, and Search */}
            <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-[73px] z-40">
                <div className="container mx-auto px-4 py-4">
                    <BlogFilters categories={categories} currentCategory={category} />
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
                                <BlogCard key={post.id} post={post} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {pages > 1 && (() => {
                            const buildPageUrl = (pageNum: number) => {
                                const queryParams = new URLSearchParams();
                                queryParams.set('page', pageNum.toString());
                                if (category) queryParams.set('category', category);
                                if (search) queryParams.set('search', search);
                                if (mediaType) queryParams.set('mediaType', mediaType);
                                return `/blog?${queryParams.toString()}`;
                            };

                            return (
                                <div className="flex justify-center gap-2">
                                    {page > 1 && (
                                        <Link
                                            href={buildPageUrl(page - 1)}
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
                                                    href={buildPageUrl(pageNum)}
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
                                            href={buildPageUrl(page + 1)}
                                            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                        >
                                            Next
                                        </Link>
                                    )}
                                </div>
                            );
                        })()}

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
