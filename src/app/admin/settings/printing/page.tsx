
'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Branch, PrintSettings, PrintSize } from '@/lib/definitions';
import { updateSettingsAction } from '@/lib/actions';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { useSearchParams } from 'next/navigation';
import { useRestaurantData } from '@/lib/client-data';
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';

const defaultPrintSettings: PrintSettings = {
    invoicePrintSize: 'a4',
    invoiceCustomWidth: 80,
    kitchenTicketPrintSize: 'thermal80mm',
    kitchenTicketCustomWidth: 80,
    salesReportPrintSize: 'a4',
    salesReportCustomWidth: 210,
    invoiceFooterText: '',
    invoiceTitle: 'Invoice',
    showInvoiceTitle: true,
    showInvoiceFooter: true,
    showRestaurantAddress: true,
    showCustomerDetails: true,
    showLogoInInvoice: false,
    itemHeaderFontSize: 10,
    itemBodyFontSize: 9,
    showDineEzeeWatermark: false,
    invoiceLogo: undefined,
    showThankYouMessage: true,
    invoiceThankYouMessage: 'Thank you for your business!',
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
                if (b) {
                    setPrintSettings({
                        ...defaultPrintSettings,
                        ...(b.printSettings || {}),
                    });
                } else {
                    setPrintSettings(defaultPrintSettings);
                }
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, [branchId, getBranchById]);

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

    const handleSettingChange = (field: keyof PrintSettings, value: PrintSize | number | string | boolean | undefined | null) => {
        setPrintSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleSettingChange('invoiceLogo', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Printing Settings</CardTitle>
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
                   <CardTitle className="font-headline">Printing Settings</CardTitle>
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
                    <CardTitle className="font-headline">Printing Settings for {branch.name}</CardTitle>
                    <CardDescription>
                        Configure the paper size and templates for your printed documents.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Invoice Print Size */}
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

                    {/* Kitchen Ticket Print Size */}
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

                    <Separator />
                    
                    {/* Sales Report Print Size */}
                    <div className="space-y-4">
                        <Label className="text-base font-medium">Sales Report Print Size</Label>
                        <RadioGroup
                            value={printSettings.salesReportPrintSize}
                            onValueChange={(value: PrintSize) => handleSettingChange('salesReportPrintSize', value)}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="a4" id="sales-a4" />
                                <Label htmlFor="sales-a4">A4 / US Letter</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="thermal80mm" id="sales-thermal" />
                                <Label htmlFor="sales-thermal">80mm Thermal Receipt</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="custom" id="sales-custom" />
                                <Label htmlFor="sales-custom">Custom (mm)</Label>
                            </div>
                        </RadioGroup>
                         {printSettings.salesReportPrintSize === 'custom' && (
                            <div className="pl-6 pt-2">
                                <Label htmlFor="sales-custom-width">Custom Width (mm)</Label>
                                <Input
                                    id="sales-custom-width"
                                    type="number"
                                    value={printSettings.salesReportCustomWidth || 210}
                                    onChange={(e) => handleSettingChange('salesReportCustomWidth', parseInt(e.target.value, 10))}
                                    className="mt-1 w-32"
                                />
                            </div>
                        )}
                    </div>
                    
                    <Separator />

                    {/* Invoice Template Customization */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-semibold font-headline">Invoice Template Customization</h3>
                        <div className="space-y-4 rounded-lg border p-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="showInvoiceTitle"
                                    checked={printSettings.showInvoiceTitle}
                                    onCheckedChange={(checked) => handleSettingChange('showInvoiceTitle', checked)}
                                />
                                <Label htmlFor="showInvoiceTitle" className="cursor-pointer">Show Invoice Title</Label>
                            </div>
                            {printSettings.showInvoiceTitle && (
                                <div className="space-y-2 pl-8">
                                    <Label htmlFor="invoiceTitle">Invoice Title Text</Label>
                                    <Input
                                        id="invoiceTitle"
                                        placeholder="e.g., Tax Invoice"
                                        value={printSettings.invoiceTitle || ''}
                                        onChange={(e) => handleSettingChange('invoiceTitle', e.target.value)}
                                    />
                                </div>
                            )}
                            <Separator/>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="showInvoiceFooter"
                                    checked={printSettings.showInvoiceFooter}
                                    onCheckedChange={(checked) => handleSettingChange('showInvoiceFooter', checked)}
                                />
                                <Label htmlFor="showInvoiceFooter" className="cursor-pointer">Show Invoice Footer Text</Label>
                            </div>
                            {printSettings.showInvoiceFooter && (
                                <div className="space-y-2 pl-8">
                                    <Label htmlFor="invoiceFooterText">Invoice Footer Text</Label>
                                    <Textarea
                                        id="invoiceFooterText"
                                        placeholder="e.g., Follow us on social media! @yourrestaurant"
                                        value={printSettings.invoiceFooterText || ''}
                                        onChange={(e) => handleSettingChange('invoiceFooterText', e.target.value)}
                                    />
                                </div>
                            )}
                            <Separator/>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="showThankYouMessage"
                                    checked={printSettings.showThankYouMessage}
                                    onCheckedChange={(checked) => handleSettingChange('showThankYouMessage', checked)}
                                />
                                <Label htmlFor="showThankYouMessage" className="cursor-pointer">Show "Thank You" Message</Label>
                            </div>
                            {printSettings.showThankYouMessage && (
                                <div className="space-y-2 pl-8">
                                    <Label htmlFor="invoiceThankYouMessage">"Thank You" Message Text</Label>
                                    <Input
                                        id="invoiceThankYouMessage"
                                        placeholder="e.g., Thank you for your business!"
                                        value={printSettings.invoiceThankYouMessage || ''}
                                        onChange={(e) => handleSettingChange('invoiceThankYouMessage', e.target.value)}
                                    />
                                </div>
                            )}
                            <Separator/>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                                 <div className="flex items-center space-x-2">
                                    <Switch
                                        id="showRestaurantAddress"
                                        checked={printSettings.showRestaurantAddress}
                                        onCheckedChange={(checked) => handleSettingChange('showRestaurantAddress', checked)}
                                    />
                                    <Label htmlFor="showRestaurantAddress" className="cursor-pointer">
                                        Show Address
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="showCustomerDetails"
                                        checked={printSettings.showCustomerDetails}
                                        onCheckedChange={(checked) => handleSettingChange('showCustomerDetails', checked)}
                                    />
                                    <Label htmlFor="showCustomerDetails" className="cursor-pointer">
                                        Show Customer Details
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="showLogoInInvoice"
                                        checked={!!printSettings.showLogoInInvoice}
                                        onCheckedChange={(checked) => handleSettingChange('showLogoInInvoice', checked)}
                                    />
                                    <Label htmlFor="showLogoInInvoice" className="cursor-pointer">
                                        Show Logo
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="showDineEzeeWatermark"
                                        checked={!!printSettings.showDineEzeeWatermark}
                                        onCheckedChange={(checked) => handleSettingChange('showDineEzeeWatermark', checked)}
                                    />
                                    <Label htmlFor="showDineEzeeWatermark" className="cursor-pointer">
                                        Show DineEzee Watermark
                                    </Label>
                                </div>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="itemHeaderFontSize">Table Header Font Size (pt)</Label>
                                    <Input
                                        id="itemHeaderFontSize"
                                        type="number"
                                        value={printSettings.itemHeaderFontSize}
                                        onChange={(e) => handleSettingChange('itemHeaderFontSize', parseInt(e.target.value, 10))}
                                    />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="itemBodyFontSize">Table Body Font Size (pt)</Label>
                                    <Input
                                        id="itemBodyFontSize"
                                        type="number"
                                        value={printSettings.itemBodyFontSize}
                                        onChange={(e) => handleSettingChange('itemBodyFontSize', parseInt(e.target.value, 10))}
                                    />
                                </div>
                            </div>
                            
                            {/* New Logo Upload Section */}
                            {printSettings.showLogoInInvoice && (
                                <div className="space-y-2 pt-4 border-t">
                                    <Label htmlFor="logo">Invoice Logo</Label>
                                    <Input id="logo" name="logoFile" type="file" accept="image/*" onChange={handleLogoChange} />
                                    <p className="text-xs text-muted-foreground">
                                        Upload a logo to display on your invoices. For best results, use a PNG with a transparent background.
                                    </p>
                                    {printSettings.invoiceLogo && (
                                        <div className="mt-4 flex flex-col items-start gap-2">
                                            <div className="relative w-32 h-32 border rounded-md p-2">
                                                <Image src={printSettings.invoiceLogo} alt="Logo preview" fill objectFit="contain" />
                                            </div>
                                            <Button variant="link" size="sm" className="text-destructive h-auto p-0" type="button" onClick={() => handleSettingChange('invoiceLogo', null)}>
                                                Remove Logo
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
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
