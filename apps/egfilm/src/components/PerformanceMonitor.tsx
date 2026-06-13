'use client'

import { useEffect } from 'react'

interface WebVitalsMetric {
    name: string
    value: number
    id: string
    delta: number
}

export default function PerformanceMonitor() {
    useEffect(() => {
        // Only run on client side
        if (typeof window === 'undefined') return

        // Performance reporting function
        const reportWebVitals = (metric: WebVitalsMetric) => {
            // Log to console in development
            if (process.env.NODE_ENV === 'development') {
                console.log('Performance Metric:', metric)
            }

            // In production, you could send to analytics service
            // Example: gtag('event', metric.name, { value: Math.round(metric.value) })
        }

        // Basic performance monitoring using Performance API
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'navigation') {
                    const navEntry = entry as PerformanceNavigationTiming
                    reportWebVitals({
                        name: 'Navigation',
                        value: navEntry.loadEventEnd - navEntry.fetchStart,
                        id: 'nav-' + Date.now(),
                        delta: navEntry.loadEventEnd - navEntry.fetchStart,
                    })
                } else if (entry.entryType === 'measure') {
                    reportWebVitals({
                        name: entry.name,
                        value: entry.duration,
                        id: entry.name + '-' + Date.now(),
                        delta: entry.duration,
                    })
                }
            }
        })

        // Observe navigation and custom measures
        observer.observe({ entryTypes: ['navigation', 'measure'] })

        // Mark when React hydration is complete
        performance.mark('hydration-complete')

        return () => {
            observer.disconnect()
        }
    }, [])

    return null // This component doesn't render anything
}