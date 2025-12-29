

'use client';

import { useState, useEffect, useRef } from 'react';
import type { OrderItem, RestaurantSettings, Order, RemoteOrder } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useFormStatus } from 'react-dom';
import { ScrollArea } from './ui/scroll-area';
import { addRemoteOrderAction } from '@/lib/actions';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { useAuth } from '@/app/admin/auth-provider';

type CartItem = Omit<OrderItem, 'orderItemId' | 'category' | 'isReady' | 'status' | 'selectedAddons' | 'notes'>;
type OrderType = 'Online' | 'Take-away' | 'Dine-in';

type CustomerDetails = {
    name: string;
    phone: string;
    address: string;
    platform: string;
};

function isRemoteOrder(order: Order | RemoteOrder): order is RemoteOrder {
    return 'customerDetails' in order;
}

function SubmitButton({ orderType }: { orderType: OrderType }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Placing Order...' : `Place ${orderType} Order`}
      <ShoppingCart className="ml-2 h-5 w-5" />
    </Button>
  );
}

type RemoteOrderCartSheetProps = {
  cart: CartItem[];
  orderType: OrderType;
  onRemoveFromCart: (menuItemId: string) => void;
  onOrderPlaced: (orderData: FormData) => Promise<void>;
  settings: RestaurantSettings | null;
  correctionOrder?: Order | RemoteOrder | null;
};

export function RemoteOrderCartSheet({ cart, orderType, onRemoveFromCart, onOrderPlaced, settings, correctionOrder }: RemoteOrderCartSheetProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({ name: '', phone: '', address: '', platform: '' });
  const formRef = useRef<HTMLFormElement>(null);
  
  const platforms = settings?.onlineOrderPlatforms || [];

  useEffect(() => {
    if(platforms.length > 0 && !customerDetails.platform) {
        setCustomerDetails(prev => ({...prev, platform: platforms[0]}));
    }
  }, [platforms, customerDetails.platform]);
  
  useEffect(() => {
    if (correctionOrder) {
      if (isRemoteOrder(correctionOrder)) {
        setCustomerDetails({
          name: correctionOrder.customerDetails.name,
          phone: correctionOrder.customerDetails.phone,
          address: correctionOrder.customerDetails.address || '',
          platform: correctionOrder.customerDetails.platform || (platforms.length > 0 ? platforms[0] : ''),
        });
      } else {
        setCustomerDetails({
          name: correctionOrder.customerName,
          phone: correctionOrder.customerPhone,
          address: '',
          platform: platforms.length > 0 ? platforms[0] : '',
        });
      }
    }
  }, [correctionOrder, platforms]);
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const appliedTaxes = settings?.taxes?.map(tax => ({
    ...tax,
    amount: subtotal * (tax.rate / 100)
  })) || [];

  const totalTaxAmount = appliedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
  const total = subtotal + totalTaxAmount;

  const currencySymbol = settings?.currencySymbol || '$';
  const currencyDecimalPlaces = settings?.currencyDecimalPlaces ?? 2;

  const handleCustomerDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomerDetails(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePlatformChange = (value: CustomerDetails['platform']) => {
      setCustomerDetails(prev => ({ ...prev, platform: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if(user) {
        formData.append('createdByName', user.username);
    }
    await onOrderPlaced(formData);
    setOpen(false);
    formRef.current?.reset();
    setCustomerDetails({ name: '', phone: '', address: '', platform: platforms.length > 0 ? platforms[0] : '' });
  };

  const currentOrderType = correctionOrder ? correctionOrder.orderType : orderType;

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
        <SheetContent className="flex flex-col w-[90vw] sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="font-headline text-2xl">New {currentOrderType} Order</SheetTitle>
          </SheetHeader>
          {cart.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-muted-foreground">Your cart is empty.</p>
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="flex h-full flex-col">
               <input type="hidden" name="cart" value={JSON.stringify(cart)} />
               <input type="hidden" name="orderType" value={currentOrderType} />
               {correctionOrder && <input type="hidden" name="correctionFor" value={correctionOrder.id} />}
               {correctionOrder && <input type="hidden" name="correctionType" value={correctionOrder.orderType === 'Dine-in' ? 'Dine-in' : 'Remote'} />}


              <ScrollArea className="flex-1 -mx-6">
                <div className="px-6 space-y-4">
                  {cart.map(item => (
                      <div key={item.menuItemId} className="flex justify-between items-center">
                      <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{currencySymbol}{item.price.toFixed(currencyDecimalPlaces)} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                          <p className="font-semibold">{currencySymbol}{(item.price * item.quantity).toFixed(currencyDecimalPlaces)}</p>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => onRemoveFromCart(item.menuItemId)}>
                              <Trash2 className="h-4 w-4" />
                          </Button>
                      </div>
                      </div>
                  ))}
                  
                  <Separator />
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
                  <Separator />
                  
                  {/* Customer Details Form */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Customer Details</h4>
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" name="name" placeholder="John Doe" value={customerDetails.name} onChange={handleCustomerDetailChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" name="phone" placeholder="555-123-4567" value={customerDetails.phone} onChange={handleCustomerDetailChange} required />
                    </div>
                    {currentOrderType === 'Online' && (
                      <>
                          <div className="space-y-2">
                              <Label htmlFor="address">Delivery Address</Label>
                              <Textarea id="address" name="address" placeholder="123 Main St, Anytown, USA" value={customerDetails.address} onChange={handleCustomerDetailChange} required />
                          </div>
                          <div className="space-y-2">
                              <Label>Platform</Label>
                              {platforms.length > 0 ? (
                                  <RadioGroup name="platform" value={customerDetails.platform} onValueChange={handlePlatformChange} className="flex gap-4 flex-wrap">
                                      {platforms.map(platform => (
                                          <div key={platform} className="flex items-center space-x-2">
                                              <RadioGroupItem value={platform} id={`sheet-${platform}`} />
                                              <Label htmlFor={`sheet-${platform}`}>{platform}</Label>
                                          </div>
                                      ))}
                                  </RadioGroup>
                              ) : (
                                  <p className="text-sm text-muted-foreground">No online platforms configured. Please add one in settings.</p>
                              )}
                          </div>
                      </>
                    )}
                  </div>
                </div>
              </ScrollArea>
                
              <div className="mt-auto border-t pt-4">
                <SubmitButton orderType={currentOrderType} />
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
