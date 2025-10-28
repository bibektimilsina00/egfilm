import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Simple health check endpoint for Docker container monitoring
 * Checks database connectivity without Redis dependency
 */
export async function GET() {
    try {
        // Test database connection with a simple count query
        // This will work if the database is accessible
        await prisma.user.count();

        return NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: 'connected',
                app: 'running'
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Health check failed:', error);

        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            services: {
                database: 'disconnected',
                app: 'running'
            },
            error: 'Database connection failed'
        }, { status: 503 });
    }
}