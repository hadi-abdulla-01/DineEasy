'use client';

import { useEffect } from 'react';

const LEAGUE_SPARTAN_HREF =
    'https://fonts.googleapis.com/css2?family=League+Spartan:wght@300;400;500;700&display=swap';
const LINK_ID = 'deferred-league-spartan';

/**
 * Loads the "League Spartan" web font without blocking first paint.
 *
 * Previously this font was pulled in through a CSS `@import` in globals.css, which makes the
 * whole stylesheet render-blocking. If Google Fonts is slow/unreachable the page stayed blank
 * and never hydrated. A script-inserted <link> is not render-blocking and `display=swap`
 * shows fallback text immediately, then swaps once the font arrives.
 */
export function DeferredFonts() {
    useEffect(() => {
        if (document.getElementById(LINK_ID)) return;
        const link = document.createElement('link');
        link.id = LINK_ID;
        link.rel = 'stylesheet';
        link.href = LEAGUE_SPARTAN_HREF;
        document.head.appendChild(link);
    }, []);

    return null;
}
