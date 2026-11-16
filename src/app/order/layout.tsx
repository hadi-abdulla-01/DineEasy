
'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/app/admin/auth-provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import {
    CustomerFormCardSkeleton,
    CustomerOrderPageSkeleton,
    OrderStatusSkeleton,
} from '@/components/skeletons';
import type { ReactNode } from 'react';

/** Picks the skeleton that matches the customer page currently being opened. */
function OrderRouteSkeleton() {
    const pathname = usePathname() || '';
    if (/\/(welcome|verify|verify-phone)\/?$/.test(pathname)) return <CustomerFormCardSkeleton />;
    if (/\/status\//.test(pathname)) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--order-status-bg)]">
                <OrderStatusSkeleton />
            </div>
        );
    }
    return <CustomerOrderPageSkeleton />;
}

function OrderLayoutContent({ children }: { children: ReactNode }) {
    return (
        <FirebaseClientProvider fallback={<OrderRouteSkeleton />}>
          <AuthProvider>{children}</AuthProvider>
        </FirebaseClientProvider>
    )
}


export default function OrderLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<OrderRouteSkeleton />}>
        <OrderLayoutContent>{children}</OrderLayoutContent>
    </Suspense>
  );
}
