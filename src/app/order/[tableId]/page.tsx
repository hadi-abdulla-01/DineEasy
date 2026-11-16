

'use client';
import { getMenuItems, getTableById, getActiveOrders, getSettings, getOrderById, getCurrentSession } from "@/lib/data";
import { OrderForm } from "@/components/order-form";
import { notFound, redirect, useParams, useRouter, useSearchParams } from "next/navigation";
import type { Order, MenuItem, MealSession, RestaurantSettings } from "@/lib/definitions";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { CustomerOrderPageSkeleton } from "@/components/skeletons";
import { OrderHeader } from "@/components/order-header";
import { useAuth } from "@/app/admin/auth-provider";
import { getCustomerSessionStorage } from "@/lib/customer-session-storage";

type CustomerInfo = {
    name: string;
    phone: string;
};

function OrderPageContent() {
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
    const [customerInfo, setCustomerInfo] = useState<{ name: string; phone: string; tempUserUid?: string; guestSessionId?: string; isTableDevice?: boolean } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        if (!tableId) {
            setIsLoading(false);
            return;
        };

        const isTableDevice = loggedInUser?.role === 'Table' && loggedInUser.assignedTableId === tableId;
        const tokenParam = searchParams.get('token');
        const queryParts = new URLSearchParams();
        if (restaurantIdFromUrl) queryParts.set('restaurantId', restaurantIdFromUrl);
        if (tokenParam) queryParts.set('token', tokenParam);
        const welcomeQuery = queryParts.toString() ? `?${queryParts.toString()}` : '';

        if (isTableDevice) {
            // For a logged-in table device, bypass welcome screen.
            setCustomerInfo({ name: `Table ${tableId}`, phone: `table-user-${tableId}`, isTableDevice: true });
        } else {
            // Logic for regular QR code customers
            const info = getCustomerSessionStorage(tableId);
            if (info && info.phone && info.isVerified && info.guestSessionId) {
                setCustomerInfo({
                    name: info.name,
                    phone: info.phone,
                    tempUserUid: info.tempUserUid,
                    guestSessionId: info.guestSessionId,
                });
            } else {
                router.replace(`/order/${encodeURIComponent(tableId)}/welcome${welcomeQuery}`);
            }
        }
    }, [tableId, loggedInUser, router, restaurantIdFromUrl, searchParams]);


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
                    setCustomerInfo({ name: `Table ${fetchedTable.number}`, phone: `table-user-${tableId}`, isTableDevice: true });
                }

                setTable({
                    id: fetchedTable.id,
                    branchId: fetchedTable.branchId,
                    number: fetchedTable.number,
                    restaurantId: restaurantIdFromUrl
                });

                const targetRestaurantId = restaurantIdFromUrl;

                const [fetchedSettings, allMenuItems, session, branchActiveOrders] = await Promise.all([
                    getSettings(fetchedTable.branchId, targetRestaurantId),
                    getMenuItems(fetchedTable.branchId, targetRestaurantId),
                    getCurrentSession(fetchedTable.branchId, targetRestaurantId),
                    getActiveOrders(fetchedTable.branchId, targetRestaurantId),
                ]);

                const tableActiveOrders = branchActiveOrders.filter(o => o.tableId === tableId);
                let matchingOrder: Order | undefined;

                if (orderId) {
                    matchingOrder = tableActiveOrders.find(o => o.id === orderId) || await getOrderById(orderId, targetRestaurantId);
                }
                if (!matchingOrder) {
                    matchingOrder =
                        tableActiveOrders.find(o =>
                            (customerInfo?.guestSessionId && o.guestSessionId === customerInfo.guestSessionId) ||
                            (customerInfo?.phone && o.customerPhone === customerInfo.phone)
                        ) ||
                        (!fetchedSettings?.multipleGuestEnabled ? tableActiveOrders[0] : undefined);
                }

                // If the customer already has an active order and did NOT click "Add More Items",
                // take them straight to their live Order Status page when they scan the QR again.
                if (
                    matchingOrder &&
                    matchingOrder.status !== 'completed' &&
                    matchingOrder.status !== 'cancelled' &&
                    !addItems &&
                    !customerInfo?.isTableDevice
                ) {
                    router.replace(
                        `/order/${encodeURIComponent(tableId)}/status/${encodeURIComponent(matchingOrder.id)}?restaurantId=${encodeURIComponent(targetRestaurantId)}`
                    );
                    return;
                }

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

                if (matchingOrder && matchingOrder.status !== 'completed' && matchingOrder.status !== 'cancelled') {
                    setActiveOrderForCustomer(matchingOrder);
                } else {
                    setActiveOrderForCustomer(undefined);
                }
                setIsLoading(false);
            } catch (err) {
                console.error("Error fetching order data:", err);
                setError("Failed to load menu. Please try again.");
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
        return <CustomerOrderPageSkeleton />;
    }

    return (
        <div className="min-h-screen bg-[#f5f5f5] pb-20 content-fade-in">
            <OrderHeader
                restaurantName={settings?.restaurantName || 'DineEasy'}
                tableNumber={table?.number || 0}
                currentSession={currentSession}
                customerName={customerInfo.name}
            />

            <main className="container mx-auto px-4 py-6 max-w-md">
                {activeOrderForCustomer && (
                    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#E95322]/30 bg-white p-3.5 shadow-sm">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#F5CB58]/30 text-[#CB1E1D]">
                                <ClipboardList className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-[#391713] truncate">
                                    Adding to {activeOrderForCustomer.invoiceNumber ? `Invoice #${activeOrderForCustomer.invoiceNumber}` : `Order #${activeOrderForCustomer.id.slice(-6)}`}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    New items will be added to your current order
                                </p>
                            </div>
                        </div>
                        <Link
                            href={`/order/${encodeURIComponent(tableId)}/status/${encodeURIComponent(activeOrderForCustomer.id)}?restaurantId=${encodeURIComponent(table?.restaurantId || restaurantIdFromUrl || '')}`}
                            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-[#CB1E1D] px-3 py-2 text-xs font-semibold text-white hover:bg-[#E95322] transition-colors"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Order Status
                        </Link>
                    </div>
                )}
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

export default function OrderPage() {
    return (
        <Suspense fallback={<CustomerOrderPageSkeleton />}>
            <OrderPageContent />
        </Suspense>
    );
}
