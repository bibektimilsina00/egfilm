/**
 * API Route: Stop Generation
 * POST /api/admin/blog/auto-generate/stop
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { stopGeneration, getGenerationStatus } from '@/lib/services/blogGeneratorService';
import { stopContinuousMode } from '@/lib/queue/blogQueue';

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

        // Get current status to check mode
        const status = await getGenerationStatus(user.id);

        if (status.mode === 'continuous') {
            // Stop the repeatable job for continuous mode
            const result = await stopContinuousMode(user.id);
            if (!result.success) {
                console.warn('Failed to stop continuous mode:', result.error);
            }
        }

        // Also stop the in-memory generation flag
        await stopGeneration(user.id);

        return NextResponse.json({
            success: true,
            message: status.mode === 'continuous'
                ? 'Continuous generation stopped. No more posts will be created.'
                : 'Generation will stop after current item completes',
        });
    } catch (error: any) {
        console.error('Stop API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to stop generation' },
            { status: 500 }
        );
    }
}
