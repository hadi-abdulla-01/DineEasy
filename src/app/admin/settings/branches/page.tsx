
'use client';
import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Branch } from '@/lib/definitions';
import { createBranchAction, deleteBranchAction, setMainBranchAction } from '@/lib/actions';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Star } from 'lucide-react';
import Link from 'next/link';
import { useRestaurantData } from '@/lib/client-data';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Adding...' : 'Add Branch'}
            <PlusCircle className="ml-2 h-4 w-4" />
        </Button>
    );
}

export default function BranchManagementPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const { getBranches, restaurantId } = useRestaurantData();

    const fetchBranches = async () => {
        if(restaurantId) {
            const branchData = await getBranches();
            setBranches(branchData);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, [restaurantId]);

    const handleAddBranch = async (formData: FormData) => {
        formData.append('restaurantId', restaurantId);
        await createBranchAction(formData);
        toast({ title: "Branch Created", description: "The new branch has been added." });
        formRef.current?.reset();
        fetchBranches();
    };

    const handleDeleteBranch = async (branchId: string, isMain: boolean) => {
        if (isMain) {
            toast({ variant: "destructive", title: "Cannot Delete Main Branch", description: "Please set another branch as main before deleting this one." });
            return;
        }
        await deleteBranchAction(branchId, restaurantId);
        toast({ title: "Branch Deleted" });
        fetchBranches();
    };

    const handleSetMainBranch = async (branchId: string) => {
        await setMainBranchAction(branchId, restaurantId);
        toast({ title: "Main Branch Updated" });
        fetchBranches();
    }

    if (!restaurantId) return <div>Loading...</div>;

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Add New Branch</CardTitle>
                    <CardDescription>Create a new branch for your restaurant.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form ref={formRef} action={handleAddBranch} className="flex gap-4 items-end">
                        <div className="flex-grow space-y-2">
                            <Label htmlFor="branchName">Branch Name</Label>
                            <Input id="branchName" name="branchName" placeholder="e.g., Downtown Branch" required />
                        </div>
                        <SubmitButton />
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Manage Branches</CardTitle>
                    <CardDescription>View, edit, or delete existing branches.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {branches.map(branch => (
                            <div key={branch.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                                <span className="font-medium">{branch.name}</span>
                                <div className="flex items-center gap-2">
                                    {branch.isMain && (
                                        <div className="flex items-center gap-1 text-yellow-500 text-sm font-semibold">
                                            <Star className="h-4 w-4 fill-current" />
                                            <span>Main</span>
                                        </div>
                                    )}
                                    <Button
                                        variant={branch.isMain ? "secondary" : "outline"}
                                        size="sm"
                                        onClick={() => handleSetMainBranch(branch.id)}
                                        disabled={branch.isMain}
                                    >
                                        Set as Main
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteBranch(branch.id, branch.isMain)}
                                        disabled={branch.isMain}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {branches.length === 0 && (
                            <p className="text-muted-foreground text-center py-8">No branches created yet.</p>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" asChild>
                        <Link href="/admin/settings">Back to Settings</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
