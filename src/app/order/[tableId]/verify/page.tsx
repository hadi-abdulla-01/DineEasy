'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { CustomerFormCardSkeleton } from '@/components/skeletons';

function LegacyVerifyRedirectContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const tableId = params.tableId as string;
    const restaurantId = searchParams.get('restaurantId') || '';
    const token = searchParams.get('token');

    useEffect(() => {
        const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
        router.replace(`/order/${encodeURIComponent(tableId)}/welcome?restaurantId=${encodeURIComponent(restaurantId)}${tokenParam}`);
    }, [router, tableId, restaurantId, token]);

    return <CustomerFormCardSkeleton />;
}

/**
 * Legacy waiter-based OTP verification route has been replaced by direct customer phone OTP.
 * Redirects any stale links to the table welcome page.
 */
export default function LegacyVerifyRedirectPage() {
    return (
        <Suspense fallback={<CustomerFormCardSkeleton />}>
            <LegacyVerifyRedirectContent />
        </Suspense>
    );
}
