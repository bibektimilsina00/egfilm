import { Metadata } from 'next'
import { getMovieDetails, getTVDetails, getImageUrl } from '@/lib/tmdb'

export async function generateMovieMetadata(id: string): Promise<Metadata> {
    try {
        const movie = await getMovieDetails(parseInt(id))

        const title = `${movie.title} (${new Date(movie.release_date).getFullYear()})`
        const description = movie.overview.length > 160
            ? `${movie.overview.substring(0, 157)}...`
            : movie.overview

        const imageUrl = getImageUrl(movie.backdrop_path || movie.poster_path, 'w1280')
        const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'}/og?title=${encodeURIComponent(movie.title)}&subtitle=${encodeURIComponent(`Movie • ${new Date(movie.release_date).getFullYear()} • ⭐ ${movie.vote_average.toFixed(1)}`)}`

        return {
            title,
            description,
            keywords: [
                movie.title,
                'movie',
                'film',
                'streaming',
                'watch online',
                ...movie.genres.map((g: any) => g.name),
                ...movie.credits?.cast.slice(0, 3).map((actor: any) => actor.name) || [],
                movie.credits?.crew.find((c: any) => c.job === 'Director')?.name || '',
            ].filter(Boolean),
            openGraph: {
                type: 'video.movie',
                title,
                description,
                images: [
                    {
                        url: ogImageUrl,
                        width: 1200,
                        height: 630,
                        alt: `${movie.title} poster`,
                    },
                ],
                locale: 'en_US',
                siteName: 'Egfilm',
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [ogImageUrl],
            },
            other: {
                'article:author': movie.credits?.crew.find((c: any) => c.job === 'Director')?.name || '',
                'article:published_time': movie.release_date,
                'video:duration': movie.runtime ? (movie.runtime * 60).toString() : '',
                'video:release_date': movie.release_date,
            },
        }
    } catch (error) {
        return {
            title: 'Movie Not Found | Egfilm',
            description: 'The requested movie could not be found.',
        }
    }
}

export async function generateTVMetadata(id: string): Promise<Metadata> {
    try {
        const show = await getTVDetails(parseInt(id))

        const title = `${show.name} (${new Date(show.first_air_date).getFullYear()}) - TV Series`
        const description = show.overview.length > 160
            ? `${show.overview.substring(0, 157)}...`
            : show.overview

        const imageUrl = getImageUrl(show.backdrop_path || show.poster_path, 'w1280')
        const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000'}/og?title=${encodeURIComponent(show.name)}&subtitle=${encodeURIComponent(`TV Series • ${new Date(show.first_air_date).getFullYear()} • ⭐ ${show.vote_average.toFixed(1)} • ${show.number_of_seasons} Season${show.number_of_seasons !== 1 ? 's' : ''}`)}`

        return {
            title,
            description,
            keywords: [
                show.name,
                'tv show',
                'series',
                'television',
                'streaming',
                'watch online',
                ...show.genres.map((g: any) => g.name),
                ...show.credits?.cast.slice(0, 3).map((actor: any) => actor.name) || [],
                show.created_by?.[0]?.name || '',
            ].filter(Boolean),
            openGraph: {
                type: 'video.tv_show',
                title,
                description,
                images: [
                    {
                        url: ogImageUrl,
                        width: 1200,
                        height: 630,
                        alt: `${show.name} poster`,
                    },
                ],
                locale: 'en_US',
                siteName: 'Egfilm',
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [ogImageUrl],
            },
            other: {
                'article:published_time': show.first_air_date,
                'video:release_date': show.first_air_date,
                'video:series': show.name,
            },
        }
    } catch (error) {
        return {
            title: 'TV Show Not Found | Egfilm',
            description: 'The requested TV show could not be found.',
        }
    }
}

export async function generateMovieJSONLD(id: string) {
    try {
        const movie = await getMovieDetails(parseInt(id))

        return {
            '@context': 'https://schema.org',
            '@type': 'Movie',
            name: movie.title,
            description: movie.overview,
            image: getImageUrl(movie.poster_path, 'w500'),
            datePublished: movie.release_date,
            director: movie.credits?.crew.find((c: any) => c.job === 'Director') ? {
                '@type': 'Person',
                name: movie.credits.crew.find((c: any) => c.job === 'Director').name,
            } : undefined,
            actor: movie.credits?.cast?.slice(0, 5).map((actor: any) => ({
                '@type': 'Person',
                name: actor.name,
            })),
            genre: movie.genres?.map((genre: any) => genre.name),
            aggregateRating: movie.vote_average ? {
                '@type': 'AggregateRating',
                ratingValue: movie.vote_average,
                ratingCount: movie.vote_count,
                bestRating: 10,
            } : undefined,
            duration: movie.runtime ? `PT${movie.runtime}M` : undefined,
        }
    } catch (error) {
        return null
    }
}

export async function generateTVJSONLD(id: string) {
    try {
        const show = await getTVDetails(parseInt(id))

        return {
            '@context': 'https://schema.org',
            '@type': 'TVSeries',
            name: show.name,
            description: show.overview,
            image: getImageUrl(show.poster_path, 'w500'),
            datePublished: show.first_air_date,
            creator: show.created_by?.map((creator: any) => ({
                '@type': 'Person',
                name: creator.name,
            })),
            actor: show.credits?.cast.slice(0, 5).map((actor: any) => ({
                '@type': 'Person',
                name: actor.name,
                sameAs: `https://www.themoviedb.org/person/${actor.id}`
            })),
            genre: show.genres.map((g: any) => g.name),
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: show.vote_average,
                ratingCount: show.vote_count,
                bestRating: 10,
                worstRating: 1,
            },
            numberOfSeasons: show.number_of_seasons,
            numberOfEpisodes: show.number_of_episodes,
            sameAs: `https://www.themoviedb.org/tv/${show.id}`,
        }
    } catch (error) {
        return null
    }
}