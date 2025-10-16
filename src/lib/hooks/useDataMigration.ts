import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Hook to automatically migrate localStorage data to database on login
 */
export function useDataMigration() {
    const { data: session, status } = useSession();
    const [migrated, setMigrated] = useState(false);

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.email && !migrated) {
            migrateData();
        }
    }, [status, session, migrated]);

    async function migrateData() {
        try {
            // Migrate watchlist
            const watchlistData = localStorage.getItem('watchlist');
            if (watchlistData) {
                const watchlist = JSON.parse(watchlistData);
                if (watchlist.length > 0) {
                    await fetch('/api/watchlist/migrate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ items: watchlist }),
                    });
                    console.log('✅ Watchlist migrated to database');
                }
            }

            // Migrate continue watching
            const continueWatchingData = localStorage.getItem('continueWatching');
            if (continueWatchingData) {
                const continueWatching = JSON.parse(continueWatchingData);
                if (continueWatching.length > 0) {
                    // Note: You'll need to create this endpoint or add it to continue-watching route
                    for (const item of continueWatching) {
                        await fetch('/api/continue-watching', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(item),
                        });
                    }
                    console.log('✅ Continue watching migrated to database');
                }
            }

            setMigrated(true);
        } catch (error) {
            console.error('Error migrating data:', error);
        }
    }

    return { migrated };
}
