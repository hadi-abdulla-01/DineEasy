

'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, useTransition } from 'react';
import type { MenuItem, RestaurantSettings, OrderItem, Order, Branch, Table, RemoteOrder, CustomerDetails, AddonOption } from '@/lib/definitions';
import { useRestaurantData } from '@/lib/client-data';
import { useAuth } from '../auth-provider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { placeholderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { LoaderCircle, PlusCircle, MinusCircle, Trash2, User, Phone, Hash, CreditCard, Banknote, QrCode, Utensils, Search, Globe, ShoppingBag, Home, Clock, XCircle, CheckCircle, Pencil, Building2, Grid3x3, Maximize, Minimize, CaseUpper, Delete, X, IceCream, Beef, Wine, Leaf, CircleDot } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderStatusBadge } from '@/components/order-status-badge';
import { formatDistanceInTimezone } from '@/lib/format-date';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { createOrderAction, updateOrderStatusAction } from "@/lib/actions";
import { Textarea } from '@/components/ui/textarea';
import dynamic from 'next/dynamic';
import { AddonDialog } from '@/components/addon-dialog';


const DraggableTableLayout = dynamic(() => import('@/components/draggable-table-layout'), {
    ssr: false,
    loading: () => <div className="flex h-full items-center justify-center"><LoaderCircle className="h-10 w-10 animate-spin text-muted-foreground" /></div>
});


type OrderWithTable = Order & { table?: Table };
type RemoteOrderWithTable = RemoteOrder & { table?: Table }; // Just for type consistency
type CombinedOrderWithTable = OrderWithTable | RemoteOrderWithTable;


