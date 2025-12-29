'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { addMenuCategoryAction, removeMenuCategoryAction } from '@/lib/actions';
import { useAuth } from '../../auth-provider';
import { getSettings, getMainBranch } from '@/lib/data';
import type { RestaurantSettings } from '@/lib/definitions';
import { Plus, Trash2, Tag } from 'lucide-react';

export default function CategoriesPage() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [branchId, setBranchId] = useState<string | null>(null);
    const [newCategory, setNewCategory] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchData() {
            let activeBranchId = user?.branchId;

            if (!activeBranchId) {
                const mainBranch = await getMainBranch();
                activeBranchId = mainBranch?.id || null;
            }

            setBranchId(activeBranchId);

            if (activeBranchId) {
                getSettings(activeBranchId).then(setSettings);
            }
        }
        fetchData();
    }, [user]);

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!branchId || !newCategory.trim()) return;

        setError('');
        const formData = new FormData();
        formData.append('branchId', branchId);
        formData.append('categoryName', newCategory.trim());

        const result = await addMenuCategoryAction(formData);

        if (result?.message) {
            setError(result.message);
        } else {
            // Refresh settings
            const updatedSettings = await getSettings(branchId);
            setSettings(updatedSettings);
            setNewCategory('');
        }
    };

    const handleDeleteCategory = async (categoryName: string) => {
        if (!branchId) return;
        if (!confirm(`Are you sure you want to delete the "${categoryName}" category?`)) return;

        setError('');
        const result = await removeMenuCategoryAction(branchId, categoryName);

        if (result?.message) {
            setError(result.message);
        } else {
            // Refresh settings
            const updatedSettings = await getSettings(branchId);
            setSettings(updatedSettings);
        }
    };

    const categories = settings?.menuCategories || [];

    if (!user) return <div>Loading...</div>;

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
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteCategory(category)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
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
