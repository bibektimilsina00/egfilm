import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: postId } = await params;
        const session = await auth();

        // Get total like count
        const likeCount = await prisma.blogLike.count({
            where: { postId },
        });

        // Check if current user has liked
        let isLiked = false;
        if (session?.user?.id) {
            const userLike = await prisma.blogLike.findUnique({
                where: {
                    postId_userId: {
                        postId,
                        userId: session.user.id,
                    },
                },
            });
            isLiked = !!userLike;
        }

        return NextResponse.json({ count: likeCount, isLiked });
    } catch (error) {
        console.error('Failed to fetch likes:', error);
        return NextResponse.json({ error: 'Failed to fetch likes' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: postId } = await params;
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if post exists
        const post = await prisma.blogPost.findUnique({
            where: { id: postId },
        });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Create like (will throw error if already exists due to unique constraint)
        const like = await prisma.blogLike.create({
            data: {
                postId,
                userId: session.user.id,
            },
        });

        // Get updated count
        const likeCount = await prisma.blogLike.count({
            where: { postId },
        });

        return NextResponse.json({ success: true, count: likeCount, isLiked: true });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Already liked' }, { status: 400 });
        }
        console.error('Failed to like post:', error);
        return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: postId } = await params;
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Delete like
        await prisma.blogLike.delete({
            where: {
                postId_userId: {
                    postId,
                    userId: session.user.id,
                },
            },
        });

        // Get updated count
        const likeCount = await prisma.blogLike.count({
            where: { postId },
        });

        return NextResponse.json({ success: true, count: likeCount, isLiked: false });
    } catch (error) {
        console.error('Failed to unlike post:', error);
        return NextResponse.json({ error: 'Failed to unlike post' }, { status: 500 });
    }
}
