

'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { RestaurantSettings, Tax, Branch } from '@/lib/definitions';
import { getSettings, getBranchById } from '@/lib/data';
import { updateSettingsAction } from '@/lib/actions';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COMMON_TIMEZONES } from '@/lib/format-date';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save Settings'}
        </Button>
    );
}

export default function GeneralSettingsPage() {
    const searchParams = useSearchParams();
    const branchId = searchParams.get('branchId');
    const [branch, setBranch] = useState<Branch | null>(null);
    const [taxes, setTaxes] = useState<Tax[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        if (branchId) {
            getBranchById(branchId).then(b => {
                setBranch(b);
                setTaxes(b?.taxes || []);
            });
        }
    }, [branchId]);

    const handleFormAction = async (formData: FormData) => {
        const newFormData = new FormData();
        for (const [key, value] of formData.entries()) {
            newFormData.append(key, value);
        }
        newFormData.append('taxes', JSON.stringify(taxes));

        await updateSettingsAction(newFormData);
        toast({
            title: "Settings Saved",
            description: "Your general settings have been updated.",
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

    if (!branch) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Settings</CardTitle>
                    <CardDescription>Manage your application settings here.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                        <p className="text-muted-foreground">Loading settings...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <form action={handleFormAction}>
            <input type="hidden" name="branchId" value={branch.id} />
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">General Settings for {branch.name}</CardTitle>
                    <CardDescription>
                        Manage your restaurant's public information, currency, and tax settings for this branch.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="restaurantName">Branch Name</Label>
                        <Input id="restaurantName" name="restaurantName" defaultValue={branch.restaurantName} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="restaurantAddress">Branch Address</Label>
                        <Textarea id="restaurantAddress" name="restaurantAddress" defaultValue={branch.restaurantAddress} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="currencySymbol">Currency Symbol</Label>
                            <Input id="currencySymbol" name="currencySymbol" defaultValue={branch.currencySymbol} className="w-24" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currencyDecimalPlaces">Decimal Places</Label>
                            <Input id="currencyDecimalPlaces" name="currencyDecimalPlaces" type="number" min="0" max="4" defaultValue={branch.currencyDecimalPlaces} className="w-24" />
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label htmlFor="timezone">Restaurant Timezone</Label>
                        <Select name="timezone" defaultValue={branch.timezone || 'Asia/Kolkata'}>
                            <SelectTrigger id="timezone">
                                <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent>
                                {COMMON_TIMEZONES.map((tz) => (
                                    <SelectItem key={tz.value} value={tz.value}>
                                        {tz.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            Set your restaurant's timezone. Meal sessions will activate based on this timezone.
                        </p>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <Label className="text-base font-semibold">Tax Settings</Label>
                        {taxes.length > 0 ? (
                            taxes.map((tax) => (
                                <div key={tax.id} className="flex items-end gap-2 p-3 border rounded-lg bg-muted/50">
                                    <div className="grid grid-cols-2 gap-4 flex-grow">
                                        <div className="space-y-1.5">
                                            <Label htmlFor={`tax-name-${tax.id}`}>Tax Name</Label>
                                            <Input
                                                id={`tax-name-${tax.id}`}
                                                value={tax.name}
                                                placeholder="e.g., GST"
                                                onChange={(e) => handleTaxChange(tax.id, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor={`tax-rate-${tax.id}`}>Rate (%)</Label>
                                            <Input
                                                id={`tax-rate-${tax.id}`}
                                                type="number"
                                                step="0.01"
                                                value={tax.rate}
                                                placeholder="e.g., 5"
                                                onChange={(e) => handleTaxChange(tax.id, 'rate', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveTax(tax.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No taxes have been added yet.</p>
                        )}
                        <Button type="button" variant="outline" size="sm" onClick={handleAddTax}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Tax
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="gap-2">
                    <SubmitButton />
                    <Button variant="outline" asChild>
                        <Link href="/admin/settings">Back to Settings</Link>
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
