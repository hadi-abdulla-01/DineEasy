

'use client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { Order, OrderItem, OrderStatus, RestaurantSettings, Table, Branch } from "@/lib/definitions";
import { updateOrderStatusAction, cancelOrderItemAction, changeOrderTableAction } from "@/lib/actions";
import { Clock, User, Phone, ShoppingBasket, Utensils, CheckCircle, MessageSquare, XCircle, Trash2, Printer, CreditCard, Move } from "lucide-react";
import { formatDistanceInTimezone } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useCallback, useRef } from "react";
import { Invoice } from "@/components/ui/invoice";
import Link from "next/link";
import { useAuth } from "../auth-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useRestaurantData } from "@/lib/client-data";
import { ChangeTableDialog } from '@/components/change-table-dialog';
import { useFirebase } from '@/firebase/provider';
import { collection, onSnapshot, query, where, type DocumentSnapshot } from 'firebase/firestore';


function PrintInvoiceButton({ order, settings }: { order: Order, settings: RestaurantSettings | null }) {
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const content = componentRef.current;
        if (!content || !settings) return;
        const printWindow = window.open('', '', 'height=800,width=600');
        if (printWindow) {
            const printSize = settings.printSettings?.invoicePrintSize || 'a4';
            const bodyStyle = printSize === 'a4' ? 'padding: 20px;' : 'padding: 0;';

            printWindow.document.write('<html><head><title>Invoice</title>');

            const styles = Array.from(document.styleSheets).map(sheet => {
                try {
                    if (sheet.href) {
                        return `<link rel="stylesheet" href="${sheet.href}">`;
                    }
                    if (sheet.cssRules) {
                        return `<style>${Array.from(sheet.cssRules).map(rule => rule.cssText).join('')}</style>`;
                    }
                } catch (e) {
                    console.warn('Could not copy stylesheet for printing:', e);
                }
                return '';
            }).join('\n');

            printWindow.document.head.innerHTML += styles;
            printWindow.document.write(`</head><body style="${bodyStyle}">`);
            printWindow.document.write(content.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };

    return (
        <>
            <div className="hidden">
                <div ref={componentRef}>
                    {settings && <Invoice order={order} settings={settings} />}
                </div>
            </div>
            <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handlePrint}
            >
                <Printer className="mr-2 h-4 w-4" />
                Print Invoice
            </Button>
        </>
    );
}

function UpdateStatusButton({ order, currentStatus, restaurantId }: { order: Order; currentStatus: OrderStatus, restaurantId: string }) {
    const nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
        received: 'preparing',
        preparing: 'ready',
    };

    const nextStatus = nextStatusMap[currentStatus];
    const allItemsReady = order.items.filter(i => i.status !== 'cancelled').every(item => item.isReady);

    const isPreparingButton = currentStatus === 'received';
    const isReadyButton = currentStatus === 'preparing';

    const isButtonDisabled = isReadyButton && !allItemsReady;

    if (currentStatus === 'ready') {
        return (
            <Button
                asChild
                size="sm"
                className="w-full"
            >
                <Link href={`/admin/orders/${order.id}/payment?redirectTo=/admin/kitchen`}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Payment
                </Link>
            </Button>
        );
    }

    return (
        <form action={updateOrderStatusAction} className="flex flex-col gap-2 w-full">
            <input type="hidden" name="restaurantId" value={restaurantId} />
            <input type="hidden" name="orderId" value={order.id} />
            {nextStatus && (
                <Button
                    type="submit"
                    name="status"
                    value={nextStatus}
                    size="sm"
                    className="w-full"
                    disabled={isButtonDisabled}
                >
                    {isPreparingButton && 'Mark as Preparing'}
                    {isReadyButton && 'Mark as Ready'}
                </Button>
            )}
            {currentStatus !== 'cancelled' && currentStatus !== 'completed' && (
                <Button
                    type="submit"
                    name="status"
                    value="cancelled"
                    variant="destructive"
                    size="sm"
                    className="w-full"
                >
                    Cancel Order
                </Button>
            )}
        </form>
    );
}

