

'use client';

import { useState, useEffect } from 'react';
import type { Order, OrderItem, RestaurantSettings } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { ShoppingCart, Trash2, LoaderCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { placeOrder } from '@/lib/actions';
import { useFormStatus } from 'react-dom';
import { ScrollArea } from './ui/scroll-area';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

function SubmitButton({ isCustomerFacing }: { isCustomerFacing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Placing Order...' : isCustomerFacing ? 'Place My Order' : 'Place Order for Customer'}
      <ShoppingCart className="ml-2 h-5 w-5" />
    </Button>
  );
}

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
  customerInfo?: {name: string, phone: string};
};

export function CartSheet({ cart, tableId, isCustomerFacing, onRemoveFromCart, onNotesChange, onOrderPlaced, existingOrder, branchId, settings, customerInfo }: CartSheetProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleFormSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setError(null);
    
    const state = await placeOrder(null, formData);

    if (state?.success && state.orderId) {
      onOrderPlaced();
      setOpen(false);

      if (isCustomerFacing) {
        router.push(`/order/${tableId}/status/${state.orderId}`);
      } else {
        toast({
          title: 'Order Placed Successfully!',
          description: 'The order has been sent to the kitchen.',
        });
        router.push('/admin/table-order');
      }
    } else {
       setError(state?.message || 'An unexpected error occurred.');
    }
    
    setIsSubmitting(false);
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
      amount: subtotal * (tax.rate / 100)
    })) || [];
    const totalTaxAmount = appliedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
    const total = subtotal + totalTaxAmount;
    const currencySymbol = settings.currencySymbol || '$';
    const currencyDecimalPlaces = settings.currencyDecimalPlaces ?? 2;


    if (cart.length === 0) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
        </div>
      );
    }

    return (
      <form action={handleFormSubmit} className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto">
          <ScrollArea className="h-full pr-6">
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.orderItemId} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{currencySymbol}{item.price.toFixed(currencyDecimalPlaces)} x {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <p className="font-semibold">{currencySymbol}{(item.price * item.quantity).toFixed(currencyDecimalPlaces)}</p>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => onRemoveFromCart(item.orderItemId)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove Item</span>
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    placeholder="Add note for this item..."
                    className="text-xs h-10"
                    value={item.notes || ''}
                    onChange={(e) => onNotesChange(item.orderItemId, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="mt-auto border-t pt-4 space-y-4">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{currencySymbol}{subtotal.toFixed(currencyDecimalPlaces)}</span>
            </div>
            {appliedTaxes.map(tax => (
              <div key={tax.id} className="flex justify-between text-muted-foreground">
                <span>{tax.name} ({tax.rate}%)</span>
                <span>{currencySymbol}{tax.amount.toFixed(currencyDecimalPlaces)}</span>
              </div>
            ))}
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <p>Total</p>
            <p>{currencySymbol}{total.toFixed(currencyDecimalPlaces)}</p>
          </div>

          <input type="hidden" name="tableId" value={tableId} />
          <input type="hidden" name="items" value={JSON.stringify(cart)} />
          <input type="hidden" name="isCustomerFacing" value={String(isCustomerFacing)} />
          {branchId && <input type="hidden" name="branchId" value={branchId} />}
          {customerInfo?.name && <input type="hidden" name="customerName" value={customerInfo.name} />}
          {customerInfo?.phone && <input type="hidden" name="customerPhone" value={customerInfo.phone} />}
          
          {!isCustomerFacing && !customerInfo && (
            <>
                <div className="space-y-2">
                    <Label htmlFor="customerName-sheet">Customer Name</Label>
                    <Input id="customerName-sheet" name="customerName" placeholder="For dine-in" required/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="customerPhone-sheet">Customer Phone</Label>
                    <Input id="customerPhone-sheet" name="customerPhone" placeholder="For dine-in" required/>
                </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="orderNotes-sheet">Order Notes (Optional)</Label>
            <Textarea id="orderNotes-sheet" name="orderNotes" placeholder="Any special requests for the whole order?" />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Placing Order...' : isCustomerFacing ? 'Place My Order' : 'Place Order for Customer'}
            <ShoppingCart className="ml-2 h-5 w-5" />
          </Button>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        </div>
      </form>
    );
  };


  return (
    <>
      {/* Floating Cart Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button size="lg" className="rounded-full h-16 w-16 shadow-lg" onClick={() => setOpen(true)} disabled={totalItems === 0}>
          <ShoppingCart className="h-7 w-7" />
          <span className="sr-only">Open Cart</span>
          {totalItems > 0 && (
            <Badge variant="secondary" className="absolute -top-1 -right-1 h-6 w-6 justify-center rounded-full">
              {totalItems}
            </Badge>
          )}
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle className="font-headline text-2xl">Your Order</SheetTitle>
          </SheetHeader>
          {renderCartContent()}
        </SheetContent>
      </Sheet>
    </>
  );
}
