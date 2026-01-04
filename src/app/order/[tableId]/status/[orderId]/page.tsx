
'use client';

import { getOrderById, getSettings, getTableById } from "@/lib/data";
import { notFound, useParams, useRouter } from "next/navigation";
import { OrderStatusView } from "@/components/order-status-view";
import { useEffect, useState } from "react";
import type { Order, RestaurantSettings } from "@/lib/definitions";
import { LoaderCircle } from "lucide-react";

export default function OrderStatusPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const tableId = params.tableId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!orderId || !tableId) return;

      // First, check if customer info is in session. If not, redirect to welcome.
      const storedCustomerInfo = sessionStorage.getItem(`dineeasy-customer-${tableId}`);
      let customerPhone: string | null = null;

      if (storedCustomerInfo) {
        try {
          const info = JSON.parse(storedCustomerInfo);
          customerPhone = info.phone;
        } catch {
          // Invalid JSON, force re-authentication
        }
      }

      if (!customerPhone) {
        // No phone number found, user must identify themselves.
        // We pass the current URL as 'next' so they can be redirected back here.
        router.replace(`/order/${tableId}/welcome?next=/order/${tableId}/status/${orderId}`);
        return;
      }

      try {
        // 1. Resolve Table & Restaurant ID
        const fetchedTable = await getTableById(tableId);
        if (!fetchedTable) {
          console.error("Table not found for status page");
          notFound(); // Or handle error
          return;
        }

        const restaurantId = fetchedTable.restaurantId || 'dineeasee-restaurant';

        // 2. Fetch Order with Restaurant ID
        const fetchedOrder = await getOrderById(orderId, restaurantId);

        if (!fetchedOrder) {
          notFound();
          return;
        }

        // Validate that the customer phone number matches the order.
        if (customerPhone !== fetchedOrder.customerPhone) {
          router.replace(`/order/${tableId}/welcome`);
          return;
        }

        // 3. Fetch Settings with Restaurant ID
        const fetchedSettings = await getSettings(fetchedOrder.branchId, restaurantId);

        setOrder(fetchedOrder);
        setSettings(fetchedSettings);
      } catch (error) {
        console.error("Failed to fetch initial data", error);
        // You might want to show a more user-friendly error state here
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [orderId, tableId, router]);

  if (isLoading || !order || !settings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--order-status-bg)]">
        <div className="flex flex-col items-center gap-2">
          <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading order status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--order-status-bg)] flex items-center justify-center">
      <OrderStatusView initialOrder={order} settings={settings} tableId={tableId} restaurantId={order.restaurantId || 'dineeasee-restaurant'} />
    </div>
  );
}
