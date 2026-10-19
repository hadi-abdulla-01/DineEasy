
'use client';

import type { MenuItem, RestaurantSettings } from '@/lib/definitions';
import Image from 'next/image';
import { placeholderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MinusCircle, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuGridProps {
    items: MenuItem[];
    onAddToCart: (item: MenuItem) => void;
    getQuantity: (itemId: string) => number;
    onRemoveFromCart: (menuItemId: string) => void;
    settings: RestaurantSettings | null;
    isUnavailable?: boolean;
}

export function MenuGrid({ items, onAddToCart, getQuantity, onRemoveFromCart, settings, isUnavailable = false }: MenuGridProps) {

    if (!settings) {
        return <div>Loading settings...</div>;
    }
    const currencySymbol = settings.currencySymbol || '$';
    const currencyDecimalPlaces = settings.currencyDecimalPlaces ?? 2;

    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
                                <div className="text-xs text-muted-foreground p-2 text-center">No image</div>
                            )}
                        </div>
                        <div className="flex flex-col flex-grow p-3">
                            <div className="flex-grow">
                                <h3 className="font-headline font-semibold text-base leading-tight">{item.name}</h3>
                                <p className="text-xs text-muted-foreground mt-1 h-8 line-clamp-2">{item.description}</p>
                                <p className="text-base font-semibold mt-1">{currencySymbol}{item.price.toFixed(currencyDecimalPlaces)}</p>
                            </div>
                            <div className="mt-3">
                                {quantity > 0 ? (
                                    <div className="flex items-center justify-between">
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onRemoveFromCart(item.id)}>
                                            <MinusCircle className="h-4 w-4" />
                                        </Button>
                                        <span className="font-bold text-lg">{quantity}</span>
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onAddToCart(item)}>
                                            <PlusCircle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button className="w-full h-9" size="sm" onClick={() => onAddToCart(item)} disabled={!item.isAvailable || isUnavailable}>
                                        {item.isAvailable ? 'Add' : 'Unavailable'}
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
