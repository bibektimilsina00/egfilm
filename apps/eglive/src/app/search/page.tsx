'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSportsCategories } from '@/lib/hooks/useSports';
import SportsTile from '@/components/SportsTile';

function SearchResults({ q }: { q: string }) {
    const { data: sports = [] } = useSportsCategories();
    const term = q.trim().toLowerCase();
    const matches = useMemo(() => sports.filter((s) =>
        (s.name ?? '').toString().toLowerCase().includes(term) ||
        (s.category ?? '').toString().toLowerCase().includes(term),
    ), [sports, term]);

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">{matches.length} sport{matches.length === 1 ? '' : 's'} match &quot;{q}&quot;</h2>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                {matches.map((s, i) => (
                    <SportsTile key={(s.category ?? s.name ?? i).toString()} sport={s} />
                ))}
            </div>
        </div>
    );
}

function SearchInner() {
    const params = useSearchParams();
    const initial = params.get('q') ?? '';
    const [q, setQ] = useState(initial);

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Search</h1>
                <p className="text-muted-foreground">Find sports, leagues and matches.</p>
            </div>
            <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="football, ufc, EPL..."
                className="h-10 w-full max-w-lg rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            {q.trim() ? <SearchResults q={q} /> : (
                <p className="text-sm text-muted-foreground">Start typing to search.</p>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading…</div>}>
            <SearchInner />
        </Suspense>
    );
}
