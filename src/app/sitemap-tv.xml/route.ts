import { getTrending, getPopular, getTopRated } from '@/lib/tmdb'
import { siteConfig } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const revalidate = 86400 // Revalidate once per day

export async function GET() {
    const baseUrl = siteConfig.url

    try {
        // Fetch popular TV shows (first 5 pages to get good coverage)
        const pages = await Promise.all([
            getTrending('tv', 'week'),
            getPopular('tv', 1),
            getPopular('tv', 2),
            getTopRated('tv', 1),
        ])

        const shows = pages.flat()
        const uniqueShows = Array.from(
            new Map(shows.map((s) => [s.id, s])).values()
        )

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueShows
                .map(
                    (show) => `  <url>
    <loc>${baseUrl}/tv/${show.id}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
                )
                .join('\n')}
</urlset>`

        return new Response(sitemap, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
            },
        })
    } catch (error) {
        console.error('Error generating TV shows sitemap:', error)
        return new Response('Error generating sitemap', { status: 500 })
    }
}
