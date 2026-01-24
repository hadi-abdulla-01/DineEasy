

'use client';
import { updateOrderStatusAction } from "@/lib/actions";
import { useEffect, useState } from "react";
import { notFound, useParams, useSearchParams } from "next/navigation";
import type { Order, RestaurantSettings, Table } from "@/lib/definitions";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DollarSign, CreditCard, LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { useRestaurantData } from "@/lib/client-data";

type OrderWithTable = Order & { table?: Table };
type PaymentMode = 'cash' | 'card';

function CompleteButton({ order }: { order: Order }) {
    const { pending } = useFormStatus();

    if (order.status === 'completed' || order.status === 'cancelled') {
        return (
            <Button className="w-full" disabled>
                Order Already {order.status}
            </Button>
        )
    }

    return (
        <Button type="submit" name="status" value="completed" className="w-full" disabled={pending}>
            {pending ? 'Processing...' : 'Finalize & Complete Order'}
        </Button>
    )
}

export default function PaymentPage() {
    const { getOrderById, getTableById, getSettings, restaurantId } = useRestaurantData();
    const [order, setOrder] = useState<OrderWithTable | null>(null);
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
    const [cashReceived, setCashReceived] = useState<number | string>(0);
    const params = useParams();
    const searchParams = useSearchParams();
    const orderId = params.orderId as string;
    const redirectTo = searchParams.get('redirectTo') || '/admin/kitchen';

    useEffect(() => {
        if (orderId) {
            getOrderById(orderId).then(async (fetchedOrder) => {
                if (!fetchedOrder) {
                    notFound();
                    return;
                }

                if (fetchedOrder.branchId) {
                    const fetchedSettings = await getSettings(fetchedOrder.branchId);
                    setSettings(fetchedSettings);
                }

                let table;
                if (fetchedOrder.tableId) {
                    table = await getTableById(fetchedOrder.tableId);
                }

                setOrder({ ...fetchedOrder, table });
                setCashReceived(0);
            });
        }
    }, [orderId, getOrderById, getSettings, getTableById]);

    if (!order || !settings) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Loading payment details...</p>
                </div>
            </div>
        );
    }

    const currencyDecimalPlaces = settings.currencyDecimalPlaces ?? 2;

    const changeDue = (typeof cashReceived === 'number' && cashReceived >= order.total)
        ? cashReceived - order.total
        : 0;

    const currencySymbol = settings.currencySymbol || '$';

    return (
        <div className="grid gap-8 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Order Summary</CardTitle>
                    <CardDescription>
                        Order #{order.id.slice(-6)} for {order.table ? `Table ${order.table.number}` : order.orderType}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm">
                        {order.items.map((item) => (
                            <li key={item.orderItemId} className="flex justify-between items-start">
                                <span>{item.quantity}x {item.name}</span>
                                <span className="font-mono">{currencySymbol}{(item.quantity * item.price).toFixed(currencyDecimalPlaces)}</span>
                            </li>
                        ))}
                    </ul>
                    <Separator className="my-4" />
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
                    <Separator className="my-4" />
                    <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="font-mono">{currencySymbol}{order.total.toFixed(currencyDecimalPlaces)}</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <form action={updateOrderStatusAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="redirectTo" value={redirectTo} />
                    <input type="hidden" name="restaurantId" value={restaurantId} />
                    <CardHeader>
                        <CardTitle className="font-headline">Process Payment</CardTitle>
                        <CardDescription>Select a payment method and finalize the order.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <Label className="text-base">Payment Mode</Label>
                            <RadioGroup value={paymentMode} onValueChange={(value: PaymentMode) => setPaymentMode(value)} className="mt-2 grid grid-cols-2 gap-4">
                                <div>
                                    <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                                    <Label htmlFor="cash" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                        <DollarSign className="mb-3 h-6 w-6" />
                                        Cash
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="card" id="card" className="peer sr-only" />
                                    <Label htmlFor="card" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                        <CreditCard className="mb-3 h-6 w-6" />
                                        Card/Other
                                    </Label>
                                </div>
                            </RadioGroup>
                            <input type="hidden" name="paymentMethod" value={paymentMode} />
                        </div>
                        {paymentMode === 'cash' && (
                            <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
                                <h4 className="font-semibold">Cash Payment</h4>
                                <div className="space-y-2">
                                    <Label htmlFor="cashReceived">Cash Received</Label>
                                    <div className="relative">
                                        <span className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground">{currencySymbol}</span>
                                        <Input
                                            id="cashReceived"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={cashReceived}
                                            onChange={(e) => setCashReceived(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                            className="pl-6"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center rounded-md bg-background p-3">
                                    <span className="font-medium text-muted-foreground">Change Due</span>
                                    <span className="text-xl font-bold font-mono">{currencySymbol}{changeDue.toFixed(currencyDecimalPlaces)}</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <CompleteButton order={order} />
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
