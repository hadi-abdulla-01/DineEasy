
'use client';
import { getMenuItems, getTableById, getActiveOrders, getSettings, getOrderById, getCurrentSession } from "@/lib/data";
import { OrderForm } from "@/components/order-form";
import { notFound, redirect, useParams, useRouter } from "next/navigation";
import type { Order, MenuItem, MealSession, RestaurantSettings } from "@/lib/definitions";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

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

        // Check for customer info in session storage
        const storedCustomerInfo = sessionStorage.getItem(`dineeasy-customer-${tableId}`);
        if (storedCustomerInfo) {
            const info: CustomerInfo = JSON.parse(storedCustomerInfo);
            setCustomerInfo(info);
        } else {
            // If no info, redirect to the welcome page to collect it
            router.replace(`/order/${tableId}/welcome`);
            return; // Stop further execution until redirected
        }

        async function fetchData(customerPhone: string) {
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
                if (!item.availableSessions || item.availableSessions.length === 0) return true;
                if (!session) return false;
                return item.availableSessions.includes(session.id);
            });
            setMenuItems(availableMenuItems);

            // Find an existing order for this specific customer at this table
            const existingOrder = activeOrders.find(order => order.tableId === tableId && order.customerPhone === customerPhone);
            setActiveOrderForCustomer(existingOrder);
            
            setIsLoading(false);
        }

        if (customerInfo?.phone) {
            fetchData(customerInfo.phone);
        } else if (storedCustomerInfo) {
             const info: CustomerInfo = JSON.parse(storedCustomerInfo);
             fetchData(info.phone);
        }

    }, [tableId, router, customerInfo]);
    
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

