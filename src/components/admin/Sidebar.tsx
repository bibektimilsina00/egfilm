'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    BarChart3,
    Settings,
    Tv,
    MessageSquare,
    Users2,
    Bell,
    LogOut,
    BookOpen,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const adminLinks = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/content', icon: Tv, label: 'Content' },
    { href: '/admin/blog', icon: BookOpen, label: 'Blog' },
    { href: '/admin/rooms', icon: Users2, label: 'Watch Rooms' },
    { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/admin/notifications', icon: Bell, label: 'Notifications' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-2xl font-bold text-white">
                    <span className="text-blue-500">Eg</span>film Admin
                </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {adminLinks.map((link) => {
                    const isActive =
                        link.exact
                            ? pathname === link.href
                            : pathname?.startsWith(link.href);
                    const Icon = link.icon;

                    return (
                        <Link key={link.href} href={link.href}>
                            <div
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{link.label}</span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={() => signOut({ redirect: true, callbackUrl: '/' })}
                    className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
}
