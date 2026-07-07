'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import io, { type Socket } from 'socket.io-client';
import { MessageSquare, Send, Trash2, CornerDownRight, X, ArrowDown, SmilePlus, Radio } from 'lucide-react';

// ---- DTO ----
interface ReactionDTO { type: string; count: number; reacted: boolean }
interface CommentDTO {
    id: string;
    content: string;
    createdAt: string;
    parentId: string | null;
    author: { name: string; isGuest: boolean };
    reactions: ReactionDTO[];
    replies: CommentDTO[];
    canDelete: boolean;
}

const REACTIONS: Array<{ type: string; emoji: string }> = [
    { type: 'like', emoji: '👍' }, { type: 'love', emoji: '❤️' }, { type: 'laugh', emoji: '😂' },
    { type: 'wow', emoji: '😮' }, { type: 'sad', emoji: '😢' }, { type: 'fire', emoji: '🔥' },
];
const EMOJI: Record<string, string> = Object.fromEntries(REACTIONS.map((r) => [r.type, r.emoji]));

function makeId(): string {
    try { return crypto.randomUUID(); } catch { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`; }
}
function useGuestId(enabled: boolean): string {
    const [id, setId] = useState('');
    useEffect(() => {
        if (!enabled) return;
        let g = localStorage.getItem('egsport_guest_id');
        if (!g) { g = makeId(); localStorage.setItem('egsport_guest_id', g); }
        setId(g);
    }, [enabled]);
    return id;
}

function timeAgo(iso: string): string {
    const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return 'now';
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
}
function initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?';
}
// deterministic avatar hue from the name
function hue(name: string): number {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
    return h;
}
function total(cs: CommentDTO[]): number { return cs.reduce((n, c) => n + 1 + c.replies.length, 0); }

export default function CommentSection({ matchKey }: { matchKey: string }) {
    const { data: session } = useSession();
    const isMember = !!session?.user?.id;
    const guestId = useGuestId(!isMember);
    const qc = useQueryClient();
    const [live, setLive] = useState(false);
    const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

    const ident = useMemo(() => (isMember ? {} : { guestId }), [isMember, guestId]);
    const canPost = isMember || !!guestId;

    const listKey = ['match-comments', matchKey];
    const gid = !isMember && guestId ? `&gid=${encodeURIComponent(guestId)}` : '';
    const { data } = useQuery({
        queryKey: [...listKey, isMember ? 'member' : guestId],
        queryFn: async (): Promise<CommentDTO[]> => {
            const res = await fetch(`/api/match-comments?matchKey=${encodeURIComponent(matchKey)}${gid}`);
            if (!res.ok) throw new Error('failed');
            return (await res.json()).comments ?? [];
        },
        staleTime: 10_000,
        refetchInterval: live ? false : 30_000,
    });
    // API returns newest-first; a live chat reads oldest-top, newest-bottom.
    const comments = useMemo(() => (data ? [...data].reverse() : []), [data]);
    const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: listKey }), [qc, matchKey]); // eslint-disable-line react-hooks/exhaustive-deps

    // ---- realtime ----
    const socketRef = useRef<Socket | null>(null);
    useEffect(() => {
        const socket = io({ path: '/api/socketio', transports: ['polling', 'websocket'], reconnection: true, reconnectionAttempts: 8, reconnectionDelay: 800 });
        socketRef.current = socket;
        socket.on('connect', () => { setLive(true); socket.emit('join-comments', { matchKey }); });
        socket.on('disconnect', () => setLive(false));
        const onChange = () => invalidate();
        socket.on('comment:new', onChange);
        socket.on('comment:deleted', onChange);
        socket.on('comment:reactions', onChange);
        return () => { socket.emit('leave-comments', { matchKey }); socket.off(); socket.disconnect(); socketRef.current = null; };
    }, [matchKey, invalidate]);

    // ---- auto-scroll (stick to bottom like a live chat) ----
    const scrollRef = useRef<HTMLDivElement>(null);
    const stickRef = useRef(true);
    const [showJump, setShowJump] = useState(false);
    const onScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        stickRef.current = atBottom;
        setShowJump(!atBottom);
    };
    const scrollToBottom = (smooth = true) => {
        const el = scrollRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
        stickRef.current = true;
        setShowJump(false);
    };
    useLayoutEffect(() => {
        if (stickRef.current) scrollToBottom(false);
    }, [comments.length]);

    const addComment = useMutation({
        mutationFn: async (vars: { content: string; parentId?: string }) => {
            const res = await fetch('/api/match-comments', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchKey, ...vars, ...ident }),
            });
            if (!res.ok) throw new Error((await res.json()).error ?? 'failed');
        },
        onSuccess: () => { stickRef.current = true; invalidate(); },
    });
    const removeComment = useMutation({
        mutationFn: async (id: string) => {
            const q = !isMember && guestId ? `?gid=${encodeURIComponent(guestId)}` : '';
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

    const send = (text: string) => { addComment.mutate({ content: text, parentId: replyTo?.id }); setReplyTo(null); };

    return (
        <section className="flex h-[32rem] flex-col overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950">
            <header className="flex items-center gap-2 border-b border-gray-800 px-4 py-2.5">
                <MessageSquare className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Live chat</h3>
                {comments.length > 0 ? <span className="text-xs text-gray-500">{total(comments)}</span> : null}
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium" title={live ? 'Live' : 'Connecting…'}>
                    <span className={`h-1.5 w-1.5 rounded-full ${live ? 'animate-pulse bg-emerald-400' : 'bg-gray-600'}`} />
                    <span className={live ? 'text-emerald-400' : 'text-gray-500'}>{live ? 'LIVE' : '···'}</span>
                </span>
            </header>

            <div className="relative flex-1 overflow-hidden">
                <div ref={scrollRef} onScroll={onScroll} className="h-full space-y-0.5 overflow-y-auto px-2 py-2">
                    {comments.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-sm text-gray-600">
                            <Radio className="h-6 w-6" />
                            <p>No messages yet.</p>
                            <p className="text-xs">Say something about the match.</p>
                        </div>
                    ) : (
                        comments.map((c) => (
                            <Message key={c.id} c={c} canPost={canPost}
                                onReact={(id, t) => react.mutate({ id, type: t })}
                                onDelete={(id) => removeComment.mutate(id)}
                                onReply={(id, name) => setReplyTo({ id, name })} />
                        ))
                    )}
                </div>
                {showJump ? (
                    <button onClick={() => scrollToBottom()} className="absolute bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-blue-500 px-3 py-1 text-xs font-medium text-white shadow-lg hover:bg-blue-600">
                        <ArrowDown className="h-3 w-3" /> Latest
                    </button>
                ) : null}
            </div>

            <ChatInput
                canPost={canPost}
                isMember={isMember}
                submitting={addComment.isPending}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                onSend={send}
            />
        </section>
    );
}

function Message({ c, canPost, onReact, onDelete, onReply, depth = 0 }: {
    c: CommentDTO; canPost: boolean; depth?: number;
    onReact: (id: string, type: string) => void; onDelete: (id: string) => void; onReply: (id: string, name: string) => void;
}) {
    const [picker, setPicker] = useState(false);
    const h = hue(c.author.name);
    return (
        <div className={depth === 0 ? '' : 'ml-8 border-l border-gray-800/70 pl-2'}>
            <div className="group flex gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.03]">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ring-1 ring-white/10"
                    style={{ background: `linear-gradient(135deg, hsl(${h} 60% 45%), hsl(${(h + 40) % 360} 60% 35%))` }}>
                    {initials(c.author.name)}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">
                        <span className={`mr-1.5 font-semibold ${c.author.isGuest ? 'text-gray-400' : 'text-blue-300'}`}>{c.author.name}</span>
                        <span className="mr-1.5 align-middle text-[10px] text-gray-600">{timeAgo(c.createdAt)}</span>
                        <span className="whitespace-pre-wrap break-words text-gray-200">{c.content}</span>
                    </p>

                    <div className="mt-0.5 flex flex-wrap items-center gap-1">
                        {c.reactions.map((r) => (
                            <button key={r.type} disabled={!canPost} onClick={() => onReact(c.id, r.type)}
                                className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[11px] ring-1 transition-colors ${r.reacted ? 'bg-blue-500/15 text-blue-300 ring-blue-500/40' : 'bg-gray-800/60 text-gray-400 ring-transparent hover:ring-gray-700'}`}>
                                <span>{EMOJI[r.type] ?? '👍'}</span>{r.count}
                            </button>
                        ))}

                        {/* hover actions */}
                        <span className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            {canPost ? (
                                <span className="relative">
                                    <button onClick={() => setPicker((v) => !v)} className="rounded-full p-0.5 text-gray-500 hover:text-blue-300" aria-label="React"><SmilePlus className="h-3.5 w-3.5" /></button>
                                    {picker ? (
                                        <span className="absolute bottom-full left-0 z-10 mb-1 flex gap-0.5 rounded-full border border-gray-800 bg-gray-950 px-1.5 py-1 shadow-xl">
                                            {REACTIONS.map((r) => <button key={r.type} onClick={() => { onReact(c.id, r.type); setPicker(false); }} className="text-sm transition-transform hover:scale-125">{r.emoji}</button>)}
                                        </span>
                                    ) : null}
                                </span>
                            ) : null}
                            {canPost && depth === 0 ? (
                                <button onClick={() => onReply(c.id, c.author.name)} className="rounded-full p-0.5 text-gray-500 hover:text-blue-300" aria-label="Reply"><CornerDownRight className="h-3.5 w-3.5" /></button>
                            ) : null}
                            {c.canDelete ? (
                                <button onClick={() => onDelete(c.id)} className="rounded-full p-0.5 text-gray-500 hover:text-red-400" aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                            ) : null}
                        </span>
                    </div>
                </div>
            </div>
            {c.replies.map((r) => (
                <Message key={r.id} c={r} canPost={canPost} depth={depth + 1} onReact={onReact} onDelete={onDelete} onReply={onReply} />
            ))}
        </div>
    );
}

