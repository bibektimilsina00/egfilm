'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Play, Loader2, Mail, Lock, User as UserIcon, Sparkles, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Registration failed');
                return;
            }

            // Redirect to login page after successful registration
            router.push('/login?registered=true');
        } catch (error) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/5 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-md w-full relative z-10">
                {/* Logo Section */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center gap-3 group mb-4">
                        <div className="relative">
                            <Play className="w-16 h-16 text-blue-500 group-hover:text-blue-400 transition-all duration-300 group-hover:scale-110 drop-shadow-2xl" fill="currentColor" />
                            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                        </div>
                        <span className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-blue-500 to-blue-400 bg-clip-text text-transparent">
                            StreamFlix
                        </span>
                    </Link>
                    <div className="flex items-center justify-center gap-2 text-gray-400 text-lg">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <span>Join the Experience</span>
                        <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                </div>

                {/* Registration Card */}
                <div className="bg-gradient-to-b from-gray-900/90 to-gray-900/50 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300">
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Your Account</h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl p-4 text-sm flex items-start gap-2 backdrop-blur-sm animate-in fade-in slide-in-from-top">
                                <span className="text-lg">⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                                <UserIcon className="w-4 h-4 text-purple-400" />
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:bg-gray-800/70"
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-purple-400" />
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:bg-gray-800/70"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                                <Lock className="w-4 h-4 text-purple-400" />
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:bg-gray-800/70"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:bg-gray-800/70"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-4 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-400">
                            Already have an account?{' '}
                            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </div>

                    {/* Features List */}
                    <div className="mt-6 p-5 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-800/30 backdrop-blur-sm space-y-2">
                        <p className="text-sm text-purple-300 font-semibold mb-3">Why Join StreamFlix?</p>
                        <div className="space-y-2 text-xs text-gray-400">
                            <p className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                                Stream unlimited movies & TV shows
                            </p>
                            <p className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                                Watch together with friends in real-time
                            </p>
                            <p className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                                Save your favorite content to watchlist
                            </p>
                        </div>
                    </div>
                </div>

                {/* Back to Home Link */}
                <div className="text-center mt-6">
                    <Link href="/" className="text-gray-500 hover:text-gray-400 text-sm transition-colors inline-flex items-center gap-2 group">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span>
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
