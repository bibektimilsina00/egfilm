/**
 * API Route: Start Auto Blog Generation (with BullMQ)
 * POST /api/admin/blog/auto-generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { addBlogGenerationJob } from '@/lib/queue/blogQueue';
import type { SortOption, GenerationMode } from '@/lib/services/blogGeneratorService';

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

        // Parse request body
        const body = await request.json();
        const {
            count = 5,
            type = 'movie',
            sortBy = 'popular',
            mode = 'batch',
            postsPerHour = 1,
            minRating,
            includeAdult = false,
            genres,
            yearFrom,
            yearTo,
            aiModel, // New: AI model selection
            apiKey, // New: User's API key
        } = body;

        // Validate inputs
        if (!['movie', 'tv'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid type. Must be "movie" or "tv"' },
                { status: 400 }
            );
        }

        const validSortOptions: SortOption[] = [
            'popular',
            'top_rated',
            'upcoming',
            'now_playing',
            'trending_day',
            'trending_week',
        ];
        if (!validSortOptions.includes(sortBy)) {
            return NextResponse.json(
                { error: 'Invalid sortBy option' },
                { status: 400 }
            );
        }

        if (!['batch', 'continuous'].includes(mode)) {
            return NextResponse.json(
                { error: 'Invalid mode. Must be "batch" or "continuous"' },
                { status: 400 }
            );
        }

        if (mode === 'batch' && (count < 1 || count > 50)) {
            return NextResponse.json(
                { error: 'Count must be between 1 and 50 for batch mode' },
                { status: 400 }
            );
        }

        if (mode === 'continuous' && (postsPerHour < 1 || postsPerHour > 10)) {
            return NextResponse.json(
                { error: 'Posts per hour must be between 1 and 10' },
                { status: 400 }
            );
        }

        // Add job to BullMQ queue
        const job = await addBlogGenerationJob({
            userId: user.id,
            authorId: user.id,
            config: {
                count,
                type,
                sortBy,
                mode,
                postsPerHour,
                minRating,
                includeAdult,
                genres,
                yearFrom,
                yearTo,
                aiModel,
                apiKey,
            },
        });

        const message =
            mode === 'batch'
                ? `Started generating ${count} ${type} blog posts (${sortBy}) - Job ID: ${job.id}`
                : `Started continuous generation: ${postsPerHour} ${type} posts per hour (${sortBy}) - Job ID: ${job.id}`;

        return NextResponse.json({
            success: true,
            message,
            jobId: job.id,
        });
    } catch (error: any) {
        console.error('Auto-generate API error:', error);

        if (error.message?.includes('already running')) {
            return NextResponse.json(
                { error: 'You already have a generation in progress. Please wait for it to complete or stop it first.' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to start generation' },
            { status: 500 }
        );
    }
}
