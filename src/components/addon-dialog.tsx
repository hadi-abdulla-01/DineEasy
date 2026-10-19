
'use client';

import { useState, useEffect } from 'react';
import type { MenuItem, AddonGroup, AddonOption, RestaurantSettings } from "@/lib/definitions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AddonDialogProps = {
    item: MenuItem;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddToCart: (item: MenuItem, selectedAddons: Record<string, AddonOption>) => void;
    settings: RestaurantSettings | null;
};

export function AddonDialog({ item, open, onOpenChange, onAddToCart, settings }: AddonDialogProps) {
    const [selectedOptions, setSelectedOptions] = useState<Record<string, AddonOption>>({});
    const { toast } = useToast();

    // Reset state when a new item is passed in
    useEffect(() => {
        if (item) {
            const defaultSelections: Record<string, AddonOption> = {};
            item.addonGroups?.forEach(group => {
                if (group.isRequired) {
                     // Find the first option or keep it undefined if no options exist
                    const firstOption = group.options.length > 0 ? group.options[0] : undefined;
                    if(firstOption) {
                        defaultSelections[group.id] = firstOption;
                    }
                }
            });
            setSelectedOptions(defaultSelections);
        }
    }, [item]);

    const handleOptionSelect = (group: AddonGroup, option: AddonOption | null) => {
        setSelectedOptions(prev => {
            const newSelections = { ...prev };
            if (option === null) {
                // "None" was selected for a non-required group
                delete newSelections[group.id];
            } else {
                newSelections[group.id] = option;
            }
            return newSelections;
        });
    };

    const handleSubmit = () => {
        for (const group of item.addonGroups || []) {
            if (group.isRequired && !selectedOptions[group.id]) {
                toast({
                    variant: "destructive",
                    title: "Missing Selection",
                    description: `Please make a selection for "${group.title}".`,
                });
                return;
            }
        }
        onAddToCart(item, selectedOptions);
        onOpenChange(false);
    };

    const currencySymbol = settings?.currencySymbol || '$';
    const currencyDecimalPlaces = settings?.currencyDecimalPlaces ?? 2;

    const totalAddonPrice = Object.values(selectedOptions).reduce((sum, option) => sum + option.price, 0);
    const finalPrice = item.price + totalAddonPrice;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">{item.name}</DialogTitle>
                    <DialogDescription>Customize your item by selecting from the options below.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-4">
                    {item.addonGroups?.map(group => (
                        <div key={group.id} className="space-y-3">
                            <Label className="font-semibold text-base flex items-center gap-2">
                                {group.title}
                                {group.isRequired && <span className="text-xs font-normal text-destructive">(Required)</span>}
                            </Label>
                             <RadioGroup
                                value={selectedOptions[group.id]?.id || ''}
                            >
                                {group.options.map(option => (
                                    <div key={option.id} className="flex items-center space-x-2">
                                        <RadioGroupItem 
                                            value={option.id} 
                                            id={`${group.id}-${option.id}`} 
                                            onClick={() => handleOptionSelect(group, option)}
                                        />
                                        <Label htmlFor={`${group.id}-${option.id}`} className="flex-1 cursor-pointer">
                                            <div className="flex justify-between items-center">
                                                <span>{option.name}</span>
                                                {option.price > 0 && (
                                                    <span className="text-sm text-muted-foreground">
                                                        + {currencySymbol}{option.price.toFixed(currencyDecimalPlaces)}
                                                    </span>
                                                )}
                                            </div>
                                        </Label>
                                    </div>
                                ))}
                                {!group.isRequired && (
                                     <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                            value=""
                                            id={`${group.id}-none`}
                                            onClick={() => handleOptionSelect(group, null)}
                                        />
                                        <Label htmlFor={`${group.id}-none`} className="flex-1 cursor-pointer">
                                            None
                                        </Label>
                                    </div>
                                )}
                            </RadioGroup>
                        </div>
                    ))}
                </div>
                <Separator />
                <DialogFooter>
                    <div className="w-full flex justify-between items-center">
                         <p className="text-xl font-bold">
                            Total: {currencySymbol}{finalPrice.toFixed(currencyDecimalPlaces)}
                         </p>
                        <Button onClick={handleSubmit}>
                            Add to Order <PlusCircle className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
