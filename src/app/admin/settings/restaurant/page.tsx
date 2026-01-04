
'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { RestaurantSettings } from '@/lib/definitions';
import { updateSettingsAction } from '@/lib/actions';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRestaurantData } from '@/lib/client-data';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save Settings'}
        </Button>
    );
}

export default function RestaurantSettingsPage() {
    const { getSettings, restaurantId } = useRestaurantData();
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (restaurantId) {
            getSettings().then(setSettings);
        }
    }, [restaurantId]);

    const handleFormAction = async (formData: FormData) => {
        formData.append('restaurantId', restaurantId);
        await updateSettingsAction(formData);
        toast({
            title: "Settings Saved",
            description: "Your restaurant settings have been updated.",
        });
    };
    
    if (!settings) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Restaurant Details</CardTitle>
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
            <Card>
            <CardHeader>
                <CardTitle className="font-headline">Restaurant Details</CardTitle>
                <CardDescription>
                Manage your restaurant's global public information. This will be used as a default for new branches.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="restaurantName">Restaurant Name</Label>
                    <Input id="restaurantName" name="restaurantName" defaultValue={settings.restaurantName} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="restaurantAddress">Default Address</Label>
                    <Textarea id="restaurantAddress" name="restaurantAddress" defaultValue={settings.restaurantAddress} />
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
