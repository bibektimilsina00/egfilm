'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Clock, Calendar, User, Tag, ArrowLeft, ExternalLink, Film, Tv, Share2, Heart, MessageCircle, Send, Users } from 'lucide-react';
import { useBlogLikes, useToggleBlogLike, useBlogComments, useCreateBlogComment } from '@/lib/hooks/useBlog';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    tags: string[];
    readingTime: number;
    viewCount: number;
    publishedAt: Date | null;
    featuredImage: string | null;
    mediaId: number | null;
    mediaType: string | null;
    mediaTitle: string | null;
    mediaOverview: string | null;
    mediaPosterPath: string | null;
    mediaBackdropPath: string | null;
    mediaRating: number | null;
    mediaCast: string[]; // Array of cast member names
    author: {
        name: string;
        role?: string;
    };
}

interface RelatedPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    featuredImage: string | null;
    mediaBackdropPath: string | null;
}

interface CastMember {
    name: string;
    character?: string;
    profile_path?: string | null;
}

interface BlogPostClientProps {
    post: {
        id: string;
        slug: string;
        title: string;
        excerpt: string;
        content: string;
        category: string;
        tags?: string[];
        publishedAt: Date | string;
        readingTime: number;
        viewCount: number;
        featuredImage: string | null;
        mediaId: number | null;
        mediaTitle: string | null;
        mediaType: string | null;
        mediaOverview: string | null;
        mediaPosterPath: string | null;
        mediaBackdropPath: string | null;
        mediaGenres: string[];
        mediaRating: number | null;
        mediaCast: (CastMember | string)[] | null; // Array of cast objects with images OR strings
        author: {
            name: string;
            role?: string;
        };
    };
    relatedPosts?: RelatedPost[];
    postUrl: string;
}

interface Comment {
    id: string;
    content: string;
    createdAt: Date;
    user: {
        name: string;
    };
    replies?: Comment[];
}

