'use client';

import { Users, Activity, Tv, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { ActiveRoomsChart } from '@/components/admin/charts/ActiveRoomsChart';
import { UserGrowthChart } from '@/components/admin/charts/UserGrowthChart';
import { useStatsOverview } from '@/lib/hooks/useAdmin';

export default function AdminDashboard() {
    // Fetch dashboard stats using React Query hook
    const { data: stats, isLoading } = useStatsOverview();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-400 mt-2">Welcome back! Here's your platform overview.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    icon={<Users size={24} />}
                    trend={stats?.userTrend || '+0%'}
                    color="blue"
                />
                <StatCard
                    title="Active Watch Rooms"
                    value={stats?.activeRooms || 0}
                    icon={<Activity size={24} />}
                    trend={stats?.roomTrend || '+0%'}
                    color="green"
                />
                <StatCard
                    title="Watch Sessions Today"
                    value={stats?.sessionsToday || 0}
                    icon={<Tv size={24} />}
                    trend={stats?.sessionTrend || '+0%'}
                    color="purple"
                />
                <StatCard
                    title="Platform Health"
                    value={`${stats?.platformHealth || 0}%`}
                    icon={<TrendingUp size={24} />}
                    trend="Optimal"
                    color="emerald"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                    <h2 className="text-xl font-bold text-white mb-4">User Growth</h2>
                    <UserGrowthChart />
                </div>
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Active Watch Rooms</h2>
                    <ActiveRoomsChart />
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
                <RecentActivity />
            </div>
        </div>
    );
}
