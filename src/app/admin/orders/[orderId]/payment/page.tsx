

'use client';
import { updateOrderStatusAction } from "@/lib/actions";
import { useEffect, useState } from "react";
import { notFound, useParams, useSearchParams } from "next/navigation";
import type { Order, RestaurantSettings, Table, Payment } from "@/lib/definitions";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DollarSign, CreditCard, LoaderCircle, Scissors } from "lucide-react";
import { useFormStatus } from "react-dom";
import { useRestaurantData } from "@/lib/client-data";
import { SplitBillDialog } from "@/components/split-bill-dialog";

type OrderWithTable = Order & { table?: Table };

function CompleteButton({ order, totalPaid }: { order: OrderWithTable, totalPaid: number }) {
    const { pending } = useFormStatus();

    if (order.status === 'completed' || order.status === 'cancelled') {
        return (
            <Button className="w-full" disabled>
                Order Already {order.status}
            </Button>
        )
    }

    const isPaymentSufficient = totalPaid >= order.total;

    return (
        <Button type="submit" name="status" value="completed" className="w-full" disabled={pending || !isPaymentSufficient}>
            {pending ? 'Processing...' : (isPaymentSufficient ? 'Finalize & Complete Order' : 'Insufficient Payment')}
        </Button>
    )
}

export default function PaymentPage() {
    const { getOrderById, getTableById, getSettings, restaurantId } = useRestaurantData();
    const [order, setOrder] = useState<OrderWithTable | null>(null);
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [cashPaid, setCashPaid] = useState<number | string>('');
    const [cardPaid, setCardPaid] = useState<number | string>('');
    const [isSplitBillOpen, setIsSplitBillOpen] = useState(false);
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
    const currencySymbol = settings.currencySymbol || '$';

    const totalPaid = (Number(cashPaid) || 0) + (Number(cardPaid) || 0);
    const balanceDue = order.total - totalPaid;

    const paymentDetails: Payment[] = [];
    if (Number(cashPaid) > 0) paymentDetails.push({ method: 'cash', amount: Number(cashPaid) });
    if (Number(cardPaid) > 0) paymentDetails.push({ method: 'card', amount: Number(cardPaid) });

    return (
        <>
        <div className="grid gap-8 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Order Summary</CardTitle>
                    <CardDescription>
                        Invoice #{order.invoiceNumber || order.id.slice(-6)} for {order.table ? `Table ${order.table.number}` : order.orderType}
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
                    {paymentDetails.length > 0 && <input type="hidden" name="paymentDetails" value={JSON.stringify(paymentDetails)} />}
                    <CardHeader>
                        <CardTitle className="font-headline">Process Payment</CardTitle>
                        <CardDescription>Enter the amounts paid via each method.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="cashPaid">Cash Amount Paid</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="cashPaid"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={cashPaid}
                                        onChange={(e) => setCashPaid(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="cardPaid">Card/Other Amount Paid</Label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="cardPaid"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={cardPaid}
                                        onChange={(e) => setCardPaid(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between font-medium">
                                <span>Total Paid</span>
                                <span className="font-mono">{currencySymbol}{totalPaid.toFixed(currencyDecimalPlaces)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-base">
                                <span>{balanceDue >= 0 ? 'Change Due' : 'Balance Due'}</span>
                                <span className={balanceDue >= 0 ? 'text-green-600' : 'text-destructive'}>{currencySymbol}{Math.abs(balanceDue).toFixed(currencyDecimalPlaces)}</span>
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <CompleteButton order={order} totalPaid={totalPaid} />
                        {order.orderType === 'Dine-in' && (
                            <Button type="button" variant="outline" className="w-full" onClick={() => setIsSplitBillOpen(true)}>
                                <Scissors className="mr-2 h-4 w-4" />
                                Split Bill
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </Card>
        </div>
        <SplitBillDialog
            open={isSplitBillOpen}
            onOpenChange={setIsSplitBillOpen}
            order={order}
            settings={settings}
        />
        </>
    );
}
