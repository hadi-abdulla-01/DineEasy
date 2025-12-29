

'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Branch } from '@/lib/definitions';
import { getBranchById } from '@/lib/data';
import { updateSettingsAction } from '@/lib/actions';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : 'Save Platforms'}
        </Button>
    );
}

export default function PlatformSettingsPage() {
    const searchParams = useSearchParams();
    const branchId = searchParams.get('branchId');
    const [branch, setBranch] = useState<Branch | null>(null);
    const [platforms, setPlatforms] = useState<string[]>([]);
    const [newPlatform, setNewPlatform] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        if(branchId) {
            getBranchById(branchId).then(b => {
                setBranch(b);
                setPlatforms(b?.onlineOrderPlatforms || []);
                setIsLoading(false);
            });
        }
    }, [branchId]);

    const handleFormAction = async (formData: FormData) => {
        const platformsString = JSON.stringify(platforms);
        const newFormData = new FormData();
        newFormData.append('onlineOrderPlatforms', platformsString);
        newFormData.append('branchId', branchId!);

        await updateSettingsAction(newFormData);
        toast({
            title: "Settings Saved",
            description: "Your online order platforms have been updated.",
        });
    };

    const addPlatform = () => {
        if (newPlatform && !platforms.includes(newPlatform)) {
            setPlatforms([...platforms, newPlatform]);
            setNewPlatform('');
        }
    };

    const removePlatform = (platformToRemove: string) => {
        setPlatforms(platforms.filter(p => p !== platformToRemove));
    };

    if (isLoading || !branch) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Platform Management</CardTitle>
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
                    <CardTitle className="font-headline">Platform Management for {branch.name}</CardTitle>
                    <CardDescription>
                        Add or remove online ordering platforms for this branch.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <Label>Add New Platform</Label>
                        <div className="flex gap-2">
                            <Input
                                value={newPlatform}
                                onChange={(e) => setNewPlatform(e.target.value)}
                                placeholder="e.g., Zomato"
                            />
                            <Button type="button" onClick={addPlatform}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                         <Label>Current Platforms</Label>
                         {platforms.length > 0 ? (
                            <div className="space-y-2 rounded-md border p-4">
                                {platforms.map(platform => (
                                    <div key={platform} className="flex items-center justify-between">
                                        <span className="font-medium">{platform}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removePlatform(platform)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                         ) : (
                            <div className="text-center text-sm text-muted-foreground border-2 border-dashed rounded-lg p-8">
                                No platforms added yet.
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
