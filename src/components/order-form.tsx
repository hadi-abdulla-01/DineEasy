
'use client';

import type { MenuItem, OrderItem, RestaurantSettings, AddonGroup, AddonOption, Order, Branch, MealSession } from '@/lib/definitions';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { placeholderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoaderCircle, MinusCircle, PlusCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { CartSheet } from './cart-sheet';
import { getSettings, getTableById } from '@/lib/data';
import { ItemDetailsDialog } from './item-details-dialog';
import { AddonDialog } from './addon-dialog';
import { FeaturedSections } from './featured-sections';
import { CategoryScroll } from './category-scroll';

const MenuList = ({ items, isUnavailable = false, onSelect, getQuantity, onAdd, onRemove, currencySymbol, currencyDecimalPlaces }: { items: MenuItem[], isUnavailable?: boolean, onSelect: (item: MenuItem) => void, getQuantity: (itemId: string) => number, onAdd: (item: MenuItem) => void, onRemove: (item: MenuItem) => void, currencySymbol: string, currencyDecimalPlaces: number }) => (
  <div className="space-y-4">
    {items.map((item) => {
      const image = placeholderImages.find(p => p.id === item.imageId);
      const baseItemInCart = getQuantity(item.id) > 0 && !item.addonGroups?.length;
      const totalQuantity = getQuantity(item.id);
      const imageSrc = item.imageId?.startsWith('data:image') ? item.imageId : image?.imageUrl;

      return (
        <Card key={item.id} className={cn("overflow-hidden transition-all duration-300", isUnavailable && 'opacity-50')}>
          <div className="flex justify-between items-start p-4">
            <button
              className="flex-1 flex items-start gap-4 text-left"
              onClick={() => onSelect(item)}
              disabled={isUnavailable}
            >
              <div className="relative w-28 h-28 flex-shrink-0">
                {imageSrc ? (
                  <Image src={imageSrc} alt={item.name} data-ai-hint={image?.imageHint} fill className="object-cover rounded-md" />
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-2 text-center bg-muted rounded-md">No image</div>
                )}
              </div>
              <div className="flex flex-col">
                <h3 className="font-headline font-bold text-lg">{item.name}</h3>
                <p className="text-base font-semibold mt-1">{currencySymbol}{item.price.toFixed(currencyDecimalPlaces)}</p>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3 flex-grow">{item.description}</p>
              </div>
            </button>
            <div className="flex flex-col items-center justify-between w-auto flex-shrink-0 pl-4">
              <div className="h-28 flex flex-col justify-end">
                {totalQuantity > 0 && !baseItemInCart ? (
                  <div className="flex w-full items-center justify-center text-sm">
                    <span className="text-xs text-muted-foreground">In Cart: {totalQuantity}</span>
                  </div>
                ) : getQuantity(item.id) > 0 && !item.addonGroups?.length ? (
                  <div className="flex items-center gap-2 bg-[#E95322] rounded-full px-3 py-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(item);
                      }}
                      className="text-white hover:text-gray-200 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9" />
                      </svg>
                    </button>
                    <span className="text-white font-semibold text-base min-w-[2rem] text-center">
                      {getQuantity(item.id)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAdd(item);
                      }}
                      className="text-white hover:text-gray-200 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdd(item);
                    }}
                    disabled={!item.isAvailable}
                    className="bg-[#E95322] hover:bg-[#CB1E1D] disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-full text-sm font-semibold transition-colors"
                  >
                    {item.isAvailable ? 'Add' : 'Unavailable'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>
      );
    })}
  </div>
);