function ChatInput({ canPost, isMember, submitting, replyTo, onCancelReply, onSend }: {
    canPost: boolean; isMember: boolean; submitting: boolean;
    replyTo: { id: string; name: string } | null; onCancelReply: () => void; onSend: (text: string) => void;
}) {
    const [value, setValue] = useState('');
    const MAX = 500;
    const submit = () => { const v = value.trim(); if (!v || submitting || !canPost) return; onSend(v); setValue(''); };
    return (
        <div className="border-t border-gray-800 bg-gray-950/60 px-3 py-2">
            {replyTo ? (
                <div className="mb-1.5 flex items-center gap-2 text-[11px] text-gray-400">
                    <CornerDownRight className="h-3 w-3" /> Replying to <span className="font-medium text-gray-300">{replyTo.name}</span>
                    <button onClick={onCancelReply} className="ml-auto text-gray-500 hover:text-red-400"><X className="h-3 w-3" /></button>
                </div>
            ) : null}
            <div className="flex items-center gap-2">
                <input
                    value={value}
                    onChange={(e) => setValue(e.target.value.slice(0, MAX))}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
                    placeholder={isMember ? 'Say something…' : 'Comment as Anonymous…'}
                    className="h-9 flex-1 rounded-full border border-gray-800 bg-gray-900 px-4 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                />
                <button onClick={submit} disabled={!value.trim() || submitting || !canPost}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send">
                    <Send className="h-4 w-4" />
                </button>
            </div>
            {!isMember ? (
                <p className="mt-1 px-1 text-[10px] text-gray-600">Posting as Anonymous · <Link href="/login" className="text-blue-400 hover:underline">sign in</Link> to use your name</p>
            ) : null}
        </div>
    );
}
