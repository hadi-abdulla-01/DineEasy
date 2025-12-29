
'use client';
import { getActiveOrders, getSettings, getTableById } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { Order, OrderItem, RestaurantSettings, Table } from "@/lib/definitions";
import { updateKitchenOrderStatusAction, updateOrderItemStatusAction } from "@/lib/actions";
import { Clock, User, Phone, ShoppingBasket, Utensils, CheckCircle, MessageSquare, Printer } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/app/admin/auth-provider";

type OrderWithTable = Order & { table?: Table };

function KitchenTicket({ order, settings, visibleItems }: { order: OrderWithTable, settings: RestaurantSettings | null, visibleItems: OrderItem[] }) {
    // This is a simplified kitchen ticket for printing
    return (
        <div className="p-4 font-mono text-sm">
            <div className="text-center font-bold text-lg mb-2">KITCHEN TICKET</div>
            <div className="mb-2">
                <div>Order #: {order.invoiceNumber || order.id.slice(-4)}</div>
                <div>{order.orderType} - {order.table ? `Table ${order.table.number}` : order.customerName}</div>
                <div>Time: {new Date().toLocaleTimeString()}</div>
            </div>
            <div className="border-b border-black mb-2"></div>
            <div className="space-y-2">
                {visibleItems.map(item => (
                    <div key={item.orderItemId} className="flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                    </div>
                ))}
            </div>
            {order.notes && (
                <div className="mt-4 border-t border-black pt-2">
                    <strong>Notes:</strong> {order.notes}
                </div>
            )}
        </div>
    );
}

function PrintTicketButton({ order, settings, visibleItems }: { order: OrderWithTable, settings: RestaurantSettings | null, visibleItems: OrderItem[] }) {
    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=600,width=400');
        if (printWindow && settings) {
            const ReactDOMServer = require('react-dom/server');
            const ticketHtml = ReactDOMServer.renderToString(<KitchenTicket order={order} settings={settings} visibleItems={visibleItems} />);

            printWindow.document.write('<html><head><title>Kitchen Ticket</title></head><body style="padding: 0; margin: 0;">');
            printWindow.document.body.innerHTML = ticketHtml;
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };
    return (
        <Button variant="outline" size="sm" className="w-full" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Ticket
        </Button>
    )
}

function UpdateItemStatusButton({ orderId, orderItemId, isReady }: { orderId: string, orderItemId: string, isReady: boolean }) {
    const toggleStatus = updateOrderItemStatusAction.bind(null, orderId, orderItemId, !isReady);

    return (
        <form action={toggleStatus}>
            <Button
                type="submit"
                size="sm"
                variant={isReady ? "outline" : "default"}
                className={cn("h-8 px-2", isReady && "text-muted-foreground")}
            >
                {isReady ? "Mark Unready" : "Mark Ready"}
            </Button>
        </form>
    );
}


function MarkOrderReadyButton({ order, visibleItems }: { order: Order, visibleItems: OrderItem[] }) {
    // Only verify readiness of VISIBLE items for this kitchen user
    const allVisibleReady = visibleItems.every(item => item.isReady);
    const updateStatus = updateKitchenOrderStatusAction.bind(null, order.id);

    return (
        <form action={updateStatus} className="w-full">
            <input type="hidden" name="status" value="ready" />
            <Button
                type="submit"
                size="sm"
                className="w-full"
                disabled={!allVisibleReady || order.status === 'ready'}
            >
                Mark Order Ready
            </Button>
        </form>
    );
}

