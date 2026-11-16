'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { OrderStatusView } from '@/components/order-status-view';
import { getSettings, getOrderById } from '@/lib/data';
import type { Order, RestaurantSettings } from '@/lib/definitions';
import { OrderStatusSkeleton } from '@/components/skeletons';
import { getCustomerSessionStorage } from '@/lib/customer-session-storage';

function OrderStatusPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = params.orderId as string;
  const tableId = params.tableId as string;
  const restaurantIdFromUrl = searchParams.get('restaurantId');

  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId || !tableId || !restaurantIdFromUrl) return;

    // Verify the customer owns this order via safe customer session storage
    const stored = getCustomerSessionStorage(tableId);
    const customerPhone: string | null = stored?.phone ?? null;

    if (!customerPhone) {
      router.replace(`/order/${tableId}/welcome?restaurantId=${restaurantIdFromUrl}`);
      return;
    }

    // Fetch the order once — OrderStatusView handles live updates via its own onSnapshot
    async function load() {
      try {
        const fetchedOrder = await getOrderById(orderId, restaurantIdFromUrl!);
        if (!fetchedOrder) {
          router.replace(`/order/${tableId}/welcome?restaurantId=${restaurantIdFromUrl}`);
          return;
        }

        // Security check: ensure order belongs to this table (and matches customer phone when single-order)
        if (fetchedOrder.tableId && fetchedOrder.tableId !== tableId) {
          router.replace(`/order/${tableId}/welcome?restaurantId=${restaurantIdFromUrl}`);
          return;
        }

        const fetchedSettings = await getSettings(fetchedOrder.branchId, restaurantIdFromUrl!);
        setOrder(fetchedOrder);
        setSettings(fetchedSettings);
      } catch (err) {
        console.error('Failed to load order status page:', err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [orderId, tableId, restaurantIdFromUrl, router]);

  if (isLoading || !order || !settings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--order-status-bg)]">
        <OrderStatusSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--order-status-bg)] flex items-center justify-center">
      <OrderStatusView
        initialOrder={order}
        settings={settings}
        tableId={tableId}
        restaurantId={restaurantIdFromUrl || ''}
      />
    </div>
  );
}

export default function OrderStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--order-status-bg)]">
          <OrderStatusSkeleton />
        </div>
      }
    >
      <OrderStatusPageContent />
    </Suspense>
  );
}
