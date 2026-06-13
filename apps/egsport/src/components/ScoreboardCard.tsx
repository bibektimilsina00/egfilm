import { ScoreboardEntry } from '@/lib/sportsrc';
import { Card, CardContent } from '@egfilm/ui/components/ui/card';

export default function ScoreboardCard({ entry }: { entry: ScoreboardEntry }) {
    const dateLabel = entry.date ? new Date(entry.date).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
    }) : '—';
    return (
        <Card>
            <CardContent className="p-3 space-y-2">
                <p className="text-xs text-muted-foreground">{dateLabel} · {entry.league ?? ''}</p>
                <div className="flex items-center justify-between text-sm">
                    <span className="flex-1 truncate">{entry.homeTeam ?? '—'}</span>
                    <span className="px-2 font-mono font-semibold">{entry.homeScore ?? '?'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="flex-1 truncate">{entry.awayTeam ?? '—'}</span>
                    <span className="px-2 font-mono font-semibold">{entry.awayScore ?? '?'}</span>
                </div>
            </CardContent>
        </Card>
    );
}
