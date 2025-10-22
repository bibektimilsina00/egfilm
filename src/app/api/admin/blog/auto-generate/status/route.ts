/**
 * API Route: Get Generation Status
 * GET /api/admin/blog/auto-generate/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { getGenerationStatus } from '@/lib/services/blogGeneratorService';

export async function GET(request: NextRequest) {
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

        const status = getGenerationStatus(user.id);

        return NextResponse.json({
            success: true,
            status,
        });
    } catch (error: any) {
        console.error('Status API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get status' },
            { status: 500 }
        );
    }
}
