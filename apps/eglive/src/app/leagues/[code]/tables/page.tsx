'use client';

import { use } from 'react';
import Link from 'next/link';
import { useStandings } from '@/lib/hooks/useSports';
import StandingsTable from '@/components/StandingsTable';

export default function LeagueTablesPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = use(params);
    const { data: standings = [], isLoading, error } = useStandings(code);

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/leagues" className="text-xs text-muted-foreground hover:text-foreground">← Leagues</Link>
                <span className="text-muted-foreground">/</span>
                <h1 className="text-2xl font-bold">{decodeURIComponent(code)} — Standings</h1>
            </div>

            {error ? <p className="text-sm text-red-500">Failed to load standings.</p> : null}

            {isLoading ? (
                <div className="h-64 rounded-md bg-muted animate-pulse" />
            ) : (
                <StandingsTable rows={standings} />
            )}
        </div>
    );
}
