'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import io, { type Socket } from 'socket.io-client';
import { MessageSquare, Loader2, Trash2, CornerDownRight, Send, Wifi, WifiOff, Pencil } from 'lucide-react';

// ---- DTO shape (mirrors the API) ----
interface ReactionDTO { type: string; count: number; reacted: boolean }
interface CommentDTO {
    id: string;
    content: string;
    createdAt: string;
    isEdited: boolean;
    parentId: string | null;
    author: { name: string; isGuest: boolean };
    reactions: ReactionDTO[];
    replies: CommentDTO[];
    canDelete: boolean;
}

const REACTIONS: Array<{ type: string; emoji: string; label: string }> = [
    { type: 'like', emoji: '👍', label: 'Like' },
    { type: 'love', emoji: '❤️', label: 'Love' },
    { type: 'laugh', emoji: '😂', label: 'Haha' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'sad', emoji: '😢', label: 'Sad' },
    { type: 'fire', emoji: '🔥', label: 'Fire' },
];

// ---- guest identity (persisted in localStorage) ----
function makeId(): string {
    try {
        return crypto.randomUUID();
    } catch {
        return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
    }
}
function useGuest(enabled: boolean) {
    const [guestId, setGuestId] = useState('');
    const [guestName, setGuestName] = useState('');
    useEffect(() => {
        if (!enabled) return;
        let id = localStorage.getItem('egsport_guest_id');
        if (!id) { id = makeId(); localStorage.setItem('egsport_guest_id', id); }
        setGuestId(id);
        setGuestName(localStorage.getItem('egsport_guest_name') ?? '');
    }, [enabled]);
    const save = (name: string) => { setGuestName(name); localStorage.setItem('egsport_guest_name', name); };
    return { guestId, guestName, setGuestName: save };
}

function timeAgo(iso: string): string {
    const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    if (s < 604800) return `${Math.floor(s / 86400)}d`;
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?';
}
function countAll(cs: CommentDTO[]): number { return cs.reduce((n, c) => n + 1 + c.replies.length, 0); }

