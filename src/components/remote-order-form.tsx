

'use client';

import type { MenuItem, OrderItem, RemoteOrder, RestaurantSettings, Order } from '@/lib/definitions';
import React, from 'react';
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

type CartItem = Omit<OrderItem, 'orderItemId' | 'category' | 'isReady' | 'status' | 'selectedAddons' | 'notes'>;
type OrderType = 'Online' | 'Take-away' | 'Dine-in';

export function RemoteOrderForm({ menu: initialMenu, orderType, onItemsUpdate, correctionOrder, branchId }: { menu: MenuItem[]; orderType: OrderType, onItemsUpdate: () => void, correctionOrder?: Order | RemoteOrder | null, branchId: string }) {
  const [menu, setMenu] = React.useState(initialMenu);
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [showPrintDialog, setShowPrintDialog] = React.useState(false);
  const [lastOrder, setLastOrder] = React.useState<RemoteOrder | null>(null);
  const [settings, setSettings] = React.useState<RestaurantSettings | null>(null);

  React.useEffect(() => {
    getSettings().then(setSettings);
    setMenu(initialMenu);
  }, [initialMenu, onItemsUpdate]);

  React.useEffect(() => {
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

  const MenuList = ({ items, isUnavailable = false }: { items: MenuItem[], isUnavailable?: boolean }) => (
    <div className="divide-y divide-border rounded-md border">
        {items.map((item) => {
            const image = placeholderImages.find(p => p.id === item.imageId);
            const quantity = getQuantity(item.id);
            const imageSrc = item.imageId?.startsWith('data:image') ? item.imageId : image?.imageUrl;

            return (
                <div key={item.id} className={cn(
                  "flex items-center gap-4 p-4 transition-colors",
                  isUnavailable ? 'opacity-50' : 'hover:bg-accent'
                )}>
                    <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        {imageSrc ? (
                            <Image src={imageSrc} alt={item.name} data-ai-hint={image?.imageHint} fill className="object-cover" />
                        ) : (
                            <span>No Image</span>
                        )}
                    </div>
                    <div className="flex-grow">
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                        <p className="text-sm font-mono mt-1">{currencySymbol}{item.price.toFixed(currencyDecimalPlaces)}</p>
                    </div>
                    <div className="flex-shrink-0">
                        {quantity > 0 ? (
                            <div className="flex w-24 items-center justify-between">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => removeFromCart(item.id)}>
                                    <MinusCircle className="h-4 w-4" />
                                </Button>
                                <span className="font-bold">{quantity}</span>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => addToCart(item)}>
                                    <PlusCircle className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <Button className="w-24" onClick={() => addToCart(item)} disabled={!item.isAvailable} variant="outline" size="sm">
                                {item.isAvailable ? 'Add' : 'Unavailable'}
                            </Button>
                        )}
                    </div>
                </div>
            );
        })}
    </div>
  )

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
            <MenuList items={availableMenu} />
            {unavailableMenu.length > 0 && (
            <>
                <Separator className="my-8" />
                <h3 className="font-headline text-2xl font-bold mb-6 text-muted-foreground">Unavailable Items</h3>
                <MenuList items={unavailableMenu} isUnavailable={true} />
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