const CategoryButton = ({ icon, label, selected, onClick }: { icon: React.ReactNode, label: string, selected: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={cn(
            "flex flex-col items-center justify-center gap-2 p-3 rounded-lg w-20 h-20 transition-all duration-200",
            selected
                ? 'bg-pink-600 text-white shadow-md scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
        )}
    >
        <div className="w-6 h-6 flex items-center justify-center">
            {icon}
        </div>
        <span className="text-xs font-medium">{label}</span>
    </button>
)

// POSMenuGrid Component
function POSMenuGrid({
    items,
    onAddToCart,
    onRemoveFromCart,
    getQuantity,
    settings,
    cart
}: {
    items: MenuItem[],
    onAddToCart: (item: MenuItem) => void,
    onRemoveFromCart: (item: MenuItem) => void,
    getQuantity: (itemId: string) => number,
    settings: RestaurantSettings | null,
    cart: OrderItem[],
}) {
    if (!settings) {
        return <p>Loading settings...</p>;
    }
    const currencySymbol = settings.currencySymbol || '$';
    const currencyDecimalPlaces = settings.currencyDecimalPlaces ?? 2;

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 pr-4">
            {items.map((item) => {
                const image = placeholderImages.find(p => p.id === item.imageId);
                const imageSrc = item.imageId?.startsWith('data:image') ? item.imageId : image?.imageUrl;
                const hasAddons = item.addonGroups && item.addonGroups.length > 0;
                const totalQuantity = cart.filter(cartItem => cartItem.menuItemId === item.id).reduce((sum, i) => sum + i.quantity, 0);

                // For simple items (no addons), the quantity is the count of the base item.
                const simpleItemQuantity = hasAddons ? 0 : cart.find(cartItem => cartItem.menuItemId === item.id)?.quantity || 0;

                return (
                    <Card
                        key={item.id}
                        className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 bg-white dark:bg-gray-800 rounded-xl flex flex-col border-gray-200 dark:border-gray-700"
                    >
                        <button className="aspect-square w-full bg-muted relative flex items-center justify-center" onClick={() => onAddToCart(item)}>
                            {imageSrc ? (
                                <Image src={imageSrc} alt={item.name} data-ai-hint={image?.imageHint} fill className="object-cover" />
                            ) : (
                                <div className="text-xs text-muted-foreground p-2 text-center">No image</div>
                            )}
                            {totalQuantity > 0 && (
                                <div className="absolute top-2 left-2 bg-pink-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold shadow-lg">
                                    {totalQuantity}
                                </div>
                            )}
                        </button>
                        <div className="p-3 text-center flex flex-col flex-grow justify-between">
                            <p className="text-sm font-semibold leading-tight line-clamp-2 mb-2 h-10 text-gray-900 dark:text-gray-100">{item.name}</p>
                            <div className="flex justify-between items-center mt-auto">
                                <p className="text-sm font-bold text-pink-600">{settings.currencySymbol}{item.price.toFixed(settings.currencyDecimalPlaces)}</p>
                                {hasAddons ? (
                                    <Button size="sm" variant="outline" className="text-pink-600 border-pink-600 hover:bg-pink-50 hover:text-pink-700" onClick={() => onAddToCart(item)}>
                                        Customize
                                    </Button>
                                ) : simpleItemQuantity > 0 ? (
                                    <div className="flex items-center gap-1">
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-pink-600 hover:bg-pink-100" onClick={() => onRemoveFromCart(item)}><MinusCircle className="h-5 w-5" /></Button>
                                        <span className="font-bold text-lg w-5 text-center">{simpleItemQuantity}</span>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-pink-600 hover:bg-pink-100" onClick={() => onAddToCart(item)}><PlusCircle className="h-5 w-5" /></Button>
                                    </div>
                                ) : (
                                    <Button size="sm" variant="outline" className="text-pink-600 border-pink-600 hover:bg-pink-50 hover:text-pink-700" onClick={() => onAddToCart(item)}>Add</Button>
                                )}
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}


// POSCart Component
function POSCart({
    cart,
    settings,
    onUpdateQuantity,
    onPlaceOrder,
    tables,
    orderType,
    setOrderType,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    tableId,
    setTableId,
    address,
    setAddress,
    platform,
    setPlatform,
    takeAwayTime,
    setTakeAwayTime,
    orderToUpdate,
    onClearEdit,
    orderNotes,
    setOrderNotes,
    onItemNoteChange,
    onInputDoubleClick,
    discount,
    setDiscount,
    isSubmitting,
}: {
    cart: OrderItem[];
    settings: RestaurantSettings | null;
    onUpdateQuantity: (orderItemId: string, newQuantity: number) => void;
    onPlaceOrder: (discount: number) => void;
    tables: Table[];
    orderType: 'Dine-in' | 'Take-away' | 'Online';
    setOrderType: (type: 'Dine-in' | 'Take-away' | 'Online') => void;
    customerName: string;
    setCustomerName: (name: string) => void;
    customerPhone: string;
    setCustomerPhone: (phone: string) => void;
    tableId: string;
    setTableId: (id: string) => void;
    address: string;
    setAddress: (address: string) => void;
    platform: string;
    setPlatform: (platform: string) => void;
    takeAwayTime: string;
    setTakeAwayTime: (time: string) => void;
    orderToUpdate: CombinedOrderWithTable | null;
    onClearEdit: () => void;
    orderNotes: string;
    setOrderNotes: (notes: string) => void;
    onItemNoteChange: (orderItemId: string, note: string) => void;
    onInputDoubleClick: (e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    discount: number;
    setDiscount: (value: number) => void;
    isSubmitting: boolean;
}) {

    useEffect(() => {
        if (orderToUpdate) {
            setDiscount(orderToUpdate.discount || 0);
        } else {
            setDiscount(0);
        }
    }, [orderToUpdate, setDiscount]);


    if (!settings) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Loading cart...</p>
            </div>
        );
    }
    const currencySymbol = settings.currencySymbol || '$';
    const currencyDecimalPlaces = settings.currencyDecimalPlaces ?? 2;

    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const taxes = (settings.taxes || []).map(tax => ({
        ...tax,
        amount: subtotal * (tax.rate / 100)
    }));
    const totalTaxAmount = taxes.reduce((acc, tax) => acc + tax.amount, 0);
    const total = subtotal - discount + totalTaxAmount;

    const handlePlaceOrder = async () => {
        await onPlaceOrder(discount);
    };

    return (
        <div className="grid grid-rows-[auto_auto_1fr_auto] bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-gray-200 dark:border-gray-700 h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {orderToUpdate ? 'Edit Order' : 'New Order'}
                    </h2>
                    {orderToUpdate && (
                        <Button variant="outline" size="sm" onClick={onClearEdit} className="bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700">
                            <PlusCircle className="h-4 w-4 mr-1" />
                            New Order
                        </Button>
                    )}
                </div>
            </div>

            <div className="p-4 space-y-4 border-b border-gray-200 dark:border-gray-700">
                <RadioGroup
                    value={orderType}
                    onValueChange={(value) => !orderToUpdate && setOrderType(value as any)}
                    className="grid grid-cols-3 gap-4"
                >
                    <Label
                        htmlFor="dine-in"
                        className={cn(
                            "border rounded-md p-2 flex flex-col items-center justify-center gap-1 text-center text-sm h-16 transition-colors",
                            !orderToUpdate && "cursor-pointer hover:bg-pink-50 dark:hover:bg-gray-700",
                            orderType === 'Dine-in' && "bg-pink-100 text-pink-600 border-pink-300 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700",
                            !!orderToUpdate && orderType !== 'Dine-in' && "cursor-not-allowed opacity-50"
                        )}
                    >
                        <RadioGroupItem value="Dine-in" id="dine-in" className="sr-only" disabled={!!orderToUpdate} />
                        <Utensils className="h-5 w-5" />
                        Dine-in
                    </Label>
                    <Label
                        htmlFor="take-away"
                        className={cn(
                            "border rounded-md p-2 flex flex-col items-center justify-center gap-1 text-center text-sm h-16 transition-colors",
                            !orderToUpdate && "cursor-pointer hover:bg-pink-50 dark:hover:bg-gray-700",
                            orderType === 'Take-away' && "bg-pink-100 text-pink-600 border-pink-300 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700",
                            !!orderToUpdate && orderType !== 'Take-away' && "cursor-not-allowed opacity-50"
                        )}
                    >
                        <RadioGroupItem value="Take-away" id="take-away" className="sr-only" disabled={!!orderToUpdate} />
                        <ShoppingBag className="h-5 w-5" />
                        Take-away
                    </Label>
                    <Label
                        htmlFor="online"
                        className={cn(
                            "border rounded-md p-2 flex flex-col items-center justify-center gap-1 text-center text-sm h-16 transition-colors",
                            !orderToUpdate && "cursor-pointer hover:bg-pink-50 dark:hover:bg-gray-700",
                            orderType === 'Online' && "bg-pink-100 text-pink-600 border-pink-300 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700",
                            !!orderToUpdate && orderType !== 'Online' && "cursor-not-allowed opacity-50"
                        )}
                    >
                        <RadioGroupItem value="Online" id="online" className="sr-only" disabled={!!orderToUpdate} />
                        <Globe className="h-5 w-5" />
                        Online
                    </Label>
                </RadioGroup>
                <div className='py-4 space-y-2'>
                    {orderType === 'Dine-in' && (
                        <div className="space-y-2">
                            <Label htmlFor="tableId-select">Table</Label>
                            <Select value={tableId} onValueChange={setTableId}>
                                <SelectTrigger id="tableId-select">
                                    <SelectValue placeholder="Select a table" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tables.map(table => (
                                        <SelectItem key={table.id} value={table.id}>
                                            Table {table.number}{table.floor ? ` (${table.floor})` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="customerName">Customer Name</Label>
                        <Input id="customerName" value={customerName} onDoubleClick={onInputDoubleClick} onChange={(e) => setCustomerName(e.target.value)} placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="customerPhone">Customer Phone</Label>
                        <Input id="customerPhone" type="tel" value={customerPhone} onDoubleClick={onInputDoubleClick} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="555-1234" />
                    </div>

                    {orderType === 'Take-away' && (
                        <div className="space-y-2">
                            <Label htmlFor="takeAwayTime">Pickup Time (Optional)</Label>
                            <Input
                                id="takeAwayTime"
                                name="takeAwayTime"
                                type="time"
                                value={takeAwayTime}
                                onDoubleClick={onInputDoubleClick}
                                onChange={(e) => setTakeAwayTime(e.target.value)}
                            />
                        </div>
                    )}

                    {orderType === 'Online' && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea id="address" value={address} onDoubleClick={onInputDoubleClick} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery Address" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="platform">Platform</Label>
                                <Select value={platform} onValueChange={setPlatform}>
                                    <SelectTrigger id="platform">
                                        <SelectValue placeholder="Select platform" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(settings.onlineOrderPlatforms || []).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                </div>
            </div>


            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {cart.length === 0 ? (
                        <p className="text-muted-foreground text-center pt-10">Select items to start an order.</p>
                    ) : (
                        cart.map((item, index) => (
                            <div key={item.orderItemId ?? index} className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm line-clamp-1">{item.name}</p>
                                        <p className="font-semibold text-sm text-pink-600">{currencySymbol}{(item.price * item.quantity).toFixed(currencyDecimalPlaces)}</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-pink-100 text-pink-600 rounded-full p-1">
                                        <button onClick={() => onUpdateQuantity(item.orderItemId, item.quantity - 1)} className="hover:text-pink-800">
                                            <MinusCircle className="h-5 w-5" />
                                        </button>
                                        <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                                        <button onClick={() => onUpdateQuantity(item.orderItemId, item.quantity + 1)} className="hover:text-pink-800">
                                            <PlusCircle className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <button onClick={() => onUpdateQuantity(item.orderItemId, 0)} className="hover:text-destructive">
                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                </div>
                                <Textarea
                                    placeholder="Add special instructions for this item..."
                                    className="text-xs h-12"
                                    value={item.notes || ''}
                                    onDoubleClick={onInputDoubleClick}
                                    onChange={(e) => onItemNoteChange(item.orderItemId, e.target.value)}
                                />
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 border-t border-gray-200 dark:bg-gray-900 rounded-b-2xl">
                <div className="w-full space-y-2 py-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{currencySymbol}{subtotal.toFixed(currencyDecimalPlaces)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <Label htmlFor="discount" className="text-muted-foreground">Discount</Label>
                        <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">{currencySymbol}</span>
                            <Input
                                id="discount"
                                type="number"
                                value={discount}
                                onDoubleClick={onInputDoubleClick}
                                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                                className="h-8 w-24 text-right"
                                placeholder="0.00"
                                min="0"
                            />
                        </div>
                    </div>
                    {taxes.map(tax => (
                        <div key={tax.id} className="flex justify-between text-sm text-muted-foreground">
                            <span>{tax.name} ({tax.rate}%)</span>
                            <span>{currencySymbol}{tax.amount.toFixed(currencyDecimalPlaces)}</span>
                        </div>
                    ))}
                    <Separator className="my-2" />
                    <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>{currencySymbol}{total.toFixed(currencyDecimalPlaces)}</span>
                    </div>
                </div>

                {!orderToUpdate && (
                    <div className="w-full space-y-2 pt-4 border-t">
                        <Label htmlFor="order-notes">Order Notes</Label>
                        <Textarea
                            id="order-notes"
                            placeholder="Add general notes for the entire order..."
                            value={orderNotes}
                            onDoubleClick={onInputDoubleClick}
                            onChange={(e) => setOrderNotes(e.target.value)}
                        />
                    </div>
                )}

                <Button className="w-full mt-4 bg-pink-600 hover:bg-pink-700" size="lg" onClick={handlePlaceOrder} disabled={cart.length === 0 || isSubmitting}>
                    {isSubmitting ? <LoaderCircle className="animate-spin" /> : (orderToUpdate ? 'Update Order' : 'Place Order')}
                </Button>
            </div>
        </div>
    );
}

function ActiveOrderCard({ order, settings, onUpdate, onEdit, restaurantId, startTransition }: { order: CombinedOrderWithTable, settings: RestaurantSettings | null, onUpdate: () => void, onEdit: (order: CombinedOrderWithTable) => void, restaurantId: string, startTransition: React.TransitionStartFunction }) {

    const getOrderTitle = (order: CombinedOrderWithTable) => {
        switch (order.orderType) {
            case 'Dine-in':
                return order.table ? `Table ${order.table.number}` : 'Dine-in';
            case 'Online':
                return 'Online Order';
            case 'Take-away':
                return 'Take-Away';
            default:
                return `Order #${order.id.slice(-6)}`;
        }
    }

    const getOrderIcon = (order: CombinedOrderWithTable) => {
        switch (order.orderType) {
            case 'Dine-in':
                return <Utensils className="h-4 w-4 mr-2" />;
            case 'Online':
            case 'Take-away':
                return <ShoppingBag className="h-4 w-4 mr-2" />;
            default:
                return null;
        }
    }

    const { toast } = useToast();


    const handleUpdateStatus = (status: 'preparing' | 'ready' | 'completed' | 'cancelled') => {
        startTransition(async () => {
            try {
                const formData = new FormData();
                formData.append('orderId', order.id);
                formData.append('status', status);
                formData.append('restaurantId', restaurantId);
                await updateOrderStatusAction(formData);

                if (status === 'cancelled') {
                    toast({
                        title: "Order Cancelled",
                        description: `Order #${order.invoiceNumber || order.id.slice(-6)} has been cancelled.`,
                        variant: "destructive"
                    });
                } else {
                    toast({
                        title: "Status Updated",
                        description: `Order marked as ${status}.`
                    });
                }

                // Wait a bit for the database to update, then refresh
                setTimeout(() => {
                    onUpdate();
                }, 500);
            } catch (error) {
                console.error('Failed to update order status:', error);
                toast({
                    variant: 'destructive',
                    title: "Error",
                    description: "Failed to update order status."
                });
            }
        });
    }

    const nextStatus = order.status === 'received' ? 'preparing' : order.status === 'preparing' ? 'ready' : undefined;

    return (
        <Card className="flex flex-col bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="font-headline text-lg flex items-center text-gray-900 dark:text-gray-100">
                            {getOrderIcon(order)}
                            {getOrderTitle(order)}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">Order #{order.invoiceNumber || order.id.slice(-6)}</p>
                    </div>
                    {'status' in order && <OrderStatusBadge status={order.status} />}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2 pt-2">
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceInTimezone(order.createdAt, settings?.timezone)}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 flex-shrink-0" />
                        <span>{'customerDetails' in order ? order.customerDetails.name : order.customerName}</span>
                    </div>
                </div>
                <Separator className="my-2" />
                <ScrollArea className="h-24">
                    <ul className="space-y-1 text-sm">
                        {order.items.map((item, index) => (
                            <li key={item.orderItemId ?? index} className="flex justify-between items-start gap-2">
                                <div className="flex-1">
                                    <span className={cn("font-semibold", (item.isReady || item.status === 'cancelled') && "line-through text-muted-foreground")}>
                                        {item.quantity}x {item.name}
                                    </span>
                                </div>
                                {item.status === 'cancelled' && <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Cancelled</Badge>}
                            </li>
                        ))}
                    </ul>
                </ScrollArea>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-2">
                {nextStatus && (
                    <Button onClick={() => handleUpdateStatus(nextStatus as any)} size="sm" className="w-full">
                        Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                    </Button>
                )}
                {order.status === 'ready' && (
                    <Button asChild size="sm" className="w-full bg-green-600 hover:bg-green-700">
                        <Link href={`/admin/orders/${order.id}/payment?redirectTo=/admin/pos`}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Proceed to Payment
                        </Link>
                    </Button>
                )}
                <Button onClick={() => onEdit(order)} size="sm" variant="outline" className="w-full">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Order
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="w-full">
                            Cancel Order
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action will cancel the entire order. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Go Back</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleUpdateStatus('cancelled')} className="bg-destructive hover:bg-destructive/90">
                                Yes, Cancel Order
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    );
}

// On-screen keyboard component
const OnScreenKeyboard = ({ onClose, inputType = 'text' }: { onClose: () => void; inputType?: 'text' | 'number' | 'email' | 'tel' }) => {
    const [isShift, setIsShift] = React.useState(false);

    const handleKeyPress = (key: string) => {
        const target = keyboardConfig.target;
        if (!target) return;

        const currentValue = target.value || '';
        let newValue;

        if (key === 'Backspace') {
            newValue = currentValue.slice(0, -1);
        } else {
            newValue = currentValue + key;
        }

        const prototype = Object.getPrototypeOf(target);
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

        nativeInputValueSetter?.call(target, newValue);

        const event = new Event('input', { bubbles: true, cancelable: true });
        target.dispatchEvent(event);

        target.focus();
        target.setSelectionRange(newValue.length, newValue.length);
    };

    const handleKeyClick = (key: string) => {
        if (key === 'Shift') {
            setIsShift(!isShift);
            return;
        }
        if (key === 'Space') {
            handleKeyPress(' ');
            if (isShift) setIsShift(false);
            return;
        }
        if (key === 'Backspace') {
            handleKeyPress('Backspace');
            if (isShift) setIsShift(false);
            return;
        }

        handleKeyPress(isShift ? key.toUpperCase() : key.toLowerCase());
        if (isShift) setIsShift(false);
    };

    const isNumeric = inputType === 'number' || inputType === 'tel';

    const KeyButton = ({ children, onClick, className, ...props }: { children: React.ReactNode, onClick: () => void, className?: string, style?: React.CSSProperties }) => (
        <Button
            type="button"
            variant="outline"
            className={cn("h-12 text-lg font-semibold bg-white/80 dark:bg-gray-800/80 shadow-sm transition-transform active:scale-95", className)}
            onClick={onClick}
            {...props}
        >
            {children}
        </Button>
    );

    const AlphanumericLayout = () => (
        <div className="flex justify-center items-start gap-4">
            {/* Letter Section */}
            <div className="flex flex-col gap-1.5">
                {[['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'], ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], ['z', 'x', 'c', 'v', 'b', 'n', 'm']].map((row, rowIndex) => (
                    <div key={`letter-row-${rowIndex}`} className="flex justify-center gap-1.5">
                        {row.map((key) => (
                            <KeyButton key={key} onClick={() => handleKeyClick(key)} className="w-12">
                                {isShift ? key.toUpperCase() : key.toLowerCase()}
                            </KeyButton>
                        ))}
                    </div>
                ))}
                <div className="flex justify-center gap-1.5">
                    <KeyButton onClick={() => handleKeyClick('Shift')} className="px-4 flex-grow"><CaseUpper /></KeyButton>
                    <KeyButton onClick={() => handleKeyClick('@')} className="w-12">@</KeyButton>
                    <KeyButton onClick={() => handleKeyClick('Space')} className="px-4 flex-grow min-w-[200px]">Space</KeyButton>
                    <KeyButton onClick={() => handleKeyClick('.')} className="w-12">.</KeyButton>
                    <KeyButton onClick={() => handleKeyClick('Backspace')} className="px-4 flex-grow"><Delete /></KeyButton>
                </div>
            </div>

            <Separator orientation="vertical" className="h-auto self-stretch" />

            {/* Number Section */}
            <div className="flex flex-col gap-1.5">
                 {[['7', '8', '9'], ['4', '5', '6'], ['1', '2', '3']].map((row, rowIndex) => (
                     <div key={`num-row-${rowIndex}`} className="flex justify-center gap-1.5">
                        {row.map((key) => (
                            <KeyButton key={key} onClick={() => handleKeyClick(key)} className="w-12 h-12">
                                {key}
                            </KeyButton>
                        ))}
                    </div>
                ))}
                 <div className="flex justify-center gap-1.5">
                    <KeyButton onClick={() => handleKeyClick('0')} className="flex-grow h-12">0</KeyButton>
                </div>
            </div>
        </div>
    );

    const NumericLayout = () => (
        <div className="space-y-1.5 w-fit mx-auto">
            {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']].map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-1.5">
                    {row.map((key) => (
                        <KeyButton key={key} onClick={() => handleKeyClick(key)} className="w-20 h-16 text-2xl">
                            {key}
                        </KeyButton>
                    ))}
                </div>
            ))}
            <div className="flex justify-center gap-1.5">
                 <KeyButton onClick={() => handleKeyClick('.')} className="w-20 h-16 text-2xl">.</KeyButton>
                 <KeyButton onClick={() => handleKeyClick('0')} className="w-20 h-16 text-2xl">0</KeyButton>
                 <KeyButton onClick={() => handleKeyClick('Backspace')} className="w-20 h-16 text-2xl"><Delete /></KeyButton>
            </div>
        </div>
    );

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-200/95 dark:bg-gray-900/95 backdrop-blur-sm p-2 z-[100] shadow-lg rounded-t-lg border-t dark:border-gray-700">
            <div className="flex justify-end">
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-5 w-5" />
                </Button>
            </div>
            <div className="p-1 flex justify-center">
                {isNumeric ? <NumericLayout /> : <AlphanumericLayout />}
            </div>
        </div>
    );
};


export default function POSPage() {
    const { user } = useAuth();
    const {
        getMenuItems,
        getSettings,
        getBranches,
        getTables,
        restaurantId,
        getActiveOrders,
        updateFullOrder,
        getMainBranch,
        getTableById,
    } = useRestaurantData();

    const [isPending, startTransition] = useTransition();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(undefined);
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [orderToUpdate, setOrderToUpdate] = useState<CombinedOrderWithTable | null>(null);
    const [activeTab, setActiveTab] = useState('new-order');
    const [orderType, setOrderType] = useState<'Dine-in' | 'Take-away' | 'Online'>('Dine-in');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [tableId, setTableId] = useState('');
    const [address, setAddress] = useState('');
    const [platform, setPlatform] = useState('');
    const [takeAwayTime, setTakeAwayTime] = useState('');
    const [orderNotes, setOrderNotes] = useState('');
    const [discount, setDiscount] = useState(0);
    const [activeOrders, setActiveOrders] = useState<CombinedOrderWithTable[]>([]);
    const { toast } = useToast();
    const isGlobalAdmin = (user?.role === 'Admin' && !user?.branchId) || user?.username?.toLowerCase() === 'admin';
    const [floorFilter, setFloorFilter] = useState<string>('');
    const [selectedItemForAddons, setSelectedItemForAddons] = useState<MenuItem | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [keyboardConfig, setKeyboardConfig] = React.useState<{ visible: boolean; target: HTMLInputElement | HTMLTextAreaElement | null; inputType?: 'text' | 'number' | 'email' | 'tel' }>({ visible: false, target: null });


    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const fetchStaticData = useCallback(async () => {
        if (!selectedBranchId || !restaurantId) return;
        setIsLoading(true);
        try {
            const [fetchedMenuItems, fetchedSettings, fetchedTables] = await Promise.all([
                getMenuItems(selectedBranchId),
                getSettings(selectedBranchId),
                getTables(selectedBranchId),
            ]);
            setMenuItems(fetchedMenuItems);
            setSettings(fetchedSettings);
            setTables(fetchedTables);

            if (fetchedSettings?.multiFloorEnabled && fetchedSettings.floors && fetchedSettings.floors.length > 0) {
                const groundFloor = fetchedSettings.floors.find(f => f.toLowerCase() === 'ground floor');
                if (groundFloor) {
                    setFloorFilter(groundFloor);
                } else {
                    setFloorFilter(fetchedSettings.defaultFloor || fetchedSettings.floors[0]);
                }
            } else {
                setFloorFilter('');
            }

            if (fetchedSettings?.onlineOrderPlatforms?.length) {
                setPlatform(p => p || fetchedSettings.onlineOrderPlatforms![0]);
            }
        } catch (error) {
            console.error("Failed to fetch initial POS data:", error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to load core POS data." });
        } finally {
            setIsLoading(false);
        }
    }, [selectedBranchId, restaurantId, getMenuItems, getSettings, getTables, toast]);

    const refreshActiveOrders = useCallback(async () => {
        if (!selectedBranchId || !restaurantId) return;
        try {
            const fetchedActiveOrders = await getActiveOrders(selectedBranchId);
    
            const activeOrdersWithTables: OrderWithTable[] = await Promise.all(fetchedActiveOrders.map(async (order) => {
                const table = order.tableId ? await getTableById(order.tableId) : undefined;
                return { ...order, table };
            }));
    
            const filteredActiveOrders = activeOrdersWithTables.filter(order =>
                order.status !== 'cancelled' && order.status !== 'completed'
            );
    
            setActiveOrders(filteredActiveOrders);
    
        } catch (error) {
            console.error("Failed to refresh active orders:", error);
        }
    }, [selectedBranchId, restaurantId, getActiveOrders, getTableById]);


    useEffect(() => {
        if (!user || !restaurantId) return;
        if (isGlobalAdmin) {
            getBranches().then(fetchedBranches => {
                setBranches(fetchedBranches);
                const mainBranch = fetchedBranches.find(b => b.isMain);
                if (mainBranch) {
                    setSelectedBranchId(mainBranch.id);
                } else if (fetchedBranches.length > 0) {
                    setSelectedBranchId(fetchedBranches[0].id);
                }
            });
        } else {
            setSelectedBranchId(user.branchId);
        }
    }, [user, restaurantId, isGlobalAdmin, getBranches]);

    useEffect(() => {
        if (selectedBranchId) {
            fetchStaticData(); // Load menu, settings etc once
            refreshActiveOrders(); // Load orders and start interval
            const interval = setInterval(refreshActiveOrders, 10000); // 10 seconds
            return () => clearInterval(interval);
        }
    }, [selectedBranchId, fetchStaticData, refreshActiveOrders]);


    const handleItemNoteChange = (orderItemId: string, note: string) => {
        setCart(prev => prev.map(item => item.orderItemId === orderItemId ? { ...item, notes: note } : item));
    };

    const handleClearEdit = () => {
        setOrderToUpdate(null);
        setCart([]);
        setOrderType('Dine-in');
        setCustomerName('');
        setCustomerPhone('');
        setTableId('');
        setAddress('');
        setPlatform(settings?.onlineOrderPlatforms?.[0] || '');
        setTakeAwayTime('');
        setOrderNotes('');
        setDiscount(0);
    };

    const handleEditOrder = (order: CombinedOrderWithTable) => {
        setOrderToUpdate(order);
        setCart(order.items.map(item => ({ ...item })));
        setOrderType(order.orderType);
        setOrderNotes(order.notes || '');

        if ('customerDetails' in order) {
            setCustomerName(order.customerDetails.name);
            setCustomerPhone(order.customerDetails.phone);
            setAddress(order.customerDetails.address || '');
            setPlatform(order.customerDetails.platform || '');
            if ('takeAwayTime' in order && order.takeAwayTime) {
                setTakeAwayTime(order.takeAwayTime);
            }
        } else {
            setTableId(order.tableId);
            setCustomerName(order.customerName);
            setCustomerPhone(order.customerPhone);
            setAddress('');
            setPlatform('');
            setTakeAwayTime('');
        }
        setActiveTab('new-order');
        toast({ title: "Editing Order", description: `Order #${order.invoiceNumber || order.id.slice(-6)} loaded into cart.` });
    };

    const getAddonCombinationId = (selectedAddons?: Record<string, AddonOption>): string => {
        if (!selectedAddons || Object.keys(selectedAddons).length === 0) {
            return 'base';
        }
        return Object.keys(selectedAddons)
            .sort()
            .map(groupId => `${groupId}:${selectedAddons[groupId].id}`)
            .join(';');
    };

    const handleAddToCartWithAddons = (menuItem: MenuItem, selectedAddons?: Record<string, AddonOption>) => {
        const addonId = getAddonCombinationId(selectedAddons);
        const orderItemId = `${menuItem.id}-${addonId}`;

        setCart((prevCart) => {
            const existingItem = prevCart.find(item => item.orderItemId === orderItemId);

            if (existingItem) {
                return prevCart.map(item =>
                    item.orderItemId === orderItemId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                let notes = '';
                let addonPrice = 0;

                if (selectedAddons && Object.keys(selectedAddons).length > 0) {
                    notes = Object.entries(selectedAddons).map(([groupId, option]) => {
                        const group = menuItem.addonGroups?.find(g => g.id === groupId);
                        return group ? `${group.title}: ${option.name}` : option.name;
                    }).join('; ');
                    addonPrice = Object.values(selectedAddons).reduce((sum, addon) => sum + addon.price, 0);
                }

                const newOrderItem: OrderItem = {
                    orderItemId: orderItemId,
                    menuItemId: menuItem.id,
                    name: menuItem.name,
                    price: menuItem.price + addonPrice,
                    quantity: 1,
                    category: menuItem.category,
                    isReady: false,
                    status: 'active',
                    notes: notes,
                };

                return [...prevCart, newOrderItem];
            }
        });
    };

    const handleSimpleAddToCart = (menuItem: MenuItem) => {
        if (menuItem.addonGroups && menuItem.addonGroups.length > 0) {
            setSelectedItemForAddons(menuItem);
        } else {
            handleAddToCartWithAddons(menuItem);
        }
    };

    const handleRemoveFromCart = (menuItem: MenuItem) => {
        const orderItemId = `${menuItem.id}-base`;
        const itemInCart = cart.find(i => i.orderItemId === orderItemId);
        if (itemInCart) {
            handleUpdateQuantity(orderItemId, itemInCart.quantity - 1);
        }
    };

    const handleUpdateQuantity = (orderItemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            setCart(prev => prev.filter(i => i.orderItemId !== orderItemId));
        } else {
            setCart(prev => prev.map(i => i.orderItemId === orderItemId ? { ...i, quantity: newQuantity } : i));
        }
    };

    const getQuantity = (menuItemId: string): number => {
        return cart
            .filter(item => item.menuItemId === menuItemId)
            .reduce((sum, item) => sum + item.quantity, 0);
    };

    const handlePlaceOrder = (discountValue: number) => {
        if (!selectedBranchId || !user || !restaurantId) {
            toast({ variant: 'destructive', title: "Error", description: "Branch not selected or user not found." });
            return;
        }

        if (isPending) {
            return;
        }

        startTransition(async () => {
            try {
                if (orderToUpdate) {
                    await updateFullOrder(orderToUpdate.id, orderToUpdate.orderType as any, {
                        items: cart,
                        notes: orderNotes,
                        customerName: customerName || 'Customer',
                        customerPhone: customerPhone || 'N/A',
                        tableId: orderType === 'Dine-in' ? tableId : undefined,
                        address: orderType === 'Online' ? address : undefined,
                        platform: orderType === 'Online' ? platform : undefined,
                        takeAwayTime: orderType === 'Take-away' ? takeAwayTime : undefined,
                        discount: discountValue,
                    });
                    toast({ title: "Success", description: "Order updated successfully." });
                    handleClearEdit();
                } else {
                    const orderPayload: any = {
                        branchId: selectedBranchId,
                        customerName: customerName || 'Customer',
                        customerPhone: customerPhone || 'N/A',
                        items: cart,
                        orderType: orderType,
                        notes: orderNotes,
                        createdByName: user.username,
                        discount: discountValue,
                    };
                    if (orderType === 'Dine-in') {
                        if (!tableId) {
                            toast({ variant: 'destructive', title: "Error", description: "Table is required for Dine-in orders." });
                            return;
                        }
                        const selectedTable = tables.find(t => t.id === tableId);
                        orderPayload.tableId = tableId;
                        if (!orderPayload.customerName) {
                            orderPayload.customerName = `Table ${selectedTable?.number || ''}`;
                        }
                    }
                    if (orderType === 'Take-away') {
                        orderPayload.takeAwayTime = takeAwayTime;
                    }
                    if (orderType === 'Online') {
                        orderPayload.customerDetails = { name: customerName, phone: customerPhone, address, platform };
                    }

                    await createOrderAction(orderPayload, restaurantId);
                    toast({ title: "Success", description: "Order placed successfully." });
                    handleClearEdit();
                }
                refreshActiveOrders();
            } catch (error: any) {
                toast({ variant: 'destructive', title: "Order Failed", description: error.message || "Could not place order." });
            }
        });
    };


    const handleTableSelectFromLayout = (table: Table) => {
        setOrderType('Dine-in');
        setTableId(table.id);
        setCustomerName(`Table ${table.number}`);
        setCustomerPhone(''); // Clear phone for new order
        setCart([]); // Clear cart
        setOrderToUpdate(null); // Ensure we're not editing
        setActiveTab('new-order'); // Switch to the order creation tab
        toast({
            title: `Table ${table.number} Selected`,
            description: "Start adding items to the order.",
        });
    };

    const categories = useMemo(() => ["All", ...Array.from(new Set(menuItems.map(item => item.category)))], [menuItems]);
    const filteredMenu = useMemo(() => menuItems.filter(item =>
        item.isAvailable &&
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedCategory === "All" || item.category === selectedCategory)
    ), [menuItems, searchTerm, selectedCategory]);

    const categoryIcons: Record<string, React.ReactNode> = {
        'All': <Grid3x3 className="w-6 h-6" />,
        'Meals': <Utensils className="w-6 h-6" />,
        'Snacks': <Beef className="w-6 h-6" />,
        'Beverages': <Wine className="w-6 h-6" />,
        'Breads': <CircleDot className="w-6 h-6" />,
        'Desserts': <IceCream className="w-6 h-6" />,
        'Vegan': <Leaf className="w-6 h-6" />,
        'Default': <Utensils className="w-6 h-6" />
    };

    const handleInputDoubleClick = (e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (settings?.posSettings?.enableOnScreenKeyboard) {
            const target = e.currentTarget;
            setKeyboardConfig({
                visible: true,
                target: target,
                inputType: (target.type as any) || 'text',
            });
        }
    };

    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><LoaderCircle className="h-10 w-10 animate-spin text-muted-foreground" /></div>;
    }

    if (!settings) {
        return (
            <div className="flex h-full items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>Welcome to the POS</CardTitle>
                        <CardDescription>To get started, please select a branch.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isGlobalAdmin ? (
                            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select a branch" /></SelectTrigger>
                                <SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                            </Select>
                        ) : <p className="text-muted-foreground">It seems you are not assigned to a branch. Please contact an administrator.</p>}
                    </CardContent>
                </Card>
            </div>
        );
    }

    const mainCategories = settings?.menuCategories?.slice(0, 4) || [];

    return (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg h-screen overflow-hidden flex flex-col">
            {selectedItemForAddons && (
                <AddonDialog
                    item={selectedItemForAddons}
                    open={!!selectedItemForAddons}
                    onOpenChange={(isOpen) => !isOpen && setSelectedItemForAddons(null)}
                    onAddToCart={handleAddToCartWithAddons}
                    settings={settings}
                />
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 flex-1 min-h-0 gap-0">
                <div className="lg:col-span-2 flex flex-col p-4 overflow-hidden min-h-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
                        <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
                            <TabsTrigger value="new-order">{orderToUpdate ? 'Edit Order' : 'New Order'}</TabsTrigger>
                            <TabsTrigger value="table-view">Table View</TabsTrigger>
                            <TabsTrigger value="manage-orders">Manage Orders ({activeOrders.length})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="new-order" className="flex-1 min-h-0 relative data-[state=active]:block">
                            <div className="absolute inset-0 flex flex-col">
                                <div className="flex flex-col md:flex-row gap-4 justify-end items-center flex-shrink-0 mt-4 mb-4">
                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                        <div className="relative w-full md:max-w-xs">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                placeholder="Search menu..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                onDoubleClick={handleInputDoubleClick}
                                                className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-12 rounded-lg text-gray-900 dark:text-gray-100"
                                            />
                                        </div>
                                        <Button variant="outline" className="h-12 w-12 shrink-0" onClick={handleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
                                            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                                        </Button>
                                        <Link href="/admin" passHref>
                                            <Button variant="outline" className="h-12 w-12 shrink-0" title="Exit POS">
                                                <Home className="h-5 w-5" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                                <div className='flex-shrink-0'>
                                    <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-gray-100">Choose Category</h3>
                                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                                        <CategoryButton key="All" label="All" selected={selectedCategory === "All"} onClick={() => setSelectedCategory("All")} icon={categoryIcons['All']} />
                                        {mainCategories.map(cat => <CategoryButton key={cat} label={cat} selected={selectedCategory === cat} onClick={() => setSelectedCategory(cat)} icon={categoryIcons[cat] || categoryIcons['Default']} />)}
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto -mr-4 pr-4 mt-4 min-h-0 pb-8">
                                    <POSMenuGrid
                                        items={filteredMenu}
                                        onAddToCart={handleSimpleAddToCart}
                                        onRemoveFromCart={handleRemoveFromCart}
                                        getQuantity={getQuantity}
                                        settings={settings}
                                        cart={cart}
                                    />
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="table-view" className="flex-1 min-h-0 relative data-[state=active]:block">
                            <div className="absolute inset-0 flex flex-col">
                                <div className="flex flex-col md:flex-row gap-4 justify-end items-center flex-shrink-0 mt-4 mb-4">
                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                        {settings?.multiFloorEnabled && (settings.floors?.length ?? 0) > 0 && (
                                            <Select value={floorFilter} onValueChange={setFloorFilter}>
                                                <SelectTrigger className="w-full sm:w-[180px]">
                                                    <SelectValue placeholder="Filter by floor" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {settings.floors?.filter(f => f.toLowerCase() !== 'all floor').map(floor => (
                                                        <SelectItem key={floor} value={floor}>{floor}</SelectItem>
                                                    ))}
                                                    <SelectItem value="__none__">No Floor</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                        <Button variant="outline" className="h-12 w-12 shrink-0" onClick={handleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
                                            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                                        </Button>
                                        <Link href="/admin" passHref>
                                            <Button variant="outline" className="h-12 w-12 shrink-0" title="Exit POS">
                                                <Home className="h-5 w-5" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto -mr-4 pr-4 min-h-0">
                                    {selectedBranchId ? (
                                        <DraggableTableLayout
                                            branchId={selectedBranchId}
                                            floorFilter={floorFilter}
                                            onTableSelect={handleTableSelectFromLayout}
                                        />
                                    ) : (
                                        <p className="text-center text-muted-foreground p-8">Select a branch to see the table layout.</p>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="manage-orders" className="flex-1 min-h-0 relative data-[state=active]:block">
                            <div className="absolute inset-0 flex flex-col">
                                <div className="flex justify-end items-center gap-2 flex-shrink-0 mt-4 mb-4">
                                    <Button variant="outline" className="h-12 w-12 shrink-0" onClick={handleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
                                        {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                                    </Button>
                                    <Link href="/admin" passHref>
                                        <Button variant="outline" className="h-12 w-12 shrink-0" title="Exit POS">
                                            <Home className="h-5 w-5" />
                                        </Button>
                                    </Link>
                                </div>
                                {activeOrders.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <p className="text-muted-foreground">No active orders for this branch.</p>
                                    </div>
                                ) : (
                                    <div className="flex-1 overflow-y-auto -mr-4 pr-4 min-h-0">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                                            {activeOrders.map((order) => <ActiveOrderCard key={order.id} order={order} settings={settings} onUpdate={refreshActiveOrders} onEdit={handleEditOrder} restaurantId={restaurantId} startTransition={startTransition} />)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
                <div className="col-span-1 border-l border-gray-200 dark:border-gray-700 overflow-hidden min-h-0">
                    <POSCart
                        cart={cart}
                        settings={settings}
                        onUpdateQuantity={handleUpdateQuantity}
                        onPlaceOrder={handlePlaceOrder}
                        tables={tables}
                        orderType={orderType}
                        setOrderType={setOrderType}
                        customerName={customerName}
                        setCustomerName={setCustomerName}
                        customerPhone={customerPhone}
                        setCustomerPhone={setCustomerPhone}
                        tableId={tableId}
                        setTableId={setTableId}
                        address={address}
                        setAddress={setAddress}
                        platform={platform}
                        setPlatform={setPlatform}
                        takeAwayTime={takeAwayTime}
                        setTakeAwayTime={setTakeAwayTime}
                        orderToUpdate={orderToUpdate}
                        onClearEdit={handleClearEdit}
                        orderNotes={orderNotes}
                        setOrderNotes={setOrderNotes}
                        onItemNoteChange={handleItemNoteChange}
                        onInputDoubleClick={handleInputDoubleClick}
                        discount={discount}
                        setDiscount={setDiscount}
                        isSubmitting={isPending}
                    />
                </div>
            </div>
            {keyboardConfig.visible && (
                <OnScreenKeyboard
                    onClose={() => setKeyboardConfig({ visible: false, target: null })}
                    inputType={keyboardConfig.inputType}
                />
            )}
        </div>
    );
}

