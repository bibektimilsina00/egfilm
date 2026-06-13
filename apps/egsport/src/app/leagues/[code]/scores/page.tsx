'use client';

import { use } from 'react';
import Link from 'next/link';
import { useScores } from '@/lib/hooks/useSports';
import ScoreboardCard from '@/components/ScoreboardCard';

export default function LeagueScoresPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = use(params);
    const { data: scores = [], isLoading, error } = useScores(code);

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/leagues" className="text-xs text-muted-foreground hover:text-foreground">← Leagues</Link>
                <span className="text-muted-foreground">/</span>
                <h1 className="text-2xl font-bold">{decodeURIComponent(code)} — Scores</h1>
            </div>

            {error ? <p className="text-sm text-red-500">Failed to load scores.</p> : null}

            {isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-md bg-muted animate-pulse" />
                    ))}
                </div>
            ) : scores.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent scores available.</p>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {scores.map((s, i) => (
                        <ScoreboardCard key={i} entry={s} />
                    ))}
                </div>
            )}
        </div>
    );
}
