import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
    onLoadMore: () => void;
    hasMore: boolean;
    isLoading: boolean;
    threshold?: number;
    rootMargin?: string;
}

/**
 * Custom hook for infinite scrolling using Intersection Observer
 * Triggers onLoadMore when the sentinel element comes into view
 */
export function useInfiniteScroll({
    onLoadMore,
    hasMore,
    isLoading,
    threshold = 0.1,
    rootMargin = '100px',
}: UseInfiniteScrollOptions) {
    const sentinelRef = useRef<HTMLDivElement>(null);

    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries;
            if (entry.isIntersecting && hasMore && !isLoading) {
                onLoadMore();
            }
        },
        [hasMore, isLoading, onLoadMore]
    );

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(handleObserver, {
            threshold,
            rootMargin,
        });

        observer.observe(sentinel);

        return () => {
            if (sentinel) {
                observer.unobserve(sentinel);
            }
        };
    }, [handleObserver, threshold, rootMargin]);

    return sentinelRef;
}