
'use client';

import { getOrderById, getSettings, getTableById } from "@/lib/data";
import { notFound, useParams, useRouter } from "next/navigation";
import { OrderStatusView } from "@/components/order-status-view";
import { useEffect, useState, useRef } from "react";
import type { Order, RestaurantSettings } from "@/lib/definitions";
import { LoaderCircle } from "lucide-react";

export default function OrderStatusPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const tableId = params.tableId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [restaurantId, setRestaurantId] = useState<string>('dineeasee-restaurant');
  const [isLoading, setIsLoading] = useState(true);

  // Track which branch's settings we have loaded to avoid re-fetching unnecessarily
  const loadedBranchIdRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    async function initialize() {
      if (!orderId || !tableId) return;

      const storedCustomerInfo = sessionStorage.getItem(`dineeasy-customer-${tableId}`);
      let customerPhone: string | null = null;
      if (storedCustomerInfo) {
        try {
          const info = JSON.parse(storedCustomerInfo);
          customerPhone = info.phone;
        } catch { }
      }

      if (!customerPhone) {
        router.replace(`/order/${tableId}/welcome?next=/order/${tableId}/status/${orderId}`);
        return;
      }

      try {
        const fetchedTable = await getTableById(tableId);
        if (!fetchedTable) {
          notFound();
          return;
        }

        const restaurantId = fetchedTable.restaurantId || 'dineeasee-restaurant';
        setRestaurantId(restaurantId);

        const { firestore } = await import("@/firebase/client").then(mod => mod.getClientFirebase());
        const { doc, onSnapshot } = await import("firebase/firestore");

        const orderRef = doc(firestore, `restaurants/${restaurantId}/orders`, orderId);

        const unsub = onSnapshot(orderRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Convert timestamps
            const orderData = {
              ...data,
              id: docSnap.id,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
            } as Order;

            if (customerPhone !== orderData.customerPhone) {
              router.replace(`/order/${tableId}/welcome`);
              return;
            }

            setOrder(orderData);

            // Check if we need to fetch settings (first load or branch changed)
            if (loadedBranchIdRef.current !== orderData.branchId) {
              try {
                const newSettings = await getSettings(orderData.branchId, restaurantId);
                setSettings(newSettings);
                loadedBranchIdRef.current = orderData.branchId;
              } catch (err) {
                console.error("Error fetching settings:", err);
              }
            }

            setIsLoading(false);
          } else {
            notFound();
          }
        }, (error) => {
          console.error("Snapshot error:", error);
        });

        unsubs.push(unsub);

      } catch (error) {
        console.error("Failed to initialize order stream", error);
        setIsLoading(false);
      }
    }

    initialize();

    return () => {
      unsubs.forEach(u => u());
    };
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
      <OrderStatusView initialOrder={order} settings={settings} tableId={tableId} restaurantId={restaurantId} />
    </div>
  );
}
