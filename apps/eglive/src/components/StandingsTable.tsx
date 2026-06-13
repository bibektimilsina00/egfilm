import { StandingRow } from '@/lib/sportsrc';
import { cn } from '@egfilm/ui/lib/utils';

export default function StandingsTable({ rows }: { rows: StandingRow[] }) {
    if (!rows || rows.length === 0) {
        return <p className="text-sm text-muted-foreground">No standings available.</p>;
    }

    return (
        <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
                <thead className="bg-muted/50">
                    <tr className="text-left">
                        <th className="px-3 py-2 w-12">#</th>
                        <th className="px-3 py-2">Team</th>
                        <th className="px-3 py-2 w-12 text-right">P</th>
                        <th className="px-3 py-2 w-12 text-right">W</th>
                        <th className="px-3 py-2 w-12 text-right">D</th>
                        <th className="px-3 py-2 w-12 text-right">L</th>
                        <th className="px-3 py-2 w-16 text-right">GD</th>
                        <th className="px-3 py-2 w-14 text-right font-semibold">Pts</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => {
                        const pos = row.position ?? row.rank ?? i + 1;
                        const gd = (row.goalsFor ?? 0) - (row.goalsAgainst ?? 0);
                        const zone =
                            pos <= 4 ? 'border-l-2 border-emerald-500' :
                                pos >= rows.length - 2 ? 'border-l-2 border-red-500' :
                                    'border-l-2 border-transparent';
                        return (
                            <tr key={`${pos}-${row.team ?? row.teamName ?? i}`} className={cn('border-t border-border/60', zone)}>
                                <td className="px-3 py-2 font-medium">{pos}</td>
                                <td className="px-3 py-2">{row.team ?? row.teamName ?? '—'}</td>
                                <td className="px-3 py-2 text-right">{row.played ?? '—'}</td>
                                <td className="px-3 py-2 text-right">{row.won ?? '—'}</td>
                                <td className="px-3 py-2 text-right">{row.drawn ?? '—'}</td>
                                <td className="px-3 py-2 text-right">{row.lost ?? '—'}</td>
                                <td className="px-3 py-2 text-right">{gd > 0 ? `+${gd}` : gd}</td>
                                <td className="px-3 py-2 text-right font-semibold">{row.points ?? '—'}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