const AdminMenuGrid = ({ items, isUnavailable = false, onSelect, getQuantity, onAdd, onRemove, currencySymbol, currencyDecimalPlaces }: { items: MenuItem[], isUnavailable?: boolean, onSelect: (item: MenuItem) => void, getQuantity: (itemId: string) => number, onAdd: (item: MenuItem) => void, onRemove: (item: MenuItem) => void, currencySymbol: string, currencyDecimalPlaces: number }) => (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
    {items.map((item) => {
      const image = placeholderImages.find(p => p.id === item.imageId);
      const baseItemInCart = getQuantity(item.id) > 0 && !item.addonGroups?.length;
      const totalQuantity = getQuantity(item.id);
      const imageSrc = item.imageId?.startsWith('data:image') ? item.imageId : image?.imageUrl;

      return (
        <Card key={item.id} className={cn(
          "overflow-hidden transition-all duration-300 flex flex-col",
          isUnavailable ? 'opacity-50' : 'hover:shadow-lg hover:-translate-y-0.5'
        )}>
          <button
            onClick={() => onSelect(item)}
            className="aspect-square w-full bg-muted relative flex items-center justify-center"
            disabled={isUnavailable}
          >
            {imageSrc ? (
              <Image src={imageSrc} alt={item.name} data-ai-hint={image?.imageHint} fill className="object-cover" />
            ) : (
              <div className="text-xs text-muted-foreground p-2 text-center">No image</div>
            )}
          </button>
          <div className="flex flex-col flex-grow p-3">
            <div className="flex-grow">
              <h3 className="font-headline font-semibold text-base leading-tight">{item.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 h-8 line-clamp-2">{item.description}</p>
              <p className="text-base font-semibold mt-1">{currencySymbol}{item.price.toFixed(currencyDecimalPlaces)}</p>
            </div>
            <div className="mt-3">
              {totalQuantity > 0 && !baseItemInCart ? (
                <div className="flex w-full items-center justify-center text-sm gap-2">
                  <span>In Cart:</span>
                  <span className="font-bold">{totalQuantity}</span>
                </div>
              ) : getQuantity(item.id) > 0 && !item.addonGroups?.length ? (
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onRemove(item)}>
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  <span className="font-bold text-lg">{getQuantity(item.id)}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onAdd(item)}>
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button className="w-full h-9" size="sm" onClick={() => onAdd(item)} disabled={!item.isAvailable}>
                  {item.isAvailable ? 'Add' : 'Unavailable'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      );
    })}
  </div>
)

function MenuDisplay({ isCustomerFacing, menu, onSelectItem, getQuantity, onAddToCart, onRemoveFromCart, settings, currentSession }: { isCustomerFacing: boolean, menu: MenuItem[], onSelectItem: (item: MenuItem) => void, getQuantity: (itemId: string) => number, onAddToCart: (item: MenuItem) => void, onRemoveFromCart: (item: MenuItem) => void, settings: RestaurantSettings | null, currentSession?: MealSession | null }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFeatured, setShowFeatured] = useState(isCustomerFacing);

  if (!settings) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  const currencySymbol = settings.currencySymbol || '$';
  const currencyDecimalPlaces = settings.currencyDecimalPlaces ?? 2;

  const categories = ["All", ...Array.from(new Set(menu.map(item => item.category)))];

  const filteredMenu = menu.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === "All" || item.category === selectedCategory)
  );

  const availableMenu = filteredMenu.filter(item => item.isAvailable);
  const unavailableMenu = filteredMenu.filter(item => !item.isAvailable);

  const MenuComponent = isCustomerFacing ? MenuList : AdminMenuGrid;

  if (isCustomerFacing && showFeatured) {
    return (
      <FeaturedSections
        menu={menu}
        onViewAllMenu={() => setShowFeatured(false)}
        onItemClick={onSelectItem}
        onAddToCart={onAddToCart}
        getQuantity={getQuantity}
        onRemoveFromCart={onRemoveFromCart}
        settings={settings}
        currentSession={currentSession}
      />
    );
  }

  return (
    <>
      {isCustomerFacing ? (
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-['League_Spartan',sans-serif] font-bold text-[#391713] text-xl">Browse Menu</h2>
            <button
              onClick={() => setShowFeatured(true)}
              className="font-['League_Spartan',sans-serif] font-semibold text-[#E95322] text-sm"
            >
              Back to Home
            </button>
          </div>

          <Input
            type="text"
            placeholder="Search menu..."
            className="w-full rounded-[30px] border-2 border-gray-200 focus:border-[#CB1E1D] h-12 px-6 font-['League_Spartan',sans-serif]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <CategoryScroll
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
      ) : (
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <h2 className="font-headline text-3xl font-bold">Menu</h2>
            <Input
              type="text"
              placeholder="Search menu..."
              className="w-full sm:max-w-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                size="sm"
                className="text-xs h-8"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      )}
      <MenuComponent
        items={availableMenu}
        onSelect={onSelectItem}
        getQuantity={getQuantity}
        onAdd={onAddToCart}
        onRemove={onRemoveFromCart}
        currencySymbol={currencySymbol}
        currencyDecimalPlaces={currencyDecimalPlaces}
      />
      {unavailableMenu.length > 0 && (
        <>
          <Separator className="my-8" />
          <h3 className="font-headline text-2xl font-bold mb-6 text-muted-foreground">Unavailable Items</h3>
          <MenuComponent
            items={unavailableMenu}
            isUnavailable={true}
            onSelect={onSelectItem}
            getQuantity={getQuantity}
            onAdd={onAddToCart}
            onRemove={onRemoveFromCart}
            currencySymbol={currencySymbol}
            currencyDecimalPlaces={currencyDecimalPlaces}
          />
        </>
      )}
    </>
  );
}


