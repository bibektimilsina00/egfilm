'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from '@/components/admin/Sidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        // Check if user is authenticated
        if (status === 'unauthenticated') {
            console.log('[Admin Layout] Unauthenticated - redirecting to /login');
            router.push('/login');
            return;
        }

        // Check if user has admin role from database
        const userRole = (session?.user as any)?.role;
        const isAdmin = userRole === 'admin';

        console.log('[Admin Layout] Status:', status);
        console.log('[Admin Layout] User Role:', userRole);
        console.log('[Admin Layout] Is Admin:', isAdmin);
        console.log('[Admin Layout] Full session:', session);

        if (status === 'authenticated' && !isAdmin) {
            console.log('[Admin Layout] Not admin - redirecting to /');
            router.push('/');
            return;
        }
    }, [status, session, router]);

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const userRole = (session?.user as any)?.role;
    const isAdmin = userRole === 'admin';

    console.log('[Admin Layout Render] Status:', status);
    console.log('[Admin Layout Render] User Role:', userRole);
    console.log('[Admin Layout Render] Is Admin:', isAdmin);

    if (status === 'unauthenticated') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-950">
                <p className="text-white">Redirecting to login...</p>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-950">
                <p className="text-white">Redirecting to home... Not admin!</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-950">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <AdminHeader user={session?.user} />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="p-6">{children}</div>
                </main>
            </div>
        </div>
    );
}
