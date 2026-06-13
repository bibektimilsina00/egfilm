'use client';

import Link from 'next/link';
import { useLeagues } from '@/lib/hooks/useSports';
import { Trophy } from 'lucide-react';

export default function LeaguesPage() {
    const { data: leagues = [], isLoading, error } = useLeagues();

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Leagues</h1>
                <p className="text-gray-400">Standings, tables, scores.</p>
            </div>

            {error ? <p className="text-sm text-red-400">Failed to load leagues.</p> : null}

            {isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-xl bg-gray-900 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {leagues.map((l) => (
                        <div key={l.code ?? l.name} className="rounded-xl border border-gray-800 bg-gray-900 p-4 flex items-center gap-3 transition-all hover:border-blue-500/40">
                            <Trophy className="h-5 w-5 text-blue-400" />
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate text-white">{l.name}</p>
                                <p className="text-xs text-gray-500 truncate">{l.country ?? l.code}</p>
                            </div>
                            <div className="flex gap-1">
                                <Link href={`/leagues/${encodeURIComponent(l.code ?? l.name)}/tables`} className="text-xs rounded-md border border-gray-700 text-gray-300 px-2 py-1 hover:bg-gray-800 hover:text-blue-400 transition-colors">Table</Link>
                                <Link href={`/leagues/${encodeURIComponent(l.code ?? l.name)}/scores`} className="text-xs rounded-md border border-gray-700 text-gray-300 px-2 py-1 hover:bg-gray-800 hover:text-blue-400 transition-colors">Scores</Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