export function OrderForm({ menu: initialMenu, tableId, isCustomerFacing, existingOrder, currentSession, customerInfo, settings, restaurantId }: { menu: MenuItem[]; tableId: string, isCustomerFacing: boolean, existingOrder?: Order, currentSession?: MealSession | null, customerInfo?: { name: string, phone: string }, settings: RestaurantSettings | null, restaurantId?: string }) {
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [table, setTable] = useState<{ id: string, branchId: string } | null>(null);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<MenuItem | null>(null);
  const [selectedItemForAddons, setSelectedItemForAddons] = useState<MenuItem | null>(null);

  useEffect(() => {
    async function fetchData() {
        if (restaurantId) {
            const fetchedTable = await getTableById(tableId, restaurantId);
            if (fetchedTable) {
                setTable({ id: fetchedTable.id, branchId: fetchedTable.branchId });
            }
        }
    }
    fetchData();
  }, [tableId, restaurantId]);


  const getAddonCombinationId = (selectedAddons?: Record<string, AddonOption>): string => {
    if (!selectedAddons || Object.keys(selectedAddons).length === 0) {
      return 'base';
    }
    // Create a stable ID from sorted addon group and option IDs
    return Object.keys(selectedAddons)
      .sort()
      .map(groupId => `${groupId}:${selectedAddons[groupId].id}`)
      .join(';');
  };

  const handleAddToCart = (menuItem: MenuItem, selectedAddons?: Record<string, AddonOption>) => {
    const addonId = getAddonCombinationId(selectedAddons);
    const orderItemId = `${menuItem.id}-${addonId}`;

    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.orderItemId === orderItemId);

      if (existingItem) {
        // Item with same addons exists, just increment quantity
        return prevCart.map(item =>
          item.orderItemId === orderItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Item is new or has a new combination of addons
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

  const handleAddMultipleToCart = (menuItem: MenuItem, quantity: number) => {
    if (menuItem.addonGroups && menuItem.addonGroups.length > 0) {
      setSelectedItemForAddons(menuItem);
      return;
    }

    const orderItemId = `${menuItem.id}-base`;

    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.orderItemId === orderItemId);
      if (existingItem) {
        return prevCart.map(item => item.orderItemId === existingItem.orderItemId ? { ...item, quantity: item.quantity + quantity } : item);
      }

      const newOrderItem: OrderItem = {
        orderItemId: orderItemId,
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
        category: menuItem.category,
        isReady: false,
        status: 'active',
        notes: '',
      };
      return [...prevCart, newOrderItem];
    });
  };

  const handleSimpleAddToCart = (menuItem: MenuItem) => {
    if (menuItem.addonGroups && menuItem.addonGroups.length > 0) {
      setSelectedItemForAddons(menuItem);
    } else {
      handleAddToCart(menuItem);
    }
  };


  const removeFromCart = (orderItemId: string) => {
    setCart((prevCart) => {
      return prevCart.reduce((acc, item) => {
        if (item.orderItemId === orderItemId) {
          if (item.quantity > 1) {
            acc.push({ ...item, quantity: item.quantity - 1 });
          }
        } else {
          acc.push(item);
        }
        return acc;
      }, [] as OrderItem[]);
    });
  };

  const handleRemoveFromCart = (item: MenuItem) => {
    // This only works for base items without addons from the main list.
    const orderItemId = `${item.id}-base`;
    const baseItemInCart = cart.find(i => i.orderItemId === orderItemId);
    if (baseItemInCart) {
      removeFromCart(baseItemInCart.orderItemId);
    }
  }

  const handleNoteChangeForCartItem = (orderItemId: string, notes: string) => {
    setCart(prevCart => prevCart.map(item =>
      item.orderItemId === orderItemId ? { ...item, notes } : item
    ));
  };

  const getQuantity = (menuItemId: string) => {
    return cart.filter(item => item.menuItemId === menuItemId).reduce((total, item) => total + item.quantity, 0);
  };

  const handleOrderPlaced = () => {
    setCart([]);
  }

  return (
    <div className="relative">
      <MenuDisplay
        isCustomerFacing={isCustomerFacing}
        menu={initialMenu}
        onSelectItem={setSelectedItemForDetails}
        getQuantity={getQuantity}
        onAddToCart={handleSimpleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        settings={settings}
        currentSession={currentSession}
      />

      <CartSheet
        cart={cart}
        tableId={tableId}
        isCustomerFacing={isCustomerFacing}
        onRemoveFromCart={removeFromCart}
        onNotesChange={handleNoteChangeForCartItem}
        onOrderPlaced={handleOrderPlaced}
        existingOrder={existingOrder}
        branchId={table?.branchId}
        settings={settings}
        customerInfo={customerInfo}
        restaurantId={restaurantId}
      />

      {selectedItemForDetails && (
        <ItemDetailsDialog
          item={selectedItemForDetails}
          open={!!selectedItemForDetails}
          onOpenChange={(isOpen) => !isOpen && setSelectedItemForDetails(null)}
          onAddToCart={handleAddMultipleToCart}
          onRemoveFromCart={handleRemoveFromCart}
          getQuantityInCart={getQuantity}
          settings={settings}
        />
      )}

      {selectedItemForAddons && (
        <AddonDialog
          item={selectedItemForAddons}
          open={!!selectedItemForAddons}
          onOpenChange={(isOpen) => !isOpen && setSelectedItemForAddons(null)}
          onAddToCart={handleAddToCart}
          settings={settings}
        />
      )}
    </div>
  );
}
