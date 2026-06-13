'use client';

import { use, useState } from 'react';
import { useMatchesByCategory } from '@/lib/hooks/useSports';
import { isMatchLive, getMatchKickoff } from '@/lib/sportsrc';
import MatchCard from '@/components/MatchCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@egfilm/ui/components/ui/tabs';

export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
    const { category } = use(params);
    const { data: matches = [], isLoading, error } = useMatchesByCategory(category);
    const [tab, setTab] = useState<'live' | 'upcoming' | 'finished'>('live');

    const live = matches.filter(isMatchLive);
    const upcoming = matches.filter((m) => {
        if (isMatchLive(m)) return false;
        const k = getMatchKickoff(m);
        return !k || k.getTime() >= Date.now();
    });
    const finished = matches.filter((m) => {
        if (isMatchLive(m)) return false;
        const k = getMatchKickoff(m);
        return k && k.getTime() < Date.now();
    });

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Sport</p>
                <h1 className="text-2xl font-bold capitalize">{category.replace(/-/g, ' ')}</h1>
            </div>

            {error ? (
                <div className="rounded-md border border-red-500/30 bg-red-500/5 p-4 text-sm">
                    Failed to load matches. Try again in a moment.
                </div>
            ) : null}

            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
                <TabsList>
                    <TabsTrigger value="live">Live ({live.length})</TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
                    <TabsTrigger value="finished">Finished ({finished.length})</TabsTrigger>
                </TabsList>

                {(['live', 'upcoming', 'finished'] as const).map((key) => {
                    const list = key === 'live' ? live : key === 'upcoming' ? upcoming : finished;
                    return (
                        <TabsContent key={key} value={key} className="mt-4">
                            {isLoading ? (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="h-32 rounded-md bg-muted animate-pulse" />
                                    ))}
                                </div>
                            ) : list.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No matches in this view.</p>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {list.map((m) => (
                                        <MatchCard key={`${category}-${m.id}`} match={m} category={category} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    );
                })}
            </Tabs>
        </div>
    );
}
