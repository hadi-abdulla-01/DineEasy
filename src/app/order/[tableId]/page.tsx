
'use client';
import { getMenuItems, getTableById, getActiveOrders, getSettings, getOrderById, getCurrentSession } from "@/lib/data";
import { OrderForm } from "@/components/order-form";
import { notFound, redirect, useParams, useRouter } from "next/navigation";
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
    const tableId = params.tableId as string;

    const [table, setTable] = useState<{ id: string, branchId: string, number: number } | null>(null);
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [currentSession, setCurrentSession] = useState<MealSession | null | undefined>(undefined);
    const [activeOrderForCustomer, setActiveOrderForCustomer] = useState<Order | undefined>(undefined);
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!tableId) return;

        // This effect only runs once on mount to check for customer info.
        const storedCustomerInfo = sessionStorage.getItem(`dineeasy-customer-${tableId}`);
        if (storedCustomerInfo) {
            try {
                const info = JSON.parse(storedCustomerInfo);
                if (info.name && info.phone) {
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

    useEffect(() => {
        // This effect runs only when customerInfo is set.
        if (!customerInfo || !tableId) return;

        async function fetchData() {
            setIsLoading(true);
            const fetchedTable = await getTableById(tableId);
            if (!fetchedTable || !fetchedTable.branchId) {
                notFound();
                return;
            }
            setTable({ id: fetchedTable.id, branchId: fetchedTable.branchId, number: fetchedTable.number });

            const [fetchedSettings, allMenuItems, session, activeOrders] = await Promise.all([
                getSettings(fetchedTable.branchId),
                getMenuItems(fetchedTable.branchId),
                getCurrentSession(fetchedTable.branchId),
                getActiveOrders(fetchedTable.branchId)
            ]);

            setSettings(fetchedSettings);
            setCurrentSession(session);

            // Filter menu items by current session
            const availableMenuItems = allMenuItems.filter(item => {
                if (!item.isAvailable) return false;
                // If item has no assigned sessions, it's available only if there's no active session.
                if (!item.availableSessions || item.availableSessions.length === 0) {
                     return true;
                }
                 // If there is an active session, the item must be in it.
                if (!session) return false;
                return item.availableSessions.includes(session.id);
            });
            setMenuItems(availableMenuItems);

            // Find an existing order for this specific customer at this table
            const existingOrder = activeOrders.find(order => order.tableId === tableId && order.customerPhone === customerInfo.phone);
            setActiveOrderForCustomer(existingOrder);
            
            setIsLoading(false);
        }

        fetchData();

    }, [customerInfo, tableId]); // Only re-run when customerInfo is available.
    
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
                tableNumber={table?.number || 0}
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
                />
            </main>
        </div>
    );
}
