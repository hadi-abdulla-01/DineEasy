
'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { Branch, InvoiceSettings } from '@/lib/definitions';
import { updateSettingsAction } from '@/lib/actions';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRestaurantData } from '@/lib/client-data';

const defaultInvoiceSettings: InvoiceSettings = {
    useUnifiedNumbering: true,
    unified: { prefix: 'INV-', nextNumber: 1 },
    dineIn: { prefix: 'DI-', nextNumber: 1 },
    online: { prefix: 'ON-', nextNumber: 1 },
    takeAway: { prefix: 'TA-', nextNumber: 1 },
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save Invoice Settings'}
        </Button>
    );
}

export default function InvoiceSettingsPage() {
    const searchParams = useSearchParams();
    const branchId = searchParams.get('branchId');
    const { getBranchById, restaurantId } = useRestaurantData();
    const [branch, setBranch] = useState<Branch | null>(null);
    const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>(defaultInvoiceSettings);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (branchId) {
            getBranchById(branchId).then((b) => {
                setBranch(b);
                if (b?.invoiceSettings) {
                    setInvoiceSettings({
                        ...defaultInvoiceSettings,
                        ...b.invoiceSettings,
                        unified: { ...defaultInvoiceSettings.unified, ...b.invoiceSettings.unified },
                        dineIn: { ...defaultInvoiceSettings.dineIn, ...b.invoiceSettings.dineIn },
                        online: { ...defaultInvoiceSettings.online, ...b.invoiceSettings.online },
                        takeAway: { ...defaultInvoiceSettings.takeAway, ...b.invoiceSettings.takeAway },
                    });
                }
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, [branchId, getBranchById]);

    const handleFormAction = async (formData: FormData) => {
        const newFormData = new FormData();
        newFormData.append('invoiceSettings', JSON.stringify(invoiceSettings));
        newFormData.append('branchId', branchId!);
        newFormData.append('restaurantId', restaurantId);
        
        await updateSettingsAction(newFormData);
        toast({
            title: "Settings Saved",
            description: "Your invoice numbering settings have been updated.",
        });
    };

    const handleSettingChange = (section: keyof InvoiceSettings | 'unified' | 'dineIn' | 'online' | 'takeAway', field: string, value: any) => {
        setInvoiceSettings(prev => {
            const newSettings = { ...prev };
            if (section === 'useUnifiedNumbering') {
                newSettings.useUnifiedNumbering = value;
            } else if (section === 'unified' || section === 'dineIn' || section === 'online' || section === 'takeAway') {
                (newSettings[section] as any)[field] = value;
            }
            return newSettings;
        });
    };
    
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Invoice & Numbering</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                        <p className="text-muted-foreground">Loading settings...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    if (!branch) {
         return (
            <Card>
               <CardHeader>
                   <CardTitle className="font-headline">Invoice & Numbering</CardTitle>
                   <CardDescription>Could not load settings for the selected branch.</CardDescription>
               </CardHeader>
               <CardContent>
                   <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed text-center">
                       <p className="text-muted-foreground">
                           Please select a valid branch from the main settings page.
                       </p>
                   </div>
               </CardContent>
               <CardFooter>
                   <Button variant="outline" asChild>
                       <Link href="/admin/settings">Back to Settings</Link>
                   </Button>
               </CardFooter>
           </Card>
        )
    }

    return (
        <form action={handleFormAction}>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Invoice & Numbering for {branch.name}</CardTitle>
                    <CardDescription>
                        Configure prefixes and starting numbers for your invoices.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="unifiedSwitch" className="text-base">
                                Use Unified Invoice Numbering
                            </Label>
                            <CardDescription>
                                Use one numbering sequence for all order types.
                            </CardDescription>
                        </div>
                        <Switch
                            id="unifiedSwitch"
                            checked={invoiceSettings.useUnifiedNumbering}
                            onCheckedChange={(checked) => handleSettingChange('useUnifiedNumbering', '', checked)}
                        />
                    </div>
                    
                    {invoiceSettings.useUnifiedNumbering ? (
                        <div>
                             <h3 className="text-lg font-medium mb-4">Unified Numbering</h3>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Prefix</Label>
                                    <Input value={invoiceSettings.unified.prefix} onChange={e => handleSettingChange('unified', 'prefix', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Next Number</Label>
                                    <Input type="number" value={invoiceSettings.unified.nextNumber} onChange={e => handleSettingChange('unified', 'nextNumber', parseInt(e.target.value, 10) || 1)} />
                                </div>
                            </div>
                        </div>
                    ) : (
                         <div className="space-y-6">
                            <h3 className="text-lg font-medium">Separate Numbering per Order Type</h3>
                             <div className="space-y-2">
                                <Label className="font-semibold">Dine-in Orders</Label>
                                <div className="grid grid-cols-2 gap-4 pl-4 border-l-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Prefix</Label>
                                        <Input value={invoiceSettings.dineIn.prefix} onChange={e => handleSettingChange('dineIn', 'prefix', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Next Number</Label>
                                        <Input type="number" value={invoiceSettings.dineIn.nextNumber} onChange={e => handleSettingChange('dineIn', 'nextNumber', parseInt(e.target.value, 10) || 1)} />
                                    </div>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label className="font-semibold">Online Orders</Label>
                                 <div className="grid grid-cols-2 gap-4 pl-4 border-l-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Prefix</Label>
                                        <Input value={invoiceSettings.online.prefix} onChange={e => handleSettingChange('online', 'prefix', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Next Number</Label>
                                        <Input type="number" value={invoiceSettings.online.nextNumber} onChange={e => handleSettingChange('online', 'nextNumber', parseInt(e.target.value, 10) || 1)} />
                                    </div>
                                </div>
                            </div>
                             <Separator />
                            <div className="space-y-2">
                                <Label className="font-semibold">Take-away Orders</Label>
                                <div className="grid grid-cols-2 gap-4 pl-4 border-l-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Prefix</Label>
                                        <Input value={invoiceSettings.takeAway.prefix} onChange={e => handleSettingChange('takeAway', 'prefix', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Next Number</Label>
                                        <Input type="number" value={invoiceSettings.takeAway.nextNumber} onChange={e => handleSettingChange('takeAway', 'nextNumber', parseInt(e.target.value, 10) || 1)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
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
