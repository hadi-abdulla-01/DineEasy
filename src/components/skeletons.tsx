import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Shared skeleton screens. Each one mirrors the layout of the content it stands in for so the
 * hand-off to real content causes no layout shift. All of them use the shared <Skeleton />
 * (shimmer, disabled under prefers-reduced-motion).
 */

/** Accessible wrapper: announces a single "Loading" status instead of every placeholder block. */
export function SkeletonRegion({
    label = 'Loading',
    className,
    children,
}: {
    label?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div role="status" aria-busy="true" aria-live="polite" className={className}>
            <span className="sr-only">{label}…</span>
            {children}
        </div>
    );
}

/* ───────────────────────────── Customer ordering ───────────────────────────── */

/** One row of the customer menu list (image left, text middle, "Add" button right). */
export function MenuItemRowSkeleton() {
    return (
        <Card className="overflow-hidden">
            <div className="flex items-start justify-between p-4">
                <div className="flex flex-1 items-start gap-4">
                    <Skeleton className="h-28 w-28 flex-shrink-0" />
                    <div className="flex flex-1 flex-col gap-2 pt-1">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="mt-1 h-3 w-full" />
                        <Skeleton className="h-3 w-5/6" />
                    </div>
                </div>
                <div className="flex h-28 flex-shrink-0 flex-col justify-end pl-4">
                    <Skeleton className="h-9 w-20 rounded-full" />
                </div>
            </div>
        </Card>
    );
}

/** Search box + category chips + menu rows (the menu area of the customer page). */
export function MenuListSkeleton({ count = 5, label = 'Loading menu' }: { count?: number; label?: string }) {
    return (
        <SkeletonRegion label={label} className="space-y-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <div className="flex gap-2 overflow-hidden">
                {[0, 1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-9 w-20 flex-shrink-0 rounded-full" />
                ))}
            </div>
            <div className="space-y-4">
                {Array.from({ length: count }).map((_, i) => (
                    <MenuItemRowSkeleton key={i} />
                ))}
            </div>
        </SkeletonRegion>
    );
}

/** Full customer ordering page: branded header + menu list. Matches /order/[tableId]. */
export function CustomerOrderPageSkeleton({ label = 'Loading menu' }: { label?: string }) {
    return (
        <SkeletonRegion label={label} className="min-h-screen bg-[#f5f5f5] pb-20">
            <header className="rounded-b-[30px] bg-[#f5cb58] px-6 pb-8 pt-8 shadow-md">
                <div className="container mx-auto max-w-md">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8 rounded-full bg-black/10" />
                            <Skeleton className="h-5 w-28 bg-black/10" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <Skeleton className="h-3 w-8 bg-black/10" />
                            <Skeleton className="h-7 w-10 bg-black/10" />
                        </div>
                    </div>
                    <Skeleton className="mb-2 h-8 w-3/4 bg-black/10" />
                    <Skeleton className="h-4 w-1/2 bg-black/10" />
                </div>
            </header>
            <main className="container mx-auto max-w-md space-y-4 px-4 py-6">
                <Skeleton className="h-10 w-full rounded-lg" />
                <div className="flex gap-2 overflow-hidden">
                    {[0, 1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-9 w-20 flex-shrink-0 rounded-full" />
                    ))}
                </div>
                {[0, 1, 2, 3].map(i => (
                    <MenuItemRowSkeleton key={i} />
                ))}
            </main>
        </SkeletonRegion>
    );
}

/** Customer order-status page (status header, progress steps, ordered items). */
export function OrderStatusSkeleton() {
    return (
        <SkeletonRegion label="Loading order status" className="mx-auto w-full max-w-md space-y-4 p-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Card>
                <CardContent className="space-y-5 p-5">
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-3 w-3/4" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
            <Card>
                <CardContent className="space-y-3 p-5">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="flex items-center justify-between">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-14" />
                        </div>
                    ))}
                    <Skeleton className="mt-2 h-5 w-full" />
                </CardContent>
            </Card>
        </SkeletonRegion>
    );
}

/** Centered form card (customer welcome / phone verification). */
export function CustomerFormCardSkeleton() {
    return (
        <SkeletonRegion label="Loading" className="flex min-h-screen items-center justify-center bg-gray-100 p-4 dark:bg-gray-900">
            <Card className="w-full max-w-sm">
                <CardHeader className="items-center space-y-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-7 w-32" />
                    <Skeleton className="h-4 w-56" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-14" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </SkeletonRegion>
    );
}

/* ─────────────────────────────── Kiosk / QR display ─────────────────────────────── */

