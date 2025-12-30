'use client';

import { getOrderById, getSettings } from "@/lib/data";
import { notFound, useParams } from "next/navigation";
import { OrderStatusView } from "@/components/order-status-view";
import { useEffect, useState } from "react";
import type { Order, RestaurantSettings } from "@/lib/definitions";

export default function OrderStatusPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const tableId = params.tableId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (orderId) {
        try {
          // First fetch the order to get branchId
          const fetchedOrder = await getOrderById(orderId);

          if (!fetchedOrder) {
            notFound();
            return;
          }

          // Then fetch settings with the order's branchId
          const fetchedSettings = await getSettings(fetchedOrder.branchId);

          setOrder(fetchedOrder);
          setSettings(fetchedSettings);
        } catch (error) {
          console.error("Failed to fetch initial data", error);
          // Handle error appropriately
        } finally {
          setIsLoading(false);
        }
      }
    }

    fetchData();
  }, [orderId]);

  if (isLoading || !order || !settings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--order-status-bg)]">
        <p>Loading order status...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--order-status-bg)] flex items-center justify-center">
      <OrderStatusView initialOrder={order} settings={settings} tableId={tableId} />
    </div>
  );
}
