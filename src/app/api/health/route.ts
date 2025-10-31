import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Simple health check endpoint for Docker container monitoring
 * Checks database connectivity without Redis dependency
 */
export async function GET() {
    try {
        console.log('🔍 Health check: Starting database connectivity test...');

        // Test database connection - try simple query first, fallback to raw query
        let dbTestResult = 'unknown';
        try {
            console.log('🔍 Health check: Testing user.count()...');
            const userCount = await prisma.user.count();
            dbTestResult = `success (${userCount} users)`;
            console.log(`✅ Health check: Database connected, ${userCount} users found`);
        } catch (userError) {
            console.log('⚠️ Health check: user.count() failed, trying raw query...', userError);
            try {
                await prisma.$queryRaw`SELECT 1 as test`;
                dbTestResult = 'success (raw query)';
                console.log('✅ Health check: Raw database query successful');
            } catch (rawError) {
                console.log('❌ Health check: Raw database query failed:', rawError);
                dbTestResult = `failed: ${rawError instanceof Error ? rawError.message : 'Unknown error'}`;
                throw rawError;
            }
        }

        console.log('✅ Health check: All tests passed');
        return NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: dbTestResult,
                app: 'running'
            }
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Health check failed:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
        console.error('❌ Health check error details:', {
            message: errorMessage,
            name: error instanceof Error ? error.name : 'Unknown',
            stack: error instanceof Error ? error.stack : undefined
        });

        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            services: {
                database: 'disconnected',
                app: 'running'
            },
            error: errorMessage,
            details: {
                database_url: process.env.DATABASE_URL ? 'configured' : 'missing',
                node_env: process.env.NODE_ENV
            }
        }, { status: 503 });
    }
}