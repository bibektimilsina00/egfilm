/**
 * API Route: Stop Generation
 * POST /api/admin/blog/auto-generate/stop
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { stopGeneration } from '@/lib/services/blogGeneratorService';

export async function POST(request: NextRequest) {
    try {
        // Verify admin authentication
        const authResult = await requireAdminAuth();
        if (authResult.error) {
            return authResult.error;
        }

        const user = authResult.session?.user as any;
        if (!user?.id) {
            return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
        }

        stopGeneration(user.id);

        return NextResponse.json({
            success: true,
            message: 'Generation will stop after current item completes',
        });
    } catch (error: any) {
        console.error('Stop API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to stop generation' },
            { status: 500 }
        );
    }
}
