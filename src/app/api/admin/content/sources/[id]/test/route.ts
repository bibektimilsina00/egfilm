import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        return NextResponse.json({ success: true, status: 'healthy' });
    } catch (error) {
        console.error('Error testing source:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