function CancelItemButton({ orderId, orderItemId, restaurantId }: { orderId: string; orderItemId: string, restaurantId: string }) {
    const cancelItem = async () => {
        await cancelOrderItemAction(orderId, orderItemId, restaurantId);
    };
    return (
        <form action={cancelItem}>
            <Button type="submit" size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Cancel Item</span>
            </Button>
        </form>
    );
}

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

export default function AdminKitchenPage() {
    const { user } = useAuth();
    const { getBranches, getMainBranch, restaurantId, getSettings } = useRestaurantData();
    const { firestore } = useFirebase();
    const [orders, setOrders] = useState<Order[]>([]);
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [allBranches, setAllBranches] = useState<Branch[]>([]);
    const [allTables, setAllTables] = useState<Table[]>([]);
    const [mainBranch, setMainBranch] = useState<Branch | null>(null);
    const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [orderToChangeTable, setOrderToChangeTable] = useState<Order | null>(null);

    const isGlobalAdmin = (user?.role === 'Admin' && !user?.branchId) || user?.username?.toLowerCase() === 'admin';

    const handleBranchChange = (branchId: string) => {
        sessionStorage.setItem('kitchenViewBranchId', branchId);
        setSelectedBranchId(branchId);
    };

    useEffect(() => {
        async function fetchInitialData() {
            if (!user) return;
            const fetchedMainBranch = await getMainBranch();
            setMainBranch(fetchedMainBranch);

            const savedBranchId = sessionStorage.getItem('kitchenViewBranchId');

            let initialBranchId: string | undefined;

            if (isGlobalAdmin) {
                initialBranchId = savedBranchId || fetchedMainBranch?.id;
                const branches = await getBranches();
                setAllBranches(branches);
            } else {
                initialBranchId = user.branchId;
            }

            if (initialBranchId) {
                setSelectedBranchId(initialBranchId);
            }
        }
        fetchInitialData();
    }, [user, isGlobalAdmin, getMainBranch, getBranches]);

    // Real-time listener for tables
    useEffect(() => {
        if (!selectedBranchId || !restaurantId || !firestore) return;

        const tablesRef = collection(firestore, `restaurants/${restaurantId}/tables`);
        const q = query(tablesRef, where('branchId', '==', selectedBranchId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tablesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table));
            setAllTables(tablesData);
        }, (error) => {
            console.error("Error fetching tables in real-time:", error);
        });

        return () => unsubscribe();
    }, [selectedBranchId, restaurantId, firestore]);

    // Real-time listener for orders
    useEffect(() => {
        if (!selectedBranchId || !restaurantId || !firestore) return;

        setIsLoading(true);
        const ordersRef = collection(firestore, `restaurants/${restaurantId}/orders`);
        const q = query(ordersRef,
            where('branchId', '==', selectedBranchId),
            where('status', 'in', ['received', 'preparing', 'ready'])
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const activeOrders = snapshot.docs.map(doc => docToObj<Order>(doc));

            const ordersWithTableData: Order[] = activeOrders.map(order => {
                let table;
                if (order.orderType === 'Dine-in' && order.tableId) {
                    table = allTables.find(t => t.id === order.tableId);
                }
                return { ...order, table };
            });

            setOrders(ordersWithTableData.sort((a, b) => {
                const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                if (isNaN(timeA) || isNaN(timeB)) return 0;
                return timeA - timeB;
            }));
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching kitchen orders:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [selectedBranchId, restaurantId, allTables, firestore]); // Rerun when tables update

    useEffect(() => {
        if (selectedBranchId) {
            getSettings(selectedBranchId).then(setSettings);
        }
    }, [selectedBranchId, getSettings]);


    const getOrderTitle = (order: Order) => {
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

    if (isLoading || !settings) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-9 w-48" />
                </div>
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                            <CardContent><Skeleton className="h-24 w-full" /></CardContent>
                            <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    const currencySymbol = settings.currencySymbol || '$';
    const currencyDecimalPlaces = settings.currencyDecimalPlaces ?? 2;

    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-headline text-2xl font-semibold">Kitchen View</h2>
                {isGlobalAdmin && (
                    <Select value={selectedBranchId} onValueChange={handleBranchChange}>
                        <SelectTrigger className="w-full sm:w-[220px]">
                            <SelectValue placeholder="Select a branch" />
                        </SelectTrigger>
                        <SelectContent>
                            {allBranches.map(branch => (
                                <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>
            {orders.length === 0 ? (
                <div className="flex h-[60vh] flex-col items-center justify-center rounded-xl border border-dashed">
                    <div className="text-center">
                        <h3 className="font-headline text-2xl font-semibold tracking-tight">No active orders</h3>
                        <p className="text-sm text-muted-foreground">New orders will appear here as they are placed.</p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {orders.map((order) => (
                        <Card key={order.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="font-headline text-lg flex items-center">
                                            {getOrderIcon(order)}
                                            {getOrderTitle(order)}
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground">Order #{order.id}</p>
                                    </div>
                                    <OrderStatusBadge status={order.status} />
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2 pt-2">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{formatDistanceInTimezone(order.createdAt, settings?.timezone)}</span>
                                    </div>
                                    {order.orderType === 'Take-away' && order.takeAwayTime && (
                                        <Badge variant="secondary" className="font-bold">
                                            Pickup: {order.takeAwayTime}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        <span>{order.customerName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        <span>{order.customerPhone}</span>
                                    </div>
                                    {order.notes && (
                                        <div className="flex items-start gap-2 pt-1">
                                            <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                                            <p className="text-xs italic text-muted-foreground">{order.notes}</p>
                                        </div>
                                    )}
                                </div>
                                <Separator className="my-4" />
                                <ul className="space-y-3 text-sm">
                                    {order.items.map((item) => (
                                        <li key={item.orderItemId} className="flex justify-between items-start gap-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    {item.isReady && <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />}
                                                    <span className={cn("font-semibold", (item.isReady || item.status === 'cancelled') && "line-through text-muted-foreground")}>
                                                        {item.quantity}x {item.name}
                                                    </span>
                                                </div>
                                                {item.notes && (
                                                    <ul className="text-xs text-muted-foreground pl-6">
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
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {item.status === 'cancelled' ? (
                                                    <Badge variant="destructive" className="flex items-center gap-1">
                                                        <XCircle className="h-3 w-3" />
                                                        Cancelled
                                                    </Badge>
                                                ) : item.isReady ? (
                                                    <span className="font-mono text-right text-green-600">Ready</span>
                                                ) : (
                                                    <>
                                                        <span className="font-mono text-right">{currencySymbol}{(item.quantity * item.price).toFixed(currencyDecimalPlaces)}</span>
                                                        <CancelItemButton orderId={order.id} orderItemId={item.orderItemId} restaurantId={restaurantId} />
                                                    </>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter className="flex flex-col items-start gap-3">
                                <div className="w-full flex justify-between items-center font-bold text-base">
                                    <span>Total:</span>
                                    <span className="font-mono">{currencySymbol}{order.total.toFixed(currencyDecimalPlaces)}</span>
                                </div>
                                {order.status !== 'completed' && order.status !== 'cancelled' && (
                                    <PrintInvoiceButton order={order} settings={settings} />
                                )}
                                {order.orderType === 'Dine-in' && order.status !== 'completed' && order.status !== 'cancelled' && (
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => setOrderToChangeTable(order)}>
                                        <Move className="mr-2 h-4 w-4" /> Change Table
                                    </Button>
                                )}
                                <UpdateStatusButton order={order} currentStatus={order.status} restaurantId={restaurantId} />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
            {orderToChangeTable && (
                <ChangeTableDialog
                    order={orderToChangeTable}
                    tables={allTables}
                    isOpen={!!orderToChangeTable}
                    onOpenChange={(isOpen) => { if (!isOpen) setOrderToChangeTable(null); }}
                    restaurantId={restaurantId}
                    onTableChanged={() => { }}
                />
            )}
        </>
    );
}
