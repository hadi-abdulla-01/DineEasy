

'use client';
import { getMenuItems, getTableById, getActiveOrders, getSettings, getOrderById, getCurrentSession } from "@/lib/data";
import { OrderForm } from "@/components/order-form";
import { notFound, redirect, useParams, useRouter, useSearchParams } from "next/navigation";
import type { Order, MenuItem, MealSession, RestaurantSettings } from "@/lib/definitions";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { OrderHeader } from "@/components/order-header";

type CustomerInfo = {
    name: string;
    phone: string;
};

export default function OrderPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const tableId = params.tableId as string;
    const addItems = searchParams.get('add_items') === 'true';
    const orderId = searchParams.get('order_id');

    const [table, setTable] = useState<{ id: string, branchId: string, number: string, restaurantId?: string } | null>(null);
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [currentSession, setCurrentSession] = useState<MealSession | null | undefined>(undefined);
    const [activeOrderForCustomer, setActiveOrderForCustomer] = useState<Order | undefined>(undefined);
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!tableId) return;

        const storedCustomerInfo = sessionStorage.getItem(`dineeasy-customer-${tableId}`);
        if (storedCustomerInfo) {
            try {
                const info = JSON.parse(storedCustomerInfo);
                if (info.phone) {
                    setCustomerInfo(info);
                } else {
                    router.replace(`/order/${tableId}/welcome`);
                }
            } catch {
                router.replace(`/order/${tableId}/welcome`);
            }
        } else {
            router.replace(`/order/${tableId}/welcome`);
        }
    }, [tableId, router]);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!customerInfo || !tableId) return;

        async function fetchData() {
            try {
                setIsLoading(true);
                setError(null);
                const fetchedTable = await getTableById(tableId);
                console.log(`[OrderPage] Fetched table result for ID ${tableId}:`, fetchedTable);

                if (!fetchedTable || !fetchedTable.branchId) {
                    console.error(`[OrderPage] Table validation failed. Table: ${JSON.stringify(fetchedTable)}`);
                    setError("Table not found");
                    setIsLoading(false);
                    return;
                }
                // Ensure restaurantId is populated in state
                setTable({
                    id: fetchedTable.id,
                    branchId: fetchedTable.branchId,
                    number: fetchedTable.number,
                    restaurantId: fetchedTable.restaurantId
                });

                if (!customerInfo) {
                    setError("Session expired");
                    setIsLoading(false);
                    return;
                }
                const currentCustomerInfo = customerInfo;

                // Use the restaurantId found from the table, or fallback to default if not present (logic in data.ts handle defaults)
                // But generally fetchedTable.restaurantId should be set now.
                // Use the restaurantId found from the table, or fallback to default if not present (logic in data.ts handle defaults)
                // But generally fetchedTable.restaurantId should be set now.
                const targetRestaurantId = fetchedTable.restaurantId || 'dineeasee-restaurant';
                console.log(`[OrderPage] Using Restaurant ID: ${targetRestaurantId}`);

                console.log("[OrderPage] Starting parallel data fetch...");
                // Split logic to see what fails
                // getSettings(fetchedTable.branchId, targetRestaurantId),
                // getMenuItems(fetchedTable.branchId, targetRestaurantId),
                // getCurrentSession(fetchedTable.branchId, targetRestaurantId),
                // getActiveOrders(fetchedTable.branchId, targetRestaurantId)

                const fetchedSettings = await getSettings(fetchedTable.branchId, targetRestaurantId);
                console.log("[OrderPage] Fetched Settings", fetchedSettings ? "Success" : "Failed");

                const allMenuItems = await getMenuItems(fetchedTable.branchId, targetRestaurantId);
                console.log("[OrderPage] Fetched Menu Items", allMenuItems?.length);

                const session = await getCurrentSession(fetchedTable.branchId, targetRestaurantId);
                console.log("[OrderPage] Fetched Session", session ? session.name : "None");

                const activeOrders = await getActiveOrders(fetchedTable.branchId, targetRestaurantId);
                console.log("[OrderPage] Fetched Active Orders", activeOrders?.length);

                /*
                const [fetchedSettings, allMenuItems, session, activeOrders] = await Promise.all([
                    getSettings(fetchedTable.branchId, targetRestaurantId),
                    getMenuItems(fetchedTable.branchId, targetRestaurantId),
                    getCurrentSession(fetchedTable.branchId, targetRestaurantId),
                    getActiveOrders(fetchedTable.branchId, targetRestaurantId)
                ]);
                */

                const existingOrder = activeOrders.find(order => order.tableId === tableId && order.customerPhone === currentCustomerInfo.phone);

                if (existingOrder && !addItems) {
                    router.replace(`/order/${tableId}/status/${existingOrder.id}`);
                    return;
                }

                setSettings(fetchedSettings);
                setCurrentSession(session);

                const availableMenuItems = allMenuItems.filter(item => {
                    if (!item.isAvailable) return false;
                    if (!item.availableSessions || item.availableSessions.length === 0) {
                        return true;
                    }
                    if (!session) return false;
                    return item.availableSessions.includes(session.id);
                });
                setMenuItems(availableMenuItems);

                if (addItems && orderId) {
                    const orderToModify = await getOrderById(orderId, targetRestaurantId);
                    setActiveOrderForCustomer(orderToModify);
                } else {
                    setActiveOrderForCustomer(undefined);
                }
            } catch (err) {
                console.error("Error fetching order data:", err);
                setError("Failed to load menu. Please try again.");
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();

    }, [customerInfo, tableId, router, addItems, orderId]);

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--order-status-bg)]">
                <div className="flex flex-col items-center gap-4 text-center px-4">
                    <p className="text-destructive font-medium">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!customerInfo || isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--order-status-bg)]">
                <div className="flex flex-col items-center gap-2">
                    <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Loading menu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f5f5] pb-20">
            <OrderHeader
                restaurantName={settings?.restaurantName || 'DineEasy'}
                tableNumber={table?.number || "0"}
                currentSession={currentSession}
                customerName={customerInfo.name}
            />

            <main className="container mx-auto px-4 py-6 max-w-md">
                <OrderForm
                    menu={menuItems}
                    tableId={tableId}
                    isCustomerFacing={true}
                    existingOrder={activeOrderForCustomer}
                    currentSession={currentSession}
                    customerInfo={customerInfo}
                    settings={settings}
                    restaurantId={table?.restaurantId}
                />
            </main>
        </div>
    );
}
