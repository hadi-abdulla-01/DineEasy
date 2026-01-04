
'use client';

import { OrderForm } from "@/components/order-form";
import { notFound, useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { CheckCircle, LoaderCircle } from "lucide-react";
import type { Order, Table, MenuItem } from "@/lib/definitions";
import { useEffect, useState } from "react";
import { useRestaurantData } from "@/lib/client-data";

type AdminOrderPageProps = {
    params: {
        tableId: string;
    };
};

function CurrentOrderDisplay({ orders }: { orders: Order[] }) {
    if (orders.length === 0) {
        return null;
    }

    return (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle className="font-headline">Current Active Order</CardTitle>
                <CardDescription>These items are already being processed for this table.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {orders.map(order => (
                    <div key={order.id}>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold">Order #{order.id.slice(-4)}</h4>
                            <OrderStatusBadge status={order.status} />
                        </div>
                        <ul className="space-y-2 text-sm">
                            {order.items.map(item => (
                                <li key={item.orderItemId} className="flex justify-between items-center text-muted-foreground">
                                    <span>{item.quantity}x {item.name}</span>
                                    {item.isReady && <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-4 w-4" /> Ready</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
                <Separator className="my-4" />
                <p className="text-sm text-muted-foreground">Add more items using the form below.</p>
            </CardContent>
        </Card>
    );
}

export default function AdminOrderPage() {
    const params = useParams();
    const { tableId } = params;
    const { getMenuItems, getTableById, getActiveOrders } = useRestaurantData();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [table, setTable] = useState<Table | null>(null);
    const [ordersForTable, setOrdersForTable] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            if (typeof tableId !== 'string') {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);

            try {
                const [fetchedTable, fetchedMenuItems, activeOrders] = await Promise.all([
                    getTableById(tableId),
                    getMenuItems(),
                    getActiveOrders()
                ]);

                if (!fetchedTable) {
                    notFound();
                    return;
                }

                setTable(fetchedTable);
                setMenuItems(fetchedMenuItems);
                setOrdersForTable(activeOrders.filter(order => order.tableId === tableId));
            } catch (error) {
                console.error("Failed to load order page data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [tableId, getTableById, getMenuItems, getActiveOrders]);

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Loading order screen...</p>
                </div>
            </div>
        );
    }

    if (!table) {
        return notFound();
    }

    const pageTitle = ordersForTable.length > 0 ? `Add to Order for Table ${table.number}` : `Place New Order for Table ${table.number}`;

    return (
        <div>
            <Card className="mb-8 bg-transparent border-none shadow-none">
                <CardHeader className="p-0">
                    <CardTitle className="font-headline">{pageTitle}</CardTitle>
                </CardHeader>
            </Card>

            <CurrentOrderDisplay orders={ordersForTable} />

            <OrderForm menu={menuItems} tableId={table.id} isCustomerFacing={false} />
        </div>
    )
}
