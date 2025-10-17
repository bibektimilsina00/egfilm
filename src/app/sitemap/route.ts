import { MetadataRoute } from 'next'

export async function GET(): Promise<Response> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'

    // Static pages
    const staticPages = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 1,
        },
        {
            url: `${baseUrl}/movies`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        },
        {
            url: `${baseUrl}/tv`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.9,
        },
        {
            url: `${baseUrl}/search`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        },
        {
            url: `${baseUrl}/watchlist`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.8,
        },
    ]

    // Dynamic pages for trending movies and TV shows
    const dynamicPages: MetadataRoute.Sitemap = []

    try {
        // Get trending movies
        const trendingMoviesResponse = await fetch(
            `https://api.themoviedb.org/3/trending/movie/week?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
        )
        if (trendingMoviesResponse.ok) {
            const trendingMovies = await trendingMoviesResponse.json()
            trendingMovies.results.slice(0, 50).forEach((movie: any) => {
                dynamicPages.push({
                    url: `${baseUrl}/movie/${movie.id}`,
                    lastModified: new Date(movie.release_date || Date.now()),
                    changeFrequency: 'weekly' as const,
                    priority: 0.8,
                })
            })
        }

        // Get trending TV shows
        const trendingTVResponse = await fetch(
            `https://api.themoviedb.org/3/trending/tv/week?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
        )
        if (trendingTVResponse.ok) {
            const trendingTV = await trendingTVResponse.json()
            trendingTV.results.slice(0, 50).forEach((show: any) => {
                dynamicPages.push({
                    url: `${baseUrl}/tv/${show.id}`,
                    lastModified: new Date(show.first_air_date || Date.now()),
                    changeFrequency: 'weekly' as const,
                    priority: 0.8,
                })
            })
        }

        // Get popular movies
        const popularMoviesResponse = await fetch(
            `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&page=1`
        )
        if (popularMoviesResponse.ok) {
            const popularMovies = await popularMoviesResponse.json()
            popularMovies.results.slice(0, 50).forEach((movie: any) => {
                dynamicPages.push({
                    url: `${baseUrl}/movie/${movie.id}`,
                    lastModified: new Date(movie.release_date || Date.now()),
                    changeFrequency: 'weekly' as const,
                    priority: 0.7,
                })
            })
        }

        // Get popular TV shows
        const popularTVResponse = await fetch(
            `https://api.themoviedb.org/3/tv/popular?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&page=1`
        )
        if (popularTVResponse.ok) {
            const popularTV = await popularTVResponse.json()
            popularTV.results.slice(0, 50).forEach((show: any) => {
                dynamicPages.push({
                    url: `${baseUrl}/tv/${show.id}`,
                    lastModified: new Date(show.first_air_date || Date.now()),
                    changeFrequency: 'weekly' as const,
                    priority: 0.7,
                })
            })
        }
    } catch (error) {
        console.error('Error generating sitemap:', error)
    }

    const sitemap = [...staticPages, ...dynamicPages]
    return Response.json(sitemap)
}