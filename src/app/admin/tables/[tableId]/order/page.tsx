
import { getMenuItems, getTableById, getActiveOrders } from "@/lib/data";
import { OrderForm } from "@/components/order-form";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { CheckCircle } from "lucide-react";
import type { Order } from "@/lib/definitions";

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

export default async function AdminOrderPage(props: AdminOrderPageProps) {
    const params = await props.params;
    const { tableId } = params;
    const menuItems = await getMenuItems();
    const table = await getTableById(tableId);
    const activeOrders = await getActiveOrders();
    const ordersForTable = activeOrders.filter(order => order.tableId === tableId);

    if (!table) {
        notFound();
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

            <OrderForm menu={menuItems} tableId={tableId} isCustomerFacing={false} />
        </div>
    )
}
