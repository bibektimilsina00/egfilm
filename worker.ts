#!/usr/bin/env node

/**
 * Standalone BullMQ Worker Script
 * Run this separately from Next.js server for production deployments
 * Usage: node worker.js or ts-node worker.ts
 */

// Load environment variables FIRST before any other imports
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local first (higher priority), then .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

console.log('🔧 Environment loaded');
console.log('📦 DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('📦 REDIS_HOST:', process.env.REDIS_HOST || 'localhost');

import './src/lib/queue/blogWorker';

console.log('🚀 Blog Generation Worker Started');
console.log('📊 Processing jobs from blog-generation queue');
console.log('🔌 Connected to Redis at', process.env.REDIS_HOST || 'localhost');
console.log('\n✅ Worker is ready and waiting for jobs...\n');

// Keep process running
process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM signal');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT signal');
    process.exit(0);
});
