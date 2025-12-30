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
      if (orderId) {
        try {
          const fetchedOrder = await getOrderById(orderId);

          if (!fetchedOrder) {
            notFound();
            return;
          }

          // Ensure the customer viewing this order is the one who placed it
          const storedCustomerInfo = sessionStorage.getItem(`dineeasy-customer-${tableId}`);
          if (storedCustomerInfo) {
              const info = JSON.parse(storedCustomerInfo);
              if (info.phone !== fetchedOrder.customerPhone) {
                  // If phone numbers don't match, this customer shouldn't see this order.
                  // Redirect them to the welcome page to start their own order.
                  router.replace(`/order/${tableId}/welcome`);
                  return;
              }
          } else {
              // If there's no info, they need to identify themselves.
              router.replace(`/order/${tableId}/welcome?next=/order/${tableId}/status/${orderId}`);
              return;
          }
          
          const fetchedSettings = await getSettings(fetchedOrder.branchId);

          setOrder(fetchedOrder);
          setSettings(fetchedSettings);
        } catch (error) {
          console.error("Failed to fetch initial data", error);
        } finally {
          setIsLoading(false);
        }
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
      <OrderStatusView initialOrder={order} settings={settings} tableId={tableId} />
    </div>
  );
}
