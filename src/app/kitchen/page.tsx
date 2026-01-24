

'use client';
import { collection, query, where, onSnapshot, DocumentSnapshot } from "firebase/firestore";
import { getClientFirebase } from "@/firebase/client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { Order, OrderItem, RestaurantSettings, Table } from "@/lib/definitions";
import { updateKitchenOrderStatusAction, updateOrderItemStatusAction } from "@/lib/actions";
import { Clock, User, Phone, ShoppingBasket, Utensils, CheckCircle, MessageSquare, Printer } from "lucide-react";
import { formatDistanceInTimezone } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/app/admin/auth-provider";
import { getSettings, getTableById } from "@/lib/data";
import { extractRestaurantId } from "@/lib/auth-utils";
import { Badge } from "@/components/ui/badge";

type OrderWithTable = Order & { table?: Table };

function KitchenTicket({ order, settings, visibleItems, printSize }: { order: OrderWithTable, settings: RestaurantSettings | null, visibleItems: OrderItem[], printSize?: string }) {
    // Adjust font sizes based on print format
    const isA4 = printSize === 'a4';
    const isThermal = printSize === 'thermal80mm';

    const titleSize = isA4 ? 'text-4xl' : isThermal ? 'text-xl' : 'text-2xl';
    const textSize = isA4 ? 'text-xl' : isThermal ? 'text-sm' : 'text-base';
    const itemSize = isA4 ? 'text-2xl' : isThermal ? 'text-base' : 'text-lg';
    const padding = isA4 ? 'p-8' : 'p-3';

    return (
        <div className={`${padding} font-mono ${textSize} w-full h-full`}>
            <div className={`text-center font-bold ${titleSize} mb-4 uppercase tracking-wide`}>KITCHEN TICKET</div>
            <div className="mb-4 space-y-1">
                <div className="font-bold text-2xl">Order #: {order.invoiceNumber || order.id.slice(-4)}</div>
                <div className="font-semibold">{order.orderType} - {order.table ? `Table ${order.table.number}` : order.customerName}</div>
                <div>Time: {new Date().toLocaleTimeString()}</div>
            </div>
            <div className="border-b-4 border-black mb-4"></div>
            <div className="space-y-3">
                {visibleItems.map(item => (
                    <div key={item.orderItemId} className="flex justify-between items-start">
                        <span className={`font-bold ${itemSize} flex-1`}>{item.quantity}x {item.name}</span>
                    </div>
                ))}
            </div>
            {order.notes && (
                <div className="mt-6 border-t-4 border-black pt-4">
                    <strong className="text-2xl">Notes:</strong>
                    <div className="mt-2 text-xl">{order.notes}</div>
                </div>
            )}
        </div>
    );
}

