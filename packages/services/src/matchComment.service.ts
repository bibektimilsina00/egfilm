import { prisma } from '@egfilm/db';

/** Allowed reaction types. Anything else is rejected. */
export const REACTION_TYPES = ['like', 'love', 'laugh', 'wow', 'sad', 'fire'] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

const MAX_LEN = 2000;

export interface CommentReactionDTO {
    type: string;
    count: number;
    reacted: boolean;
}

export interface CommentDTO {
    id: string;
    content: string;
    createdAt: string;
    isEdited: boolean;
    parentId: string | null;
    user: { id: string; name: string };
    reactions: CommentReactionDTO[];
    replies: CommentDTO[];
    canDelete: boolean;
}

interface RawReaction {
    type: string;
    userId: string;
}
interface RawComment {
    id: string;
    content: string;
    createdAt: Date;
    isEdited: boolean;
    parentId: string | null;
    user: { id: string; name: string };
    reactions: RawReaction[];
    replies?: RawComment[];
}

const userSelect = { select: { id: true, name: true } };

function aggregateReactions(reactions: RawReaction[], currentUserId?: string): CommentReactionDTO[] {
    const counts = new Map<string, { count: number; reacted: boolean }>();
    for (const r of reactions) {
        const entry = counts.get(r.type) ?? { count: 0, reacted: false };
        entry.count += 1;
        if (currentUserId && r.userId === currentUserId) entry.reacted = true;
        counts.set(r.type, entry);
    }
    // stable ordering by our canonical list
    return REACTION_TYPES.filter((t) => counts.has(t)).map((t) => ({ type: t, count: counts.get(t)!.count, reacted: counts.get(t)!.reacted }));
}

function toDTO(c: RawComment, currentUserId?: string, isAdmin = false): CommentDTO {
    return {
        id: c.id,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        isEdited: c.isEdited,
        parentId: c.parentId,
        user: { id: c.user.id, name: c.user.name },
        reactions: aggregateReactions(c.reactions, currentUserId),
        replies: (c.replies ?? []).map((r) => toDTO(r, currentUserId, isAdmin)),
        canDelete: !!currentUserId && (c.user.id === currentUserId || isAdmin),
    };
}

/** List threaded comments (newest top-level first, replies oldest first). */
export async function listMatchComments(matchKey: string, currentUserId?: string, isAdmin = false): Promise<CommentDTO[]> {
    const comments = await prisma.matchComment.findMany({
        where: { matchKey, parentId: null },
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
            user: userSelect,
            reactions: { select: { type: true, userId: true } },
            replies: {
                orderBy: { createdAt: 'asc' },
                include: { user: userSelect, reactions: { select: { type: true, userId: true } } },
            },
        },
    });
    return (comments as unknown as RawComment[]).map((c) => toDTO(c, currentUserId, isAdmin));
}

export async function createMatchComment(
    userId: string,
    input: { matchKey: string; content: string; parentId?: string | null },
    isAdmin = false,
): Promise<CommentDTO> {
    const content = (input.content ?? '').trim();
    if (!content) throw new Error('Comment cannot be empty');
    if (content.length > MAX_LEN) throw new Error('Comment too long');
    if (!input.matchKey) throw new Error('Missing matchKey');

    // Replies are only one level deep and must belong to the same match.
    let parentId: string | null = null;
    if (input.parentId) {
        const parent = await prisma.matchComment.findUnique({ where: { id: input.parentId }, select: { id: true, matchKey: true, parentId: true } });
        if (!parent || parent.matchKey !== input.matchKey) throw new Error('Invalid parent comment');
        parentId = parent.parentId ?? parent.id; // attach nested replies to the top-level parent
    }

    const created = await prisma.matchComment.create({
        data: { matchKey: input.matchKey, userId, content, parentId },
        include: {
            user: userSelect,
            reactions: { select: { type: true, userId: true } },
            replies: { include: { user: userSelect, reactions: { select: { type: true, userId: true } } } },
        },
    });
    return toDTO(created as unknown as RawComment, userId, isAdmin);
}

export async function deleteMatchComment(userId: string, commentId: string, isAdmin = false): Promise<void> {
    const comment = await prisma.matchComment.findUnique({ where: { id: commentId }, select: { userId: true } });
    if (!comment) throw new Error('Comment not found');
    if (comment.userId !== userId && !isAdmin) throw new Error('Forbidden');
    await prisma.matchComment.delete({ where: { id: commentId } });
}

/** Toggle a reaction; returns the comment's updated reaction summary. */
export async function toggleReaction(userId: string, commentId: string, type: string): Promise<CommentReactionDTO[]> {
    if (!REACTION_TYPES.includes(type as ReactionType)) throw new Error('Invalid reaction type');
    const exists = await prisma.matchComment.findUnique({ where: { id: commentId }, select: { id: true } });
    if (!exists) throw new Error('Comment not found');

    const existing = await prisma.matchCommentReaction.findUnique({
        where: { commentId_userId_type: { commentId, userId, type } },
    });
    if (existing) {
        await prisma.matchCommentReaction.delete({ where: { id: existing.id } });
    } else {
        await prisma.matchCommentReaction.create({ data: { commentId, userId, type } });
    }

    const reactions = await prisma.matchCommentReaction.findMany({ where: { commentId }, select: { type: true, userId: true } });
    return aggregateReactions(reactions, userId);
}
