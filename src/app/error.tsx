'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const RELOAD_FLAG = 'dineezee-chunk-reload';

function isChunkLoadError(error: Error) {
    const text = `${error?.name ?? ''} ${error?.message ?? ''}`;
    return /ChunkLoadError|Loading chunk .* failed|Loading CSS chunk|Failed to fetch dynamically imported module/i.test(text);
}

/**
 * Route-level error boundary. Without it an uncaught render error leaves the user with a
 * blank/frozen screen. A missing JS chunk (typically a stale cached page after a new deploy)
 * is retried once with a hard reload, which fetches the current build.
 */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error('[app error boundary]', error);
        if (isChunkLoadError(error)) {
            try {
                if (!sessionStorage.getItem(RELOAD_FLAG)) {
                    sessionStorage.setItem(RELOAD_FLAG, '1');
                    window.location.reload();
                }
            } catch {
                /* storage unavailable: fall through and show the manual retry UI */
            }
        }
    }, [error]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-sm text-center">
                <CardHeader>
                    <CardTitle className="font-headline text-xl">Something went wrong</CardTitle>
                    <CardDescription>
                        We couldn&apos;t load this page. Please try again. If you scanned a QR code, you can scan it again.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error?.digest && <p className="text-xs text-muted-foreground">Reference: {error.digest}</p>}
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button className="w-full" onClick={() => reset()}>Try again</Button>
                    <Button className="w-full" variant="outline" onClick={() => window.location.reload()}>Reload page</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
