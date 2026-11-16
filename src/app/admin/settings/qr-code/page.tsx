'use client';
import { Suspense, useEffect, useState } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/app/admin/auth-provider';
import { AdminPageSkeleton } from '@/components/skeletons';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save QR Code Settings'}
        </Button>
    );
}

function QRCodeSettingsContent() {
    const searchParams = useSearchParams();
    const branchId = searchParams.get('branchId');
    const { user } = useAuth();
    const { getBranchById, getSettings, restaurantId } = useRestaurantData();
    const [branch, setBranch] = useState<Branch | null>(null);
    const [qrCodeLogoPreview, setQrCodeLogoPreview] = useState<string | null>(null);
    const [restaurantPrintLogoPreview, setRestaurantPrintLogoPreview] = useState<string | null>(null);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [dynamicQrAllowed, setDynamicQrAllowed] = useState(true);
    const [restaurantDefaultDuration, setRestaurantDefaultDuration] = useState(300);
    const [multipleGuestEnabled, setMultipleGuestEnabled] = useState(false);
    const [otpAllowed, setOtpAllowed] = useState(true);
    const [requireCustomerPhoneOTP, setRequireCustomerPhoneOTP] = useState(false);

    const canEditSettings = Boolean(
        user?.isSuperAdmin ||
        user?.role === 'Admin' ||
        user?.role === 'Manager' ||
        user?.permissions?.settingsQr?.edit
    );

    useEffect(() => {
        if (branchId) {
            Promise.all([getBranchById(branchId), getSettings(undefined)]).then(([b, restaurantSettings]) => {
                setBranch(b);
                if (b) {
                    setQrCodeLogoPreview(b.qrCodeLogo || null);
                    setRestaurantPrintLogoPreview(b.printSettings?.restaurantPrintLogo || null);
                    setMultipleGuestEnabled(Boolean(b.multipleGuestEnabled));
                    setRequireCustomerPhoneOTP(Boolean(b.posSettings?.enableDineInOTP));
                }
                setDynamicQrAllowed(restaurantSettings?.dynamicQrEnabled ?? true);
                setOtpAllowed(restaurantSettings?.dineInOtpEnabled ?? true);
                setRestaurantDefaultDuration(restaurantSettings?.dynamicQrDuration ?? 300);
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, [branchId, getBranchById, getSettings]);

    const handleFormAction = async (formData: FormData) => {
        if (!canEditSettings) {
            toast({
                variant: 'destructive',
                title: 'Unauthorized',
                description: 'Only authorized supervisors or administrators can modify these settings.',
            });
            return;
        }
        if (qrCodeLogoPreview) {
            formData.append('qrCodeLogo', qrCodeLogoPreview);
        } else {
            formData.append('qrCodeLogo', 'null');
        }

        const currentPrintSettings = branch?.printSettings || {};
        formData.append('printSettings', JSON.stringify({
            ...currentPrintSettings,
            restaurantPrintLogo: restaurantPrintLogoPreview,
        }));

        const currentPosSettings = branch?.posSettings || { cashDenominations: [10, 20, 50, 100], enableOnScreenKeyboard: false };
        formData.append('posSettings', JSON.stringify({
            ...currentPosSettings,
            enableDineInOTP: requireCustomerPhoneOTP,
        }));

        formData.append('multipleGuestEnabled', String(multipleGuestEnabled));
        formData.append('restaurantId', restaurantId);
        if (user?.id) formData.append('actorUserId', user.id);

        const res = await updateSettingsAction(formData);
        if (res?.message) {
            toast({ variant: 'destructive', title: 'Error', description: res.message });
            return;
        }
        toast({ title: 'Settings Saved', description: 'Your QR code settings have been updated.' });
    };

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: React.Dispatch<React.SetStateAction<string | null>>
    ) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setter(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    if (isLoading) {
        return <AdminPageSkeleton label="Loading QR code settings" />;
    }

    if (!branch) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">QR Code Customization</CardTitle>
                    <CardDescription>Could not load settings for the selected branch.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed text-center">
                        <p className="text-muted-foreground">Please select a valid branch from the main settings page.</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" asChild>
                        <Link href="/admin/settings">Back to Settings</Link>
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <form action={handleFormAction}>
            <input type="hidden" name="branchId" value={branch.id} />
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">QR Code Customization — {branch.name}</CardTitle>
                    <CardDescription>
                        Customize the appearance and behaviour of QR codes for this branch.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">

                    {/* ── Colours ── */}
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
                                        const t = document.getElementById('qrCodeColor') as HTMLInputElement;
                                        if (t) t.value = e.target.value;
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
                                        const t = document.getElementById('qrCodeBackgroundColor') as HTMLInputElement;
                                        if (t) t.value = e.target.value;
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* ── Dynamic QR duration ── */}
                    {dynamicQrAllowed && (
                        <div className="space-y-2">
                            <Label htmlFor="dynamicQrDuration">Dynamic QR Code Duration (timeout)</Label>
                            <div className="flex items-center gap-3 max-w-xs">
                                <Input
                                    id="dynamicQrDuration"
                                    name="dynamicQrDuration"
                                    type="number"
                                    min={30}
                                    max={86400}
                                    step={30}
                                    defaultValue={branch.dynamicQrDuration ?? restaurantDefaultDuration}
                                />
                                <span className="text-sm text-muted-foreground whitespace-nowrap">seconds</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                How long a dynamic QR code is valid before it auto-rotates and the old one expires.
                                Restaurant default: {restaurantDefaultDuration} s. Minimum: 30 s. Leave empty to use the restaurant default.
                            </p>
                        </div>
                    )}

                    <Separator />

                    {/* ── QR Ordering Behaviour ── */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">QR Ordering Behaviour</h3>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="multipleGuestSwitch" className="text-base">
                                    Multiple Guest
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Allow multiple customers to scan the same QR code and create independent guest sessions. When OFF, only one active session is permitted per QR/table at a time.
                                </p>
                            </div>
                            <Switch
                                id="multipleGuestSwitch"
                                checked={multipleGuestEnabled}
                                disabled={!canEditSettings}
                                onCheckedChange={setMultipleGuestEnabled}
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="requireCustomerPhoneOTPSwitch" className="text-base">
                                    Require Customer Phone OTP
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    When ON, customers must verify their mobile number via SMS OTP before ordering. When OFF, customers can order without phone OTP verification.
                                </p>
                            </div>
                            <Switch
                                id="requireCustomerPhoneOTPSwitch"
                                checked={otpAllowed && requireCustomerPhoneOTP}
                                disabled={!otpAllowed || !canEditSettings}
                                onCheckedChange={setRequireCustomerPhoneOTP}
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* ── Print logo ── */}
                    <div className="space-y-2">
                        <Label htmlFor="print-logo">Restaurant Logo (for Printing)</Label>
                        <Input
                            id="print-logo"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, setRestaurantPrintLogoPreview)}
                        />
                        <p className="text-xs text-muted-foreground">Displayed above the QR code on printed materials.</p>
                        {restaurantPrintLogoPreview && (
                            <div className="mt-4 flex flex-col items-start gap-2">
                                <div className="relative w-32 h-32 border rounded-md p-2">
                                    <Image src={restaurantPrintLogoPreview} alt="Restaurant Logo Preview" fill style={{ objectFit: 'contain' }} />
                                </div>
                                <Button variant="link" size="sm" className="text-destructive h-auto p-0" type="button" onClick={() => setRestaurantPrintLogoPreview(null)}>
                                    Remove Logo
                                </Button>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* ── Embedded QR logo ── */}
                    <div className="space-y-2">
                        <Label htmlFor="logo">QR Code Logo (Embedded)</Label>
                        <Input
                            id="logo"
                            name="logoFile"
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, setQrCodeLogoPreview)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Small logo placed in the centre of the QR code. Use a square PNG with a transparent background for best results.
                        </p>
                        {qrCodeLogoPreview && (
                            <div className="mt-4 flex flex-col items-center gap-2">
                                <div className="relative w-24 h-24 border rounded-md p-2">
                                    <Image src={qrCodeLogoPreview} alt="Logo preview" fill style={{ objectFit: 'contain' }} />
                                </div>
                                <Button variant="link" size="sm" className="text-destructive" type="button" onClick={() => setQrCodeLogoPreview(null)}>
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

export default function QRCodeSettingsPage() {
    return (
        <Suspense fallback={<AdminPageSkeleton label="Loading QR code settings" />}>
            <QRCodeSettingsContent />
        </Suspense>
    );
}
