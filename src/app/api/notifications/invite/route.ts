import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sendWatchInvite } from '@/lib/services/notification.service';

// POST - Send watch together invite
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            console.log('❌ Unauthorized: No session or email');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { toUserId, roomCode, mediaTitle, mediaId, mediaType, embedUrl } = body;

        console.log('📧 Sending invite:', {
            from: session.user.email,
            toUserId,
            roomCode,
            mediaTitle,
            mediaType
        });

        if (!toUserId || !roomCode || !mediaTitle || !mediaId || !mediaType || !embedUrl) {
            console.log('❌ Missing fields:', { toUserId, roomCode, mediaTitle, mediaId, mediaType, embedUrl });
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const notification = await sendWatchInvite(
            session.user.email,
            toUserId,
            roomCode,
            mediaTitle,
            mediaId,
            mediaType,
            embedUrl
        );

        console.log('✅ Notification created:', notification.id, 'for user:', toUserId);

        return NextResponse.json({ success: true, notification });
    } catch (error) {
        console.error('❌ Error sending invite:', error);
        return NextResponse.json(
            { error: 'Failed to send invite' },
            { status: 500 }
        );
    }
}
