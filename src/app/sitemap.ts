import { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/seo'

// Static pages sitemap
export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = siteConfig.url

    const routes: MetadataRoute.Sitemap = [
        '',
        '/movies',
        '/tv',
        '/search',
        '/watchlist',
        '/login',
        '/register',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: (route === '' ? 'daily' : 'weekly') as 'daily' | 'weekly',
        priority: route === '' ? 1 : 0.8,
    }))

    return routes
}
