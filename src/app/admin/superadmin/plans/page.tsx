
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit, Star, ArrowLeft, LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { createSubscriptionPlan, getSubscriptionPlans, updateSubscriptionPlan, deleteSubscriptionPlan, type SubscriptionPlan } from '@/lib/server-actions';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ALL_PERMISSIONS_CONFIG } from '@/lib/permissions';
import { Checkbox } from '@/components/ui/checkbox';
import type { NavMenuKey, UserPermissions } from '@/lib/definitions';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const getCurrencySymbol = (currency: string | undefined) => {
    if (currency === 'USD') return '$';
    if (currency === 'INR') return '₹';
    if (currency === 'EUR') return '€';
    return currency ? `${currency} ` : '$';
}

function PlanForm({
    plan,
    onSave,
    onCancel,
    isSaving
}: {
    plan?: SubscriptionPlan | null;
    onSave: (data: Omit<SubscriptionPlan, 'id'>) => void;
    onCancel: () => void;
    isSaving: boolean;
}) {
    const [name, setName] = useState(plan?.name || '');
    const [price, setPrice] = useState(plan ? (plan.price / 100).toString() : '');
    const [currency, setCurrency] = useState(plan?.currency || 'USD');
    const [description, setDescription] = useState(plan?.description || '');
    const [permissions, setPermissions] = useState<UserPermissions>(plan?.permissions || {});

    const handlePermissionChange = (menu: NavMenuKey, right: 'view' | 'create' | 'edit' | 'delete', value: boolean) => {
        setPermissions(prev => {
            const newPermissions = JSON.parse(JSON.stringify(prev));
            if (!newPermissions[menu]) newPermissions[menu] = {};
            
            const menuPermissions = newPermissions[menu]!;
            (menuPermissions as any)[right] = value;

            if (right === 'view' && !value) {
                Object.keys(menuPermissions).forEach(key => (menuPermissions as any)[key] = false);
            } else if (right !== 'view' && value) {
                menuPermissions.view = true;
            }
            return newPermissions;
        });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name,
            price: Math.round(parseFloat(price) * 100), // Store in cents
            currency,
            description,
            permissions
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="planName">Plan Name</Label>
                <Input id="planName" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="planCurrency">Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger id="planCurrency">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="INR">INR (₹)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="planPrice">Price (per month)</Label>
                    <Input id="planPrice" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="planDescription">Description</Label>
                <Textarea id="planDescription" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            
            <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="border rounded-lg max-h-80 overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-1/3">Feature</TableHead>
                                <TableHead className="text-center">View</TableHead>
                                <TableHead className="text-center">Create</TableHead>
                                <TableHead className="text-center">Edit</TableHead>
                                <TableHead className="text-center">Delete</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ALL_PERMISSIONS_CONFIG.map(menu => {
                                const availableRights = ['view', 'create', 'edit', 'delete'];
                                const currentPerms = permissions[menu.key] || {};
                                return (
                                    <TableRow key={menu.key}>
                                        <TableCell className="font-medium">{menu.label}</TableCell>
                                        {availableRights.map(right => (
                                            <TableCell key={right} className="text-center">
                                                {menu.rights.includes(right as any) ? (
                                                    <Checkbox
                                                        checked={currentPerms[right as keyof typeof currentPerms] || false}
                                                        onCheckedChange={(checked) => handlePermissionChange(menu.key, right as any, !!checked)}
                                                    />
                                                ) : <span className="text-muted-foreground">-</span>}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? <><LoaderCircle className="animate-spin mr-2"/>Saving...</> : 'Save Plan'}
                </Button>
            </DialogFooter>
        </form>
    );
}

export default function SubscriptionPlansPage() {
    const { toast } = useToast();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

    const fetchPlans = async () => {
        setIsLoading(true);
        const fetchedPlans = await getSubscriptionPlans();
        setPlans(fetchedPlans);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleSavePlan = async (data: Omit<SubscriptionPlan, 'id'>) => {
        setIsSaving(true);
        const action = editingPlan ? updateSubscriptionPlan.bind(null, editingPlan.id) : createSubscriptionPlan;
        const result = await action(data);

        if (result.success) {
            toast({ title: `Plan ${editingPlan ? 'updated' : 'created'} successfully` });
            setIsFormOpen(false);
            setEditingPlan(null);
            await fetchPlans();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
        setIsSaving(false);
    };

    const handleDeletePlan = async (planId: string) => {
        if (confirm('Are you sure you want to delete this plan? This cannot be undone.')) {
            const result = await deleteSubscriptionPlan(planId);
            if (result.success) {
                toast({ title: 'Plan deleted' });
                await fetchPlans();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        }
    };

    const handleEditClick = (plan: SubscriptionPlan) => {
        setEditingPlan(plan);
        setIsFormOpen(true);
    };

    const handleAddNewClick = () => {
        setEditingPlan(null);
        setIsFormOpen(true);
    };
    
    return (
         <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                 <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/admin/superadmin">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                <Star className="w-8 h-8 text-red-600" />
                                Subscription Plan Management
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                               Create and manage subscription tiers for your restaurants.
                            </p>
                        </div>
                    </div>
                     <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={handleAddNewClick}>
                                <Plus className="mr-2 h-4 w-4"/> New Plan
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                            <DialogHeader>
                                <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
                                <DialogDescription>Define the details and permissions for this subscription plan.</DialogDescription>
                            </DialogHeader>
                            <PlanForm
                                plan={editingPlan}
                                onSave={handleSavePlan}
                                onCancel={() => setIsFormOpen(false)}
                                isSaving={isSaving}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Existing Plans</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-48 flex items-center justify-center">
                                <LoaderCircle className="animate-spin" />
                            </div>
                        ) : plans.length === 0 ? (
                            <p className="text-muted-foreground text-center">No subscription plans created yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {plans.map(plan => (
                                    <Card key={plan.id}>
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <div>
                                                <CardTitle>{plan.name}</CardTitle>
                                                <CardDescription>{getCurrencySymbol(plan.currency)}{(plan.price / 100).toFixed(2)} / month</CardDescription>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => handleEditClick(plan)}>
                                                    <Edit className="h-4 w-4 mr-2"/>Edit
                                                </Button>
                                                 <Button variant="destructive" size="sm" onClick={() => handleDeletePlan(plan.id)}>
                                                    <Trash2 className="h-4 w-4 mr-2"/>Delete
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm">{plan.description}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
