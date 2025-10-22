import { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/admin/',
                    '/watch-together',
                    '/watchlist',
                ],
            },
            {
                userAgent: 'Googlebot',
                allow: '/',
                disallow: ['/api/', '/admin/'],
                crawlDelay: 0,
            },
        ],
        sitemap: [
            `${siteConfig.url}/sitemap.xml`,
            `${siteConfig.url}/sitemap-movies.xml`,
            `${siteConfig.url}/sitemap-tv.xml`,
            `${siteConfig.url}/sitemap-blog.xml`,
        ],
        host: siteConfig.url,
    }
}
