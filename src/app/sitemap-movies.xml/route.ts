import { getTrending, getPopular, getTopRated } from '@/lib/tmdb'
import { siteConfig } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const revalidate = 86400 // Revalidate once per day

export async function GET() {
    const baseUrl = siteConfig.url

    try {
        // Fetch popular movies (first 5 pages to get good coverage)
        const pages = await Promise.all([
            getTrending('movie', 'week'),
            getPopular('movie', 1),
            getPopular('movie', 2),
            getTopRated('movie', 1),
        ])

        const movies = pages.flat()
        const uniqueMovies = Array.from(
            new Map(movies.map((m) => [m.id, m])).values()
        )

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueMovies
                .map(
                    (movie) => `  <url>
    <loc>${baseUrl}/movie/${movie.id}</loc>
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
        console.error('Error generating movies sitemap:', error)
        return new Response('Error generating sitemap', { status: 500 })
    }
}
