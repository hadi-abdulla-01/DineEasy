
'use client';

import type { MenuItem, OrderItem, RemoteOrder, RestaurantSettings, Order } from '@/lib/definitions';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { placeholderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MinusCircle, PlusCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { addRemoteOrderAction } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { Invoice } from '@/components/ui/invoice';
import { getSettings } from '@/lib/data';
import { RemoteOrderCartSheet } from './remote-order-cart-sheet';
import { Card, CardContent } from './ui/card';

type CartItem = Omit<OrderItem, 'orderItemId' | 'category' | 'isReady' | 'status' | 'selectedAddons' | 'notes'>;
type OrderType = 'Online' | 'Take-away' | 'Dine-in';

export function RemoteOrderForm({ menu: initialMenu, orderType, onItemsUpdate, correctionOrder, branchId }: { menu: MenuItem[]; orderType: OrderType, onItemsUpdate: () => void, correctionOrder?: Order | RemoteOrder | null, branchId: string }) {
  const [menu, setMenu] = useState(initialMenu);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [lastOrder, setLastOrder] = useState<RemoteOrder | null>(null);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);

  useEffect(() => {
    if(branchId) {
      getSettings(branchId).then(setSettings);
    } else {
      getSettings().then(setSettings);
    }
    setMenu(initialMenu);
  }, [initialMenu, onItemsUpdate, branchId]);

  useEffect(() => {
    if (correctionOrder) {
      // Pre-fill the cart with items from the order being corrected
      const itemsFromCorrection = correctionOrder.items.map(item => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));
      setCart(itemsFromCorrection);
    }
  }, [correctionOrder]);


  const addToCart = (menuItem: MenuItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.menuItemId === menuItem.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.menuItemId === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { menuItemId: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: 1 }];
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prevCart) => {
      return prevCart.reduce((acc, item) => {
        if (item.menuItemId === menuItemId) {
          if (item.quantity > 1) {
            acc.push({ ...item, quantity: item.quantity - 1 });
          }
        } else {
          acc.push(item);
        }
        return acc;
      }, [] as CartItem[]);
    });
  };

  const getQuantity = (menuItemId: string) => {
    return cart.find((item) => item.menuItemId === menuItemId)?.quantity || 0;
  };
  
  const currencySymbol = settings?.currencySymbol || '$';
  const currencyDecimalPlaces = settings?.currencyDecimalPlaces ?? 2;

  const categories = ["All", ...Array.from(new Set(menu.map(item => item.category)))];

  const filteredMenu = menu.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === "All" || item.category === selectedCategory)
  );

  const availableMenu = filteredMenu.filter(item => item.isAvailable);
  const unavailableMenu = filteredMenu.filter(item => !item.isAvailable);

  const printInvoice = (order: RemoteOrder) => {
    const printWindow = window.open('', '', 'height=800,width=600');
    if (printWindow && settings) {
      const invoiceElement = document.createElement('div');
      // A bit of a hack to render React component to string for printing
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
  
  const resetForm = () => {
    setCart([]);
    onItemsUpdate();
  };

   const handleOrderPlaced = async (formData: FormData) => {
    if (cart.length === 0 || !settings) return;
    
    formData.append('branchId', branchId);
    
    const newOrder = await addRemoteOrderAction(formData);
    setLastOrder(newOrder);
    setShowPrintDialog(true);
  };

  const handlePrintDialogClose = (shouldPrint: boolean) => {
      if (shouldPrint && lastOrder) {
          printInvoice(lastOrder);
      }
      setShowPrintDialog(false);
      setLastOrder(null);
      resetForm();
  }

  const MenuGrid = ({ items, isUnavailable = false }: { items: MenuItem[], isUnavailable?: boolean }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {items.map((item) => {
            const image = placeholderImages.find(p => p.id === item.imageId);
            const quantity = getQuantity(item.id);
            const imageSrc = item.imageId?.startsWith('data:image') ? item.imageId : image?.imageUrl;

            return (
                <Card key={item.id} className={cn(
                    "overflow-hidden transition-all duration-300 flex flex-col",
                    isUnavailable ? 'opacity-50' : 'hover:shadow-lg hover:-translate-y-0.5'
                )}>
                    <div className="aspect-square w-full bg-muted relative flex items-center justify-center">
                        {imageSrc ? (
                            <Image src={imageSrc} alt={item.name} data-ai-hint={image?.imageHint} fill className="object-cover" />
                        ) : (
                            <div className="text-xs text-muted-foreground p-2 text-center">No Image</div>
                        )}
                    </div>
                    <CardContent className="p-2 flex flex-col flex-grow">
                        <div className="flex-grow">
                            <h4 className="font-semibold text-xs leading-tight line-clamp-2">{item.name}</h4>
                            <p className="text-xs font-mono mt-1">{currencySymbol}{item.price.toFixed(currencyDecimalPlaces)}</p>
                        </div>
                        <div className="mt-2">
                            {quantity > 0 ? (
                                <div className="flex items-center justify-between">
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => removeFromCart(item.id)}>
                                        <MinusCircle className="h-4 w-4" />
                                    </Button>
                                    <span className="font-bold text-sm">{quantity}</span>
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => addToCart(item)}>
                                        <PlusCircle className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <Button className="w-full h-8" onClick={() => addToCart(item)} disabled={!item.isAvailable} variant="outline" size="sm">
                                    {item.isAvailable ? 'Add' : 'Unavailable'}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            );
        })}
    </div>
  );

  return (
    <div className="space-y-8">
        <AlertDialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Order Placed Successfully!</AlertDialogTitle>
                    <AlertDialogDescription>
                        Would you like to print an invoice for this order?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => handlePrintDialogClose(false)}>No</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handlePrintDialogClose(true)}>Yes, Print</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-headline text-3xl font-bold">Menu</h2>
                <Input
                    type="text"
                    placeholder="Search menu..."
                    className="max-w-xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
             <div className="flex flex-wrap gap-2 mb-6">
                {categories.map(category => (
                    <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        onClick={() => setSelectedCategory(category)}
                    >
                        {category}
                    </Button>
                ))}
            </div>
            <MenuGrid items={availableMenu} />
            {unavailableMenu.length > 0 && (
            <>
                <Separator className="my-8" />
                <h3 className="font-headline text-2xl font-bold mb-6 text-muted-foreground">Unavailable Items</h3>
                <MenuGrid items={unavailableMenu} isUnavailable={true} />
            </>
            )}
        </div>
        
        <RemoteOrderCartSheet
            cart={cart}
            orderType={orderType}
            onOrderPlaced={handleOrderPlaced}
            onRemoveFromCart={removeFromCart}
            settings={settings}
            correctionOrder={correctionOrder}
        />
    </div>
  );
}
