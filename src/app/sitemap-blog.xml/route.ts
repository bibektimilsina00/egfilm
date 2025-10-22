import { siteConfig } from '@/lib/seo'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate once per hour

export async function GET() {
    const baseUrl = siteConfig.url

    try {
        // Fetch all published blog posts
        const posts = await prisma.blogPost.findMany({
            where: {
                status: 'published',
            },
            select: {
                slug: true,
                updatedAt: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
${posts
                .map(
                    (post: { slug: string; updatedAt: Date | null; createdAt: Date }) => `  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${(post.updatedAt || post.createdAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
                )
                .join('\n')}
</urlset>`

        return new Response(sitemap, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
            },
        })
    } catch (error) {
        console.error('Error generating blog sitemap:', error)
        // Return empty sitemap if blog posts don't exist yet
        const emptySitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`

        return new Response(emptySitemap, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
            },
        })
    }
}
