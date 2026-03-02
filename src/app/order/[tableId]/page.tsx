

'use client';
import { getMenuItems, getTableById, getActiveOrders, getSettings, getOrderById, getCurrentSession } from "@/lib/data";
import { OrderForm } from "@/components/order-form";
import { notFound, redirect, useParams, useRouter, useSearchParams } from "next/navigation";
import type { Order, MenuItem, MealSession, RestaurantSettings } from "@/lib/definitions";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { OrderHeader } from "@/components/order-header";
import { useAuth } from "@/app/admin/auth-provider";

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
    const { user: loggedInUser } = useAuth();
    const restaurantIdFromUrl = searchParams.get('restaurantId');

    const [table, setTable] = useState<{ id: string, branchId: string, number: number, restaurantId?: string } | null>(null);
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [currentSession, setCurrentSession] = useState<MealSession | null | undefined>(undefined);
    const [activeOrderForCustomer, setActiveOrderForCustomer] = useState<Order | undefined>(undefined);
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        if (!tableId) {
            setIsLoading(false);
            return;
        };

        const isTableDevice = loggedInUser?.role === 'Table' && loggedInUser.assignedTableId === tableId;

        if (isTableDevice) {
            // For a logged-in table device, bypass welcome screen.
            setCustomerInfo({ name: `Table ${tableId}`, phone: `table-user-${tableId}` });
        } else {
            // Logic for regular QR code customers
            const storedCustomerInfo = sessionStorage.getItem(`dineeasy-customer-${tableId}`);
            if (storedCustomerInfo) {
                try {
                    const info = JSON.parse(storedCustomerInfo);
                    if (info.phone) {
                        setCustomerInfo(info);
                    } else {
                        router.replace(`/order/${tableId}/welcome?restaurantId=${restaurantIdFromUrl}`);
                    }
                } catch {
                    router.replace(`/order/${tableId}/welcome?restaurantId=${restaurantIdFromUrl}`);
                }
            } else {
                router.replace(`/order/${tableId}/welcome?restaurantId=${restaurantIdFromUrl}`);
            }
        }
    }, [tableId, loggedInUser, router, restaurantIdFromUrl]);


    useEffect(() => {
        if (!customerInfo || !tableId) return;

        if (!restaurantIdFromUrl) {
            setError("This page was loaded without a restaurant context. Please use a valid QR code.");
            setIsLoading(false);
            return;
        }


        async function fetchData() {
            try {
                setIsLoading(true);
                setError(null);
                const fetchedTable = await getTableById(tableId, restaurantIdFromUrl);

                if (!fetchedTable || !fetchedTable.branchId) {
                    setError("Table not found");
                    setIsLoading(false);
                    return;
                }
                
                if (loggedInUser?.role === 'Table') {
                    setCustomerInfo({ name: `Table ${fetchedTable.number}`, phone: `table-user-${tableId}` });
                }

                setTable({
                    id: fetchedTable.id,
                    branchId: fetchedTable.branchId,
                    number: fetchedTable.number,
                    restaurantId: restaurantIdFromUrl
                });

                const targetRestaurantId = restaurantIdFromUrl;

                const [fetchedSettings, allMenuItems, session] = await Promise.all([
                    getSettings(fetchedTable.branchId, targetRestaurantId),
                    getMenuItems(fetchedTable.branchId, targetRestaurantId),
                    getCurrentSession(fetchedTable.branchId, targetRestaurantId),
                ]);

                setSettings(fetchedSettings);
                setCurrentSession(session);

                const availableMenuItems = allMenuItems.filter(item => {
                    if (!item.isAvailable) return false;
                    if (!session || !item.availableSessions || item.availableSessions.length === 0) {
                        return true;
                    }
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

    }, [customerInfo, tableId, router, addItems, orderId, loggedInUser, restaurantIdFromUrl]);

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
                    settings={settings}
                    restaurantId={table?.restaurantId}
                />
            </main>
        </div>
    );
}
