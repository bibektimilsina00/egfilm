import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function PATCH(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        const url = new URL(request.url);
        const sourceId = url.pathname.split('/')[5]; // Get ID from /admin/content/sources/:id/...
        const body = await request.json();

        // TODO: Update source status

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating source:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        // This is for test endpoint
        return NextResponse.json({ success: true, status: 'healthy', responseTime: 150 });
    } catch (error) {
        console.error('Error testing source:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
