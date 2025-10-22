import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
    const { error } = await requireAdminAuth();
    if (error) return error;

    try {
        // Mock video sources
        const sources = [
            {
                id: 'vidsrc',
                name: 'VidSrc',
                quality: '1080p',
                isActive: true,
                lastChecked: new Date().toISOString(),
                status: 'healthy',
                responseTime: 120,
            },
            {
                id: '2embed',
                name: '2Embed',
                quality: '720p',
                isActive: true,
                lastChecked: new Date().toISOString(),
                status: 'degraded',
                responseTime: 250,
            },
            {
                id: 'superembed',
                name: 'SuperEmbed',
                quality: '1080p',
                isActive: false,
                lastChecked: new Date().toISOString(),
                status: 'offline',
                responseTime: 5000,
            },
        ];

        return NextResponse.json({ sources });
    } catch (error) {
        console.error('Error fetching sources:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
