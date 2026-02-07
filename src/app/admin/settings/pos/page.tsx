
'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Branch, POSSettings } from '@/lib/definitions';
import { updateSettingsAction } from '@/lib/actions';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useRestaurantData } from '@/lib/client-data';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

const defaultPosSettings: POSSettings = {
    cashDenominations: [10, 20, 50, 100],
    enableOnScreenKeyboard: false,
    enableDineInOTP: false,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save POS Settings'}
        </Button>
    );
}

export default function PosSettingsPage() {
    const searchParams = useSearchParams();
    const branchId = searchParams.get('branchId');
    const { getBranchById, restaurantId } = useRestaurantData();
    const [branch, setBranch] = useState<Branch | null>(null);
    const [posSettings, setPosSettings] = useState<POSSettings>(defaultPosSettings);
    const [newDenomination, setNewDenomination] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if(branchId) {
            getBranchById(branchId).then(b => {
                setBranch(b);
                if (b) {
                    setPosSettings({
                        ...defaultPosSettings,
                        ...(b.posSettings || {}),
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
        newFormData.append('posSettings', JSON.stringify(posSettings));
        newFormData.append('branchId', branchId!);
        newFormData.append('restaurantId', restaurantId);

        await updateSettingsAction(newFormData);
        toast({
            title: "Settings Saved",
            description: "Your POS settings have been updated.",
        });
    };

    const addDenomination = () => {
        const value = parseInt(newDenomination, 10);
        if (!isNaN(value) && value > 0 && !posSettings.cashDenominations.includes(value)) {
            setPosSettings(prev => ({
                ...prev,
                cashDenominations: [...prev.cashDenominations, value].sort((a,b) => a-b)
            }));
            setNewDenomination('');
        }
    };

    const removeDenomination = (denominationToRemove: number) => {
        setPosSettings(prev => ({
            ...prev,
            cashDenominations: prev.cashDenominations.filter(d => d !== denominationToRemove)
        }));
    };
    
    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">POS Settings</CardTitle>
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
                   <CardTitle className="font-headline">POS Settings</CardTitle>
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
                    <CardTitle className="font-headline">POS Settings for {branch.name}</CardTitle>
                    <CardDescription>
                        Configure cash denominations and other options for the Point of Sale screen.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <Label>Cash Denominations</Label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                value={newDenomination}
                                onChange={(e) => setNewDenomination(e.target.value)}
                                placeholder="e.g., 10, 20, 50"
                            />
                            <Button type="button" onClick={addDenomination}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                         <Label>Current Denominations</Label>
                         {posSettings.cashDenominations.length > 0 ? (
                            <div className="flex flex-wrap gap-2 rounded-md border p-4">
                                {posSettings.cashDenominations.map(denom => (
                                    <div key={denom} className="flex items-center justify-between bg-muted px-3 py-1 rounded-md">
                                        <span className="font-medium">{denom}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeDenomination(denom)}
                                            className="text-destructive hover:text-destructive h-6 w-6 ml-2"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                         ) : (
                            <div className="text-center text-sm text-muted-foreground border-2 border-dashed rounded-lg p-8">
                                No cash denominations added yet.
                            </div>
                         )}
                    </div>

                    <Separator />
                    
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">On-Screen Keyboard</h3>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="onScreenKeyboardSwitch" className="text-base">
                                    Enable Virtual Keyboard
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Shows a keyboard on-screen when double-clicking input fields on the POS screen.
                                </p>
                            </div>
                            <Switch
                                id="onScreenKeyboardSwitch"
                                checked={posSettings.enableOnScreenKeyboard}
                                onCheckedChange={(checked) => setPosSettings(prev => ({...prev, enableOnScreenKeyboard: checked}))}
                            />
                        </div>
                    </div>

                    <Separator />
                    
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Dine-in OTP Verification</h3>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="enableDineInOTPSwitch" className="text-base">
                                    Enable OTP for Dine-in Orders
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    If enabled, customers must enter an OTP sent to staff devices before they can place an order.
                                </p>
                            </div>
                            <Switch
                                id="enableDineInOTPSwitch"
                                checked={posSettings.enableDineInOTP}
                                onCheckedChange={(checked) => setPosSettings(prev => ({...prev, enableDineInOTP: checked}))}
                            />
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
