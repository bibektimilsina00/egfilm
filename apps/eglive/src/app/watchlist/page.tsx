'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent } from '@egfilm/ui/components/ui/card';
import { ListVideo } from 'lucide-react';

interface WatchlistRow {
    id: string;
    mediaId: number;
    mediaType: string;
    title: string;
    sport?: string | null;
    matchExternalId?: string | null;
    addedAt: string;
}

export default function WatchlistPage() {
    const { data, isLoading } = useQuery<{ items: WatchlistRow[] }>({
        queryKey: ['watchlist'],
        queryFn: async () => {
            const res = await fetch('/api/watchlist');
            if (!res.ok) throw new Error('Failed');
            return res.json();
        },
    });

    const matches = (data?.items ?? []).filter((r) => r.mediaType === 'match');

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center gap-2">
                <ListVideo className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Your watchlist</h1>
            </div>
            {isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-md bg-muted animate-pulse" />
                    ))}
                </div>
            ) : matches.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No saved matches yet. Browse <Link href="/sports" className="underline">Sports</Link> and tap save on any match.
                </p>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {matches.map((m) => (
                        <Card key={m.id}>
                            <CardContent className="p-4 space-y-1">
                                <p className="text-xs uppercase tracking-wider text-muted-foreground">{m.sport ?? 'Match'}</p>
                                <p className="font-semibold truncate">{m.title}</p>
                                {m.matchExternalId && m.sport ? (
                                    <Link href={`/match/${m.sport}/${m.matchExternalId}`} className="text-xs underline">Open</Link>
                                ) : null}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
