import Link from 'next/link';
import { SportCategory } from '@/lib/sportsrc';
import { Activity } from 'lucide-react';

export default function SportsTile({ sport }: { sport: SportCategory }) {
    const cat = sport.category ?? sport.slug ?? sport.name.toLowerCase();
    return (
        <Link
            href={`/sports/${encodeURIComponent(cat)}`}
            className="group relative flex h-32 items-end overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-br from-blue-500/10 via-gray-900 to-gray-950 p-4 transition-all hover:from-blue-500/20 hover:border-blue-500/40"
        >
            <div>
                <p className="text-xs uppercase tracking-wider text-gray-400">Browse</p>
                <p className="text-lg font-semibold capitalize text-white">{sport.name}</p>
            </div>
            <Activity className="absolute right-4 top-4 h-6 w-6 text-blue-400/70 group-hover:scale-110 transition-transform" />
        </Link>
    );
}
