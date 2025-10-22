'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, MoreVertical, Settings } from 'lucide-react';
import Link from 'next/link';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    category: string;
    status: 'draft' | 'published' | 'archived';
    publishedAt: string | null;
    viewCount: number;
    author: {
        name: string;
    };
    mediaTitle?: string;
    mediaType?: string;
    mediaId?: number;
}

export default function AdminBlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchPosts();
    }, [searchQuery, statusFilter, categoryFilter, page]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
            });
            if (searchQuery) params.append('search', searchQuery);
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (categoryFilter !== 'all') params.append('category', categoryFilter);

            const response = await fetch(`/api/admin/blog?${params}`);
            const data = await response.json();

            setPosts(data.posts || []);
            setTotalPages(data.pages || 1);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const response = await fetch(`/api/admin/blog?id=${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                fetchPosts();
            }
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };

    const handleTogglePublish = async (id: string, currentStatus: string) => {
        try {
            const endpoint = currentStatus === 'published'
                ? `/api/admin/blog/publish?id=${id}`
                : `/api/admin/blog/publish?id=${id}`;

            const method = currentStatus === 'published' ? 'DELETE' : 'POST';

            const response = await fetch(endpoint, { method });

            if (response.ok) {
                fetchPosts();
            }
        } catch (error) {
            console.error('Error toggling publish status:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Blog Management</h1>
                    <p className="text-gray-400 mt-1">Create and manage blog posts</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/admin/settings/ai"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700"
                        title="Configure AI Settings"
                    >
                        <Settings className="w-5 h-5" />
                        AI Settings
                    </Link>
                    <Link
                        href="/admin/blog/auto-generate"
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-lg transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI Auto-Generate
                    </Link>
                    <Link
                        href="/admin/blog/new"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        New Post
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search posts..."
                                className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                    </select>

                    {/* Category Filter */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                    >
                        <option value="all">All Categories</option>
                        <option value="review">Review</option>
                        <option value="news">News</option>
                        <option value="guide">Guide</option>
                        <option value="analysis">Analysis</option>
                    </select>
                </div>
            </div>

            {/* Posts Table */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400">No posts found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-800 border-b border-gray-700">
                                <tr>
                                    <th className="text-left px-6 py-4 text-gray-300 font-semibold">Title</th>
                                    <th className="text-left px-6 py-4 text-gray-300 font-semibold">Category</th>
                                    <th className="text-left px-6 py-4 text-gray-300 font-semibold">Status</th>
                                    <th className="text-left px-6 py-4 text-gray-300 font-semibold">Views</th>
                                    <th className="text-left px-6 py-4 text-gray-300 font-semibold">Published</th>
                                    <th className="text-right px-6 py-4 text-gray-300 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {posts.map((post) => (
                                    <tr key={post.id} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-white">{post.title}</div>
                                                <div className="text-sm text-gray-400 mt-1">
                                                    {post.mediaTitle && (
                                                        <span className="text-blue-400">
                                                            {post.mediaType === 'movie' ? '🎬' : '📺'} {post.mediaTitle}
                                                            {post.mediaId && (
                                                                <span className="text-gray-500 ml-2">
                                                                    (ID: {post.mediaId})
                                                                </span>
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-full capitalize">
                                                {post.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full capitalize ${post.status === 'published'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : post.status === 'draft'
                                                        ? 'bg-yellow-500/20 text-yellow-400'
                                                        : 'bg-gray-500/20 text-gray-400'
                                                    }`}
                                            >
                                                {post.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">{post.viewCount}</td>
                                        <td className="px-6 py-4 text-gray-400 text-sm">
                                            {post.publishedAt
                                                ? new Date(post.publishedAt).toLocaleDateString()
                                                : 'Not published'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/admin/blog/${post.id}/edit`}
                                                    className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleTogglePublish(post.id, post.status)}
                                                    className="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-800 rounded-lg transition-colors"
                                                    title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                                                >
                                                    {post.status === 'published' ? (
                                                        <EyeOff className="w-4 h-4" />
                                                    ) : (
                                                        <Eye className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(post.id)}
                                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-gray-400">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