/** Tablet "scan to order" display card (table number, QR square, countdown bar). */
export function DisplayQrSkeleton() {
    return (
        <SkeletonRegion
            label="Loading QR code"
            className="flex flex-1 items-center justify-center bg-gray-200 p-4"
        >
            <div className="mx-auto flex w-full max-w-sm flex-col items-center rounded-2xl bg-white p-8 shadow-2xl">
                <Skeleton className="mb-3 h-12 w-48" />
                <Skeleton className="mb-6 h-5 w-64 max-w-full" />
                <div className="mb-4 rounded-xl bg-gray-100 p-6">
                    <Skeleton className="h-[150px] w-[150px]" />
                </div>
                <Skeleton className="mb-4 h-2 w-full rounded-full" />
                <Skeleton className="h-5 w-40" />
            </div>
        </SkeletonRegion>
    );
}

/* ──────────────────────────────────── Admin ──────────────────────────────────── */

/** A card with a title line and a few body lines. */
function CardBlockSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
    return (
        <Card className={className}>
            <CardHeader className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-64 max-w-full" />
            </CardHeader>
            <CardContent className="space-y-3">
                {Array.from({ length: lines }).map((_, i) => (
                    <Skeleton key={i} className={cn('h-4', i % 2 ? 'w-5/6' : 'w-full')} />
                ))}
            </CardContent>
        </Card>
    );
}

/** Admin dashboard: welcome card, 4 stat widgets, 2 charts, top-items list. */
export function DashboardSkeleton() {
    return (
        <SkeletonRegion label="Loading dashboard" className="space-y-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-56" />
                        <Skeleton className="h-4 w-80 max-w-full" />
                    </div>
                    <Skeleton className="h-10 w-[180px]" />
                </CardHeader>
            </Card>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[0, 1, 2, 3].map(i => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-3 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <Skeleton className="h-5 w-40" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[300px] w-full" />
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <Skeleton className="h-5 w-40" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[300px] w-full rounded-full" />
                    </CardContent>
                </Card>
            </div>
        </SkeletonRegion>
    );
}

/** Table Management / QR Code Management grid (each card: title, QR square, actions). */
export function TableGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <SkeletonRegion
            label="Loading tables"
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="space-y-4 rounded-2xl border bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800"
                >
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                    <div className="flex justify-center">
                        <Skeleton className="h-32 w-32" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-9 w-full" />
                    </div>
                </div>
            ))}
        </SkeletonRegion>
    );
}

/** Floor-plan canvas used by Table Order (draggable table layout). */
export function TableLayoutSkeleton() {
    return (
        <SkeletonRegion
            label="Loading tables"
            className="relative h-[80vh] w-full overflow-hidden rounded-lg border border-dashed bg-muted/50"
        >
            <div className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3 md:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-36 w-full rounded-xl" />
                ))}
            </div>
        </SkeletonRegion>
    );
}

/** Admin ordering screens (online orders / table orders / take-away): menu grid + cart rail. */
export function AdminMenuSkeleton({ label = 'Loading menu' }: { label?: string }) {
    return (
        <SkeletonRegion label={label} className="flex flex-col gap-6 lg:flex-row">
            <div className="flex-1 space-y-4">
                <div className="flex gap-2">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                            <Skeleton className="aspect-square w-full rounded-none" />
                            <div className="space-y-2 p-3">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="mt-2 h-9 w-full" />
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
            <div className="hidden w-80 flex-shrink-0 lg:block">
                <CardBlockSkeleton lines={5} />
            </div>
        </SkeletonRegion>
    );
}

/** Generic list/table page: title bar + toolbar + table rows (orders, sales history, users...). */
export function TableRowsSkeleton({ rows = 8, label = 'Loading' }: { rows?: number; label?: string }) {
    return (
        <SkeletonRegion label={label} className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-72 max-w-full" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>
            <Card>
                <CardContent className="space-y-3 p-4">
                    <div className="flex gap-4 border-b pb-3">
                        {[0, 1, 2, 3].map(i => (
                            <Skeleton key={i} className="h-4 flex-1" />
                        ))}
                    </div>
                    {Array.from({ length: rows }).map((_, r) => (
                        <div key={r} className="flex gap-4">
                            {[0, 1, 2, 3].map(c => (
                                <Skeleton key={c} className="h-5 flex-1" />
                            ))}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </SkeletonRegion>
    );
}

/** Generic admin page (title + a few cards). Used while auth / Firebase initialise. */
export function AdminPageSkeleton({ label = 'Loading' }: { label?: string }) {
    return (
        <SkeletonRegion label={label} className="min-h-screen space-y-6 bg-background p-4 md:p-8">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-9 w-9 rounded-full" />
            </div>
            <CardBlockSkeleton lines={2} />
            <div className="grid gap-4 md:grid-cols-2">
                <CardBlockSkeleton lines={4} />
                <CardBlockSkeleton lines={4} />
            </div>
        </SkeletonRegion>
    );
}
