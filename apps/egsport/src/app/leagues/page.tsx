'use client';

import Link from 'next/link';
import { useLeagues } from '@/lib/hooks/useSports';
import { Card, CardContent } from '@egfilm/ui/components/ui/card';
import { Trophy } from 'lucide-react';

export default function LeaguesPage() {
    const { data: leagues = [], isLoading, error } = useLeagues();

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Leagues</h1>
                <p className="text-muted-foreground">Standings, tables, scores.</p>
            </div>

            {error ? <p className="text-sm text-red-500">Failed to load leagues.</p> : null}

            {isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-md bg-muted animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {leagues.map((l) => (
                        <Card key={l.code ?? l.name}>
                            <CardContent className="p-4 flex items-center gap-3">
                                <Trophy className="h-5 w-5 text-orange-500" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate">{l.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{l.country ?? l.code}</p>
                                </div>
                                <div className="flex gap-1">
                                    <Link href={`/leagues/${encodeURIComponent(l.code ?? l.name)}/tables`} className="text-xs rounded-md border px-2 py-1 hover:bg-muted">Table</Link>
                                    <Link href={`/leagues/${encodeURIComponent(l.code ?? l.name)}/scores`} className="text-xs rounded-md border px-2 py-1 hover:bg-muted">Scores</Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
