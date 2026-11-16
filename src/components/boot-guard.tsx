'use client';

import { useEffect } from 'react';

declare global {
    interface Window {
        __DINEEZEE_BOOTED__?: boolean;
    }
}

/**
 * Marks the client bundle as successfully hydrated and cancels the "boot stalled" overlay
 * (see the watchdog script + overlay in src/app/layout.tsx). If this never runs (JS failed to
 * load/execute, e.g. a missing chunk), the overlay offers the user a reload instead of leaving
 * them on an endless spinner / blank screen.
 */
export function BootGuard() {
    useEffect(() => {
        window.__DINEEZEE_BOOTED__ = true;
        document.documentElement.classList.remove('boot-stalled');
    }, []);

    return null;
}
