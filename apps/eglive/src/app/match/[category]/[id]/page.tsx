'use client';

import { use } from 'react';
import Link from 'next/link';
import { useMatchDetail } from '@/lib/hooks/useSports';
import { getMatchTeams, getMatchKickoff, getMatchEmbedUrl, isMatchLive } from '@/lib/sportsrc';
import EmbedMatchPlayer from '@/components/EmbedMatchPlayer';
import LiveBadge from '@/components/LiveBadge';
import { Button } from '@egfilm/ui/components/ui/button';
import { Users, CalendarClock, ArrowLeft } from 'lucide-react';

export default function MatchDetailPage({ params }: { params: Promise<{ category: string; id: string }> }) {
    const { category, id } = use(params);
    const { data: detail, isLoading, error } = useMatchDetail(category, id);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 space-y-4">
                <div className="aspect-video bg-muted rounded-md animate-pulse" />
                <div className="h-8 w-2/3 bg-muted rounded animate-pulse" />
            </div>
        );
    }

    if (error || !detail) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <p className="text-muted-foreground">Match not found.</p>
                <Link href={`/sports/${category}`} className="mt-3 inline-block text-sm underline">
                    ← Back to {category}
                </Link>
            </div>
        );
    }

    const { home, away } = getMatchTeams(detail);
    const kickoff = getMatchKickoff(detail);
    const embedUrl = getMatchEmbedUrl(detail);
    const live = isMatchLive(detail);

    return (
        <div className="container mx-auto px-4 py-6 space-y-6">
            <Link href={`/sports/${category}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3 w-3" /> Back to {category.replace(/-/g, ' ')}
            </Link>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="space-y-4">
                    <EmbedMatchPlayer
                        embedUrl={embedUrl}
                        title={`${home || 'Home'} vs ${away || 'Away'}`}
                        fallbackSources={detail.sources}
                    />

                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-sm text-muted-foreground">{detail.league ?? category}</p>
                                {live ? <LiveBadge /> : null}
                            </div>
                            <h1 className="text-2xl font-bold">
                                {home || 'Home'} <span className="text-muted-foreground">vs</span> {away || 'Away'}
                            </h1>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <CalendarClock className="h-3.5 w-3.5" />
                                {kickoff ? kickoff.toLocaleString() : 'Time TBD'}
                            </div>
                        </div>
                    </div>

                    {detail.description ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detail.description}</p>
                    ) : null}
                </div>

                <aside className="space-y-4">
                    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                        <h3 className="text-sm font-semibold">Watch together</h3>
                        <p className="text-xs text-muted-foreground">
                            Create a private room and watch this match in sync with friends, with chat and live video.
                        </p>
                        <Link href={`/match/${encodeURIComponent(category)}/${encodeURIComponent(id)}/watch-together`}>
                            <Button className="w-full" variant="default">
                                <Users className="h-4 w-4 mr-1.5" /> Start watch-together
                            </Button>
                        </Link>
                    </div>

                    <div className="rounded-lg border border-border p-4 space-y-2">
                        <h3 className="text-sm font-semibold">Match info</h3>
                        <dl className="text-xs space-y-1">
                            <div className="flex justify-between"><dt className="text-muted-foreground">Sport</dt><dd className="capitalize">{category.replace(/-/g, ' ')}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">League</dt><dd>{detail.league ?? '—'}</dd></div>
                            <div className="flex justify-between"><dt className="text-muted-foreground">Status</dt><dd>{live ? 'Live' : (detail.status ?? 'Scheduled')}</dd></div>
                        </dl>
                    </div>
                </aside>
            </div>
        </div>
    );
}
