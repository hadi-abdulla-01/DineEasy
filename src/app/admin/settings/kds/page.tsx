
'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { Branch, KdsSettings } from '@/lib/definitions';
import { updateSettingsAction } from '@/lib/actions';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useRestaurantData } from '@/lib/client-data';
import { Palette, Utensils, ShoppingBag, Globe, Music } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const defaultKdsSettings: KdsSettings = {
    enableSoundAlerts: true,
    notificationSound: 'https://cdn.pixabay.com/audio/2022/03/15/audio_165a732296.mp3',
    orderTypeColors: {
        dineIn: '#FBBF24', // amber-400
        takeAway: '#3B82F6', // blue-500
        online: '#10B981', // emerald-500
    },
};

const SOUND_OPTIONS = [
    { name: 'Ting', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_165a732296.mp3' },
    { name: 'Chime', url: 'https://cdn.pixabay.com/audio/2022/11/17/audio_8226000305.mp3' },
    { name: 'Bell', url: 'https://cdn.pixabay.com/audio/2022/03/24/audio_323402489c.mp3' },
    { name: 'Beep', url: 'https://cdn.pixabay.com/audio/2021/08/04/audio_513291614f.mp3' },
    { name: 'Up', url: 'https://cdn.pixabay.com/audio/2022/11/22/audio_c3a3c22b13.mp3' },
    { name: 'Click', url: 'https://cdn.pixabay.com/audio/2022/01/21/audio_a1250239c8.mp3' },
];


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save KDS Settings'}
        </Button>
    );
}

export default function KdsSettingsPage() {
    const searchParams = useSearchParams();
    const branchId = searchParams.get('branchId');
    const { getBranchById, restaurantId } = useRestaurantData();
    const [branch, setBranch] = useState<Branch | null>(null);
    const [kdsSettings, setKdsSettings] = useState<KdsSettings>(defaultKdsSettings);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (branchId) {
            getBranchById(branchId).then((b) => {
                setBranch(b);
                if (b?.kdsSettings) {
                    setKdsSettings({
                        ...defaultKdsSettings,
                        ...b.kdsSettings,
                        orderTypeColors: {
                            ...defaultKdsSettings.orderTypeColors!,
                            ...(b.kdsSettings.orderTypeColors || {}),
                        },
                    });
                } else {
                    setKdsSettings(defaultKdsSettings);
                }
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, [branchId, getBranchById]);

    const handleFormAction = async (formData: FormData) => {
        const newFormData = new FormData();
        newFormData.append('kdsSettings', JSON.stringify(kdsSettings));
        newFormData.append('branchId', branchId!);
        newFormData.append('restaurantId', restaurantId);

        await updateSettingsAction(newFormData);
        toast({
            title: "Settings Saved",
            description: "Your KDS settings have been updated.",
        });
    };

    const handleSettingChange = (field: keyof KdsSettings, value: any) => {
        setKdsSettings(prev => ({ ...prev, [field]: value }));
    };
    
    const handleColorChange = (orderType: keyof NonNullable<KdsSettings['orderTypeColors']>, color: string) => {
        setKdsSettings(prev => ({
            ...prev,
            orderTypeColors: {
                ...prev.orderTypeColors!,
                [orderType]: color,
            }
        }));
    };

    const handleSoundChange = (value: string) => {
        handleSettingChange('notificationSound', value);
        // Play sound preview
        try {
            const audio = new Audio(value);
            audio.play().catch(error => console.error("Audio preview failed:", error));
        } catch (error) {
            console.error("Could not play audio:", error);
        }
    };


    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">KDS Settings</CardTitle>
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
                  <CardTitle className="font-headline">KDS Settings</CardTitle>
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
                    <CardTitle className="font-headline flex items-center gap-2">
                        <Palette className="h-6 w-6 text-primary" />
                        Kitchen Display Settings for {branch.name}
                    </CardTitle>
                    <CardDescription>
                        Customize sound alerts and order colors for the kitchen screen.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="soundAlertsSwitch" className="text-base">
                                Enable Sound Alerts
                            </Label>
                            <CardDescription>
                                Play a sound for new incoming orders in the kitchen view.
                            </CardDescription>
                        </div>
                        <Switch
                            id="soundAlertsSwitch"
                            checked={kdsSettings.enableSoundAlerts}
                            onCheckedChange={(checked) => handleSettingChange('enableSoundAlerts', checked)}
                        />
                    </div>
                    
                    {kdsSettings.enableSoundAlerts && (
                        <div className="space-y-2 pl-4">
                            <Label htmlFor="notificationSound" className="flex items-center gap-2"><Music className="h-4 w-4"/> Notification Sound</Label>
                            <Select
                                value={kdsSettings.notificationSound}
                                onValueChange={handleSoundChange}
                            >
                                <SelectTrigger id="notificationSound" className="w-full md:w-1/2">
                                    <SelectValue placeholder="Select a sound" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SOUND_OPTIONS.map(sound => (
                                        <SelectItem key={sound.url} value={sound.url}>{sound.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    
                    <Separator />

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Order Type Colors</h3>
                        <CardDescription>
                            Assign colors to order cards to quickly identify them.
                        </CardDescription>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="dineInColor" className="flex items-center gap-2"><Utensils className="h-4 w-4"/> Dine-in Order Color</Label>
                                <div className="relative">
                                    <Input
                                        id="dineInColor"
                                        value={kdsSettings.orderTypeColors?.dineIn || '#FBBF24'}
                                        onChange={(e) => handleColorChange('dineIn', e.target.value)}
                                        className="pl-12"
                                    />
                                    <Input
                                        type="color"
                                        value={kdsSettings.orderTypeColors?.dineIn || '#FBBF24'}
                                        onChange={(e) => handleColorChange('dineIn', e.target.value)}
                                        className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-10 p-1 border-none cursor-pointer bg-transparent"
                                    />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="takeAwayColor" className="flex items-center gap-2"><ShoppingBag className="h-4 w-4"/> Take-away Order Color</Label>
                                <div className="relative">
                                    <Input
                                        id="takeAwayColor"
                                        value={kdsSettings.orderTypeColors?.takeAway || '#3B82F6'}
                                        onChange={(e) => handleColorChange('takeAway', e.target.value)}
                                        className="pl-12"
                                    />
                                    <Input
                                        type="color"
                                        value={kdsSettings.orderTypeColors?.takeAway || '#3B82F6'}
                                        onChange={(e) => handleColorChange('takeAway', e.target.value)}
                                        className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-10 p-1 border-none cursor-pointer bg-transparent"
                                    />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="onlineColor" className="flex items-center gap-2"><Globe className="h-4 w-4"/> Online Order Color</Label>
                                 <div className="relative">
                                    <Input
                                        id="onlineColor"
                                        value={kdsSettings.orderTypeColors?.online || '#10B981'}
                                        onChange={(e) => handleColorChange('online', e.target.value)}
                                        className="pl-12"
                                    />
                                    <Input
                                        type="color"
                                        value={kdsSettings.orderTypeColors?.online || '#10B981'}
                                        onChange={(e) => handleColorChange('online', e.target.value)}
                                        className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-10 p-1 border-none cursor-pointer bg-transparent"
                                    />
                                </div>
                            </div>
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
