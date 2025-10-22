/**
 * BullMQ Worker for Blog Generation
 * Processes background jobs from the queue
 */

import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { BlogGenerationJobData } from './blogQueue';
import { generateBlogsWithQueue } from '@/lib/services/blogGeneratorService';

// Redis connection (same as queue)
const connection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
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
        } catch (error) {
            console.error(`❌ [Worker] Job ${job.id} failed:`, error);
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
