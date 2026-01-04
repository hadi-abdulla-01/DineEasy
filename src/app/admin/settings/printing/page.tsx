
'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Branch, PrintSettings, PrintSize } from '@/lib/definitions';
import { updateSettingsAction } from '@/lib/actions';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { useSearchParams } from 'next/navigation';
import { useRestaurantData } from '@/lib/client-data';

const defaultPrintSettings: PrintSettings = {
    invoicePrintSize: 'a4',
    invoiceCustomWidth: 80,
    kitchenTicketPrintSize: 'thermal80mm',
    kitchenTicketCustomWidth: 80,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save Print Settings'}
        </Button>
    );
}

export default function PrintingSettingsPage() {
    const searchParams = useSearchParams();
    const branchId = searchParams.get('branchId');
    const { getBranchById, restaurantId } = useRestaurantData();
    const [branch, setBranch] = useState<Branch | null>(null);
    const [printSettings, setPrintSettings] = useState<PrintSettings>(defaultPrintSettings);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (branchId) {
            getBranchById(branchId).then((b) => {
                setBranch(b);
                if (b?.printSettings) {
                    setPrintSettings({
                        ...defaultPrintSettings,
                        ...b.printSettings,
                    });
                }
                setIsLoading(false);
            });
        }
    }, [branchId]);

    const handleFormAction = async (formData: FormData) => {
        const newFormData = new FormData();
        newFormData.append('printSettings', JSON.stringify(printSettings));
        newFormData.append('branchId', branchId!);
        newFormData.append('restaurantId', restaurantId);
        
        await updateSettingsAction(newFormData);
        toast({
            title: "Settings Saved",
            description: "Your printing settings have been updated.",
        });
    };

    const handleSettingChange = (field: keyof PrintSettings, value: PrintSize | number) => {
        setPrintSettings(prev => ({ ...prev, [field]: value }));
    };
    
    if (isLoading || !branch) {
        return <div>Loading print settings...</div>;
    }

    return (
        <form action={handleFormAction}>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Printing Settings for {branch.name}</CardTitle>
                    <CardDescription>
                        Configure the paper size for your printed invoices and kitchen order tickets.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-4">
                        <Label className="text-base font-medium">Invoice Print Size</Label>
                        <RadioGroup
                            value={printSettings.invoicePrintSize}
                            onValueChange={(value: PrintSize) => handleSettingChange('invoicePrintSize', value)}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="a4" id="invoice-a4" />
                                <Label htmlFor="invoice-a4">A4 / US Letter</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="thermal80mm" id="invoice-thermal" />
                                <Label htmlFor="invoice-thermal">80mm Thermal Receipt</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="custom" id="invoice-custom" />
                                <Label htmlFor="invoice-custom">Custom (mm)</Label>
                            </div>
                        </RadioGroup>
                         {printSettings.invoicePrintSize === 'custom' && (
                            <div className="pl-6 pt-2">
                                <Label htmlFor="invoice-custom-width">Custom Width (mm)</Label>
                                <Input
                                    id="invoice-custom-width"
                                    type="number"
                                    value={printSettings.invoiceCustomWidth || 80}
                                    onChange={(e) => handleSettingChange('invoiceCustomWidth', parseInt(e.target.value, 10))}
                                    className="mt-1 w-32"
                                />
                            </div>
                        )}
                    </div>
                     <Separator />
                     <div className="space-y-4">
                        <Label className="text-base font-medium">Kitchen Ticket Print Size</Label>
                        <RadioGroup
                            value={printSettings.kitchenTicketPrintSize}
                             onValueChange={(value: PrintSize) => handleSettingChange('kitchenTicketPrintSize', value)}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="a4" id="kitchen-a4" />
                                <Label htmlFor="kitchen-a4">A4 / US Letter</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="thermal80mm" id="kitchen-thermal" />
                                <Label htmlFor="kitchen-thermal">80mm Thermal Receipt</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="custom" id="kitchen-custom" />
                                <Label htmlFor="kitchen-custom">Custom (mm)</Label>
                            </div>
                        </RadioGroup>
                         {printSettings.kitchenTicketPrintSize === 'custom' && (
                            <div className="pl-6 pt-2">
                                <Label htmlFor="kitchen-custom-width">Custom Width (mm)</Label>
                                <Input
                                    id="kitchen-custom-width"
                                    type="number"
                                    value={printSettings.kitchenTicketCustomWidth || 80}
                                    onChange={(e) => handleSettingChange('kitchenTicketCustomWidth', parseInt(e.target.value, 10))}
                                    className="mt-1 w-32"
                                />
                            </div>
                        )}
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
