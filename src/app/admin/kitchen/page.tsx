
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { Order, OrderItem, OrderStatus, RestaurantSettings, Table, Branch } from "@/lib/definitions";
import { updateOrderStatusAction, cancelOrderItemAction } from "@/lib/actions";
import { Clock, User, Phone, ShoppingBasket, Utensils, CheckCircle, MessageSquare, XCircle, Trash2, Printer, CreditCard } from "lucide-react";
import { formatDistanceInTimezone } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useCallback } from "react";
import { Invoice } from "@/components/ui/invoice";
import Link from "next/link";
import { useAuth } from "../auth-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useRestaurantData } from "@/lib/client-data";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type OrderWithTable = Order & { table?: Table };

function PrintInvoiceButton({ order, settings }: { order: OrderWithTable, settings: RestaurantSettings | null }) {
    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=800,width=600');
        if (printWindow && settings) {
            const invoiceElement = document.createElement('div');
            const ReactDOMServer = require('react-dom/server');
            invoiceElement.innerHTML = ReactDOMServer.renderToString(<Invoice order={order} settings={settings} />);

            printWindow.document.write('<html><head><title>Invoice</title></head><body style="padding: 20px;">');
            printWindow.document.body.innerHTML = invoiceElement.innerHTML;
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };
    return (
        <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handlePrint}
        >
            <Printer className="mr-2 h-4 w-4" />
            Print Invoice
        </Button>
    )
}

function FinalizePaymentForm({ order, restaurantId }: { order: OrderWithTable, restaurantId: string }) {
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('card');

    const completeOrderAction = async (formData: FormData) => {
        formData.append('paymentMethod', paymentMethod);
        formData.append('status', 'completed');
        formData.append('redirectTo', '/admin/kitchen');
        await updateOrderStatusAction(order.id, formData);
    }
    
    return (
        <form action={completeOrderAction} className="w-full space-y-3">
             <input type="hidden" name="restaurantId" value={restaurantId} />
             <div>
                <Label className="text-sm font-medium">Payment Method</Label>
                 <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value: 'cash' | 'card') => setPaymentMethod(value)}
                    className="mt-2 grid grid-cols-2 gap-2"
                >
                    <Label htmlFor={`cash-${order.id}`} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-accent [&:has([data-state=checked])]:border-primary">
                        <RadioGroupItem value="cash" id={`cash-${order.id}`} />
                        Cash
                    </Label>
                    <Label htmlFor={`card-${order.id}`} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-accent [&:has([data-state=checked])]:border-primary">
                        <RadioGroupItem value="card" id={`card-${order.id}`} />
                        Card/Other
                    </Label>
                </RadioGroup>
            </div>
            <Button type="submit" size="sm" className="w-full">
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Order
            </Button>
        </form>
    );
}

function UpdateStatusButton({ order, currentStatus, restaurantId }: { order: OrderWithTable; currentStatus: OrderStatus, restaurantId: string }) {
    const nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
        received: 'preparing',
        preparing: 'ready',
    };

    const nextStatus = nextStatusMap[currentStatus];
    const updateStatus = async (formData: FormData) => {
        await updateOrderStatusAction(order.id, formData);
    };

    const allItemsReady = order.items.filter(i => i.status !== 'cancelled').every(item => item.isReady);

    const isPreparingButton = currentStatus === 'received';
    const isReadyButton = currentStatus === 'preparing';

    const isButtonDisabled = isReadyButton && !allItemsReady;

    if (currentStatus === 'ready') {
        return <FinalizePaymentForm order={order} restaurantId={restaurantId} />;
    }

    return (
        <form action={updateStatus} className="flex flex-col gap-2 w-full">
            <input type="hidden" name="restaurantId" value={restaurantId} />
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


export default function AdminKitchenPage() {
    const { user } = useAuth();
    const { getActiveOrders, getSettings, getTableById, getBranches, getMainBranch, restaurantId } = useRestaurantData();
    const [orders, setOrders] = useState<OrderWithTable[]>([]);
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [allBranches, setAllBranches] = useState<Branch[]>([]);
    const [mainBranch, setMainBranch] = useState<Branch | null>(null);
    const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    const isGlobalAdmin = (user?.role === 'Admin' && !user?.branchId) || user?.username?.toLowerCase() === 'admin';

    const handleBranchChange = (branchId: string) => {
        sessionStorage.setItem('kitchenViewBranchId', branchId);
        setSelectedBranchId(branchId);
    };

    const fetchOrders = useCallback(async (branchId: string, isInitialFetch: boolean) => {
        if (isInitialFetch) {
            setIsLoading(true);
        }
        const activeOrders = await getActiveOrders(branchId);
        const ordersWithTableData: OrderWithTable[] = await Promise.all(activeOrders.map(async (order) => {
            let table;
            if (order.orderType === 'Dine-in' && order.tableId) {
                table = await getTableById(order.tableId);
            }
            return { ...order, table };
        }));
        setOrders(ordersWithTableData);
        if (isInitialFetch) {
            setIsLoading(false);
        }
    }, [getActiveOrders, getTableById]);

    useEffect(() => {
        async function fetchInitialData() {
            if (!user) return;
            const fetchedMainBranch = await getMainBranch();
            setMainBranch(fetchedMainBranch);

            const savedBranchId = sessionStorage.getItem('kitchenViewBranchId');

            let initialBranchId: string | undefined;

            if (isGlobalAdmin) {
                // Global Admin: Respect saved preference or default to Main Branch
                initialBranchId = savedBranchId || fetchedMainBranch?.id;

                const branches = await getBranches();
                setAllBranches(branches);
            } else {
                // Branch Admin: Enforce specific branch, ignoring any stale session storage
                initialBranchId = user.branchId;
            }

            if (initialBranchId) {
                setSelectedBranchId(initialBranchId);
            }
        }
        fetchInitialData();
    }, [user, isGlobalAdmin, getMainBranch, getBranches]);

    useEffect(() => {
        if (selectedBranchId) {
            getSettings(selectedBranchId).then(setSettings);
            fetchOrders(selectedBranchId, true); // Initial fetch with loading state
            const interval = setInterval(() => fetchOrders(selectedBranchId, false), 5000); // Subsequent fetches without loading state
            return () => clearInterval(interval);
        }
    }, [selectedBranchId, fetchOrders, getSettings]);


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
                                <UpdateStatusButton order={order} currentStatus={order.status} restaurantId={restaurantId} />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </>
    );
}
