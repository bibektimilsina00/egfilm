import Link from 'next/link';
import { Match, getMatchTeams, getMatchKickoff, isMatchLive } from '@/lib/sportsrc';
import { Card, CardContent } from '@egfilm/ui/components/ui/card';
import LiveBadge from './LiveBadge';
import { CalendarClock, Trophy } from 'lucide-react';

export default function MatchCard({ match, category }: { match: Match; category: string }) {
    const { home, away } = getMatchTeams(match);
    const kickoff = getMatchKickoff(match);
    const live = isMatchLive(match);
    const href = `/match/${encodeURIComponent(category)}/${encodeURIComponent(String(match.id))}`;

    return (
        <Link href={href} className="block group">
            <Card className="h-full overflow-hidden transition-transform group-hover:-translate-y-0.5 group-hover:shadow-md">
                <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            <Trophy className="h-3 w-3" /> {match.league ?? category}
                        </span>
                        {live ? <LiveBadge /> : null}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="truncate font-semibold">{home || 'Home'}</p>
                            <p className="truncate text-xs text-muted-foreground">Home</p>
                        </div>
                        <div className="text-muted-foreground text-sm">vs</div>
                        <div className="flex-1 min-w-0 text-right">
                            <p className="truncate font-semibold">{away || 'Away'}</p>
                            <p className="truncate text-xs text-muted-foreground">Away</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {kickoff
                            ? kickoff.toLocaleString(undefined, {
                                weekday: 'short', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                            })
                            : 'Time TBD'}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
