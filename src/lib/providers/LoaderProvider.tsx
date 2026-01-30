'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import FullscreenLoader from '../../components/ui/FullscreenLoader';

interface LoaderContextType {
    showLoader: () => void;
    hideLoader: () => void;
}

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export function LoaderProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();

    const showLoader = useCallback(() => setIsLoading(true), []);
    const hideLoader = useCallback(() => setIsLoading(false), []);

    // Hide loader on pathname change
    useEffect(() => {
        setIsLoading(false);
    }, [pathname]);

    // Also hide loader on popstate (back/forward)
    useEffect(() => {
        const handleRouteChange = () => {
            setIsLoading(false);
        };
        window.addEventListener('popstate', handleRouteChange);
        return () => window.removeEventListener('popstate', handleRouteChange);
    }, []);

    return (
        <LoaderContext.Provider value={{ showLoader, hideLoader }}>
            {children}
            {isLoading && <FullscreenLoader />}
        </LoaderContext.Provider>
    );
}

export function useLoader() {
    const context = useContext(LoaderContext);
    if (!context) {
        throw new Error('useLoader must be used within a LoaderProvider');
    }
    return context;
}
