'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import RichTextEditor from '@/components/RichTextEditor';
import { searchMulti } from '@/lib/tmdb';

interface MediaItem {
    id: number;
    title?: string;
    name?: string;
    media_type: 'movie' | 'tv';
    poster_path?: string;
    backdrop_path?: string;
    release_date?: string;
    first_air_date?: string;
    vote_average?: number;
    overview?: string;
}

interface EditBlogPostPageProps {
    params: Promise<{ id: string }>;
}

export default function EditBlogPostPage({ params }: EditBlogPostPageProps) {
    const router = useRouter();
    const [postId, setPostId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mediaSearch, setMediaSearch] = useState('');
    const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
    const [showMediaSearch, setShowMediaSearch] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        category: 'review',
        tags: '',
        featuredImage: '',
        metaTitle: '',
        metaDescription: '',
        keywords: '',
        ogImage: '',
        mediaId: null as number | null,
        mediaType: '' as 'movie' | 'tv' | '',
        mediaTitle: '',
        mediaPosterPath: '',
        mediaBackdropPath: '',
        mediaReleaseDate: '',
        mediaGenres: [] as string[],
        mediaRating: null as number | null,
        mediaOverview: '',
    });

    useEffect(() => {
        const loadPost = async () => {
            const resolvedParams = await params;
            setPostId(resolvedParams.id);

            try {
                const response = await fetch(`/api/admin/blog?id=${resolvedParams.id}`);
                const data = await response.json();

                if (data.posts && data.posts.length > 0) {
                    const post = data.posts[0];
                    setFormData({
                        title: post.title,
                        slug: post.slug,
                        excerpt: post.excerpt,
                        content: post.content,
                        category: post.category,
                        tags: post.tags.join(', '),
                        featuredImage: post.featuredImage || '',
                        metaTitle: post.metaTitle || '',
                        metaDescription: post.metaDescription || '',
                        keywords: post.keywords.join(', '),
                        ogImage: post.ogImage || '',
                        mediaId: post.mediaId,
                        mediaType: post.mediaType || '',
                        mediaTitle: post.mediaTitle || '',
                        mediaPosterPath: post.mediaPosterPath || '',
                        mediaBackdropPath: post.mediaBackdropPath || '',
                        mediaReleaseDate: post.mediaReleaseDate || '',
                        mediaGenres: post.mediaGenres || [],
                        mediaRating: post.mediaRating,
                        mediaOverview: post.mediaOverview || '',
                    });
                }
            } catch (error) {
                console.error('Error loading post:', error);
                alert('Failed to load post');
            } finally {
                setLoading(false);
            }
        };

        loadPost();
    }, [params]);

    const handleMediaSearch = async (query: string) => {
        setMediaSearch(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const results = await searchMulti(query);
            setSearchResults(results.slice(0, 6));
        } catch (error) {
            console.error('Media search error:', error);
        }
    };

    const selectMedia = (media: MediaItem) => {
        setFormData({
            ...formData,
            mediaId: media.id,
            mediaType: media.media_type,
            mediaTitle: media.title || media.name || '',
            mediaPosterPath: media.poster_path || '',
            mediaBackdropPath: media.backdrop_path || '',
            mediaReleaseDate: media.release_date || media.first_air_date || '',
            mediaGenres: [],
            mediaRating: media.vote_average || null,
            mediaOverview: media.overview || '',
        });
        setShowMediaSearch(false);
        setMediaSearch('');
        setSearchResults([]);
    };

    const clearMedia = () => {
        setFormData({
            ...formData,
            mediaId: null,
            mediaType: '',
            mediaTitle: '',
            mediaPosterPath: '',
            mediaBackdropPath: '',
            mediaReleaseDate: '',
            mediaGenres: [],
            mediaRating: null,
            mediaOverview: '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload = {
                id: postId,
                ...formData,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
            };

            const response = await fetch('/api/admin/blog', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.error || 'Failed to update post');
                return;
            }

            router.push('/admin/blog');
        } catch (error) {
            console.error('Error updating post:', error);
            alert('Failed to update post');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/blog"
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Edit Blog Post</h1>
                        <p className="text-gray-400 mt-1">Update existing blog post</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
                    <h2 className="text-xl font-semibold text-white">Basic Information</h2>

                    <div>
                        <label className="block text-gray-300 mb-2">Title *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                            placeholder="Enter post title"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 mb-2">Slug *</label>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            required
                            className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                            placeholder="url-friendly-slug"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 mb-2">Excerpt *</label>
                        <textarea
                            value={formData.excerpt}
                            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                            required
                            rows={3}
                            className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                            placeholder="Brief summary of the post"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-300 mb-2">Category *</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                            >
                                <option value="review">Review</option>
                                <option value="news">News</option>
                                <option value="guide">Guide</option>
                                <option value="analysis">Analysis</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-gray-300 mb-2">Tags</label>
                            <input
                                type="text"
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                                placeholder="tag1, tag2, tag3"
                            />
                            <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-300 mb-2">Featured Image URL</label>
                        <input
                            type="url"
                            value={formData.featuredImage}
                            onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                            className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
                    <h2 className="text-xl font-semibold text-white">Content *</h2>
                    <RichTextEditor
                        value={formData.content}
                        onChange={(content) => setFormData({ ...formData, content })}
                        placeholder="Write your blog post content here. Use the toolbar for formatting."
                    />
                </div>

                {/* Media Reference */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white">Media Reference</h2>
                        {!showMediaSearch && !formData.mediaId && (
                            <button
                                type="button"
                                onClick={() => setShowMediaSearch(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                Add Movie/TV Show
                            </button>
                        )}
                    </div>

                    {showMediaSearch && (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={mediaSearch}
                                    onChange={(e) => handleMediaSearch(e.target.value)}
                                    placeholder="Search for a movie or TV show"
                                    className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowMediaSearch(false);
                                        setMediaSearch('');
                                        setSearchResults([]);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="bg-gray-800 rounded-lg border border-gray-700 divide-y divide-gray-700">
                                    {searchResults.map((media) => (
                                        <button
                                            key={`${media.media_type}-${media.id}`}
                                            type="button"
                                            onClick={() => selectMedia(media)}
                                            className="w-full flex items-center gap-4 p-4 hover:bg-gray-700 transition-colors text-left"
                                        >
                                            {media.poster_path && (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w92${media.poster_path}`}
                                                    alt={media.title || media.name}
                                                    className="w-12 h-18 object-cover rounded"
                                                />
                                            )}
                                            <div className="flex-1">
                                                <div className="text-white font-medium">
                                                    {media.title || media.name}
                                                </div>
                                                <div className="text-sm text-gray-400">
                                                    {media.media_type === 'movie' ? '🎬 Movie' : '📺 TV Show'} •{' '}
                                                    {media.release_date || media.first_air_date}
                                                </div>
                                                <div className="text-xs text-blue-400 mt-0.5">
                                                    ID: {media.id}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {formData.mediaId && (
                        <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-4">
                                {formData.mediaPosterPath && (
                                    <img
                                        src={`https://image.tmdb.org/t/p/w92${formData.mediaPosterPath}`}
                                        alt={formData.mediaTitle}
                                        className="w-12 h-18 object-cover rounded"
                                    />
                                )}
                                <div className="flex-1">
                                    <div className="text-white font-medium">{formData.mediaTitle}</div>
                                    <div className="text-sm text-gray-400">
                                        {formData.mediaType === 'movie' ? '🎬 Movie' : '📺 TV Show'}
                                        {formData.mediaRating && ` • ⭐ ${formData.mediaRating.toFixed(1)}`}
                                    </div>
                                    <div className="text-xs text-blue-400 mt-1">
                                        TMDb ID: {formData.mediaId}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={clearMedia}
                                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Link Preview */}
                            <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                                <div className="text-xs text-gray-400 mb-1">Users will be redirected to:</div>
                                <a
                                    href={`/${formData.mediaType}/${formData.mediaId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-400 hover:text-blue-300 underline"
                                >
                                    /{formData.mediaType}/{formData.mediaId}
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* SEO Settings */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
                    <h2 className="text-xl font-semibold text-white">SEO Settings</h2>

                    <div>
                        <label className="block text-gray-300 mb-2">Meta Title</label>
                        <input
                            type="text"
                            value={formData.metaTitle}
                            onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                            className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                            placeholder="Leave blank to use post title"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 mb-2">Meta Description</label>
                        <textarea
                            value={formData.metaDescription}
                            onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                            rows={3}
                            className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                            placeholder="Leave blank to use excerpt"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 mb-2">Keywords</label>
                        <input
                            type="text"
                            value={formData.keywords}
                            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                            className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                            placeholder="keyword1, keyword2, keyword3"
                        />
                        <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
                    </div>

                    <div>
                        <label className="block text-gray-300 mb-2">OG Image URL</label>
                        <input
                            type="url"
                            value={formData.ogImage}
                            onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                            className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                            placeholder="Leave blank to use featured image"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4">
                    <Link
                        href="/admin/blog"
                        className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
