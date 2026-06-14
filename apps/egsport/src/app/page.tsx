'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSportsCategories, useMatchesByCategory } from '@/lib/hooks/useSports';
import { isMatchLive } from '@/lib/sportsrc';
import MatchCard from '@/components/MatchCard';
import SportsTile from '@/components/SportsTile';
import { Activity, Flame, Users, ArrowRight, Sparkles } from 'lucide-react';

const FEATURED_CATEGORIES = ['football', 'basketball', 'ufc', 'mma'];

function LiveSection({ category }: { category: string }) {
    const { data: matches = [], isLoading } = useMatchesByCategory(category);
    const live = matches.filter(isMatchLive);
    if (isLoading || live.length === 0) return null;
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-semibold capitalize">{category} — Live now</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {live.slice(0, 4).map((m) => (
                    <MatchCard key={`${category}-${m.id}`} match={m} category={category} />
                ))}
            </div>
        </div>
    );
}

function UpcomingSection({ category }: { category: string }) {
    const { data: matches = [], isLoading } = useMatchesByCategory(category);
    const upcoming = matches.filter((m) => !isMatchLive(m)).slice(0, 4);
    if (isLoading || upcoming.length === 0) return null;
    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold capitalize">{category} — Upcoming</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {upcoming.map((m) => (
                    <MatchCard key={`${category}-${m.id}`} match={m} category={category} />
                ))}
            </div>
        </div>
    );
}

export default function HomePage() {
    const { data: sports = [], isLoading } = useSportsCategories();

    return (
        <div className="container mx-auto px-4 py-8 space-y-10">
            <section className="relative overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-br from-blue-500/10 via-gray-900 to-gray-950 p-8">
                <div className="max-w-2xl space-y-3">
                    <p className="text-xs uppercase tracking-widest text-blue-400">EGSport</p>
                    <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
                        Live sports streaming, schedules & stats.
                    </h1>
                    <p className="text-gray-400">
                        Football, basketball, UFC, MMA and more. Watch live matches, follow standings, and never miss a game.
                    </p>
                </div>
                <Activity className="absolute -bottom-6 -right-6 h-48 w-48 text-blue-500/10" />
            </section>

            <WatchTogetherWidget />

            {FEATURED_CATEGORIES.map((cat) => (
                <LiveSection key={`live-${cat}`} category={cat} />
            ))}

            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Browse Sports</h2>
                    <Link href="/sports" className="text-sm text-gray-400 hover:text-blue-400">View all →</Link>
                </div>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {isLoading
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-32 rounded-xl bg-gray-900 animate-pulse" />
                        ))
                        : sports.slice(0, 12).map((s, i) => (
                            <SportsTile key={(s.id ?? s.name ?? i).toString()} sport={s} />
                        ))}
                </div>
            </section>

            {FEATURED_CATEGORIES.map((cat) => (
                <UpcomingSection key={`up-${cat}`} category={cat} />
            ))}
        </div>
    );
}

function WatchTogetherWidget() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [code, setCode] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (status !== 'authenticated' || !session?.user) return null;

    const username = session.user.name ?? session.user.email ?? 'Guest';

    const onJoin = (e: React.FormEvent) => {
        e.preventDefault();
        const c = code.trim().toUpperCase();
        if (!c) return;
        setSubmitting(true);
        router.push(`/watch-together?room=${encodeURIComponent(c)}&username=${encodeURIComponent(username)}`);
    };

    return (
        <section className="relative overflow-hidden rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-gray-900 to-gray-950 p-6">
            {/* Decorative blur */}
            <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" aria-hidden />

            <div className="relative grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-md shadow-blue-500/30 ring-1 ring-white/20">
                            <Users className="h-4 w-4" />
                        </span>
                        <div>
                            <p className="text-xs uppercase tracking-widest text-blue-300/80">Watch together</p>
                            <h2 className="text-lg font-bold text-white">Join a friend&apos;s room, or host one</h2>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400">
                        Hey <strong className="text-gray-300">{username}</strong> — paste a 6-char code to drop into someone&apos;s
                        room, or browse a match to host your own.
                    </p>
                </div>

                <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                    <form onSubmit={onJoin} className="flex gap-2">
                        <input
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="ABC123"
                            maxLength={12}
                            className="block w-32 md:w-40 rounded-xl border border-gray-800 bg-gray-900/60 px-3 py-2.5 font-mono text-sm tracking-wider text-white placeholder:text-gray-600 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
                        />
                        <button
                            type="submit"
                            disabled={!code.trim() || submitting}
                            className="inline-flex items-center gap-1 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2.5 text-sm font-semibold text-blue-200 transition-colors hover:bg-blue-500/20 disabled:opacity-60"
                        >
                            Join <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                    </form>
                    <Link
                        href="/sports"
                        className="group inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:shadow-blue-500/50 hover:-translate-y-0.5"
                    >
                        <Sparkles className="h-4 w-4" />
                        Host a match
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
