

'use client';

import { useState } from "react";
import type { MenuItem, RestaurantSettings } from "@/lib/definitions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, PlusCircle, MinusCircle } from "lucide-react";
import { Badge } from "./ui/badge";
import Image from "next/image";
import { placeholderImages } from "@/lib/placeholder-images";
import { Separator } from "./ui/separator";

type ItemDetailsDialogProps = {
    item: MenuItem;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddToCart: (item: MenuItem, quantity: number) => void;
    onRemoveFromCart: (item: MenuItem) => void;
    getQuantityInCart: (itemId: string) => number;
    settings: RestaurantSettings | null;
}

export function ItemDetailsDialog({ item, open, onOpenChange, onAddToCart, onRemoveFromCart, getQuantityInCart, settings }: ItemDetailsDialogProps) {
    
    const imagePlaceholder = placeholderImages.find(p => p.id === item.imageId);
    const imageSrc = item.imageId?.startsWith('data:image') ? item.imageId : imagePlaceholder?.imageUrl;

    const handleInitialAddToCart = () => {
        onAddToCart(item, 1);
    };

    const quantityInCart = getQuantityInCart(item.id);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0">
                {imageSrc && (
                    <div className="relative w-full h-48">
                        <Image src={imageSrc} alt={item.name} fill className="object-cover rounded-t-lg" />
                    </div>
                )}
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="font-headline text-2xl flex justify-between items-center">
                        {item.name}
                        {item.prepTime && (
                             <Badge variant="outline" className="flex items-center gap-1.5 h-6">
                                <Clock className="h-3 w-3" />
                                <span className="text-xs">{item.prepTime} Min</span>
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription className="pt-2 text-base">
                        {item.description}
                    </DialogDescription>
                </DialogHeader>

                {item.addonGroups && item.addonGroups.length > 0 && (
                    <div className="px-6">
                        <Separator className="my-2" />
                        <h4 className="font-semibold text-sm mb-2">Customization Options</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            {item.addonGroups.map(group => (
                                <li key={group.id}>{group.title}</li>
                            ))}
                        </ul>
                    </div>
                )}
                
                <DialogFooter className="mt-6 p-6 bg-muted/50 rounded-b-lg flex-row justify-between items-center">
                     <div>
                        {settings ? (
                            <p className="text-2xl font-bold">{settings.currencySymbol}{item.price.toFixed(settings.currencyDecimalPlaces)}</p>
                        ) : (
                            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                        )}
                    </div>
                     <div>
                        {quantityInCart === 0 ? (
                             <Button
                                size="sm"
                                onClick={handleInitialAddToCart}
                            >
                                {item.addonGroups && item.addonGroups.length > 0 ? 'Customize & Add' : 'Add to Order'}
                                <PlusCircle className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                             <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => onRemoveFromCart(item)}>
                                    <MinusCircle className="h-4 w-4" />
                                </Button>
                                <span className="text-xl font-bold w-8 text-center">{quantityInCart}</span>
                                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => onAddToCart(item, 1)}>
                                    <PlusCircle className="h-4 w-4" />
                                </Button>
                             </div>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
