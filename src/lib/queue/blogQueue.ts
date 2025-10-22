/**
 * BullMQ Queue Infrastructure for Blog Generation
 * Handles background job processing with Redis persistence
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import type { GenerationConfig } from '@/lib/services/blogGeneratorService';

// Redis connection configuration
const connection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

// Job data interface
export interface BlogGenerationJobData {
    userId: string;
    authorId: string;
    config: GenerationConfig;
}

// Create the blog generation queue
export const blogQueue = new Queue<BlogGenerationJobData>('blog-generation', {
    connection,
    defaultJobOptions: {
        attempts: 3, // Retry failed jobs up to 3 times
        backoff: {
            type: 'exponential',
            delay: 2000, // Start with 2s delay, doubles each retry
        },
        removeOnComplete: 100, // Keep last 100 completed jobs for history
        removeOnFail: false, // Keep all failed jobs for debugging
    },
});

// Queue events for monitoring
export const queueEvents = new QueueEvents('blog-generation', { connection });

// Listen to global events
queueEvents.on('completed', ({ jobId }) => {
    console.log(`✅ [Queue] Job ${jobId} completed successfully`);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
    console.error(`❌ [Queue] Job ${jobId} failed: ${failedReason}`);
});

queueEvents.on('progress', ({ jobId, data }) => {
    console.log(`📊 [Queue] Job ${jobId} progress: ${JSON.stringify(data)}`);
});

// Helper function to add a blog generation job
export async function addBlogGenerationJob(data: BlogGenerationJobData) {
    if (data.config.mode === 'continuous') {
        // For continuous mode, add a repeatable job
        const postsPerHour = data.config.postsPerHour || 1;
        const intervalMs = Math.floor((60 * 60 * 1000) / postsPerHour);

        const job = await blogQueue.add('generate-blogs', data, {
            jobId: `blog-gen-continuous-${data.userId}`, // Fixed ID for continuous mode
            priority: 2,
            repeat: {
                every: intervalMs, // Repeat at specified interval
                immediately: true, // Start immediately
            },
        });

        console.log(`🔄 [Queue] Added repeatable job ${job.id} for user ${data.userId} (every ${Math.round(intervalMs / 1000 / 60)} minutes)`);
        return job;
    } else {
        // For batch mode, add a one-time job
        const job = await blogQueue.add('generate-blogs', data, {
            jobId: `blog-gen-${data.userId}-${Date.now()}`, // Unique job ID
            priority: 1, // Batch jobs have higher priority
        });

        console.log(`🚀 [Queue] Added batch job ${job.id} for user ${data.userId}`);
        return job;
    }
}

// Helper function to get job status
export async function getJobStatus(jobId: string) {
    const job = await blogQueue.getJob(jobId);

    if (!job) {
        return null;
    }

    const state = await job.getState();
    const progress = job.progress;
    const data = job.data;

    return {
        id: job.id,
        state, // 'waiting', 'active', 'completed', 'failed', 'delayed'
        progress,
        data,
        failedReason: job.failedReason,
        finishedOn: job.finishedOn,
        processedOn: job.processedOn,
        timestamp: job.timestamp,
    };
}

// Helper function to get all jobs for a user
export async function getUserJobs(userId: string) {
    const [waiting, active, completed, failed] = await Promise.all([
        blogQueue.getWaiting(),
        blogQueue.getActive(),
        blogQueue.getCompleted(),
        blogQueue.getFailed(),
    ]);

    const allJobs = [...waiting, ...active, ...completed, ...failed];
    const userJobs = allJobs.filter(job => job.data.userId === userId);

    return Promise.all(
        userJobs.map(async (job) => ({
            id: job.id,
            state: await job.getState(),
            data: job.data,
            progress: job.progress,
            failedReason: job.failedReason,
            timestamp: job.timestamp,
        }))
    );
}

// Helper function to cancel a job
export async function cancelJob(jobId: string) {
    const job = await blogQueue.getJob(jobId);

    if (!job) {
        return { success: false, error: 'Job not found' };
    }

    await job.remove();
    console.log(`🛑 [Queue] Cancelled job ${jobId}`);

    return { success: true };
}

// Helper function to stop continuous mode for a user
export async function stopContinuousMode(userId: string) {
    const repeatableJobKey = `blog-gen-continuous-${userId}`;

    try {
        // Remove the repeatable job
        const repeatableJobs = await blogQueue.getRepeatableJobs();
        const userRepeatableJob = repeatableJobs.find(job => job.id === repeatableJobKey || job.key.includes(userId));

        if (userRepeatableJob) {
            await blogQueue.removeRepeatableByKey(userRepeatableJob.key);
            console.log(`🛑 [Queue] Stopped continuous mode for user ${userId}`);
            return { success: true };
        }

        return { success: false, error: 'No continuous mode job found' };
    } catch (error: any) {
        console.error(`Error stopping continuous mode:`, error);
        return { success: false, error: error.message };
    }
}

// Helper function to get queue metrics
export async function getQueueMetrics() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
        blogQueue.getWaitingCount(),
        blogQueue.getActiveCount(),
        blogQueue.getCompletedCount(),
        blogQueue.getFailedCount(),
        blogQueue.getDelayedCount(),
    ]);

    return {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
    };
}

// Cleanup function (call on server shutdown)
export async function closeQueue() {
    await queueEvents.close();
    await blogQueue.close();
    await connection.quit();
    console.log('🔒 [Queue] Closed all connections');
}