export default function KitchenPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<OrderWithTable[]>([]);
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);

    const fetchOrders = useCallback(async () => {
        if (!user?.branchId) return;
        const activeOrders = await getActiveOrders(user.branchId);
        // Filter out completed/cancelled orders just in case, though getActiveOrders handles it
        const ordersWithTableData: OrderWithTable[] = await Promise.all(activeOrders.map(async (order) => {
            let table;
            if (order.orderType === 'Dine-in' && order.tableId) {
                table = await getTableById(order.tableId);
            }
            return { ...order, table };
        }));
        setOrders(ordersWithTableData);
    }, [user]);

    useEffect(() => {
        if (user?.branchId) {
            getSettings(user.branchId).then(setSettings);
            fetchOrders();
            const interval = setInterval(fetchOrders, 5000); // Polling every 5 sec
            return () => clearInterval(interval);
        }
    }, [user, fetchOrders]);

    const filteredOrders = useMemo(() => {
        if (!user) return [];

        return orders.map(order => {
            // Filter items based on user categories
            const visibleItems = order.items.filter(item => {
                if (item.status === 'cancelled') return false;
                if (!user.categories || user.categories.includes('All')) return true;
                return user.categories.includes(item.category);
            });
            return { ...order, visibleItems };
        }).filter(order => order.visibleItems.length > 0); // Only show orders with items relevant to this chef
    }, [orders, user]);


    const getOrderTitle = (order: OrderWithTable) => {
        switch (order.orderType) {
            case 'Dine-in':
                return order.table ? `Table ${order.table.number}` : 'Dine-in';
            case 'Online':
                return 'Online Order';
            case 'Take-away':
                return 'Take-Away';
            default:
                return `Order #${order.id.slice(-4)}`;
        }
    }

    const getOrderIcon = (order: Order) => {
        switch (order.orderType) {
            case 'Dine-in':
                return <Utensils className="h-4 w-4 mr-2" />;
            case 'Online':
            case 'Take-away':
                return <ShoppingBasket className="h-4 w-4 mr-2" />;
            default:
                return null;
        }
    }

    if (!user || !settings) {
        return <div>Loading...</div>
    }

    if (filteredOrders.length === 0) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center rounded-xl border border-dashed">
                <div className="text-center">
                    <h3 className="font-headline text-2xl font-semibold tracking-tight">No active orders</h3>
                    <p className="text-sm text-muted-foreground">Orders for your station will appear here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredOrders.map((order) => (
                <Card key={order.id} className={cn("flex flex-col border-2", order.status === 'ready' ? "border-green-500/50 bg-green-500/5" : "border-transparent")}>
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="font-headline text-lg flex items-center">
                                    {getOrderIcon(order)}
                                    {getOrderTitle(order)}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">#{order.invoiceNumber || order.id.slice(-4)}</p>
                            </div>
                            <OrderStatusBadge status={order.status} />
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 pb-3">
                        {(order.orderType === 'Online' || order.orderType === 'Take-away') && (
                            <div className="mb-4 text-sm bg-muted/50 p-2 rounded-md">
                                <div className="flex items-center gap-2 mb-1">
                                    <User className="h-4 w-4" /> {order.customerName}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" /> {order.customerPhone}
                                </div>
                            </div>
                        )}
                        {order.notes && (
                            <div className="mb-4 text-sm bg-yellow-500/10 text-yellow-600 p-2 rounded-md border border-yellow-500/20">
                                <div className="flex items-start gap-2">
                                    <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span className="italic font-medium">{order.notes}</span>
                                </div>
                            </div>
                        )}

                        <Separator className="my-2" />

                        <ul className="space-y-3">
                            {order.visibleItems.map((item) => (
                                <li key={item.orderItemId} className="flex justify-between items-start gap-2 text-sm">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            {item.isReady && <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />}
                                            <span className={cn("font-medium text-base", item.isReady && "text-muted-foreground line-through")}>
                                                {item.quantity}x {item.name}
                                            </span>
                                        </div>
                                        {item.notes && (
                                            <ul className="text-xs text-muted-foreground pl-6 mt-1">
                                                {item.notes.split(';').map(note => note.trim()).filter(note => note).map((note, index) => {
                                                    const [group, option] = note.split(':');
                                                    return (
                                                        <li key={index} className="list-disc list-outside">
                                                            <span className="font-semibold italic">{group}:</span> {option}
                                                        </li>
                                                    )
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                    <UpdateItemStatusButton orderId={order.id} orderItemId={item.orderItemId} isReady={!!item.isReady} />
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2 pt-0">
                        <PrintTicketButton order={order} settings={settings} visibleItems={order.visibleItems} />
                        <MarkOrderReadyButton order={order} visibleItems={order.visibleItems} />
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