function PrintTicketButton({ order, settings, visibleItems }: { order: OrderWithTable, settings: RestaurantSettings | null, visibleItems: OrderItem[] }) {
    const handlePrint = () => {
        if (!settings) return;

        const printSize = settings.printSettings?.kitchenTicketPrintSize || 'thermal80mm';
        const customWidth = settings.printSettings?.kitchenTicketCustomWidth || 80;

        // Determine window size and body styling based on print size
        let windowWidth = 400;
        let bodyStyle = 'padding: 0; margin: 0;';

        if (printSize === 'a4') {
            windowWidth = 800;
            bodyStyle = 'padding: 20px; margin: 0;';
        } else if (printSize === 'thermal80mm') {
            windowWidth = 300;
            bodyStyle = 'padding: 0; margin: 0; width: 80mm;';
        } else if (printSize === 'custom') {
            windowWidth = Math.max(300, customWidth * 3.78); // Convert mm to pixels (approximate)
            bodyStyle = `padding: 0; margin: 0; width: ${customWidth}mm;`;
        }

        const printWindow = window.open('', '', `height=600,width=${windowWidth}`);
        if (printWindow) {
            const ReactDOMServer = require('react-dom/server');
            const ticketHtml = ReactDOMServer.renderToString(<KitchenTicket order={order} settings={settings} visibleItems={visibleItems} printSize={printSize} />);

            printWindow.document.write('<html><head><title>Kitchen Ticket</title>');
            printWindow.document.write('<style>');
            printWindow.document.write('* { margin: 0; padding: 0; box-sizing: border-box; }');
            printWindow.document.write('html, body { width: 100%; height: 100%; }');
            printWindow.document.write('body { font-family: monospace; display: flex; flex-direction: column; }');
            printWindow.document.write('@media print {');
            if (printSize === 'thermal80mm') {
                printWindow.document.write('@page { size: 80mm auto; margin: 0; }');
            } else if (printSize === 'custom') {
                printWindow.document.write(`@page { size: ${customWidth}mm auto; margin: 0; }`);
            } else {
                printWindow.document.write('@page { size: A4; margin: 5mm; }');
            }
            printWindow.document.write('}');
            printWindow.document.write('</style>');
            printWindow.document.write(`</head><body style="${bodyStyle}">`);
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

function UpdateItemStatusButton({ orderId, orderItemId, isReady, restaurantId }: { orderId: string, orderItemId: string, isReady: boolean, restaurantId: string }) {
    const handleToggle = async () => {
        try {
            console.log('[UpdateItemStatus] Toggling item:', orderItemId, 'to', !isReady);
            await updateOrderItemStatusAction(orderId, orderItemId, !isReady, restaurantId);
            console.log('[UpdateItemStatus] Successfully toggled item status');
        } catch (error) {
            console.error('[UpdateItemStatus] Error:', error);
        }
    };

    return (
        <Button
            onClick={handleToggle}
            size="sm"
            variant={isReady ? "outline" : "default"}
            className={cn("h-8 px-2", isReady && "text-muted-foreground")}
        >
            {isReady ? "Mark Unready" : "Mark Ready"}
        </Button>
    );
}


function MarkOrderReadyButton({ order, visibleItems, restaurantId }: { order: Order, visibleItems: OrderItem[], restaurantId: string }) {
    // Only verify readiness of VISIBLE items for this kitchen user
    const allVisibleReady = visibleItems.every(item => item.isReady);

    // We can't easily use form action with data binding AND formData comfortably without hidden inputs or weird binds. 
    // Direct call is easier.
    // updateKitchenOrderStatusAction expects FormData. We should use updateOrderStatus or create a new action?
    // Actually updateKitchenOrderStatusAction implementation:
    // export async function updateKitchenOrderStatusAction(orderId: string, formData: FormData) {
    //    const status = formData.get('status') as OrderStatus;
    //    const restaurantId = formData.get('restaurantId') as string; ...
    // So if I construct a FormData object client side I can call it.
    // OR create a wrapper. 
    // simpler: construct FormData.
    const handleMarkReady = async () => {
        try {
            const formData = new FormData();
            formData.append('status', 'ready');
            formData.append('restaurantId', restaurantId);
            console.log('[MarkOrderReady] Marking order as ready:', order.id);
            await updateKitchenOrderStatusAction(order.id, formData);
            console.log('[MarkOrderReady] Successfully marked order as ready');
        } catch (error) {
            console.error('[MarkOrderReady] Error:', error);
        }
    };

    return (
        <Button
            onClick={handleMarkReady}
            size="sm"
            className="w-full"
            disabled={!allVisibleReady || order.status === 'ready'}
        >
            Mark Order Ready
        </Button>
    );
}

export default function KitchenPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<OrderWithTable[]>([]);
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);

    // Extract restaurantId from user email
    const restaurantId = user?.email ? extractRestaurantId(user.email) : null;

    // Helper to convert doc to object (client-side)
    // Helper to convert doc to object (client-side)
    function docToObj<T>(doc: DocumentSnapshot): T {
        const data = doc.data();
        if (data) {
            // Convert Firestore Timestamps to ISO strings
            for (const key in data) {
                if (data[key]?.toDate && typeof data[key].toDate === 'function') {
                    data[key] = data[key].toDate().toISOString();
                }
            }
        }
        return {
            id: doc.id,
            ...data,
        } as T;
    }

    useEffect(() => {
        if (!user?.branchId || !restaurantId) return;

        console.log(`[KitchenPage] Using restaurantId: ${restaurantId}`);
        console.log(`[KitchenPage] User email: ${user.email}`);

        getSettings(user.branchId, restaurantId).then(setSettings);

        const { firestore } = getClientFirebase();
        // Use restaurant-specific collection
        const ordersRef = collection(firestore, `restaurants/${restaurantId}/orders`);
        const q = query(ordersRef, where('status', 'in', ['received', 'preparing', 'ready']));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const activeOrders = snapshot.docs.map(d => docToObj<Order>(d));
            console.log(`[KitchenPage] Raw active orders fetched: ${activeOrders.length}`);
            console.log(`[KitchenPage] User Branch ID: ${user.branchId}`);

            // Client-side filtering for branch
            const branchOrders = activeOrders
                .filter(order => order.branchId === user.branchId)
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

            console.log(`[KitchenPage] Orders (branch filter disabled): ${branchOrders.length}`);

            const ordersWithTableData: OrderWithTable[] = await Promise.all(branchOrders.map(async (order) => {
                let table;
                // Pass restaurantId to getTableById
                if (order.orderType === 'Dine-in' && order.tableId) {
                    table = await getTableById(order.tableId, restaurantId);
                }
                return { ...order, table };
            }));

            setOrders(ordersWithTableData);
        }, (error) => {
            console.error("Error fetching kitchen orders:", error);
        });

        return () => unsubscribe();
    }, [user]);

    const filteredOrders = useMemo(() => {
        if (!user) return [];

        return orders.map(order => {
            // Filter items based on user categories
            const visibleItems = order.items.filter(item => {
                if (item.status === 'cancelled') return false;
                // TEMPORARILY DISABLED CATEGORY FILTER
                return true;
                // if (!user.categories || user.categories.includes('All')) return true;
                // return user.categories.includes(item.category);
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
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

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
                            <div className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{formatDistanceInTimezone(order.createdAt, settings.timezone)}</span>
                                </div>
                                {order.orderType === 'Take-away' && order.takeAwayTime && (
                                    <Badge variant="secondary" className="font-bold">
                                        Pickup: {order.takeAwayTime}
                                    </Badge>
                                )}
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
                                        <UpdateItemStatusButton orderId={order.id} orderItemId={item.orderItemId} isReady={!!item.isReady} restaurantId={restaurantId || 'dineeasee-restaurant'} />
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2 pt-0">
                            <PrintTicketButton order={order} settings={settings} visibleItems={order.visibleItems} />
                            <MarkOrderReadyButton order={order} visibleItems={order.visibleItems} restaurantId={restaurantId || 'dineeasee-restaurant'} />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </>
    );
}
