import { useEffect, RefObject } from 'react';

export function useClickOutside<T extends HTMLElement>(
    ref: RefObject<T | null>,
    callback: () => void
) {
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            // Check if the event originated from within an iframe
            const composedPath = event.composedPath();
            const hasIframeInPath = composedPath.some(el => el instanceof HTMLIFrameElement);
            // Prevent triggering callback if click originates from an iframe
            if (event.target instanceof HTMLIFrameElement || hasIframeInPath) {
                return;
            }

            if (ref.current && !ref.current.contains(event.target as Node)) {
                callback();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [ref, callback]);
}
