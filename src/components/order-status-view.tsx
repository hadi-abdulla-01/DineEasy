

'use client';

import { useState, useEffect } from 'react';
import type { Order, OrderStatus, RestaurantSettings } from '@/lib/definitions';
import { getOrderById } from '@/lib/data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, ChefHat, Clock, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Invoice } from './ui/invoice';

const statusSteps: { status: OrderStatus; label: string; icon: React.ReactNode }[] = [
    { status: 'received', label: 'Order Taken', icon: <Clock /> },
    { status: 'preparing', label: 'Preparing', icon: <ChefHat /> },
    { status: 'ready', label: 'Ready for Pickup', icon: <CheckCircle /> },
];

export function OrderStatusView({ initialOrder, settings, tableId }: { initialOrder: Order, settings: RestaurantSettings, tableId: string }) {
    const [order, setOrder] = useState(initialOrder);

    useEffect(() => {
        if (order.status === 'completed' || order.status === 'cancelled') {
            return;
        }
        const interval = setInterval(async () => {
            const updatedOrder = await getOrderById(order.id);
            if (updatedOrder) {
                setOrder(updatedOrder);
            }
        }, 5000); // Fetch every 5 seconds

        return () => clearInterval(interval); // Cleanup on component unmount
    }, [order.id, order.status]);

    const handlePrint = () => {
        const ReactDOMServer = require('react-dom/server');
        const invoiceHtml = ReactDOMServer.renderToString(<Invoice order={order} settings={settings} />);
        
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        const iframeDoc = iframe.contentDocument;
        if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write('<html><head><title>Invoice</title></head><body style="padding: 20px;">');
            iframeDoc.write(invoiceHtml);
            iframeDoc.write('</body></html>');
            iframeDoc.close();

            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
        }
        // The iframe can be removed after printing, but some browsers need a delay.
        // For simplicity and reliability, we can leave it, or remove it after a timeout.
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);
    };


    const currentStepIndex = statusSteps.findIndex(step => step.status === order.status);
    const isOrderActive = order.status === 'received' || order.status === 'preparing' || order.status === 'ready';
    const currencySymbol = settings.currencySymbol || '$';
    const currencyDecimalPlaces = settings.currencyDecimalPlaces ?? 2;

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4">
                    <Logo className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="font-headline text-2xl">Thank You, {order.customerName}!</CardTitle>
                <CardDescription>
                    {order.invoiceNumber ? `Invoice #${order.invoiceNumber}` : `Order #${order.id.slice(-6)}`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-6">
                     <ol className="flex items-center justify-between w-full">
                        {statusSteps.map((step, index) => {
                            const isActive = index <= currentStepIndex;
                            const isLastStep = index === statusSteps.length - 1;
                            return (
                                <li key={step.status} className={cn(
                                    "flex items-center",
                                    !isLastStep && "w-full",
                                    !isLastStep ? [
                                        "after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block",
                                        isActive ? 'after:border-primary' : 'after:border-gray-200'
                                    ] : ""
                                )}>
                                    <div className="flex flex-col items-center justify-center">
                                        <span className={cn("flex items-center justify-center w-10 h-10 rounded-full lg:h-12 lg:w-12 shrink-0", isActive ? 'bg-primary text-primary-foreground' : 'bg-gray-200')}>
                                            {step.icon}
                                        </span>
                                        <p className="text-xs text-center mt-2 w-20">{step.label}</p>
                                    </div>
                                </li>
                            )
                        })}
                    </ol>
                    {order.status === 'cancelled' && <p className="text-center text-destructive mt-4">This order has been cancelled.</p>}
                    {order.status === 'completed' && <p className="text-center text-green-600 font-semibold mt-4">Your order is complete. Thank you!</p>}
                </div>
                <Separator />
                <div className="py-4">
                    <h4 className="mb-2 font-semibold">Order Summary</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                        {order.items.map((item, index) => (
                            <li key={index} className="flex justify-between">
                                <span className={cn(item.status === 'cancelled' && 'line-through')}>
                                    {item.quantity}x {item.name}
                                </span>
                                {item.status !== 'cancelled' && (
                                    <span>{currencySymbol}{(item.price * item.quantity).toFixed(currencyDecimalPlaces)}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                    <Separator className="my-2" />
                     <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="font-mono">{currencySymbol}{order.subtotal.toFixed(currencyDecimalPlaces)}</span>
                        </div>
                        {order.taxes.map((tax, index) => (
                            <div key={index} className="flex justify-between text-muted-foreground">
                                <span>{tax.name} ({tax.rate}%)</span>
                                <span className="font-mono">{currencySymbol}{tax.amount.toFixed(currencyDecimalPlaces)}</span>
                            </div>
                        ))}
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span className="font-mono">{currencySymbol}{order.total.toFixed(currencyDecimalPlaces)}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground text-center">Hope You Enjoy The Dish Visit Again</p>
                {(order.status === 'ready' || order.status === 'completed') && (
                    <Button onClick={handlePrint} variant="outline" className="w-full">
                        <Printer className="mr-2 h-4 w-4"/>
                        Print Invoice
                    </Button>
                )}
                {isOrderActive && (
                    <Button asChild className="w-full">
                        <Link href={`/order/${tableId}/?add_items=true&order_id=${order.id}`}>Add More Items</Link>
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
