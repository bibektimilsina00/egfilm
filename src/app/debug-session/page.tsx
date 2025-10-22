'use client';

import { useSession } from 'next-auth/react';

export default function SessionDebugPage() {
    const { data: session, status } = useSession();

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Session Debug Info</h1>

                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Status</h2>
                        <p className="text-gray-300">{status}</p>
                    </div>

                    {session && (
                        <>
                            <div>
                                <h2 className="text-xl font-semibold mb-2">User Info</h2>
                                <div className="bg-gray-800 p-4 rounded-lg">
                                    <p><strong>Email:</strong> {session.user?.email}</p>
                                    <p><strong>Name:</strong> {session.user?.name}</p>
                                    <p><strong>Role:</strong> {(session.user as any)?.role || 'NOT SET (This is the problem!)'}</p>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-semibold mb-2">Full Session Object</h2>
                                <pre className="bg-gray-800 p-4 rounded-lg overflow-auto text-sm">
                                    {JSON.stringify(session, null, 2)}
                                </pre>
                            </div>
                        </>
                    )}

                    {!session && status === 'unauthenticated' && (
                        <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
                            <p className="text-yellow-300">You are not logged in. Please log in first.</p>
                        </div>
                    )}
                </div>

                <div className="mt-6 bg-blue-500/20 border border-blue-500 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Expected Behavior:</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                        <li>If role is "admin" → You can access /admin</li>
                        <li>If role is "user" or undefined → You will be redirected from /admin</li>
                        <li>If you just became admin, you MUST log out and log back in</li>
                    </ul>
                </div>

                <div className="mt-6 flex gap-4">
                    <a
                        href="/api/auth/signout"
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                        Log Out
                    </a>
                    <a
                        href="/login"
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                        Go to Login
                    </a>
                    <a
                        href="/admin"
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                        Try Admin Panel
                    </a>
                </div>
            </div>
        </div>
    );
}
