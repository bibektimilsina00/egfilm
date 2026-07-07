'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Loader2, Trash2, CornerDownRight, Send, LogIn } from 'lucide-react';

// ---- shared shape (mirrors the CommentDTO returned by the API) ----
interface ReactionDTO { type: string; count: number; reacted: boolean }
interface CommentDTO {
    id: string;
    content: string;
    createdAt: string;
    isEdited: boolean;
    parentId: string | null;
    user: { id: string; name: string };
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

function timeAgo(iso: string): string {
    const then = new Date(iso).getTime();
    const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
    if (secs < 60) return 'just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?';
}

function countAll(comments: CommentDTO[]): number {
    return comments.reduce((sum, c) => sum + 1 + c.replies.length, 0);
}

export default function CommentSection({ matchKey }: { matchKey: string }) {
    const { data: session } = useSession();
    const qc = useQueryClient();
    const isAuthed = !!session?.user?.id;

    const { data, isLoading } = useQuery({
        queryKey: ['match-comments', matchKey],
        queryFn: async (): Promise<CommentDTO[]> => {
            const res = await fetch(`/api/match-comments?matchKey=${encodeURIComponent(matchKey)}`);
            if (!res.ok) throw new Error('failed');
            return (await res.json()).comments ?? [];
        },
        staleTime: 15_000,
        refetchInterval: 30_000,
    });
    const comments = data ?? [];
    const invalidate = () => qc.invalidateQueries({ queryKey: ['match-comments', matchKey] });

    const addComment = useMutation({
        mutationFn: async (vars: { content: string; parentId?: string }) => {
            const res = await fetch('/api/match-comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchKey, ...vars }),
            });
            if (!res.ok) throw new Error((await res.json()).error ?? 'failed');
        },
        onSuccess: invalidate,
    });

    const removeComment = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/match-comments/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('failed');
        },
        onSuccess: invalidate,
    });

    const react = useMutation({
        mutationFn: async (vars: { id: string; type: string }) => {
            const res = await fetch(`/api/match-comments/${vars.id}/react`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: vars.type }),
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
            </div>

            {isAuthed ? (
                <Composer
                    placeholder="Share your thoughts on the match…"
                    submitting={addComment.isPending}
                    onSubmit={(content) => addComment.mutate({ content })}
                />
            ) : (
                <Link href="/login" className="flex items-center justify-center gap-2 rounded-lg border border-gray-800 bg-gray-950/60 px-4 py-3 text-sm text-gray-400 hover:border-blue-500/40 hover:text-blue-300">
                    <LogIn className="h-4 w-4" /> Sign in to join the conversation
                </Link>
            )}

            {isLoading ? (
                <div className="flex items-center gap-2 py-4 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading comments…</div>
            ) : comments.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">No comments yet. Be the first to comment.</p>
            ) : (
                <ul className="space-y-4">
                    {comments.map((c) => (
                        <CommentItem
                            key={c.id}
                            comment={c}
                            isAuthed={isAuthed}
                            onReact={(type) => react.mutate({ id: c.id, type })}
                            onReactReply={(replyId, type) => react.mutate({ id: replyId, type })}
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

function CommentItem({
    comment, isAuthed, onReact, onReactReply, onDelete, onReply, replying,
}: {
    comment: CommentDTO;
    isAuthed: boolean;
    onReact: (type: string) => void;
    onReactReply: (replyId: string, type: string) => void;
    onDelete: (id: string) => void;
    onReply: (content: string) => void;
    replying: boolean;
}) {
    const [showReply, setShowReply] = useState(false);
    return (
        <li>
            <CommentBody comment={comment} isAuthed={isAuthed} onReact={onReact} onDelete={onDelete} onReplyClick={() => setShowReply((v) => !v)} />
            {showReply && isAuthed ? (
                <div className="ml-9 mt-2">
                    <Composer
                        placeholder={`Reply to ${comment.user.name}…`}
                        submitting={replying}
                        compact
                        onSubmit={(content) => { onReply(content); setShowReply(false); }}
                    />
                </div>
            ) : null}
            {comment.replies.length > 0 ? (
                <ul className="ml-9 mt-3 space-y-3 border-l border-gray-800 pl-3">
                    {comment.replies.map((r) => (
                        <li key={r.id}>
                            <CommentBody comment={r} isAuthed={isAuthed} onReact={(type) => onReactReply(r.id, type)} onDelete={onDelete} />
                        </li>
                    ))}
                </ul>
            ) : null}
        </li>
    );
}

function CommentBody({
    comment, isAuthed, onReact, onDelete, onReplyClick,
}: {
    comment: CommentDTO;
    isAuthed: boolean;
    onReact: (type: string) => void;
    onDelete: (id: string) => void;
    onReplyClick?: () => void;
}) {
    const [pickerOpen, setPickerOpen] = useState(false);
    return (
        <div className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-600/30 text-xs font-bold text-blue-100 ring-1 ring-blue-500/20">{initials(comment.user.name)}</span>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{comment.user.name}</span>
                    <span className="text-[11px] text-gray-500">{timeAgo(comment.createdAt)}</span>
                    {comment.canDelete ? (
                        <button onClick={() => onDelete(comment.id)} className="ml-auto text-gray-600 hover:text-red-400" aria-label="Delete comment">
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    ) : null}
                </div>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-gray-200">{comment.content}</p>

                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {comment.reactions.map((r) => {
                        const meta = REACTIONS.find((x) => x.type === r.type);
                        return (
                            <button
                                key={r.type}
                                disabled={!isAuthed}
                                onClick={() => onReact(r.type)}
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1 transition-colors ${
                                    r.reacted ? 'bg-blue-500/15 text-blue-300 ring-blue-500/40' : 'bg-gray-800/60 text-gray-300 ring-gray-800 hover:ring-blue-500/30'
                                } ${!isAuthed ? 'cursor-default' : ''}`}
                            >
                                <span>{meta?.emoji ?? '👍'}</span>{r.count}
                            </button>
                        );
                    })}

                    {isAuthed ? (
                        <div className="relative">
                            <button onClick={() => setPickerOpen((v) => !v)} className="rounded-full bg-gray-800/60 px-2 py-0.5 text-xs text-gray-400 ring-1 ring-gray-800 hover:text-blue-300">＋</button>
                            {pickerOpen ? (
                                <div className="absolute bottom-full left-0 z-10 mb-1 flex gap-1 rounded-full border border-gray-800 bg-gray-950 px-2 py-1 shadow-xl">
                                    {REACTIONS.map((r) => (
                                        <button key={r.type} title={r.label} onClick={() => { onReact(r.type); setPickerOpen(false); }} className="text-base transition-transform hover:scale-125">{r.emoji}</button>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    {onReplyClick && isAuthed ? (
                        <button onClick={onReplyClick} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-300">
                            <CornerDownRight className="h-3 w-3" /> Reply
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function Composer({ placeholder, submitting, onSubmit, compact }: { placeholder: string; submitting: boolean; onSubmit: (content: string) => void; compact?: boolean }) {
    const [value, setValue] = useState('');
    const MAX = 2000;
    const submit = () => {
        const v = value.trim();
        if (!v || submitting) return;
        onSubmit(v);
        setValue('');
    };
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
                <button
                    onClick={submit}
                    disabled={!value.trim() || submitting}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Post
                </button>
            </div>
        </div>
    );
}