export default function CommentSection({ matchKey }: { matchKey: string }) {
    const { data: session } = useSession();
    const isMember = !!session?.user?.id;
    const qc = useQueryClient();
    const guest = useGuest(!isMember);
    const [live, setLive] = useState(false);

    // Identity payload attached to writes.
    const ident = useMemo(() => (
        isMember ? {} : { guestId: guest.guestId, guestName: guest.guestName }
    ), [isMember, guest.guestId, guest.guestName]);
    const canPost = isMember || (!!guest.guestId && !!guest.guestName.trim());

    const listKey = ['match-comments', matchKey];
    const gidParam = !isMember && guest.guestId ? `&gid=${encodeURIComponent(guest.guestId)}` : '';
    const { data, isLoading } = useQuery({
        queryKey: [...listKey, isMember ? 'member' : guest.guestId],
        queryFn: async (): Promise<CommentDTO[]> => {
            const res = await fetch(`/api/match-comments?matchKey=${encodeURIComponent(matchKey)}${gidParam}`);
            if (!res.ok) throw new Error('failed');
            return (await res.json()).comments ?? [];
        },
        staleTime: 10_000,
        refetchInterval: live ? false : 45_000, // socket drives updates; poll only as fallback
    });
    const comments = data ?? [];
    const invalidate = () => qc.invalidateQueries({ queryKey: listKey });

    // ---- realtime: subscribe to this match's comment room ----
    const socketRef = useRef<Socket | null>(null);
    useEffect(() => {
        const socket = io({ path: '/api/socketio', transports: ['polling', 'websocket'], reconnection: true, reconnectionAttempts: 8, reconnectionDelay: 800 });
        socketRef.current = socket;
        const join = () => { setLive(true); socket.emit('join-comments', { matchKey }); };
        socket.on('connect', join);
        socket.on('disconnect', () => setLive(false));
        const onChange = () => invalidate();
        socket.on('comment:new', onChange);
        socket.on('comment:deleted', onChange);
        socket.on('comment:reactions', onChange);
        return () => {
            socket.emit('leave-comments', { matchKey });
            socket.off();
            socket.disconnect();
            socketRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matchKey]);

    const addComment = useMutation({
        mutationFn: async (vars: { content: string; parentId?: string }) => {
            const res = await fetch('/api/match-comments', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchKey, ...vars, ...ident }),
            });
            if (!res.ok) throw new Error((await res.json()).error ?? 'failed');
        },
        onSuccess: invalidate,
    });
    const removeComment = useMutation({
        mutationFn: async (id: string) => {
            const q = !isMember && guest.guestId ? `?gid=${encodeURIComponent(guest.guestId)}` : '';
            const res = await fetch(`/api/match-comments/${id}${q}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('failed');
        },
        onSuccess: invalidate,
    });
    const react = useMutation({
        mutationFn: async (vars: { id: string; type: string }) => {
            const res = await fetch(`/api/match-comments/${vars.id}/react`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: vars.type, ...ident }),
            });
            if (!res.ok) throw new Error('failed');
        },
        onSuccess: invalidate,
    });

    return (
        <section className="rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-4">
            <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Comments</h3>
                {comments.length > 0 ? <span className="text-xs text-gray-500">{countAll(comments)}</span> : null}
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-gray-500" title={live ? 'Live updates on' : 'Reconnecting…'}>
                    {live ? <><Wifi className="h-3 w-3 text-emerald-400" /> Live</> : <><WifiOff className="h-3 w-3" /> …</>}
                </span>
            </div>

            {!isMember ? <GuestNameField guest={guest} /> : null}

            {canPost ? (
                <Composer placeholder="Share your thoughts on the match…" submitting={addComment.isPending} onSubmit={(content) => addComment.mutate({ content })} />
            ) : (
                <p className="rounded-lg border border-gray-800 bg-gray-950/60 px-3 py-2.5 text-xs text-gray-500">Pick a name above to comment as a guest — or sign in.</p>
            )}

            {isLoading ? (
                <div className="flex items-center gap-2 py-4 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading comments…</div>
            ) : comments.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">No comments yet. Be the first.</p>
            ) : (
                <ul className="space-y-4">
                    {comments.map((c) => (
                        <CommentItem
                            key={c.id}
                            comment={c}
                            canPost={canPost}
                            onReact={(id, type) => react.mutate({ id, type })}
                            onDelete={(id) => removeComment.mutate(id)}
                            onReply={(content) => addComment.mutate({ content, parentId: c.id })}
                            replying={addComment.isPending}
                        />
                    ))}
                </ul>
            )}
        </section>
    );
}

function GuestNameField({ guest }: { guest: ReturnType<typeof useGuest> }) {
    const [editing, setEditing] = useState(!guest.guestName);
    const [val, setVal] = useState(guest.guestName);
    useEffect(() => { setVal(guest.guestName); if (guest.guestName) setEditing(false); }, [guest.guestName]);
    if (!editing) {
        return (
            <div className="flex items-center gap-2 text-xs text-gray-400">
                Commenting as <span className="font-semibold text-gray-200">{guest.guestName}</span>
                <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-gray-500 hover:text-blue-300"><Pencil className="h-3 w-3" /> change</button>
            </div>
        );
    }
    return (
        <div className="flex items-center gap-2">
            <input
                value={val}
                onChange={(e) => setVal(e.target.value.slice(0, 40))}
                placeholder="Your display name"
                className="h-9 flex-1 rounded-lg border border-gray-800 bg-gray-950 px-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50"
            />
            <button
                onClick={() => { const v = val.trim(); if (v) { guest.setGuestName(v); setEditing(false); } }}
                disabled={!val.trim()}
                className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-40"
            >Set</button>
        </div>
    );
}

function CommentItem({ comment, canPost, onReact, onDelete, onReply, replying }: {
    comment: CommentDTO; canPost: boolean;
    onReact: (id: string, type: string) => void; onDelete: (id: string) => void; onReply: (content: string) => void; replying: boolean;
}) {
    const [showReply, setShowReply] = useState(false);
    return (
        <li>
            <CommentBody comment={comment} canPost={canPost} onReact={onReact} onDelete={onDelete} onReplyClick={() => setShowReply((v) => !v)} />
            {showReply && canPost ? (
                <div className="ml-9 mt-2">
                    <Composer placeholder={`Reply to ${comment.author.name}…`} submitting={replying} compact onSubmit={(content) => { onReply(content); setShowReply(false); }} />
                </div>
            ) : null}
            {comment.replies.length > 0 ? (
                <ul className="ml-9 mt-3 space-y-3 border-l border-gray-800 pl-3">
                    {comment.replies.map((r) => (
                        <li key={r.id}><CommentBody comment={r} canPost={canPost} onReact={onReact} onDelete={onDelete} /></li>
                    ))}
                </ul>
            ) : null}
        </li>
    );
}

function CommentBody({ comment, canPost, onReact, onDelete, onReplyClick }: {
    comment: CommentDTO; canPost: boolean;
    onReact: (id: string, type: string) => void; onDelete: (id: string) => void; onReplyClick?: () => void;
}) {
    const [picker, setPicker] = useState(false);
    return (
        <div className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-600/30 text-xs font-bold text-blue-100 ring-1 ring-blue-500/20">{initials(comment.author.name)}</span>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{comment.author.name}</span>
                    {comment.author.isGuest ? <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-gray-500">guest</span> : null}
                    <span className="text-[11px] text-gray-500">{timeAgo(comment.createdAt)}</span>
                    {comment.canDelete ? (
                        <button onClick={() => onDelete(comment.id)} className="ml-auto text-gray-600 hover:text-red-400" aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                    ) : null}
                </div>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-gray-200">{comment.content}</p>

                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {comment.reactions.map((r) => {
                        const meta = REACTIONS.find((x) => x.type === r.type);
                        return (
                            <button key={r.type} disabled={!canPost} onClick={() => onReact(comment.id, r.type)}
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1 transition-colors ${r.reacted ? 'bg-blue-500/15 text-blue-300 ring-blue-500/40' : 'bg-gray-800/60 text-gray-300 ring-gray-800 hover:ring-blue-500/30'} ${!canPost ? 'cursor-default' : ''}`}>
                                <span>{meta?.emoji ?? '👍'}</span>{r.count}
                            </button>
                        );
                    })}
                    {canPost ? (
                        <div className="relative">
                            <button onClick={() => setPicker((v) => !v)} className="rounded-full bg-gray-800/60 px-2 py-0.5 text-xs text-gray-400 ring-1 ring-gray-800 hover:text-blue-300">＋</button>
                            {picker ? (
                                <div className="absolute bottom-full left-0 z-10 mb-1 flex gap-1 rounded-full border border-gray-800 bg-gray-950 px-2 py-1 shadow-xl">
                                    {REACTIONS.map((r) => <button key={r.type} title={r.label} onClick={() => { onReact(comment.id, r.type); setPicker(false); }} className="text-base transition-transform hover:scale-125">{r.emoji}</button>)}
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                    {onReplyClick && canPost ? (
                        <button onClick={onReplyClick} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-300"><CornerDownRight className="h-3 w-3" /> Reply</button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function Composer({ placeholder, submitting, onSubmit, compact }: { placeholder: string; submitting: boolean; onSubmit: (content: string) => void; compact?: boolean }) {
    const [value, setValue] = useState('');
    const MAX = 2000;
    const submit = () => { const v = value.trim(); if (!v || submitting) return; onSubmit(v); setValue(''); };
    return (
        <div className="space-y-1.5">
            <textarea
                value={value}
                onChange={(e) => setValue(e.target.value.slice(0, MAX))}
                onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit(); }}
                placeholder={placeholder}
                rows={compact ? 2 : 3}
                className="w-full resize-y rounded-lg border border-gray-800 bg-gray-950 p-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
            />
            <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-600">{value.length}/{MAX} · ⌘↵ to send</span>
                <button onClick={submit} disabled={!value.trim() || submitting} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40">
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Post
                </button>
            </div>
        </div>
    );
}
