
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
import { Switch } from '@/components/ui/switch';
import { useSearchParams } from 'next/navigation';
import { useRestaurantData } from '@/lib/client-data';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save Online Order Settings'}
        </Button>
    );
}

export default function OnlineOrderSettingsPage() {
    const searchParams = useSearchParams();
    const branchId = searchParams.get('branchId');
    const { getBranchById, restaurantId } = useRestaurantData();
    const [branch, setBranch] = useState<Branch | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if(branchId) {
            getBranchById(branchId).then(setBranch);
        }
    }, [branchId]);

    const handleFormAction = async (formData: FormData) => {
        const onlineOrderingEnabled = formData.get('onlineOrderingEnabledSwitch') === 'on';
        formData.append('onlineOrderingEnabled', String(onlineOrderingEnabled));
        formData.append('restaurantId', restaurantId);

        await updateSettingsAction(formData);
        toast({
            title: "Settings Saved",
            description: "Your online order settings have been updated.",
        });
        if(branchId) {
            getBranchById(branchId).then(setBranch);
        }
    };
    
    if (!branch) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Online Order Settings</CardTitle>
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
                    <CardTitle className="font-headline">Online Order Settings for {branch.name}</CardTitle>
                    <CardDescription>
                    Enable or disable online ordering and set delivery parameters for this branch.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="onlineOrderingEnabledSwitch" className="text-base">
                                Enable Online Ordering
                            </Label>
                            <CardDescription>
                                Turn this on to allow customers to place orders online for this branch.
                            </CardDescription>
                        </div>
                        <Switch
                            id="onlineOrderingEnabledSwitch"
                            name="onlineOrderingEnabledSwitch"
                            defaultChecked={branch.onlineOrderingEnabled}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="deliveryFee">Delivery Fee</Label>
                            <Input id="deliveryFee" name="deliveryFee" type="number" step="0.01" defaultValue={branch.deliveryFee} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="minimumOrderValue">Minimum Order Value</Label>
                            <Input id="minimumOrderValue" name="minimumOrderValue" type="number" step="0.01" defaultValue={branch.minimumOrderValue} />
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
