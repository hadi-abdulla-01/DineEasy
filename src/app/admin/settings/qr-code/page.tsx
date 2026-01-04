
'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Branch } from '@/lib/definitions';
import { updateSettingsAction } from '@/lib/actions';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useRestaurantData } from '@/lib/client-data';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save QR Code Settings'}
        </Button>
    );
}

export default function QRCodeSettingsPage() {
    const searchParams = useSearchParams();
    const branchId = searchParams.get('branchId');
    const { getBranchById, restaurantId } = useRestaurantData();
    const [branch, setBranch] = useState<Branch | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if(branchId) {
            getBranchById(branchId).then(b => {
                setBranch(b);
                if (b?.qrCodeLogo) {
                    setLogoPreview(b.qrCodeLogo);
                }
            });
        }
    }, [branchId]);

    const handleFormAction = async (formData: FormData) => {
        if (logoPreview) {
            formData.append('qrCodeLogo', logoPreview);
        } else {
            formData.append('qrCodeLogo', 'null'); // Indicate removal
        }
        formData.append('restaurantId', restaurantId);

        await updateSettingsAction(formData);
        toast({
            title: "Settings Saved",
            description: "Your QR code settings have been updated.",
        });
    };

    if (!branch) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">QR Code Customization</CardTitle>
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
                    <CardTitle className="font-headline">QR Code Customization for {branch.name}</CardTitle>
                    <CardDescription>
                        Customize the appearance of the QR codes for this branch.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="qrCodeColor">QR Code Color</Label>
                            <div className="relative">
                                <Input 
                                    id="qrCodeColor" 
                                    name="qrCodeColor" 
                                    defaultValue={branch.qrCodeColor || '#000000'} 
                                    className="pl-10"
                                />
                                <Input 
                                    type="color" 
                                    defaultValue={branch.qrCodeColor || '#000000'}
                                    className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 border-none cursor-pointer"
                                    onChange={(e) => {
                                        const textInput = document.getElementById('qrCodeColor') as HTMLInputElement;
                                        if (textInput) textInput.value = e.target.value;
                                    }}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="qrCodeBackgroundColor">Background Color</Label>
                             <div className="relative">
                                <Input 
                                    id="qrCodeBackgroundColor" 
                                    name="qrCodeBackgroundColor" 
                                    defaultValue={branch.qrCodeBackgroundColor || '#FFFFFF'} 
                                    className="pl-10"
                                />
                                <Input 
                                    type="color" 
                                    defaultValue={branch.qrCodeBackgroundColor || '#FFFFFF'}
                                    className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 border-none cursor-pointer"
                                    onChange={(e) => {
                                        const textInput = document.getElementById('qrCodeBackgroundColor') as HTMLInputElement;
                                        if (textInput) textInput.value = e.target.value;
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="logo">QR Code Logo</Label>
                        <Input id="logo" name="logoFile" type="file" accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                setLogoPreview(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                            }
                        }} />
                        <p className="text-xs text-muted-foreground">Upload a square logo for the center of the QR code. For best results, use a simple PNG with a transparent background.</p>
                        {logoPreview && (
                            <div className="mt-4 flex flex-col items-center gap-2">
                                <div className="relative w-24 h-24 border rounded-md p-2">
                                    <Image src={logoPreview} alt="Logo preview" fill objectFit="contain" />
                                </div>
                                <Button variant="link" size="sm" className="text-destructive" type="button" onClick={() => setLogoPreview(null)}>
                                    Remove Logo
                                </Button>
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
