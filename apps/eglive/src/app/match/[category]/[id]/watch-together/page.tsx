'use client';

import { use, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMatchDetail } from '@/lib/hooks/useSports';
import { getMatchTeams, getMatchEmbedUrl, matchExternalIdHash } from '@/lib/sportsrc';
import { Button } from '@egfilm/ui/components/ui/button';
import { Users, Copy, Check } from 'lucide-react';

export default function MatchWatchTogetherPage({ params }: { params: Promise<{ category: string; id: string }> }) {
    const { category, id } = use(params);
    const { data: detail } = useMatchDetail(category, id);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [roomCode, setRoomCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    if (status === 'unauthenticated') {
        router.push(`/login?callbackUrl=/match/${category}/${id}/watch-together`);
        return null;
    }

    const { home, away } = getMatchTeams(detail ?? { id });
    const embedUrl = getMatchEmbedUrl(detail);
    const mediaTitle = `${home || 'Home'} vs ${away || 'Away'}`;

    const createRoom = async () => {
        const res = await fetch('/api/watch-room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mediaId: matchExternalIdHash(category, id),
                mediaType: 'match',
                mediaTitle,
                embedUrl,
                sport: category,
                league: detail?.league,
                matchExternalId: String(id),
            }),
        });
        if (!res.ok) return;
        const data = await res.json();
        setRoomCode(data.roomCode ?? data.room?.roomCode ?? null);
    };

    const copyLink = async () => {
        if (!roomCode) return;
        const url = `${window.location.origin}/match/${category}/${id}/watch-together?room=${roomCode}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
            <div className="space-y-1">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Watch together</p>
                <h1 className="text-2xl font-bold">{mediaTitle}</h1>
                <p className="text-sm text-muted-foreground">Sport: <span className="capitalize">{category.replace(/-/g, ' ')}</span></p>
            </div>

            {!roomCode ? (
                <div className="rounded-lg border border-border bg-muted/30 p-6 space-y-4">
                    <p className="text-sm">
                        You&apos;re signed in as <strong>{session?.user?.name ?? session?.user?.email}</strong>.
                        Create a room and invite friends to watch this match in sync, with chat + live video.
                    </p>
                    <Button onClick={createRoom} className="w-full">
                        <Users className="h-4 w-4 mr-1.5" /> Create watch-together room
                    </Button>
                </div>
            ) : (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-6 space-y-3">
                    <p className="text-sm">Room created. Share this code:</p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 rounded-md bg-background px-3 py-2 font-mono text-sm">{roomCode}</code>
                        <Button variant="outline" size="sm" onClick={copyLink}>
                            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            {copied ? 'Copied' : 'Copy link'}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Note: Real-time video + sync UI for sports rooms reuses the same socket.io watch-together engine used for movies. A full UI for live participants is on the roadmap; for now the room is persisted in the database and chat is available via the API.
                    </p>
                    <Link href={`/match/${category}/${id}`} className="text-xs underline">← Back to match detail</Link>
                </div>
            )}
        </div>
    );
}
