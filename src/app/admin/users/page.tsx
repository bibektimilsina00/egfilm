'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import { Trash2, Ban, CheckCircle, Edit } from 'lucide-react';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    isBanned: boolean;
    createdAt: string;
}

export default function UsersPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');

    // Fetch users
    const { data: usersData = { users: [], total: 0 }, isLoading } = useQuery({
        queryKey: ['admin', 'users', searchTerm, filterRole],
        queryFn: async () => {
            const res = await axios.get('/api/admin/users', {
                params: { search: searchTerm, role: filterRole === 'all' ? undefined : filterRole },
            });
            return res.data;
        },
        staleTime: 1000 * 30,
    });

    // Delete user mutation
    const deleteUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            await axios.delete(`/api/admin/users/${userId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        },
    });

    // Ban user mutation
    const banUserMutation = useMutation({
        mutationFn: async ({ userId, isBanned }: { userId: string; isBanned: boolean }) => {
            await axios.patch(`/api/admin/users/${userId}`, { isBanned });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        },
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">User Management</h1>
                <p className="text-gray-400 mt-2">Manage platform users and permissions</p>
            </div>

            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
                <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 min-w-64 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All Roles</option>
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-800 bg-gray-800/50">
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Email</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Role</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Joined</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usersData.users.map((user: User) => (
                                        <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-white font-medium">{user.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-400">{user.email}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                                                        user.role === 'moderator' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-gray-700 text-gray-300'
                                                    }`}>
                                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {user.isBanned ? (
                                                    <span className="text-red-400 font-medium">Banned</span>
                                                ) : user.isActive ? (
                                                    <span className="text-green-400 font-medium flex items-center gap-1">
                                                        <CheckCircle size={16} />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">Inactive</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => banUserMutation.mutate({ userId: user.id, isBanned: !user.isBanned })}
                                                        className={`p-2 rounded-lg transition-colors ${user.isBanned
                                                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                                : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                                            }`}
                                                        title={user.isBanned ? 'Unban user' : 'Ban user'}
                                                    >
                                                        <Ban size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteUserMutation.mutate(user.id)}
                                                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                                        title="Delete user"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer with total */}
                        <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-800">
                            <p className="text-sm text-gray-400">
                                Total: <span className="text-white font-semibold">{usersData.total}</span> users
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
