

'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { Branch, RestaurantSettings } from '@/lib/definitions';
import { updateSettingsAction } from '@/lib/actions';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useRestaurantData } from '@/lib/client-data';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save Floor Settings'}
        </Button>
    );
}

export default function FloorSettingsPage() {
    const searchParams = useSearchParams();
    const branchId = searchParams.get('branchId');
    const { getBranchById, restaurantId } = useRestaurantData();
    const [branch, setBranch] = useState<Branch | null>(null);
    const [multiFloorEnabled, setMultiFloorEnabled] = useState(false);
    const [floors, setFloors] = useState<string[]>([]);
    const [newFloor, setNewFloor] = useState('');
    const [defaultFloor, setDefaultFloor] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if (branchId) {
            getBranchById(branchId).then(b => {
                setBranch(b);
                setMultiFloorEnabled(b?.multiFloorEnabled || false);
                setFloors(b?.floors || []);
                setDefaultFloor(b?.defaultFloor || (b?.floors && b.floors.length > 0 ? b.floors[0] : ''));
                setIsLoading(false);
            });
        }
    }, [branchId, getBranchById]);

    const handleFormAction = async (formData: FormData) => {
        formData.append('multiFloorEnabled', String(multiFloorEnabled));
        formData.append('floors', JSON.stringify(floors));
        formData.append('defaultFloor', defaultFloor);
        formData.append('restaurantId', restaurantId);

        await updateSettingsAction(formData);
        toast({
            title: "Settings Saved",
            description: "Your floor settings have been updated.",
        });
    };

    const addFloor = () => {
        if (newFloor && !floors.includes(newFloor)) {
            const updatedFloors = [...floors, newFloor]
            setFloors(updatedFloors);
            if(updatedFloors.length === 1) {
                setDefaultFloor(newFloor);
            }
            setNewFloor('');
        }
    };

    const removeFloor = (floorToRemove: string) => {
        const updatedFloors = floors.filter(p => p !== floorToRemove);
        setFloors(updatedFloors);
        // If the removed floor was the default, reset the default floor to the first available, or empty string.
        if (defaultFloor === floorToRemove) {
            setDefaultFloor(updatedFloors.length > 0 ? updatedFloors[0] : '');
        }
    };

    if (isLoading || !branch) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Floor Management</CardTitle>
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
                    <CardTitle className="font-headline">Floor Management for {branch.name}</CardTitle>
                    <CardDescription>
                        Enable multiple floors, define their names, and set a default view.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="multiFloorEnabled" className="text-base">
                                Enable Multi-Floor Layout
                            </Label>
                            <CardDescription>
                                Turn this on to assign tables to different floors.
                            </CardDescription>
                        </div>
                        <Switch
                            id="multiFloorEnabled"
                            checked={multiFloorEnabled}
                            onCheckedChange={setMultiFloorEnabled}
                        />
                    </div>

                    {multiFloorEnabled && (
                        <div className="space-y-4">
                            <Label>Manage Floors</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={newFloor}
                                    onChange={(e) => setNewFloor(e.target.value)}
                                    placeholder="e.g., Ground Floor, Rooftop"
                                />
                                <Button type="button" onClick={addFloor}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Floor
                                </Button>
                            </div>
                            
                            {floors.length > 0 ? (
                                <div className="space-y-2 rounded-md border p-4">
                                    {floors.map(floor => (
                                        <div key={floor} className="flex items-center justify-between">
                                            <span className="font-medium">{floor}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeFloor(floor)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-sm text-muted-foreground border-2 border-dashed rounded-lg p-8">
                                    No floors added yet.
                                </div>
                            )}

                            <Separator />
                            
                            {floors.length > 1 && (
                                <div className="space-y-2 pt-2">
                                    <Label htmlFor="defaultFloor">Default Floor</Label>
                                    <Select value={defaultFloor} onValueChange={setDefaultFloor} disabled={floors.length === 0}>
                                        <SelectTrigger id="defaultFloor" className="w-full md:w-1/2">
                                            <SelectValue placeholder="Select a default floor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {floors.map(floor => (
                                                <SelectItem key={floor} value={floor}>{floor}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <CardDescription>
                                        This floor will be shown by default on the Table Order page.
                                    </CardDescription>
                                </div>
                            )}
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
