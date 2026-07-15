'use client';

import { useEffect, useState } from 'react';

const AD_PROBE_URL = 'https://static.adsafeprotected.com/skeleton.gif';
const AD_PROBE_TIMEOUT_MS = 3_000;

/**
 * Fires a lightweight probe once per mount to a domain that adblock lists
 * commonly block. If the request fails (any error / abort), we assume adblock
 * is active. A false positive (network blip, offline) just shows the banner
 * once — no downside, and the user can dismiss it.
 */
export function useAdblockDetect(): boolean {
    const [blocked, setBlocked] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        let cancelled = false;
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), AD_PROBE_TIMEOUT_MS);

        fetch(AD_PROBE_URL, { method: 'HEAD', mode: 'no-cors', signal: ctl.signal, cache: 'no-store' })
            .then(() => { /* reached upstream — no block */ })
            .catch(() => { if (!cancelled) setBlocked(true); })
            .finally(() => clearTimeout(timer));

        return () => { cancelled = true; ctl.abort(); clearTimeout(timer); };
    }, []);

    return blocked;
}