export default function BlogPostClient({ post, relatedPosts, postUrl }: BlogPostClientProps) {
    const { data: session, status } = useSession();
    const [copySuccess, setCopySuccess] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [showComments, setShowComments] = useState(true);

    // React Query hooks for likes and comments
    const { data: likesData, error: likesError, isLoading: likesLoading } = useBlogLikes(post.slug);
    const toggleLikeMutation = useToggleBlogLike(post.slug);
    const { data: comments = [], error: commentsError, isLoading: commentsLoading } = useBlogComments(post.slug);
    const createCommentMutation = useCreateBlogComment(post.slug);

    const isLiked = likesData?.isLiked || false;
    const likeCount = likesData?.count || 0;

    // Debug logging
    if (likesError) console.error('Likes error:', likesError);
    if (commentsError) console.error('Comments error:', commentsError);

    const handleLike = () => {
        if (status !== 'authenticated') {
            alert('Please login to like this post');
            return;
        }

        toggleLikeMutation.mutate();
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (status !== 'authenticated') {
            alert('Please login to comment');
            return;
        }

        if (!commentText.trim()) return;

        createCommentMutation.mutate(
            { content: commentText },
            {
                onSuccess: () => {
                    setCommentText('');
                },
            }
        );
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(postUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    return (
        <article className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <Link href="/" className="hover:text-blue-400 transition-colors">
                    Home
                </Link>
                <span>/</span>
                <Link href="/blog" className="hover:text-blue-400 transition-colors">
                    Blog
                </Link>
                <span>/</span>
                <span className="text-gray-300">{post.title}</span>
            </nav>

            {/* Back Button */}
            <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Blog
            </Link>

            {/* Featured Image */}
            {(post.featuredImage || post.mediaBackdropPath) && (
                <div className="relative w-full h-[400px] rounded-xl overflow-hidden mb-8">
                    <Image
                        src={
                            post.featuredImage ||
                            `https://image.tmdb.org/t/p/original${post.mediaBackdropPath}`
                        }
                        alt={post.title}
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent" />
                </div>
            )}

            {/* Article Header */}
            <header className="mb-8">
                {/* Category Badge */}
                <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                        {post.category}
                    </span>
                    {post.tags?.slice(0, 3).map((tag: string) => (
                        <span
                            key={tag}
                            className="px-3 py-1 bg-gray-800 text-gray-300 text-sm rounded-full"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                    {post.title}
                </h1>

                {/* Excerpt */}
                <p className="text-xl text-gray-300 mb-6 leading-relaxed">{post.excerpt}</p>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-6 text-gray-400 pb-6 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        <span className="font-medium text-white">
                            {post.author.role === 'admin' ? 'Egfilm Admin' : post.author.name}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        {post.publishedAt && new Date(post.publishedAt).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                        })}
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        {post.readingTime} min read
                    </div>
                    <div className="flex items-center gap-2">
                        <Tag className="w-5 h-5" />
                        {post.viewCount} views
                    </div>
                </div>
            </header>

            {/* Link to Movie/TV Page */}
            {post.mediaId && post.mediaType && (
                <div className="bg-gradient-to-r from-blue-600/10 to-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-8">
                    <div className="flex items-start gap-4">
                        {post.mediaPosterPath && (
                            <div className="relative w-20 h-28 rounded-lg overflow-hidden shrink-0">
                                <Image
                                    src={`https://image.tmdb.org/t/p/w200${post.mediaPosterPath}`}
                                    alt={post.mediaTitle || ''}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 text-blue-400 text-sm mb-2">
                                {post.mediaType === 'movie' ? (
                                    <Film className="w-4 h-4" />
                                ) : (
                                    <Tv className="w-4 h-4" />
                                )}
                                <span className="uppercase font-medium">{post.mediaType}</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{post.mediaTitle}</h3>
                            {post.mediaOverview && (
                                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                    {post.mediaOverview}
                                </p>
                            )}
                            {post.mediaRating && (
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-yellow-400 font-bold">★ {post.mediaRating.toFixed(1)}</span>
                                    <span className="text-gray-500">/ 10</span>
                                </div>
                            )}
                            <Link
                                href={`/${post.mediaType}/${post.mediaId}`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                            >
                                Watch on Egfilm
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Cast Section */}
            {post.mediaCast && post.mediaCast.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-5 h-5 text-blue-400" />
                        <h3 className="text-xl font-bold text-white">
                            Featured Cast & Crew
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {post.mediaCast.slice(0, 12).map((member, index) => {
                            // Handle both string and CastMember object types
                            const memberName = typeof member === 'string' ? member : member.name;
                            const memberCharacter = typeof member === 'string' ? null : member.character;
                            const memberProfile = typeof member === 'string' ? null : member.profile_path;

                            return (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                                >
                                    {memberProfile ? (
                                        <Image
                                            src={`https://image.tmdb.org/t/p/w185${memberProfile}`}
                                            alt={memberName}
                                            width={32}
                                            height={32}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                            {memberName?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-gray-300 truncate font-medium">
                                            {memberName}
                                        </p>
                                        {memberCharacter && (
                                            <p className="text-xs text-gray-500 truncate">
                                                {memberCharacter}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {post.mediaCast.length > 12 && (
                        <p className="text-xs text-gray-500 mt-3">
                            + {post.mediaCast.length - 12} more cast & crew members
                        </p>
                    )}
                </div>
            )}

            {/* Article Content */}
            <div
                className="blog-content prose prose-invert prose-lg max-w-none mb-12"
                dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Like and Share Actions */}
            <div className="flex items-center justify-between pt-8 border-t border-gray-800 mb-8">
                <div className="flex items-center gap-4">
                    {/* Like Button */}
                    <button
                        onClick={handleLike}
                        disabled={status === 'loading' || toggleLikeMutation.isPending || likesLoading}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all disabled:opacity-50 ${isLiked
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                    >
                        <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                        <span className="font-medium">{likesLoading ? '...' : likeCount}</span>
                    </button>

                    {/* Comments Button */}
                    <button
                        onClick={() => setShowComments(!showComments)}
                        disabled={commentsLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span className="font-medium">{commentsLoading ? '...' : comments.length}</span>
                    </button>
                </div>

                {/* Share Button */}
                <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors relative"
                >
                    <Share2 className="w-5 h-5" />
                    <span className="font-medium">Share</span>
                    {copySuccess && (
                        <span className="absolute -top-8 right-0 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            Link copied!
                        </span>
                    )}
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="border-t border-gray-800 pt-8 mb-12">
                    <h3 className="text-2xl font-bold text-white mb-6">
                        Comments ({comments.length})
                    </h3>

                    {/* Comment Form */}
                    {status === 'authenticated' ? (
                        <form onSubmit={handleComment} className="mb-8">
                            <div className="flex gap-3">
                                <textarea
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Add a comment..."
                                    className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                                    rows={3}
                                />
                                <button
                                    type="submit"
                                    disabled={createCommentMutation.isPending || !commentText.trim()}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 self-start"
                                >
                                    <Send className="w-4 h-4" />
                                    {createCommentMutation.isPending ? 'Posting...' : 'Post'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8 text-center">
                            <p className="text-gray-400 mb-4">Please login to comment on this post</p>
                            <Link
                                href="/login"
                                className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                Login
                            </Link>
                        </div>
                    )}

                    {/* Comments List */}
                    <div className="space-y-6">
                        {comments.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No comments yet. Be the first to comment!</p>
                            </div>
                        ) : (
                            comments.map((comment) => (
                                <div
                                    key={comment.id}
                                    className="bg-gray-900/50 border border-gray-800 rounded-lg p-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                                            {comment.user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-medium text-white">
                                                    {comment.user?.name || 'Unknown User'}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-gray-300 leading-relaxed">
                                                {comment.content}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Related Posts */}
            {relatedPosts && relatedPosts.length > 0 && (
                <section className="mt-16">
                    <h2 className="text-2xl font-bold text-white mb-6">Related Posts</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {relatedPosts.map((relatedPost: RelatedPost) => (
                            <Link
                                key={relatedPost.id}
                                href={`/blog/${relatedPost.slug}`}
                                className="group bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800 hover:border-blue-500/50 transition-all"
                            >
                                <div className="relative h-40 bg-gray-800">
                                    {relatedPost.featuredImage || relatedPost.mediaBackdropPath ? (
                                        <Image
                                            src={
                                                relatedPost.featuredImage ||
                                                `https://image.tmdb.org/t/p/w500${relatedPost.mediaBackdropPath}`
                                            }
                                            alt={relatedPost.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Film className="w-12 h-12 text-gray-600" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                                        {relatedPost.title}
                                    </h3>
                                    <p className="text-sm text-gray-400 line-clamp-2">{relatedPost.excerpt}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Inline styles for blog content */}
            <style jsx global>{`
                .blog-content h2 {
                    color: #fff;
                    font-size: 1.875rem;
                    font-weight: 700;
                    margin-top: 2rem;
                    margin-bottom: 1rem;
                }
                .blog-content h3 {
                    color: #fff;
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                }
                .blog-content p {
                    color: #d1d5db;
                    margin-bottom: 1.25rem;
                    line-height: 1.75;
                }
                .blog-content a {
                    color: #60a5fa;
                    text-decoration: underline;
                }
                .blog-content a:hover {
                    color: #93c5fd;
                }
                .blog-content ul,
                .blog-content ol {
                    margin-left: 1.5rem;
                    margin-bottom: 1.25rem;
                }
                .blog-content li {
                    margin-bottom: 0.5rem;
                }
                .blog-content strong {
                    color: #fff;
                    font-weight: 600;
                }
                .blog-content blockquote {
                    border-left: 4px solid #3b82f6;
                    padding-left: 1rem;
                    font-style: italic;
                    color: #9ca3af;
                    margin: 1.5rem 0;
                }
                .blog-content code {
                    background-color: #1f2937;
                    padding: 0.125rem 0.25rem;
                    border-radius: 0.25rem;
                    font-size: 0.875em;
                }
                .blog-content pre {
                    background-color: #1f2937;
                    padding: 1rem;
                    border-radius: 0.5rem;
                    overflow-x: auto;
                    margin: 1.5rem 0;
                }
                .blog-content img {
                    border-radius: 0.5rem;
                    margin: 1.5rem 0;
                }
            `}</style>
        </article>
    );
}
