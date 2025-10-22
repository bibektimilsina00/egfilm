/**
 * API Route: Get Generation Status
 * GET /api/admin/blog/auto-generate/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { getGenerationStatus } from '@/lib/services/blogGeneratorService';
import { blogQueue } from '@/lib/queue/blogQueue';

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

        // Get status from Redis (now synced in real-time by worker)
        const status = await getGenerationStatus(user.id);

        // Try to get active job from queue for real-time isRunning state
        const jobs = await blogQueue.getJobs(['active', 'waiting', 'delayed']);
        const activeJob = jobs.find(job => job.data.userId === user.id);

        if (activeJob) {
            const state = await activeJob.getState();

            // Update isRunning status based on queue job state
            status.isRunning = state === 'active' || state === 'waiting';
        }

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
