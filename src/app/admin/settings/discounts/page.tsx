
'use client';
import { useState, useEffect } from 'react';
import type { Discount, Branch, MenuItem } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Tag, Calendar, Clock, Repeat, ShoppingBasket } from 'lucide-react';
import { useRestaurantData } from '@/lib/client-data';
import { useSearchParams } from 'next/navigation';
import { deleteDiscountAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { DiscountForm } from '@/components/discount-form';

export default function DiscountSettingsPage() {
    const searchParams = useSearchParams();
    const branchId = searchParams.get('branchId');
    const { getDiscounts, getBranchById, getMenuItems, restaurantId } = useRestaurantData();
    const { toast } = useToast();

    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [branch, setBranch] = useState<Branch | null>(null);
    const [menuCategories, setMenuCategories] = useState<string[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

    useEffect(() => {
        if (branchId) {
            getBranchById(branchId).then(setBranch);
            getDiscounts(branchId).then(setDiscounts);
            getMenuItems(branchId).then(items => {
                setMenuItems(items);
                const categories = Array.from(new Set(items.map(item => item.category)));
                setMenuCategories(categories);
            });
        }
    }, [branchId, getBranchById, getDiscounts, getMenuItems]);

    const handleFormSuccess = () => {
        setIsFormOpen(false);
        setEditingDiscount(null);
        if (branchId) {
            getDiscounts(branchId).then(setDiscounts); // Refresh list
        }
    };

    const handleAddNew = () => {
        setEditingDiscount(null);
        setIsFormOpen(true);
    };

    const handleEdit = (discount: Discount) => {
        setEditingDiscount(discount);
        setIsFormOpen(true);
    };

    const handleDelete = async (discountId: string) => {
        if (!branchId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Branch information is missing.' });
            return;
        }
        if (confirm('Are you sure you want to delete this discount?')) {
            await deleteDiscountAction(discountId, branchId, restaurantId);
            toast({ title: 'Discount Deleted' });
            if (branchId) {
                getDiscounts(branchId).then(setDiscounts);
            }
        }
    };

    if (!branchId) {
        return <p>Please select a branch to manage discounts.</p>;
    }

    if (isFormOpen) {
        return (
            <DiscountForm
                branchId={branchId}
                restaurantId={restaurantId}
                menuCategories={menuCategories}
                menuItems={menuItems}
                onFormSuccess={handleFormSuccess}
                onCancel={() => setIsFormOpen(false)}
                existingDiscount={editingDiscount}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-headline font-bold">Discount Management</h1>
                    <p className="text-muted-foreground mt-2">Create and manage discounts for {branch?.name}.</p>
                </div>
                <Button onClick={handleAddNew}>
                    <Plus className="mr-2 h-4 w-4" /> Add Discount
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Configured Discounts</CardTitle>
                    <CardDescription>View, edit, or delete existing discounts.</CardDescription>
                </CardHeader>
                <CardContent>
                    {discounts.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No discounts created yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {discounts.map(discount => (
                                <Card key={discount.id} className="p-4 flex flex-col md:flex-row justify-between md:items-center">
                                    <div className="flex-1 space-y-2 mb-4 md:mb-0">
                                        <div className="flex items-center gap-4">
                                            <h3 className="font-semibold text-lg">{discount.name}</h3>
                                            <Badge variant={discount.isActive ? 'default' : 'secondary'}>
                                                {discount.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{discount.description}</p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                             {discount.applicability === 'categories' && discount.applicableCategories && discount.applicableCategories.length > 0 && (
                                                <div className="flex items-center gap-1.5"><Tag className="w-4 h-4"/> Categories: {discount.applicableCategories.join(', ')}</div>
                                            )}
                                            {discount.applicability === 'items' && discount.applicableItems && discount.applicableItems.length > 0 && (
                                                 <div className="flex items-center gap-1.5"><ShoppingBasket className="w-4 h-4"/> Items: {discount.applicableItems.length} selected</div>
                                            )}
                                            {discount.startDate && (
                                                <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4"/> {discount.startDate} to {discount.endDate}</div>
                                            )}
                                            {discount.startTime && (
                                                <div className="flex items-center gap-1.5"><Clock className="w-4 h-4"/> {discount.startTime} - {discount.endTime}</div>
                                            )}
                                             {discount.daysOfWeek && discount.daysOfWeek.length > 0 && (
                                                <div className="flex items-center gap-1.5"><Repeat className="w-4 h-4"/> {discount.daysOfWeek.join(', ')}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-shrink-0 items-center gap-2">
                                        <div className="bg-primary/10 text-primary font-bold px-4 py-2 rounded-md">
                                            {discount.type === 'percentage' ? `${discount.value}% OFF` : `$${discount.value} OFF`}
                                        </div>
                                        <Button variant="outline" size="icon" onClick={() => handleEdit(discount)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="destructive" size="icon" onClick={() => handleDelete(discount.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
