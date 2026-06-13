import Link from 'next/link';
import { SportCategory } from '@/lib/sportsrc';
import { Activity } from 'lucide-react';

export default function SportsTile({ sport }: { sport: SportCategory }) {
    const cat = sport.category ?? sport.slug ?? sport.name.toLowerCase();
    return (
        <Link
            href={`/sports/${encodeURIComponent(cat)}`}
            className="group relative flex h-32 items-end overflow-hidden rounded-xl border border-border bg-gradient-to-br from-orange-500/10 via-background to-red-500/10 p-4 transition-all hover:from-orange-500/20 hover:to-red-500/20"
        >
            <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Browse</p>
                <p className="text-lg font-semibold capitalize">{sport.name}</p>
            </div>
            <Activity className="absolute right-4 top-4 h-6 w-6 text-orange-500/70 group-hover:scale-110 transition-transform" />
        </Link>
    );
}
