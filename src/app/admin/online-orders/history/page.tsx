

'use client';
import { useEffect, useState } from "react";
import type { RemoteOrder, RestaurantSettings } from "@/lib/definitions";
import { getRemoteOrders, getSettings } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Printer, Eye, Clock } from "lucide-react";
import { Invoice } from "@/components/ui/invoice";
import { useAuth } from "../../auth-provider";

function OrderDetailsDialog({ order, isOpen, onOpenChange, settings }: { order: RemoteOrder | null, isOpen: boolean, onOpenChange: (isOpen: boolean) => void, settings: RestaurantSettings | null }) {
    if (!order) return null;
    const currencySymbol = settings?.currencySymbol || '$';
    const currencyDecimalPlaces = settings?.currencyDecimalPlaces ?? 2;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Order Details</DialogTitle>
                    <DialogDescription>Order ID: {order.id}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div>
                        <h4 className="font-semibold">Customer</h4>
                        <p className="text-sm text-muted-foreground">{order.customerDetails.name}</p>
                        <p className="text-sm text-muted-foreground">{order.customerDetails.phone}</p>
                         {order.orderType === 'Online' && (
                            <>
                                <p className="text-sm text-muted-foreground">{order.customerDetails.address}</p>
                                <p className="text-sm text-muted-foreground">Platform: {order.customerDetails.platform}</p>
                            </>
                        )}
                        {order.orderType === 'Take-away' && order.customerDetails.takeAwayTime && (
                             <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Pickup at: {order.customerDetails.takeAwayTime}</span>
                            </div>
                        )}
                    </div>
                    <Separator />
                     <div>
                        <h4 className="font-semibold">Items</h4>
                         <ul className="space-y-1 text-sm text-muted-foreground">
                            {order.items.map((item, index) => (
                                <li key={index} className="flex justify-between">
                                <span>{item.quantity}x {item.name}</span>
                                <span>{currencySymbol}{(item.quantity * item.price).toFixed(currencyDecimalPlaces)}</span>
                                </li>
                            ))}
                        </ul>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-bold">
                            <span>Total</span>
                            <span>{currencySymbol}{order.total.toFixed(currencyDecimalPlaces)}</span>
                        </div>
                    </div>
                </div>
                 <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function PreviousOrdersList({ orders, onPrint, onViewDetails, settings }: { orders: RemoteOrder[], onPrint: (order: RemoteOrder) => void, onViewDetails: (order: RemoteOrder) => void, settings: RestaurantSettings | null }) {
    if (orders.length === 0) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center rounded-xl border border-dashed">
                <div className="text-center">
                <h3 className="font-headline text-2xl font-semibold tracking-tight">No previous orders</h3>
                <p className="text-sm text-muted-foreground">Past online orders will appear here.</p>
                </div>
            </div>
        );
    }
    
    const currencySymbol = settings?.currencySymbol || '$';
    const currencyDecimalPlaces = settings?.currencyDecimalPlaces ?? 2;

    return (
        <div className="space-y-4">
            {orders.map(order => (
                <Card key={order.id}>
                    <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 gap-4">
                        <div>
                            <p className="font-semibold">{order.customerDetails.name} ({order.customerDetails.platform})</p>
                            <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                            <p className="text-sm font-mono">{currencySymbol}{order.total.toFixed(currencyDecimalPlaces)}</p>
                        </div>
                        <div className="flex gap-2 self-end sm:self-center">
                             <Button variant="outline" size="sm" onClick={() => onViewDetails(order)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => onPrint(order)}>
                                <Printer className="mr-2 h-4 w-4" />
                                Print Invoice
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}


export default function OnlineOrderHistoryPage() {
    const { user } = useAuth();
    const [previousOrders, setPreviousOrders] = useState<RemoteOrder[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<RemoteOrder | null>(null);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);

    const fetchPreviousOrders = async () => {
        if (!user) return;
        const orders = await getRemoteOrders(user.branchId);
        setPreviousOrders(orders.filter(o => o.orderType === 'Online').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };

    useEffect(() => {
        getSettings().then(setSettings);
        if(user) {
            fetchPreviousOrders();
        }
    }, [user]);

    const printInvoice = (order: RemoteOrder) => {
        const printWindow = window.open('', '', 'height=800,width=600');
        if (printWindow && settings) {
          const invoiceElement = document.createElement('div');
          const ReactDOMServer = require('react-dom/server');
          invoiceElement.innerHTML = ReactDOMServer.renderToString(<Invoice order={order} settings={settings} />);
    
          printWindow.document.write('<html><head><title>Invoice</title>');
          printWindow.document.write('</head><body>');
          printWindow.document.body.innerHTML = invoiceElement.innerHTML;
          printWindow.document.write('</body></html>');
          printWindow.document.close();
           setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };

    const handleViewDetails = (order: RemoteOrder) => {
        setSelectedOrder(order);
        setIsDetailsDialogOpen(true);
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Online Order History</CardTitle>
                    <CardDescription>View details and print invoices from past online orders for your branch.</CardDescription>
                </CardHeader>
                <CardContent>
                    <PreviousOrdersList orders={previousOrders} onPrint={printInvoice} onViewDetails={handleViewDetails} settings={settings} />
                </CardContent>
            </Card>
            <OrderDetailsDialog order={selectedOrder} isOpen={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen} settings={settings} />
        </>
    )
}
