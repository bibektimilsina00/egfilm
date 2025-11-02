import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
    // Read the icon.svg file from public directory
    const iconPath = path.join(process.cwd(), 'public', 'icon.svg')

    try {
        const iconSvg = fs.readFileSync(iconPath, 'utf-8')

        return new NextResponse(iconSvg, {
            headers: {
                'Content-Type': 'image/svg+xml',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        })
    } catch (error) {
        // Fallback to a simple SVG if file not found
        const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">🎬</text></svg>`

        return new NextResponse(fallbackSvg, {
            headers: {
                'Content-Type': 'image/svg+xml',
                'Cache-Control': 'public, max-age=3600',
            },
        })
    }
}
