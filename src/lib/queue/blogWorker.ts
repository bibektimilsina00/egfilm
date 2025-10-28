/**
 * BullMQ Worker for Blog Generation
 * Processes background jobs from the queue
 */

import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { BlogGenerationJobData } from './blogQueue';
import { generateBlogsWithQueue } from '@/lib/services/blogGeneratorService';

// Helper function to update user status with error
async function updateUserStatusWithError(userId: string, error: any) {
    try {
        const errorMessage = error.message || 'Unknown error occurred';
        const statusKey = `blog-generation-status:${userId}`;
        
        // Get current status or create default
        let status;
        try {
            const cached = await connection.get(statusKey);
            status = cached ? JSON.parse(cached) : {
                isRunning: false,
                mode: 'batch',
                sortBy: 'popular',
                total: 0,
                completed: 0,
                failed: 0,
                skipped: 0,
                errors: [],
                logs: [],
                userId,
            };
        } catch (parseError) {
            status = {
                isRunning: false,
                mode: 'batch',
                sortBy: 'popular',
                total: 0,
                completed: 0,
                failed: 0,
                skipped: 0,
                errors: [],
                logs: [],
                userId,
            };
        }

        // Update status with error
        status.isRunning = false;
        status.failed = (status.failed || 0) + 1;
        
        // Add error to errors array (keep last 10 errors)
        if (!status.errors) status.errors = [];
        const timestamp = new Date().toISOString();
        status.errors.unshift(`[${timestamp}] ${errorMessage}`);
        status.errors = status.errors.slice(0, 10);
        
        // Add log entry
        if (!status.logs) status.logs = [];
        status.logs.unshift(`[${timestamp}] ❌ Error: ${errorMessage}`);
        status.logs = status.logs.slice(0, 50);

        // Save updated status
        await connection.set(statusKey, JSON.stringify(status), 'EX', 3600); // Expire in 1 hour
        console.log(`🔄 [Worker] Updated user ${userId} status with error: ${errorMessage}`);
    } catch (redisError) {
        console.error('Failed to update Redis status with error:', redisError);
    }
}

// Redis connection (same as queue) with error handling
const connection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true, // Don't connect immediately
    retryStrategy: () => null, // Don't retry during build
});

// Suppress connection errors during build
connection.on('error', (err) => {
    if (process.env.NODE_ENV !== 'production') {
        console.warn('Redis connection warning (may be expected during build):', err.message);
    }
});

// Create the worker
export const blogWorker = new Worker<BlogGenerationJobData>(
    'blog-generation',
    async (job: Job<BlogGenerationJobData>) => {
        console.log(`🔄 [Worker] Processing job ${job.id} for user ${job.data.userId}`);

        try {
            // Update progress to 5%
            await job.updateProgress(5);

            // Call the blog generation service
            await generateBlogsWithQueue({
                config: job.data.config,
                authorId: job.data.authorId,
                userId: job.data.userId,
                jobId: job.id!,
                updateProgress: async (progress: number) => {
                    await job.updateProgress(progress);
                },
            });

            // Mark as 100% complete
            await job.updateProgress(100);

            console.log(`✅ [Worker] Job ${job.id} completed successfully`);
            return { success: true, message: 'Blog generation completed' };
        } catch (error: any) {
            console.error(`❌ [Worker] Job ${job.id} failed:`, error);
            
            // Update user status with error details
            try {
                await updateUserStatusWithError(job.data.userId, error);
            } catch (statusError) {
                console.error('Failed to update user status with error:', statusError);
            }
            
            throw error; // BullMQ will handle retries
        }
    },
    {
        connection,
        concurrency: 2, // Process up to 2 jobs simultaneously
        limiter: {
            max: 10, // Max 10 jobs per duration
            duration: 60000, // 1 minute
        },
    }
);

// Worker event listeners
blogWorker.on('completed', (job) => {
    console.log(`✅ [Worker] Completed job ${job.id}`);
});

blogWorker.on('failed', (job, err) => {
    console.error(`❌ [Worker] Failed job ${job?.id}:`, err.message);
});

blogWorker.on('error', (err) => {
    console.error('❌ [Worker] Error:', err);
});

blogWorker.on('active', (job) => {
    console.log(`🔄 [Worker] Started processing job ${job.id}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 [Worker] Received SIGTERM, closing worker...');
    await blogWorker.close();
    await connection.quit();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 [Worker] Received SIGINT, closing worker...');
    await blogWorker.close();
    await connection.quit();
    process.exit(0);
});

export default blogWorker;
