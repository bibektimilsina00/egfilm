'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Lock, User as UserIcon, Sparkles, CheckCircle2, Film, Users, Tv, Star } from 'lucide-react';
import Navigation from '@/components/Navigation';

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
        } catch {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950">
            <Navigation />

            <div className="min-h-[calc(100vh-73px)] bg-gradient-to-br from-gray-950 via-blue-950/20 to-gray-950 flex items-center justify-center px-4 py-12 relative overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-md w-full relative z-10">
                    {/* Logo Section */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-2 text-gray-300 mb-6">
                            <Sparkles className="w-5 h-5 text-blue-400" />
                            <span className="text-lg">Start Your Streaming Journey</span>
                            <Sparkles className="w-5 h-5 text-blue-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                        <p className="text-gray-400">Join thousands of movie enthusiasts</p>
                    </div>                    {/* Registration Card */}
                    <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300">

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl p-4 text-sm flex items-start gap-2 backdrop-blur-sm animate-in fade-in slide-in-from-top">
                                    <span className="text-lg">⚠️</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <UserIcon className="w-4 h-4 text-blue-400" />
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-gray-800/70"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-blue-400" />
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-gray-800/70"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-blue-400" />
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-gray-800/70"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                                    Confirm Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-gray-800/70"
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98]"
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
                                <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors hover:underline">
                                    Sign In
                                </Link>
                            </p>
                        </div>

                        {/* Features List */}
                        <div className="mt-6 p-5 bg-gradient-to-r from-blue-900/20 to-blue-900/20 rounded-xl border border-blue-800/30 backdrop-blur-sm space-y-2">
                            <p className="text-sm text-blue-300 font-semibold mb-3">Why Join Egfilm?</p>
                            <div className="space-y-2 text-xs text-gray-400">
                                <p className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                                    Stream unlimited movies & TV shows
                                </p>
                                <p className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                                    Watch together with friends in real-time
                                </p>
                                <p className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                                    Save your favorite content to watchlist
                                </p>
                            </div>
                        </div>

                        {/* Features Grid */}
                        <div className="mt-8 flex justify-around gap-3">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                                    <Film className="w-6 h-6 text-blue-400" />
                                </div>
                                <p className="text-xs text-gray-400">Movies</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                                    <Tv className="w-6 h-6 text-blue-400" />
                                </div>
                                <p className="text-xs text-gray-400">TV Shows</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                                    <Users className="w-6 h-6 text-blue-400" />
                                </div>
                                <p className="text-xs text-gray-400">Watch Party</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                                    <Star className="w-6 h-6 text-blue-400" />
                                </div>
                                <p className="text-xs text-gray-400">Watchlist</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
