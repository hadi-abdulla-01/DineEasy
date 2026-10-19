'use client';

import { useState, useRef } from 'react';
import type { Order, OrderItem, RestaurantSettings } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ShoppingCart, Trash2, LoaderCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { placeOrder } from '@/lib/actions';
import { ScrollArea } from './ui/scroll-area';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/app/admin/auth-provider';

type CartSheetProps = {
  cart: OrderItem[];
  tableId: string;
  isCustomerFacing: boolean;
  onRemoveFromCart: (orderItemId: string) => void;
  onNotesChange: (orderItemId: string, notes: string) => void;
  onOrderPlaced: () => void;
  existingOrder?: Order;
  branchId?: string;
  settings: RestaurantSettings | null;
  customerInfo?: { name: string, phone: string };
  restaurantId?: string;
};

export function CartSheet({
  cart, tableId, isCustomerFacing, onRemoveFromCart, onNotesChange,
  onOrderPlaced, existingOrder, branchId, settings, customerInfo, restaurantId
}: CartSheetProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  // Prevent double-submit
  const isSubmitting = useRef(false);

  // Notes state lives here so it persists while sheet is open
  const [orderNotes, setOrderNotes] = useState('');
  const [adminCustomerName, setAdminCustomerName] = useState('');
  const [adminCustomerPhone, setAdminCustomerPhone] = useState('');

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (isSubmitting.current || !settings) return;
    isSubmitting.current = true;
    setIsPlacing(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.set('tableId', tableId);
      formData.set('items', JSON.stringify(cart));
      formData.set('isCustomerFacing', String(isCustomerFacing));
      formData.set('orderNotes', orderNotes);
      if (existingOrder?.id) formData.set('existingOrderId', existingOrder.id);
      if (branchId) formData.set('branchId', branchId);
      if (restaurantId) formData.set('restaurantId', restaurantId);
      if (user?.id) formData.set('createdBy', user.id);

      if (isCustomerFacing) {
        formData.set('customerName', customerInfo?.name || '');
        formData.set('customerPhone', customerInfo?.phone || '');
      } else {
        formData.set('customerName', adminCustomerName);
        formData.set('customerPhone', adminCustomerPhone);
      }

      const result = await placeOrder(null, formData);

      if (result?.success && result.orderId) {
        onOrderPlaced();
        setOpen(false);
        setOrderNotes('');
        setAdminCustomerName('');
        setAdminCustomerPhone('');

        if (isCustomerFacing) {
          // Instant client-side navigation — no server redirect overhead
          router.replace(`/order/${tableId}/status/${result.orderId}?restaurantId=${restaurantId}`);
        } else {
          toast({ title: 'Order Placed!', description: 'The order has been sent to the kitchen.' });
          router.push('/admin/table-order');
        }
      } else {
        const msg = result?.message || 'Failed to place order. Please try again.';
        setErrorMsg(msg);
        toast({ variant: 'destructive', title: 'Order Failed', description: msg });
        isSubmitting.current = false;
        setIsPlacing(false);
      }
    } catch (err: any) {
      const msg = err?.message || 'An unexpected error occurred.';
      setErrorMsg(msg);
      toast({ variant: 'destructive', title: 'Order Failed', description: msg });
      isSubmitting.current = false;
      setIsPlacing(false);
    }
  };

  const renderCartContent = () => {
    if (!settings) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const appliedTaxes = settings.taxes?.map(tax => ({
      ...tax,
      amount: subtotal * (tax.rate / 100),
    })) || [];
    const totalTaxAmount = appliedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
    const total = subtotal + totalTaxAmount;
    const currencySymbol = settings.currencySymbol || '$';
    const dp = settings.currencyDecimalPlaces ?? 2;

    if (cart.length === 0) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
        </div>
      );
    }

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Cart items */}
        <div className="min-h-0 flex-1">
          <ScrollArea className="h-full pr-6">
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.orderItemId} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {currencySymbol}{item.price.toFixed(dp)} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <p className="font-semibold">{currencySymbol}{(item.price * item.quantity).toFixed(dp)}</p>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => onRemoveFromCart(item.orderItemId)}
                        disabled={isPlacing}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    placeholder="Add note for this item..."
                    className="text-xs h-10"
                    value={item.notes || ''}
                    onChange={(e) => onNotesChange(item.orderItemId, e.target.value)}
                    disabled={isPlacing}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Summary + actions */}
        <div className="mt-auto border-t pt-4 space-y-4">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{currencySymbol}{subtotal.toFixed(dp)}</span>
            </div>
            {appliedTaxes.map(tax => (
              <div key={tax.id} className="flex justify-between text-muted-foreground">
                <span>{tax.name} ({tax.rate}%)</span>
                <span>{currencySymbol}{tax.amount.toFixed(dp)}</span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex justify-between font-bold text-lg">
            <p>Total</p>
            <p>{currencySymbol}{total.toFixed(dp)}</p>
          </div>

          {!isCustomerFacing && (
            <>
              <div className="space-y-2">
                <Label>Customer Name (Optional)</Label>
                <Input
                  placeholder="For dine-in"
                  value={adminCustomerName}
                  onChange={(e) => setAdminCustomerName(e.target.value)}
                  disabled={isPlacing}
                />
              </div>
              <div className="space-y-2">
                <Label>Customer Phone (Optional)</Label>
                <Input
                  type="tel"
                  placeholder="For dine-in"
                  value={adminCustomerPhone}
                  onChange={(e) => setAdminCustomerPhone(e.target.value)}
                  disabled={isPlacing}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Order Notes (Optional)</Label>
            <Textarea
              placeholder="Any special requests for the whole order?"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              disabled={isPlacing}
            />
          </div>

          {errorMsg && (
            <p className="text-sm font-medium text-destructive">{errorMsg}</p>
          )}

          <Button
            size="lg"
            className="w-full"
            onClick={handlePlaceOrder}
            disabled={isPlacing || cart.length === 0}
          >
            {isPlacing
              ? <><LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> Placing Order...</>
              : <><ShoppingCart className="mr-2 h-5 w-5" />{isCustomerFacing ? 'Place My Order' : 'Place Order for Customer'}</>
            }
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Floating cart button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="rounded-full h-16 w-16 shadow-lg"
          onClick={() => setOpen(true)}
          disabled={totalItems === 0}
        >
          <ShoppingCart className="h-7 w-7" />
          <span className="sr-only">Open Cart</span>
          {totalItems > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-6 w-6 justify-center rounded-full"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </div>

      <Sheet open={open} onOpenChange={(v) => { if (!isPlacing) setOpen(v); }}>
        <SheetContent className="flex flex-col overflow-hidden">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle className="font-headline text-2xl">Your Order</SheetTitle>
          </SheetHeader>
          {renderCartContent()}
        </SheetContent>
      </Sheet>
    </>
  );
}
