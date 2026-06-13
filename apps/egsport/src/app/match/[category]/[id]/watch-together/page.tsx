'use client';

import { use, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMatchDetail } from '@/lib/hooks/useSports';
import { pickBestSource, matchExternalIdHash } from '@/lib/sportsrc';
import { Users, Loader2, ArrowRight, Sparkles } from 'lucide-react';

export default function MatchWatchTogetherCreatePage({
    params,
}: {
    params: Promise<{ category: string; id: string }>;
}) {
    const { category, id } = use(params);
    const { data: detail, isLoading } = useMatchDetail(category, id);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [creating, setCreating] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [error, setError] = useState<string | null>(null);

    if (status === 'unauthenticated') {
        router.push(`/login?callbackUrl=/match/${category}/${id}/watch-together`);
        return null;
    }

    const home = detail?.teams?.home?.name ?? 'Home';
    const away = detail?.teams?.away?.name ?? 'Away';
    const mediaTitle = detail?.title ?? `${home} vs ${away}`;
    const embedUrl = pickBestSource(detail)?.embedUrl ?? null;
    const username = session?.user?.name ?? session?.user?.email ?? 'Guest';

    const createRoom = async () => {
        setCreating(true);
        setError(null);
        try {
            const res = await fetch('/api/watch-room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mediaId: matchExternalIdHash(category, id),
                    mediaType: 'match',
                    mediaTitle,
                    embedUrl,
                    sport: category,
                    matchExternalId: String(id),
                }),
            });
            if (!res.ok) throw new Error('Failed to create room');
            const data = await res.json();
            const roomCode = data.roomCode ?? data.room?.roomCode;
            if (!roomCode) throw new Error('Room created but missing code');
            router.push(`/watch-together?room=${encodeURIComponent(roomCode)}&username=${encodeURIComponent(username)}`);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create room');
            setCreating(false);
        }
    };

    const joinRoom = (e: React.FormEvent) => {
        e.preventDefault();
        const code = joinCode.trim().toUpperCase();
        if (!code) return;
        router.push(`/watch-together?room=${encodeURIComponent(code)}&username=${encodeURIComponent(username)}`);
    };

    return (
        <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden flex items-center justify-center px-4 py-12">
            {/* Decorative background */}
            <div className="pointer-events-none absolute inset-0" aria-hidden>
                <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
                <div className="absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-indigo-600/15 blur-3xl" />
            </div>

            <div className="relative w-full max-w-xl">
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-blue-500/40 via-indigo-500/20 to-transparent blur-sm" aria-hidden />

                <div className="relative rounded-2xl border border-gray-800 bg-gray-900/80 backdrop-blur-xl p-7 space-y-6 shadow-2xl shadow-blue-500/10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-lg shadow-blue-500/30 ring-1 ring-white/20">
                            <Users className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-xs uppercase tracking-widest text-blue-300/80">Watch Together</p>
                            <h1 className="text-xl font-bold text-white">{isLoading ? 'Loading match…' : mediaTitle}</h1>
                            <p className="text-xs text-gray-400 capitalize">{category.replace(/-/g, ' ')}</p>
                        </div>
                    </div>

                    {/* Create */}
                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 space-y-3">
                        <div className="flex items-start gap-2">
                            <Sparkles className="h-4 w-4 text-blue-300 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-white">Start a room as host</p>
                                <p className="text-xs text-gray-400">
                                    Signed in as <strong className="text-gray-300">{username}</strong>. We&apos;ll create a private
                                    room and drop you straight into the lobby with chat + camera + sync.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={createRoom}
                            disabled={creating}
                            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-blue-500/50 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                            <span>{creating ? 'Creating room…' : 'Create watch-together room'}</span>
                            {!creating ? <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /> : null}
                        </button>
                    </div>

                    {/* Or join */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden>
                            <div className="w-full border-t border-gray-800" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-gray-900/80 px-3 text-[10px] uppercase tracking-widest text-gray-500">or join one</span>
                        </div>
                    </div>

                    <form onSubmit={joinRoom} className="space-y-3">
                        <p className="text-sm text-white">Have a room code?</p>
                        <div className="flex gap-2">
                            <input
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                placeholder="EXAMPLE"
                                maxLength={12}
                                className="block flex-1 rounded-xl border border-gray-800 bg-gray-900/60 px-3 py-3 font-mono text-sm tracking-wider text-white placeholder:text-gray-600 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
                            />
                            <button
                                type="submit"
                                disabled={!joinCode.trim()}
                                className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-200 transition-colors hover:bg-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Join
                            </button>
                        </div>
                    </form>

                    {error ? (
                        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                            {error}
                        </div>
                    ) : null}

                    <div className="border-t border-gray-800 pt-4">
                        <Link href={`/match/${category}/${id}`} className="text-xs text-gray-400 hover:text-blue-300">
                            ← Back to match
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
