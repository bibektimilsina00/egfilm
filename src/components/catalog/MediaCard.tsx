'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Movie, TVShow, getImageUrl } from '@/lib/api/tmdb';

interface MediaCardProps {
    item: Movie | TVShow;
    type: 'movie' | 'tv';
}

export default function MediaCard({ item, type }: MediaCardProps) {
    const [imageError, setImageError] = useState(false);

    const title = type === 'movie' ? (item as Movie).title : (item as TVShow).name;
    const releaseDate = type === 'movie'
        ? (item as Movie).release_date
        : (item as TVShow).first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';

    const posterUrl = getImageUrl(item.poster_path, 'w500');
    const rating = item.vote_average?.toFixed(1) || 'N/A';

    return (
        <Link
            href={`/${type}/${item.id}`}
            className="group relative block overflow-hidden rounded-lg bg-gray-800 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:ring-2 hover:ring-blue-500"
        >
            <div className="relative aspect-[2/3] w-full">
                {!imageError && item.poster_path ? (
                    <Image
                        src={posterUrl}
                        alt={title}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                        <svg
                            className="h-16 w-16 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                            />
                        </svg>
                    </div>
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Rating badge */}
                <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 backdrop-blur-sm">
                    <svg
                        className="h-4 w-4 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-semibold text-white">{rating}</span>
                </div>
            </div>

            {/* Title and year */}
            <div className="absolute bottom-0 left-0 right-0 translate-y-2 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <h3 className="line-clamp-2 text-sm font-semibold text-white">
                    {title}
                </h3>
                <p className="mt-1 text-xs text-gray-300">{year}</p>
            </div>
        </Link>
    );
}
