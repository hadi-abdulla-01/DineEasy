'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { RestaurantSettings, Tax } from '@/lib/definitions';
import { updateDefaultRestaurantSettings, getDefaultRestaurantSettings } from '@/lib/server-actions';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { PlusCircle, Trash2, ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Saving Defaults...' : 'Save Default Settings'}
        </Button>
    );
}

export default function DefaultSettingsPage() {
    const [settings, setSettings] = useState<Partial<RestaurantSettings> | null>(null);
    const [taxes, setTaxes] = useState<Tax[]>([]);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getDefaultRestaurantSettings().then(s => {
            setSettings(s);
            setTaxes(s?.taxes || []);
            setIsLoading(false);
        });
    }, []);

    const handleFormAction = async (formData: FormData) => {
        const newSettings: Partial<RestaurantSettings> = {
            restaurantName: formData.get('restaurantName') as string,
            restaurantAddress: formData.get('restaurantAddress') as string,
            currencySymbol: formData.get('currencySymbol') as string,
            currencyDecimalPlaces: Number(formData.get('currencyDecimalPlaces')),
            taxName: formData.get('taxName') as string,
            taxNumber: formData.get('taxNumber') as string,
            taxes: taxes,
            menuCategories: (formData.get('menuCategories') as string).split(',').map(c => c.trim()).filter(Boolean),
        };

        await updateDefaultRestaurantSettings(newSettings);
        toast({
            title: "Default Settings Saved",
            description: "The template for new restaurants has been updated.",
        });
    };

    const handleAddTax = () => {
        setTaxes([...taxes, { id: `new-${Date.now()}`, name: '', rate: 0 }]);
    };

    const handleTaxChange = (id: string, field: 'name' | 'rate', value: string | number) => {
        setTaxes(taxes.map(tax => tax.id === id ? { ...tax, [field]: value } : tax));
    };

    const handleRemoveTax = (id: string) => {
        setTaxes(taxes.filter(tax => tax.id !== id));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
                <p>Loading default settings...</p>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/admin/superadmin">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Default Restaurant Templates</h1>
                        <p className="text-slate-600 dark:text-slate-400">
                           These settings will be applied to all newly created restaurants.
                        </p>
                    </div>
                </div>

                <form action={handleFormAction}>
                    <Card>
                        <CardHeader>
                            <CardTitle>General Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="restaurantName">Default Restaurant Name</Label>
                                <Input id="restaurantName" name="restaurantName" defaultValue={settings?.restaurantName || 'My Restaurant'} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="restaurantAddress">Default Address</Label>
                                <Textarea id="restaurantAddress" name="restaurantAddress" defaultValue={settings?.restaurantAddress || ''} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currencySymbol">Currency Symbol</Label>
                                    <Input id="currencySymbol" name="currencySymbol" defaultValue={settings?.currencySymbol || '$'} className="w-24" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="currencyDecimalPlaces">Decimal Places</Label>
                                    <Input id="currencyDecimalPlaces" name="currencyDecimalPlaces" type="number" min="0" max="4" defaultValue={settings?.currencyDecimalPlaces ?? 2} className="w-24" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="taxName">Tax Label Name (e.g., GSTIN, VAT ID)</Label>
                                    <Input id="taxName" name="taxName" defaultValue={settings?.taxName || ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="taxNumber">Tax Number</Label>
                                    <Input id="taxNumber" name="taxNumber" defaultValue={settings?.taxNumber || ''} />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="menuCategories">Default Menu Categories</Label>
                                <Input id="menuCategories" name="menuCategories" defaultValue={settings?.menuCategories?.join(', ') || 'Meals, Snacks, Beverages, Desserts'} />
                                <p className="text-xs text-muted-foreground">Enter comma-separated values.</p>
                            </div>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Default Tax Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           {taxes.length > 0 ? (
                                taxes.map((tax) => (
                                    <div key={tax.id} className="flex items-end gap-2 p-3 border rounded-lg bg-muted/50">
                                        <div className="grid grid-cols-2 gap-4 flex-grow">
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`tax-name-${tax.id}`}>Tax Name</Label>
                                                <Input id={`tax-name-${tax.id}`} value={tax.name} placeholder="e.g., GST" onChange={(e) => handleTaxChange(tax.id, 'name', e.target.value)} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`tax-rate-${tax.id}`}>Rate (%)</Label>
                                                <Input id={`tax-rate-${tax.id}`} type="number" step="0.01" value={tax.rate} placeholder="e.g., 5" onChange={(e) => handleTaxChange(tax.id, 'rate', parseFloat(e.target.value) || 0)} />
                                            </div>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveTax(tax.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No default taxes have been added yet.</p>
                            )}
                            <Button type="button" variant="outline" size="sm" onClick={handleAddTax}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Default Tax
                            </Button>
                        </CardContent>
                    </Card>

                    <CardFooter className="flex justify-end gap-2">
                        <Button variant="outline" asChild>
                           <Link href="/admin/superadmin">Cancel</Link>
                        </Button>
                        <SubmitButton />
                    </CardFooter>
                </form>
            </div>
        </div>
    );
}
