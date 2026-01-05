
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addMenuCategoryAction, removeMenuCategoryAction } from '@/lib/actions';
import { useAuth } from '../../auth-provider';
import type { RestaurantSettings } from '@/lib/definitions';
import { Plus, Trash2, Tag } from 'lucide-react';
import { useRestaurantData } from '@/lib/client-data';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';


export default function CategoriesPage() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [newCategory, setNewCategory] = useState('');
    const [error, setError] = useState('');
    const { getSettings, getMainBranch, restaurantId } = useRestaurantData();
    const [refetchToggle, setRefetchToggle] = useState(false);
    const [branchId, setBranchId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!restaurantId || !user) return;

        let activeBranchId: string | null = user?.branchId || null;

        if (!activeBranchId) {
            const urlBranchId = searchParams.get('branchId');
            if (urlBranchId) {
                activeBranchId = urlBranchId;
            } else {
                const mainBranch = await getMainBranch();
                activeBranchId = mainBranch?.id || null;
            }
        }

        setBranchId(activeBranchId);

        if (activeBranchId) {
            const freshSettings = await getSettings(activeBranchId);
            setSettings(freshSettings);
        }
    }, [user, searchParams, restaurantId, getMainBranch, getSettings]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refetchToggle]);

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!branchId || !newCategory.trim() || !restaurantId || !settings) return;

        const categoryToAdd = newCategory.trim();
        setError('');

        // Optimistic Update: Add to UI immediately
        const prevCategories = settings.menuCategories || [];
        setSettings({
            ...settings,
            menuCategories: [...prevCategories, categoryToAdd]
        });
        setNewCategory(''); // Clear input immediately

        const formData = new FormData();
        formData.append('branchId', branchId);
        formData.append('categoryName', categoryToAdd);
        formData.append('restaurantId', restaurantId);

        const result = await addMenuCategoryAction(formData);

        if (result?.message) {
            setError(result.message);
            // Revert on error
            setSettings({
                ...settings,
                menuCategories: prevCategories
            });
        } else {
            toast({
                title: "Category Added",
                description: `The category "${categoryToAdd}" has been successfully created.`,
            });
            setRefetchToggle(prev => !prev);
        }
    };

    const handleDeleteCategory = async (categoryName: string) => {
        if (!branchId || !restaurantId || !settings) return;

        setError('');

        // Optimistic Update: Remove from UI immediately
        const prevCategories = settings.menuCategories || [];
        setSettings({
            ...settings,
            menuCategories: prevCategories.filter(c => c !== categoryName)
        });

        const formData = new FormData();
        formData.append('branchId', branchId);
        formData.append('categoryName', categoryName);
        formData.append('restaurantId', restaurantId);

        const result = await removeMenuCategoryAction(formData);

        if (result?.message) {
            setError(result.message);
            // Revert on error
            setSettings({
                ...settings,
                menuCategories: prevCategories
            });
            toast({
                variant: "destructive",
                title: "Error Deleting Category",
                description: result.message,
            });
        } else {
            toast({
                title: "Category Deleted",
                description: `The category "${categoryName}" has been removed.`,
            });
            setRefetchToggle(prev => !prev);
        }
    };

    const categories = settings?.menuCategories || [];

    if (!user || !restaurantId) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-headline font-bold">Menu Categories</h1>
                <p className="text-muted-foreground mt-2">
                    Manage food categories for organizing your menu (Meals, Snacks, Beverages, etc.)
                </p>
            </div>

            {/* Add New Category */}
            <Card>
                <CardHeader>
                    <CardTitle>Add New Category</CardTitle>
                    <CardDescription>
                        Create a new category to organize your menu items
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddCategory} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="categoryName">Category Name *</Label>
                            <Input
                                id="categoryName"
                                placeholder="e.g., Appetizers, Main Course, Drinks"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        <Button type="submit">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Category
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Existing Categories */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Configured Categories</h2>
                {categories.length === 0 ? (
                    <Card>
                        <CardContent className="p-6 text-center text-muted-foreground">
                            No categories configured yet. Add your first category to get started.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map((category) => (
                            <Card key={category}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 p-2 rounded-lg">
                                                <Tag className="h-5 w-5 text-primary" />
                                            </div>
                                            <h3 className="font-semibold">{category}</h3>
                                        </div>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the <strong>{category}</strong> category.
                                                        If any menu items are using this category, you will not be able to delete it.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDeleteCategory(category)}
                                                        className="bg-destructive hover:bg-destructive/90"
                                                    >
                                                        Yes, delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
