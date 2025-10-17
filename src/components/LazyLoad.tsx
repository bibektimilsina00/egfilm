'use client'

import { useEffect, useRef, useState } from 'react'

interface LazyLoadProps {
    children: React.ReactNode
    fallback?: React.ReactNode
    rootMargin?: string
    threshold?: number
    className?: string
}

export default function LazyLoad({
    children,
    fallback = null,
    rootMargin = '50px',
    threshold = 0.1,
    className = '',
}: LazyLoadProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [hasLoaded, setHasLoaded] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasLoaded) {
                    setIsVisible(true)
                    setHasLoaded(true)
                }
            },
            {
                rootMargin,
                threshold,
            }
        )

        const currentRef = ref.current
        if (currentRef) {
            observer.observe(currentRef)
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef)
            }
        }
    }, [hasLoaded, rootMargin, threshold])

    return (
        <div ref={ref} className={className}>
            {isVisible ? children : fallback}
        </div>
    )
}

// Higher-order component for lazy loading components
export function withLazyLoad<P extends object>(
    Component: React.ComponentType<P>,
    options?: {
        fallback?: React.ReactNode
        rootMargin?: string
        threshold?: number
    }
) {
    return function LazyLoadedComponent(props: P) {
        return (
            <LazyLoad {...options}>
                <Component {...props} />
            </LazyLoad>
        )
    }
}