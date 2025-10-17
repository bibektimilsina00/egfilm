'use client'

import { useEffect } from 'react'

export default function ServiceWorker() {
    useEffect(() => {
        if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registered:', registration)

                    // Handle updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // New content is available, notify user
                                    if (confirm('New content is available. Reload to update?')) {
                                        window.location.reload()
                                    }
                                }
                            })
                        }
                    })
                })
                .catch((error) => {
                    console.error('Service Worker registration failed:', error)
                })

            // Handle messages from service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                console.log('Message from service worker:', event.data)
            })
        }
    }, [])

    return null // This component doesn't render anything
}