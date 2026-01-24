

'use client';

import type { MenuItem, OrderItem, RemoteOrder, RestaurantSettings, Order } from '@/lib/definitions';
import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { createRemoteOrderAction } from '@/lib/actions';
import { Invoice } from '@/components/ui/invoice';
import { RemoteOrderCartSheet } from './remote-order-cart-sheet';
import { MenuGrid } from './menu-grid';
import { useRestaurantData } from '@/lib/client-data';
import { useToast } from '@/hooks/use-toast';

type CartItem = Omit<OrderItem, 'orderItemId' | 'category' | 'isReady' | 'status' | 'selectedAddons' | 'notes'>;
type OrderType = 'Online' | 'Take-away' | 'Dine-in';

export function RemoteOrderForm({ menu: initialMenu, orderType, onItemsUpdate, correctionOrder, branchId, settings }: { menu: MenuItem[]; orderType: OrderType, onItemsUpdate: () => void, correctionOrder?: Order | RemoteOrder | null, branchId: string, settings: RestaurantSettings | null }) {
  const [menu, setMenu] = React.useState(initialMenu);
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [showPrintDialog, setShowPrintDialog] = React.useState(false);
  const [lastOrder, setLastOrder] = React.useState<RemoteOrder | null>(null);
  const { restaurantId } = useRestaurantData();
  const { toast } = useToast();
  const invoiceRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    setMenu(initialMenu);
  }, [initialMenu, onItemsUpdate]);

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

  const categories = ["All", ...Array.from(new Set(menu.map(item => item.category)))];

  const filteredMenu = menu.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === "All" || item.category === selectedCategory)
  );

  const availableMenu = filteredMenu.filter(item => item.isAvailable);
  const unavailableMenu = filteredMenu.filter(item => !item.isAvailable);

  const printInvoice = (order: RemoteOrder) => {
    const content = invoiceRef.current;
    if (!content || !settings) return;

    const printWindow = window.open('', '', 'height=800,width=600');
    if (printWindow) {
        const printSize = settings.printSettings?.invoicePrintSize || 'a4';
        const bodyStyle = printSize === 'a4' ? 'padding: 20px;' : 'padding: 0;';
        printWindow.document.write('<html><head><title>Invoice</title>');

        const styles = Array.from(document.styleSheets).map(sheet => {
            try {
                if (sheet.href) {
                    return `<link rel="stylesheet" href="${sheet.href}">`;
                }
                if (sheet.cssRules) {
                    return `<style>${Array.from(sheet.cssRules).map(rule => rule.cssText).join('')}</style>`;
                }
            } catch (e) {
                console.warn('Could not copy stylesheet for printing:', e);
            }
            return '';
        }).join('\n');
        
        printWindow.document.head.innerHTML += styles;
        printWindow.document.write(`</head><body style="${bodyStyle}">`);
        printWindow.document.write(content.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 500);
    }
  };

  const resetForm = () => {
    setCart([]);
    onItemsUpdate();
  };

  const handleOrderPlaced = async (formData: FormData) => {
    if (cart.length === 0 || !settings) return;

    formData.append('branchId', branchId);
    formData.append('restaurantId', restaurantId);

    const newOrder = await createRemoteOrderAction(formData);

    if (newOrder) {
      toast({
        title: "Success",
        description: `${orderType} order placed successfully.`
      });
      setLastOrder(newOrder);
      setShowPrintDialog(true);
    } else {
      toast({
        title: "Error",
        description: "Failed to place order.",
        variant: "destructive"
      });
    }
  };

  const handlePrintDialogClose = (shouldPrint: boolean) => {
    if (shouldPrint && lastOrder) {
      printInvoice(lastOrder);
    }
    setShowPrintDialog(false);
    setLastOrder(null);
    resetForm();
  }

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
      <div className="hidden">
        <div ref={invoiceRef}>
            {lastOrder && settings && <Invoice order={lastOrder} settings={settings} />}
        </div>
      </div>
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
        <MenuGrid
          items={availableMenu}
          onAddToCart={addToCart}
          getQuantity={getQuantity}
          onRemoveFromCart={removeFromCart}
          settings={settings}
        />
        {unavailableMenu.length > 0 && (
          <>
            <Separator className="my-8" />
            <h3 className="font-headline text-2xl font-bold mb-6 text-muted-foreground">Unavailable Items</h3>
            <MenuGrid
              items={unavailableMenu}
              isUnavailable={true}
              onAddToCart={addToCart}
              getQuantity={getQuantity}
              onRemoveFromCart={removeFromCart}
              settings={settings}
            />
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
