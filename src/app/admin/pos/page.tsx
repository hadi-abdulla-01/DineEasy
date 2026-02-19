
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { MenuItem, RestaurantSettings, OrderItem, Order, Branch, Table, RemoteOrder, CustomerDetails, AddonOption, Discount } from '@/lib/definitions';
import { useRestaurantData } from '@/lib/client-data';
import { useAuth } from '../auth-provider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { placeholderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Label } from "@/components/ui/label"
import { LoaderCircle, PlusCircle, MinusCircle, Search, Globe, ShoppingBag, Utensils, ChevronRight, ChevronLeft, Beef, Leaf, Wine, Grid3x3, Drumstick, IceCream, DollarSign, CreditCard, Maximize, Minimize, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { createOrderAction } from "@/lib/actions";
import { Textarea } from '@/components/ui/textarea';
import { AddonDialog } from '@/components/addon-dialog';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


type OrderWithTable = Order & { table?: Table };
type RemoteOrderWithTable = RemoteOrder & { table?: Table };
type CombinedOrderWithTable = OrderWithTable | RemoteOrderWithTable;

const ScrollableContainer = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    useEffect(() => {
        checkScroll();
        const scrollElement = scrollRef.current;
        if (scrollElement) {
            scrollElement.addEventListener('scroll', checkScroll);
            window.addEventListener('resize', checkScroll);
            return () => {
                scrollElement.removeEventListener('scroll', checkScroll);
                window.removeEventListener('resize', checkScroll);
            };
        }
    }, [children]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 300;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="relative group">
            {canScrollLeft && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 shadow-lg rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Scroll left"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
            )}
            <div ref={scrollRef} className={cn("overflow-x-auto scrollbar-hide", className)}>
                {children}
            </div>
            {canScrollRight && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 shadow-lg rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Scroll right"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};

const CategoryButton = ({ icon, label, count, selected, onClick }: { icon: React.ReactNode, label: string, count: number, selected: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={cn(
            "flex items-center gap-2 p-2 rounded-lg transition-colors duration-200 border",
            selected
                ? 'bg-gray-800 text-white border-gray-800 dark:bg-gray-700 dark:border-gray-600'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 border-gray-200 dark:border-gray-700'
        )}
    >
        <div className={cn("w-6 h-6 flex items-center justify-center rounded-md", selected ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300')}>
            {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
        </div>
        <div className='text-left'>
            <span className="text-xs font-semibold">{label}</span>
            <p className={cn("text-[10px]", selected ? "text-white/70" : "text-muted-foreground")}>{count} items</p>
        </div>
    </button>
)

function POSMenuGrid({
    items,
    onAddToCart,
    onRemoveFromCart,
    getQuantity,
    settings,
    cart,
    discounts,
}: {
    items: MenuItem[],
    onAddToCart: (item: MenuItem) => void,
    onRemoveFromCart: (item: MenuItem) => void,
    getQuantity: (itemId: string) => number,
    settings: RestaurantSettings | null,
    cart: OrderItem[],
    discounts: Discount[],
}) {

    const getActiveDiscount = (item: MenuItem): Discount | null => {
        const now = new Date();
        const activeDiscounts = discounts.filter(d => {
            if (!d.isActive) return false;
            const startDate = d.startDate ? new Date(d.startDate) : null;
            const endDate = d.endDate ? new Date(d.endDate) : null;
            if (startDate && now < startDate) return false;
            if (endDate && now > endDate) return false;
            return true;
        });

        const itemDiscount = activeDiscounts.find(d => d.applicability === 'items' && d.applicableItems?.includes(item.id));
        if (itemDiscount) return itemDiscount;

        const categoryDiscount = activeDiscounts.find(d => d.applicability === 'categories' && d.applicableCategories?.includes(item.category));
        if (categoryDiscount) return categoryDiscount;

        return null;
    }


    if (!settings) {
        return <p>Loading settings...</p>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {items.map((item) => {
                const image = placeholderImages.find(p => p.id === item.imageId);
                const imageSrc = item.imageId?.startsWith('data:image') ? item.imageId : image?.imageUrl;
                const hasAddons = item.addonGroups && item.addonGroups.length > 0;
                const simpleItemQuantity = hasAddons ? 0 : cart.find(cartItem => cartItem.menuItemId === item.id)?.quantity || 0;
                const discount = getActiveDiscount(item);

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
                            {discount && discount.type === 'percentage' && (
                                <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                    -{discount.value}%
                                </div>
                            )}
                        </button>
                        <div className="p-3 text-left flex flex-col flex-grow justify-between">
                            <div>
                                <p className="text-sm font-semibold leading-tight text-gray-900 dark:text-gray-100 line-clamp-1">{item.name}</p>
                                <p className="text-sm text-primary font-bold mt-1">{settings.currencySymbol}{item.price.toFixed(settings.currencyDecimalPlaces)}</p>
                                <p className="text-xs text-muted-foreground mt-1 h-7 line-clamp-2">{item.description}</p>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                {simpleItemQuantity > 0 ? (
                                    <div className="flex items-center gap-2 w-full justify-between">
                                        <Button size="icon" variant="outline" className="h-7 w-7 rounded-full" onClick={() => onRemoveFromCart(item)}><MinusCircle className="h-4 w-4" /></Button>
                                        <span className="font-bold text-base w-8 text-center">{simpleItemQuantity}</span>
                                        <Button size="icon" variant="outline" className="h-7 w-7 rounded-full" onClick={() => onAddToCart(item)}><PlusCircle className="h-4 w-4" /></Button>
                                    </div>
                                ) : (
                                    <Button size="sm" variant="outline" className="w-full text-primary border-primary/50 hover:bg-primary/5 hover:text-primary h-8" onClick={() => onAddToCart(item)}>
                                        {hasAddons ? 'Customize' : 'Add to cart'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}

function POSCart({
    cart,
    menuItems,
    settings,
    onUpdateQuantity,
    onProceedToPayment,
    onSplitBill,
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
    onClearCart,
    orderNotes,
    setOrderNotes,
    discount,
    setDiscount,
    isSubmitting,
}: {
    cart: OrderItem[];
    menuItems: MenuItem[];
    settings: RestaurantSettings | null;
    onUpdateQuantity: (orderItemId: string, newQuantity: number) => void;
    onProceedToPayment: () => void;
    onSplitBill: () => void;
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
    onClearCart: () => void;
    orderNotes: string;
    setOrderNotes: (notes: string) => void;
    discount: number;
    setDiscount: (d: number) => void;
    isSubmitting: boolean;
}) {
    const handleOrderTypeChange = (newOrderType: 'Dine-in' | 'Take-away' | 'Online') => {
        if (orderToUpdate) {
            if (window.confirm('You are editing an order. Do you want to discard the changes and start a new order?')) {
                onClearCart();
                setOrderType(newOrderType);
            }
        } else {
            setOrderType(newOrderType);
        }
    };


    if (!settings) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Loading cart...</p>
            </div>
        );
    }
    const currencySymbol = settings.currencySymbol || '₹';
    const currencyDecimalPlaces = settings.currencyDecimalPlaces ?? 2;

    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const taxes = (settings.taxes || []).map(tax => ({
        ...tax,
        amount: subtotal * (tax.rate / 100)
    }));
    const totalTaxAmount = taxes.reduce((acc, tax) => acc + tax.amount, 0);
    const discountAmount = subtotal * (discount / 100);
    const total = subtotal - discountAmount + totalTaxAmount;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border-gray-200 dark:border-gray-700 h-full flex flex-col">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {orderToUpdate ? `Edit Order #${orderToUpdate.id.slice(-6)}` : 'Cart Details'}
                </h2>
            </div>

            <div className="p-3 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                    <Label
                        onClick={() => handleOrderTypeChange('Dine-in')}
                        className={cn(
                            "border rounded-md p-2 flex items-center justify-center gap-2 text-center text-sm h-10 transition-colors cursor-pointer hover:bg-accent",
                            orderType === 'Dine-in' && "bg-gray-800 text-white border-gray-800 dark:bg-gray-700 dark:border-gray-600",
                        )}
                    >
                        <Utensils className="h-4 w-4" />
                        Dine in
                    </Label>
                    <Label
                        onClick={() => handleOrderTypeChange('Take-away')}
                        className={cn(
                            "border rounded-md p-2 flex items-center justify-center gap-2 text-center text-sm h-10 transition-colors cursor-pointer hover:bg-accent",
                            orderType === 'Take-away' && "bg-gray-800 text-white border-gray-800 dark:bg-gray-700 dark:border-gray-600",
                        )}
                    >
                        <ShoppingBag className="h-4 w-4" />
                        Takeaway
                    </Label>
                    <Label
                        onClick={() => handleOrderTypeChange('Online')}
                        className={cn(
                            "border rounded-md p-2 flex items-center justify-center gap-2 text-center text-sm h-10 transition-colors cursor-pointer hover:bg-accent",
                            orderType === 'Online' && "bg-gray-800 text-white border-gray-800 dark:bg-gray-700 dark:border-gray-600",
                        )}
                    >
                        <Globe className="h-4 w-4" />
                        Delivery
                    </Label>
                </div>

                <h3 className='font-medium text-sm pt-1'>Customer Information</h3>
                <div className='space-y-2'>
                    <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" className="h-9" />
                    {orderType === 'Dine-in' && (
                        <Select value={tableId} onValueChange={setTableId}>
                            <SelectTrigger id="tableId-select" className="h-9"><SelectValue placeholder="Select table location" /></SelectTrigger>
                            <SelectContent>{tables.map(table => <SelectItem key={table.id} value={table.id}>Table {table.number}{table.floor ? ` (${table.floor})` : ''}</SelectItem>)}</SelectContent>
                        </Select>
                    )}
                    {(orderType === 'Take-away' || orderType === 'Online') && (
                        <Input id="customerPhone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Customer phone" className="h-9" />
                    )}
                    {orderType === 'Take-away' && (
                        <Input id="takeAwayTime" value={takeAwayTime} onChange={(e) => setTakeAwayTime(e.target.value)} placeholder="Pickup time" type="time" className="h-9" />
                    )}
                    {orderType === 'Online' && (
                        <>
                            <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery address" className="h-20" />
                            {settings.onlineOrderPlatforms && settings.onlineOrderPlatforms.length > 0 && (
                                <Select value={platform} onValueChange={setPlatform}>
                                    <SelectTrigger id="platform-select" className="h-9"><SelectValue placeholder="Select platform" /></SelectTrigger>
                                    <SelectContent>{settings.onlineOrderPlatforms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                </Select>
                            )}
                        </>
                    )}
                </div>
            </div>

            <Separator />

            <div className='p-3'>
                <div className='flex justify-between items-center'>
                    <h3 className='font-medium text-sm'>Order Items</h3>
                    <Button variant='link' className='text-primary p-0 h-auto text-xs' onClick={onClearCart}>Clear all</Button>
                </div>
            </div>

            <ScrollArea className="flex-1 px-3">
                <div className="space-y-3">
                    {cart.length === 0 ? (
                        <p className="text-muted-foreground text-center text-sm pt-8">Your cart is empty.</p>
                    ) : (
                        cart.map((item, index) => {
                            const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
                            const image = placeholderImages.find(p => p.id === menuItem?.imageId);
                            const imageSrc = menuItem?.imageId?.startsWith('data:image') ? menuItem.imageId : image?.imageUrl;

                            return (
                                <div key={item.orderItemId ?? index} className="flex items-start gap-2">
                                    <div className='relative w-12 h-12 rounded-md overflow-hidden shrink-0 bg-muted'>
                                        {imageSrc && <Image src={imageSrc} alt={item.name} fill className="object-cover" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                                        <p className="font-bold text-xs text-primary mt-0.5">{currencySymbol}{(item.price * item.quantity).toFixed(currencyDecimalPlaces)}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-full p-0.5">
                                        <button onClick={() => onUpdateQuantity(item.orderItemId, item.quantity - 1)} className="hover:text-primary disabled:opacity-50" disabled={item.quantity <= 1}><MinusCircle className="h-5 w-5" /></button>
                                        <span className="w-5 text-center font-bold text-sm">{item.quantity}</span>
                                        <button onClick={() => onUpdateQuantity(item.orderItemId, item.quantity + 1)} className="hover:text-primary"><PlusCircle className="h-5 w-5" /></button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>

            <div className="p-3 mt-auto border-t border-gray-200 dark:border-gray-700 space-y-2">
                <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span>Sub total</span><span className='font-mono'>{currencySymbol}{subtotal.toFixed(currencyDecimalPlaces)}</span></div>
                    <div className="flex justify-between items-center">
                        <span>Discount (%)</span>
                        <Input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-20 h-7 text-right" />
                    </div>
                    {discount > 0 && <div className="flex justify-between text-destructive"><span>Discount Amount</span><span className='font-mono'>-{currencySymbol}{discountAmount.toFixed(currencyDecimalPlaces)}</span></div>}
                    {taxes.map(tax => <div key={tax.id} className="flex justify-between"><span>{tax.name} ({tax.rate}%)</span><span className='font-mono'>{currencySymbol}{tax.amount.toFixed(currencyDecimalPlaces)}</span></div>)}
                </div>
                <div className="flex justify-between font-bold text-sm border-t pt-2 mt-2"><span>Total amount</span><span className='font-mono'>{currencySymbol}{total.toFixed(currencyDecimalPlaces)}</span></div>
                
                <div className="grid grid-cols-2 gap-2">
                    {orderType === 'Dine-in' && (
                        <Button variant="outline" className="w-full" size="default" onClick={onSplitBill} disabled={cart.length === 0 || isSubmitting}>
                            Split Bill
                        </Button>
                    )}
                    <Button className={cn("w-full bg-orange-500 hover:bg-orange-600 text-white", orderType !== 'Dine-in' && 'col-span-2')} size="default" onClick={onProceedToPayment} disabled={cart.length === 0 || isSubmitting}>
                        {isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Proceed Payment'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function OrderQueueCard({ order, onEdit }: { order: CombinedOrderWithTable, onEdit: (order: CombinedOrderWithTable) => void }) {
    const readyItems = order.items.filter(i => i.isReady).length;
    const totalItems = order.items.length;
    const progress = totalItems > 0 ? (readyItems / totalItems) * 100 : 0;

    return (
        <Card onClick={() => onEdit(order)} className="min-w-[240px] w-60 flex-shrink-0 cursor-pointer transition-all hover:shadow-lg hover:border-primary bg-white dark:bg-gray-800">
            <CardContent className="p-3 space-y-2">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-primary text-sm">{order.invoiceNumber || `#${order.id.slice(-6)}`}</p>
                        <p className="font-bold text-gray-800 dark:text-gray-100">{order.customerName || order.customerDetails?.name}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(order.createdAt), 'dd-MM-yyyy, hh:mm a')}</p>
                    </div>
                    <div className="text-right">
                        <div className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-xs font-semibold dark:bg-orange-900/50 dark:text-orange-300">
                            Table {order.table?.number || "N/A"}
                        </div>
                    </div>
                </div>

                <div className='flex items-center justify-between text-xs'>
                    <div className='flex items-center gap-2'>
                        <Progress value={progress} className="w-16 h-1.5" />
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{Math.round(progress)}%</span>
                        <span className="text-muted-foreground">On cooking</span>
                    </div>
                    <span className="text-muted-foreground flex items-center">{order.items.length} items <ChevronRight className="h-3 w-3" /></span>
                </div>
            </CardContent>
        </Card>
    )
}

function PaymentSheet({
    isOpen,
    onOpenChange,
    order,
    settings,
    onFinalizePayment,
    isFinalizing
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    order: any; // Temporary order object
    settings: RestaurantSettings | null;
    onFinalizePayment: (paymentMethod: 'cash' | 'card') => void;
    isFinalizing: boolean;
}) {
    const [paymentMode, setPaymentMode] = useState<'cash' | 'card'>('cash');
    const [cashReceived, setCashReceived] = useState<number | string>('');

    useEffect(() => {
        if (isOpen) {
            setCashReceived('');
            setPaymentMode('cash');
        }
    }, [isOpen]);

    if (!order || !settings) return null;

    const currencySymbol = settings.currencySymbol || '$';
    const currencyDecimalPlaces = settings.currencyDecimalPlaces ?? 2;
    const denominations = settings.posSettings?.cashDenominations || [10, 20, 50, 100];

    const changeDue = (typeof cashReceived === 'number' && cashReceived >= order.total)
        ? cashReceived - order.total
        : 0;

    const handleDenominationClick = (amount: number) => {
        setCashReceived(current => (Number(current) || 0) + amount);
    }

    const handleFinalize = () => {
        onFinalizePayment(paymentMode);
    }

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md flex flex-col">
                <SheetHeader>
                    <SheetTitle className="font-headline text-2xl">Process Payment</SheetTitle>
                    <SheetDescription>Finalize the order for {order.customerName}.</SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto pr-2">
                    <Card className="my-4">
                        <CardHeader>
                            <CardTitle className="font-headline">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">{currencySymbol}{order.subtotal.toFixed(currencyDecimalPlaces)}</span></div>
                            {order.discount > 0 && <div className="flex justify-between text-destructive"><span>Discount</span><span className="font-mono">-{currencySymbol}{order.discount.toFixed(currencyDecimalPlaces)}</span></div>}
                            {order.taxes.map((tax: any) => <div key={tax.id} className="flex justify-between"><span>{tax.name} ({tax.rate}%)</span><span className='font-mono'>{currencySymbol}{tax.amount.toFixed(currencyDecimalPlaces)}</span></div>)}
                            <Separator />
                            <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="font-mono">{currencySymbol}{order.total.toFixed(currencyDecimalPlaces)}</span></div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <Label className="text-base">Payment Mode</Label>
                        <RadioGroup value={paymentMode} onValueChange={(value: 'cash' | 'card') => setPaymentMode(value)} className="grid grid-cols-2 gap-4">
                            <div>
                                <RadioGroupItem value="cash" id="cash" className="peer sr-only" />
                                <Label htmlFor="cash" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    <DollarSign className="mb-3 h-6 w-6" /> Cash
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="card" id="card" className="peer sr-only" />
                                <Label htmlFor="card" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    <CreditCard className="mb-3 h-6 w-6" /> Card/Other
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {paymentMode === 'cash' && (
                        <div className="space-y-4 rounded-lg border bg-muted/50 p-4 mt-4">
                            <h4 className="font-semibold">Cash Payment</h4>
                            <div className="space-y-2">
                                <Label htmlFor="cashReceived">Cash Received</Label>
                                <div className="relative">
                                    <span className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground">{currencySymbol}</span>
                                    <Input
                                        id="cashReceived" type="number" step="0.01" placeholder="0.00"
                                        value={cashReceived}
                                        onChange={(e) => setCashReceived(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                        className="pl-6"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {denominations.map(denom => (
                                    <Button key={denom} type="button" variant="secondary" onClick={() => handleDenominationClick(denom)}>
                                        +{denom}
                                    </Button>
                                ))}
                            </div>
                            <div className="flex justify-between items-center rounded-md bg-background p-3">
                                <span className="font-medium text-muted-foreground">Change Due</span>
                                <span className="text-xl font-bold font-mono">{currencySymbol}{changeDue.toFixed(currencyDecimalPlaces)}</span>
                            </div>
                        </div>
                    )}
                </div>
                <SheetFooter className="mt-auto pt-4 border-t">
                    <Button type="button" className="w-full" size="lg" onClick={handleFinalize} disabled={isFinalizing}>
                        {isFinalizing ? <LoaderCircle className="animate-spin" /> : 'Finalize & Complete Order'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

function SplitBillDialog({ open, onOpenChange, order, settings }: { open: boolean, onOpenChange: (open: boolean) => void, order: any, settings: RestaurantSettings | null }) {
    const [tab, setTab] = useState<'evenly' | 'items'>('evenly');
    const [numEvenSplits, setNumEvenSplits] = useState(2);
    const [numItemSplits, setNumItemSplits] = useState(2);
    const [itemAssignments, setItemAssignments] = useState<Record<string, number>>({});

    useEffect(() => {
        if (order) {
            const initialAssignments: Record<string, number> = {};
            order.items.forEach((item: OrderItem) => {
                initialAssignments[item.orderItemId] = 0; // 0 for unassigned
            });
            setItemAssignments(initialAssignments);
        }
    }, [order]);

    const itemSplitBills = useMemo(() => {
        const bills = Array.from({ length: numItemSplits }, () => ({ items: [] as OrderItem[], total: 0 }));
        let unassignedTotal = 0;
        const unassignedItems: OrderItem[] = [];

        if (order) {
            order.items.forEach((item: OrderItem) => {
                const assignedBillIndex = itemAssignments[item.orderItemId];
                if (assignedBillIndex > 0 && assignedBillIndex <= numItemSplits) {
                    bills[assignedBillIndex - 1].items.push(item);
                    bills[assignedBillIndex - 1].total += item.price * item.quantity;
                } else {
                    unassignedItems.push(item);
                    unassignedTotal += item.price * item.quantity;
                }
            });
        }
        return { bills, unassignedItems, unassignedTotal };
    }, [itemAssignments, numItemSplits, order]);

    if (!order || !settings) return null;

    const currencySymbol = settings.currencySymbol || '$';
    const currencyDecimalPlaces = settings.currencyDecimalPlaces ?? 2;

    const handleAssignItem = (orderItemId: string, billIndex: number) => {
        setItemAssignments(prev => ({ ...prev, [orderItemId]: billIndex }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Split Bill for Order #{order.invoiceNumber || order.id.slice(-6)}</DialogTitle>
                    <DialogDescription>
                        Total amount to split: <span className="font-bold">{currencySymbol}{order.total.toFixed(currencyDecimalPlaces)}</span>
                    </DialogDescription>
                </DialogHeader>
                <Tabs value={tab} onValueChange={(value) => setTab(value as 'evenly' | 'items')} className="flex-1 flex flex-col min-h-0">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="evenly">Split Evenly</TabsTrigger>
                        <TabsTrigger value="items">Split By Item</TabsTrigger>
                    </TabsList>
                    <TabsContent value="evenly" className="flex-1 flex flex-col items-center justify-center gap-6">
                        <div className="flex items-center gap-4">
                            <Label htmlFor="numEvenSplits" className="text-lg">Split into</Label>
                            <Input
                                id="numEvenSplits"
                                type="number"
                                min="2"
                                value={numEvenSplits}
                                onChange={(e) => setNumEvenSplits(Math.max(2, parseInt(e.target.value) || 2))}
                                className="w-24 text-lg text-center"
                            />
                            <span className="text-lg">ways</span>
                        </div>
                        <div className="text-center">
                            <p className="text-muted-foreground">Each person pays</p>
                            <p className="text-4xl font-bold font-mono">{currencySymbol}{(order.total / numEvenSplits).toFixed(currencyDecimalPlaces)}</p>
                        </div>
                    </TabsContent>
                    <TabsContent value="items" className="flex-1 flex flex-col min-h-0">
                        <div className="flex items-center gap-4 my-4">
                            <Label htmlFor="numItemSplits">Number of Bills</Label>
                            <Input
                                id="numItemSplits"
                                type="number"
                                min="2"
                                value={numItemSplits}
                                onChange={(e) => setNumItemSplits(Math.max(2, parseInt(e.target.value) || 2))}
                                className="w-20"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
                            <Card className="flex flex-col">
                                <CardHeader><CardTitle className="text-base">Order Items</CardTitle></CardHeader>
                                <CardContent className="flex-1 overflow-y-auto">
                                    <ScrollArea className="h-full pr-4">
                                        <div className="space-y-3">
                                            {order.items.map((item: OrderItem) => (
                                                <div key={item.orderItemId} className="flex justify-between items-center text-sm">
                                                    <span className="flex-1">{item.quantity}x {item.name}</span>
                                                    <Select
                                                        value={String(itemAssignments[item.orderItemId] || 0)}
                                                        onValueChange={(value) => handleAssignItem(item.orderItemId, parseInt(value))}
                                                    >
                                                        <SelectTrigger className="w-28 h-8 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="0">Unassigned</SelectItem>
                                                            {Array.from({ length: numItemSplits }, (_, i) => i + 1).map(n => (
                                                                <SelectItem key={n} value={String(n)}>Bill {n}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                            <ScrollArea className="h-full">
                            <div className="space-y-4">
                                {itemSplitBills.bills.map((bill, index) => (
                                    <Card key={index}>
                                        <CardHeader className="flex-row justify-between items-center pb-2">
                                            <CardTitle className="text-base">Bill {index + 1}</CardTitle>
                                            <p className="font-mono font-bold">{currencySymbol}{bill.total.toFixed(currencyDecimalPlaces)}</p>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="text-xs text-muted-foreground space-y-1">
                                                {bill.items.map(item => <li key={item.orderItemId}>{item.quantity}x {item.name}</li>)}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                ))}
                                 {itemSplitBills.unassignedItems.length > 0 && (
                                     <Card className="border-dashed">
                                        <CardHeader className="flex-row justify-between items-center pb-2">
                                            <CardTitle className="text-base text-muted-foreground">Unassigned</CardTitle>
                                            <p className="font-mono font-bold">{currencySymbol}{itemSplitBills.unassignedTotal.toFixed(currencyDecimalPlaces)}</p>
                                        </CardHeader>
                                        <CardContent>
                                             <ul className="text-xs text-muted-foreground space-y-1">
                                                {itemSplitBills.unassignedItems.map(item => <li key={item.orderItemId}>{item.quantity}x {item.name}</li>)}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                 )}
                            </div>
                            </ScrollArea>
                        </div>
                    </TabsContent>
                </Tabs>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function POSPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { getMenuItems, getSettings, getBranches, getTables, restaurantId, getActiveOrders, updateFullOrder, getMainBranch, getTableById, getDiscounts } = useRestaurantData();
    const [isPending, startTransition] = useTransition();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(undefined);
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All menu');
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [orderToUpdate, setOrderToUpdate] = useState<CombinedOrderWithTable | null>(null);
    const [orderType, setOrderType] = useState<'Dine-in' | 'Take-away' | 'Online'>('Dine-in');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [tableId, setTableId] = useState('');
    const [address, setAddress] = useState('');
    const [platform, setPlatform] = useState('');
    const [takeAwayTime, setTakeAwayTime] = useState('');
    const [orderNotes, setOrderNotes] = useState('');
    const [activeOrders, setActiveOrders] = useState<CombinedOrderWithTable[]>([]);
    const { toast } = useToast();
    const isGlobalAdmin = (user?.role === 'Admin' && !user?.branchId) || user?.username?.toLowerCase() === 'admin';
    const [selectedItemForAddons, setSelectedItemForAddons] = useState<MenuItem | null>(null);

    const [discount, setDiscount] = useState(0);
    const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
    const [orderToPay, setOrderToPay] = useState<any>(null);
    const [orderToSplit, setOrderToSplit] = useState<any>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const fetchStaticData = useCallback(async () => {
        if (!selectedBranchId || !restaurantId) return;
        setIsLoading(true);
        try {
            const [fetchedMenuItems, fetchedSettings, fetchedTables, fetchedDiscounts] = await Promise.all([
                getMenuItems(selectedBranchId),
                getSettings(selectedBranchId),
                getTables(selectedBranchId),
                getDiscounts(selectedBranchId),
            ]);
            setMenuItems(fetchedMenuItems);
            setSettings(fetchedSettings);
            setTables(fetchedTables);
            setDiscounts(fetchedDiscounts);
        } catch (error) {
            console.error("Failed to fetch initial POS data:", error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to load core POS data." });
        } finally {
            setIsLoading(false);
        }
    }, [selectedBranchId, restaurantId, getMenuItems, getSettings, getTables, getDiscounts, toast]);

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
            fetchStaticData();
            refreshActiveOrders();
            const interval = setInterval(refreshActiveOrders, 10000);
            return () => clearInterval(interval);
        }
    }, [selectedBranchId, fetchStaticData, refreshActiveOrders]);

    // Listen for fullscreen changes (e.g., when user presses F11)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);


    const handleClearCart = useCallback(() => {
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
    }, [settings]);

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

        const currentDiscount = order.discount && order.subtotal > 0
            ? (order.discount / order.subtotal) * 100
            : 0;
        setDiscount(currentDiscount);

        toast({ title: "Editing Order", description: `Order #${order.invoiceNumber || order.id.slice(-6)} loaded into cart.` });
    };

    const getAddonCombinationId = (selectedAddons?: Record<string, AddonOption>): string => {
        if (!selectedAddons || Object.keys(selectedAddons).length === 0) return 'base';
        return Object.keys(selectedAddons).sort().map(groupId => `${groupId}:${selectedAddons[groupId].id}`).join(';');
    };

    const handleAddToCartWithAddons = (menuItem: MenuItem, selectedAddons?: Record<string, AddonOption>) => {
        const addonId = getAddonCombinationId(selectedAddons);
        const orderItemId = `${menuItem.id}-${addonId}`;

        setCart((prevCart) => {
            const existingItem = prevCart.find(item => item.orderItemId === orderItemId);
            if (existingItem) {
                return prevCart.map(item => item.orderItemId === orderItemId ? { ...item, quantity: item.quantity + 1 } : item);
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
                const newOrderItem: OrderItem = { orderItemId, menuItemId: menuItem.id, name: menuItem.name, price: menuItem.price + addonPrice, quantity: 1, category: menuItem.category, isReady: false, status: 'active', notes };
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

    const handleSimpleRemoveFromCart = (menuItem: MenuItem) => {
        const orderItemId = `${menuItem.id}-base`;
        const existingItem = cart.find(item => item.orderItemId === orderItemId);

        if (existingItem) {
            if (existingItem.quantity > 1) {
                setCart(prev => prev.map(item =>
                    item.orderItemId === orderItemId
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                ));
            } else {
                setCart(prev => prev.filter(item => item.orderItemId !== orderItemId));
            }
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
        return cart.filter(item => item.menuItemId === menuItemId).reduce((sum, item) => sum + item.quantity, 0);
    };

    const prepareOrderObject = () => {
        if (!settings) return null;

        const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const discountAmount = subtotal * (discount / 100);
        const taxes = (settings.taxes || []).map(tax => ({
            ...tax,
            amount: (subtotal - discountAmount) * (tax.rate / 100)
        }));
        const totalTaxAmount = taxes.reduce((acc, tax) => acc + tax.amount, 0);
        const total = subtotal - discountAmount + totalTaxAmount;

        return {
            id: orderToUpdate ? orderToUpdate.id : 'new-order',
            invoiceNumber: orderToUpdate?.invoiceNumber,
            items: cart,
            subtotal,
            taxes,
            totalTaxAmount,
            discount: discountAmount,
            total,
            orderType,
            customerName: customerName || 'Customer',
            customerPhone: customerPhone || 'N/A',
            tableId: orderType === 'Dine-in' ? tableId : undefined,
            address: orderType === 'Online' ? address : undefined,
            platform: orderType === 'Online' ? platform : undefined,
            takeAwayTime: orderType === 'Take-away' ? takeAwayTime : undefined,
            notes: orderNotes,
        };
    }

    const handleProceedToPayment = () => {
        const tempOrder = prepareOrderObject();
        if (tempOrder) {
            setOrderToPay(tempOrder);
            setIsPaymentSheetOpen(true);
        }
    };
    
    const handleOpenSplitDialog = () => {
        const tempOrder = prepareOrderObject();
        if (tempOrder) {
            setOrderToSplit(tempOrder);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                setIsFullscreen(true);
            }).catch((err) => {
                console.error('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen().then(() => {
                setIsFullscreen(false);
            }).catch((err) => {
                console.error('Error attempting to exit fullscreen:', err);
            });
        }
    };

    const handleExitToDashboard = () => {
        router.push('/admin/');
    };

    const handleFinalizePayment = (paymentMethod: 'cash' | 'card') => {
        if (!selectedBranchId || !user || !restaurantId || isPending || !orderToPay) return;

        startTransition(async () => {
            try {
                if (orderToUpdate) {
                    await updateFullOrder(orderToUpdate.id, orderToUpdate.orderType as any, {
                        items: orderToPay.items,
                        notes: orderToPay.notes,
                        customerName: orderToPay.customerName,
                        customerPhone: orderToPay.customerPhone,
                        tableId: orderToPay.tableId,
                        address: orderToPay.address,
                        platform: orderToPay.platform,
                        takeAwayTime: orderToPay.takeAwayTime,
                        paymentMethod,
                        discount: orderToPay.discount,
                    });
                    toast({ title: "Success", description: "Order updated successfully." });
                } else {
                    const orderPayload: any = {
                        branchId: selectedBranchId,
                        customerName: orderToPay.customerName,
                        customerPhone: orderToPay.customerPhone,
                        items: orderToPay.items,
                        orderType: orderToPay.orderType,
                        notes: orderToPay.notes,
                        createdByName: user.username,
                        discount: orderToPay.discount,
                        paymentMethod
                    };
                    if (orderType === 'Dine-in') {
                        if (!tableId) {
                            toast({ variant: 'destructive', title: "Error", description: "Table is required for Dine-in orders." });
                            return;
                        }
                        const selectedTable = tables.find(t => t.id === tableId);
                        orderPayload.tableId = tableId;
                        if (!orderPayload.customerName) orderPayload.customerName = `Table ${selectedTable?.number || ''}`;
                    }
                    if (orderType === 'Take-away') orderPayload.takeAwayTime = takeAwayTime;
                    if (orderType === 'Online') orderPayload.customerDetails = { name: orderToPay.customerName, phone: orderToPay.customerPhone, address: orderToPay.address, platform: orderToPay.platform };

                    await createOrderAction(orderPayload, restaurantId);
                    toast({ title: "Success", description: "Order placed successfully." });
                }
                setIsPaymentSheetOpen(false);
                setOrderToPay(null);
                handleClearCart();
                refreshActiveOrders();
            } catch (error: any) {
                toast({ variant: 'destructive', title: "Order Failed", description: error.message || "Could not place order." });
            }
        });
    };

    const categories = useMemo(() => {
        const itemCounts: Record<string, number> = {};
        menuItems.forEach(item => {
            if (item.category) {
                itemCounts[item.category] = (itemCounts[item.category] || 0) + 1;
            }
        });
        const allCount = menuItems.length;
        const sortedCategories = Object.keys(itemCounts).sort();
        return [{ name: 'All menu', count: allCount }, ...sortedCategories.map(name => ({ name, count: itemCounts[name] }))];
    }, [menuItems]);

    const filteredMenu = useMemo(() => menuItems.filter(item =>
        item.isAvailable &&
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedCategory === "All menu" || item.category === selectedCategory)
    ), [menuItems, searchTerm, selectedCategory]);

    // Function to get icon based on category name (case-insensitive and keyword matching)
    const getCategoryIcon = (categoryName: string): React.ReactNode => {
        const name = categoryName.toLowerCase();

        // Exact matches first
        const exactIcons: Record<string, React.ReactNode> = {
            'all menu': <Grid3x3 />,
            'all': <Grid3x3 />,
        };

        if (exactIcons[name]) return exactIcons[name];

        // Keyword-based matching
        if (name.includes('burger')) return <Beef />;
        if (name.includes('sandwich') || name.includes('sandwish')) return <Utensils />;
        if (name.includes('salad') || name.includes('veg')) return <Leaf />;
        if (name.includes('chicken') || name.includes('meat') || name.includes('beef') || name.includes('steak')) return <Drumstick />;
        if (name.includes('juice') || name.includes('drink') || name.includes('beverage') || name.includes('smoothie')) return <Wine />;
        if (name.includes('dessert') || name.includes('sweet') || name.includes('ice cream') || name.includes('cake')) return <IceCream />;
        if (name.includes('pizza')) return <Beef />;
        if (name.includes('pasta') || name.includes('noodle')) return <Utensils />;
        if (name.includes('soup')) return <Utensils />;
        if (name.includes('appetizer') || name.includes('starter')) return <Utensils />;

        // Default fallback
        return <Utensils />;
    };

    if (isLoading) return <div className="flex h-full items-center justify-center"><LoaderCircle className="h-10 w-10 animate-spin text-muted-foreground" /></div>;
    if (!settings) return <div className="flex h-full items-center justify-center p-4"><Card><CardContent><p>Select a branch to get started.</p>{isGlobalAdmin && <Select value={selectedBranchId} onValueChange={setSelectedBranchId}><SelectTrigger><SelectValue placeholder="Select a branch" /></SelectTrigger><SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select>}</CardContent></Card></div >;

    return (
        <div className="bg-slate-50 dark:bg-gray-950 h-screen overflow-hidden flex flex-col p-2">
            {selectedItemForAddons && (
                <AddonDialog item={selectedItemForAddons} open={!!selectedItemForAddons} onOpenChange={(isOpen) => !isOpen && setSelectedItemForAddons(null)} onAddToCart={handleAddToCartWithAddons} settings={settings} />
            )}
            {orderToSplit && (
                <SplitBillDialog
                    open={!!orderToSplit}
                    onOpenChange={() => setOrderToSplit(null)}
                    order={orderToSplit}
                    settings={settings}
                />
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 flex-1 min-h-0 gap-2 overflow-hidden">
                <main className="lg:col-span-2 flex flex-col overflow-hidden min-h-0">
                    <header className='space-y-3 mb-3'>
                        <p className='text-muted-foreground text-sm'>Dashboard / Overview / <span className='text-foreground font-semibold'>Recent orders {activeOrders.length}</span></p>
                        <div className='flex justify-between items-center'>
                            <h1 className='text-xl font-bold'>Order Queues</h1>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant='outline'
                                    size="sm"
                                    onClick={toggleFullscreen}
                                    title={isFullscreen ? "Exit Fullscreen (F11)" : "Enter Fullscreen (F11)"}
                                >
                                    {isFullscreen ? <Minimize className='w-4 h-4' /> : <Maximize className='w-4 h-4' />}
                                </Button>
                                <Button
                                    variant='outline'
                                    size="sm"
                                    onClick={handleExitToDashboard}
                                    title="Exit to Dashboard"
                                >
                                    <X className='w-4 h-4' />
                                </Button>
                            </div>
                        </div>
                    </header>
                    <ScrollableContainer className="pb-3">
                        <div className="flex gap-3">
                            {activeOrders.map(order => <OrderQueueCard key={order.id} order={order} onEdit={handleEditOrder} />)}
                        </div>
                    </ScrollableContainer>

                    <div className='flex justify-between items-center mt-4 mb-3'>
                        <h1 className='text-xl font-bold'>Product Lists</h1>
                        <div className="relative w-full md:max-w-xs">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search for food..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 bg-white dark:bg-gray-800 h-9" />
                        </div>
                    </div>
                    <ScrollableContainer className="pb-3">
                        <div className='flex gap-2'>
                            {categories.map(({ name, count }) => <CategoryButton key={name} label={name} count={count} selected={selectedCategory === name} onClick={() => setSelectedCategory(name)} icon={getCategoryIcon(name)} />)}
                        </div>
                    </ScrollableContainer>
                    <ScrollArea className='flex-1 -mx-2'>
                        <div className='px-2'>
                            <POSMenuGrid items={filteredMenu} onAddToCart={handleSimpleAddToCart} onRemoveFromCart={handleSimpleRemoveFromCart} getQuantity={getQuantity} settings={settings} cart={cart} discounts={discounts} />
                        </div>
                    </ScrollArea>
                </main>
                <aside className="col-span-1 overflow-hidden min-h-0">
                    <POSCart
                        cart={cart}
                        menuItems={menuItems}
                        settings={settings}
                        onUpdateQuantity={handleUpdateQuantity}
                        onProceedToPayment={handleProceedToPayment}
                        onSplitBill={handleOpenSplitDialog}
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
                        onClearCart={handleClearCart}
                        orderNotes={orderNotes}
                        setOrderNotes={setOrderNotes}
                        discount={discount}
                        setDiscount={setDiscount}
                        isSubmitting={isPending}
                    />
                </aside>
            </div>
            {orderToPay && (
                <PaymentSheet
                    isOpen={isPaymentSheetOpen}
                    onOpenChange={setIsPaymentSheetOpen}
                    order={orderToPay}
                    settings={settings}
                    onFinalizePayment={handleFinalizePayment}
                    isFinalizing={isPending}
                />
            )}
        </div>
    );
}
