'use client';

import React, { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * React Query provider with optimized configuration
 * - Longer stale times for movie/TV data that doesn't change frequently
 * - Retry logic for network failures
 * - Background refetching for better UX
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 30 minutes (movie data doesn't change often)
            staleTime: 1000 * 60 * 30,
            // Keep data in cache for 1 hour after component unmount
            gcTime: 1000 * 60 * 60,
            // Retry failed requests up to 2 times (faster failure)
            retry: 2,
            // Retry with exponential backoff
            retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 10000),
            // Don't refetch on window focus to avoid unnecessary requests
            refetchOnWindowFocus: false,
            // Don't refetch on reconnect to avoid spam
            refetchOnReconnect: false,
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom"
        />
      )}
    </QueryClientProvider>
  );
}

// Also export as default for compatibility
export default QueryProvider;