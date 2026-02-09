'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/admin/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Building2, Plus, Mail, Users, Trash2, Eye, EyeOff, LogOut,
    DollarSign, ShoppingCart, TrendingUp, Activity, LayoutDashboard, List,
    LoaderCircle, Edit, Save, X, KeyRound
} from 'lucide-react';
import { createAuthUser } from '@/lib/auth';
import { generateUserEmail } from '@/lib/auth-utils';
import {
    createRestaurant, getAllRestaurants, deleteRestaurant, getGlobalStats,
    getGlobalUserCount, getRestaurantLeaderboard, updateRestaurantStatus,
    updateRestaurantName, getAdminForRestaurant
} from '@/lib/server-actions';
import Link from 'next/link';
import type { AppUser } from '@/lib/definitions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PasswordCell } from './password-cell';


function StatCard({ title, value, icon, description }: { title: string, value: string, icon: React.ReactNode, description: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}

export default function SuperAdminPanel() {
    const { logout } = useAuth();
    const { toast } = useToast();
    const [restaurants, setRestaurants] = useState<Array<{
        id: string;
        name: string;
        createdAt: string;
        isActive: boolean;
    }>>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // View state
    const [view, setView] = useState<'dashboard' | 'restaurants'>('dashboard');

    // Dashboard state
    const [dashboardData, setDashboardData] = useState<{
        newOrdersCount: number;
        totalRestaurants: number;
        totalUsers: number;
        leaderboard: { id: string; name: string; totalSales: number; orderCount: number }[];
        recentRestaurants: any[];
    } | null>(null);

    // Form state
    const [restaurantName, setRestaurantName] = useState('');
    const [restaurantId, setRestaurantId] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Edit and Impersonate State
    const [editingRestaurant, setEditingRestaurant] = useState<{ id: string; name: string } | null>(null);
    const [newName, setNewName] = useState('');
    const [credentialsToShow, setCredentialsToShow] = useState<AppUser | null>(null);
    const [isCredentialsLoading, setIsCredentialsLoading] = useState(false);


    const loadRestaurants = async () => {
        setIsLoading(true);
        try {
            const data = await getAllRestaurants();
            setRestaurants(data);
        } catch (err) {
            console.error('Error loading restaurants:', err);
            setError('Failed to load restaurants.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            const [
                stats,
                allRestaurants,
                userCount,
                board
            ] = await Promise.all([
                getGlobalStats(),
                getAllRestaurants(),
                getGlobalUserCount(),
                getRestaurantLeaderboard()
            ]);

            const sortedRestaurants = allRestaurants.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setDashboardData({
                newOrdersCount: stats.newOrdersCount,
                totalRestaurants: allRestaurants.length,
                totalUsers: userCount,
                leaderboard: board,
                recentRestaurants: sortedRestaurants.slice(0, 5),
            });

        } catch (err) {
            console.error('Error loading dashboard data:', err);
            setError("Failed to load dashboard data.");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (view === 'dashboard') {
            loadDashboardData();
        } else {
            loadRestaurants();
        }
    }, [view]);

    const handleRestaurantIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const sanitizedId = e.target.value
            .toLowerCase()
            .replace(/\s+/g, '-') // replace spaces with hyphens
            .replace(/[^a-z0-9-]/g, '') // remove any other invalid characters
            .replace(/--+/g, '-'); // collapse multiple hyphens
        setRestaurantId(sanitizedId);
    };

    const handleCreateRestaurant = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!restaurantName || !restaurantId || !adminPassword) {
            setError('All fields are required');
            return;
        }

        if (adminPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsCreating(true);

        try {
            const adminEmail = generateUserEmail('admin', restaurantId, true);

            const authResult = await createAuthUser(adminEmail, adminPassword, {
                username: 'admin',
                password: adminPassword,
                role: 'Admin',
                categories: ['All'],
                branchId: '',
                permissions: {
                    dashboard: { view: true },
                    pos: { view: true },
                    tableOrder: { view: true },
                    tables: { view: true, create: true, edit: true, delete: true },
                    menu: { view: true, create: true, edit: true, delete: true },
                    kitchen: { view: true },
                    sales: { view: true },
                    salesHistory: { view: true, edit: true, delete: true },
                    menuPerformance: { view: true },
                    onlineOrders: { view: true, create: true },
                    takeAway: { view: true, create: true },
                    userManagement: { view: true, create: true, edit: true, delete: true },
                    settings: { view: true, edit: true },
                }
            }, restaurantId);

            if (!authResult.success) {
                setError(authResult.error || 'Failed to create admin user');
                setIsCreating(false);
                return;
            }

            const restaurantResult = await createRestaurant(
                restaurantId,
                restaurantName,
                {
                    username: 'admin',
                    password: adminPassword,
                    role: 'Admin',
                    categories: ['All'],
                    branchId: '',
                    email: adminEmail,
                    firebaseUid: authResult.user?.firebaseUid || '',
                    permissions: {
                        dashboard: { view: true },
                        pos: { view: true },
                        tableOrder: { view: true },
                        tables: { view: true, create: true, edit: true, delete: true },
                        menu: { view: true, create: true, edit: true, delete: true },
                        kitchen: { view: true },
                        sales: { view: true },
                        salesHistory: { view: true, edit: true, delete: true },
                        menuPerformance: { view: true },
                        onlineOrders: { view: true, create: true },
                        takeAway: { view: true, create: true },
                        userManagement: { view: true, create: true, edit: true, delete: true },
                        settings: { view: true, edit: true },
                    }
                }
            );

            if (restaurantResult.success) {
                setSuccess(`Restaurant created successfully! Admin can login with: ${adminEmail}`);
                setRestaurantName('');
                setRestaurantId('');
                setAdminPassword('');
                setShowCreateForm(false);
                loadRestaurants();
            } else {
                setError(restaurantResult.error || 'Failed to create restaurant');
            }
        } catch (err: any) {
            console.error('Error creating restaurant:', err);
            setError(err.message || 'Failed to create restaurant');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteRestaurant = async (restaurantId: string) => {
        if (!confirm('Are you sure you want to delete this restaurant? This action cannot be undone and will delete all data.')) {
            return;
        }

        try {
            const result = await deleteRestaurant(restaurantId);
            if (result.success) {
                setSuccess('Restaurant deleted successfully');
                loadRestaurants();
            } else {
                setError(result.error || 'Failed to delete restaurant');
            }
        } catch (err) {
            console.error('Error deleting restaurant:', err);
            setError('Failed to delete restaurant');
        }
    };

    const handleStatusToggle = async (restaurantId: string, currentStatus: boolean) => {
        const originalStatus = currentStatus;
        setRestaurants(prev => prev.map(r => r.id === restaurantId ? { ...r, isActive: !originalStatus } : r));

        const result = await updateRestaurantStatus(restaurantId, !originalStatus);

        if (!result.success) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
            setRestaurants(prev => prev.map(r => r.id === restaurantId ? { ...r, isActive: originalStatus } : r));
        } else {
            toast({ title: 'Success', description: 'Restaurant status updated.' });
        }
    };

    const handleStartEditing = (restaurant: { id: string; name: string; }) => {
        setEditingRestaurant(restaurant);
        setNewName(restaurant.name);
    };

    const handleCancelEditing = () => {
        setEditingRestaurant(null);
        setNewName('');
    };

    const handleSaveName = async (restaurantId: string) => {
        if (!newName.trim() || !editingRestaurant) {
            toast({ variant: 'destructive', title: 'Name cannot be empty' });
            return;
        }
        const originalName = editingRestaurant.name;
        // Optimistic update
        setRestaurants(prev => prev.map(r => r.id === restaurantId ? { ...r, name: newName } : r));
        setEditingRestaurant(null);
        
        const result = await updateRestaurantName(restaurantId, newName);

        if (result.success) {
            toast({ title: 'Success', description: 'Restaurant name updated.' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
            // Revert on failure
            setRestaurants(prev => prev.map(r => r.id === restaurantId ? { ...r, name: originalName } : r));
        }
    };

    const handleImpersonate = async (restaurantId: string) => {
        setIsCredentialsLoading(true);
        setCredentialsToShow(null);
        const admin = await getAdminForRestaurant(restaurantId);
        if (admin) {
            setCredentialsToShow(admin);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not find an admin user for this restaurant.' });
        }
        setIsCredentialsLoading(false);
    };

    const renderDashboard = () => (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Total Restaurants" value={String(dashboardData?.totalRestaurants || 0)} icon={<Building2 className="h-4 w-4 text-muted-foreground" />} description="Currently on the platform" />
                <StatCard title="Active Users" value={String(dashboardData?.totalUsers || 0)} icon={<Users className="h-4 w-4 text-muted-foreground" />} description="Staff accounts created" />
                <StatCard title="New Orders (24h)" value={String(dashboardData?.newOrdersCount || 0)} icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />} description="New orders in the last day" />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-red-600" /> Restaurant Leaderboard</CardTitle>
                        <CardDescription>Top performing restaurants by total sales.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Restaurant</TableHead>
                                    <TableHead className="text-right">Total Sales</TableHead>
                                    <TableHead className="text-right">Total Orders</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dashboardData?.leaderboard.map(r => (
                                    <TableRow key={r.id}>
                                        <TableCell>
                                            <Link href={`/admin/superadmin/restaurants/${r.id}`} className="font-medium hover:underline">{r.name}</Link>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">${r.totalSales.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">{r.orderCount}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-red-600" /> Recent Activity</CardTitle>
                        <CardDescription>Latest restaurants to join the platform.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {dashboardData?.recentRestaurants.map(r => (
                            <div key={r.id} className="flex items-center gap-4">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                                    <Building2 className="w-4 h-4 text-slate-500"/>
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{r.name} joined</p>
                                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    const renderRestaurantList = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
                <Card className="col-span-full">
                    <CardContent className="pt-6 flex justify-center items-center h-48">
                        <LoaderCircle className="w-8 h-8 animate-spin text-red-600" />
                    </CardContent>
                </Card>
            ) : restaurants.length === 0 ? (
                <Card className="col-span-full">
                    <CardContent className="pt-6">
                        <p className="text-center text-slate-500">
                            No restaurants yet. Create your first one!
                        </p>
                    </CardContent>
                </Card>
            ) : (
                restaurants.map((restaurant) => {
                    const adminEmail = `admin@${restaurant.id}.dineezee`;
                    return (
                         <Card key={restaurant.id} className="flex flex-col">
                            <CardHeader>
                                {editingRestaurant?.id === restaurant.id ? (
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-red-600" />
                                        <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="h-9 flex-1" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSaveName(restaurant.id)} />
                                        <Button size="icon" className="h-9 w-9 bg-green-600 hover:bg-green-700" onClick={() => handleSaveName(restaurant.id)}><Save className="w-4 h-4" /></Button>
                                        <Button size="icon" variant="ghost" className="h-9 w-9" onClick={handleCancelEditing}><X className="w-4 h-4" /></Button>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between">
                                        <Link href={`/admin/superadmin/restaurants/${restaurant.id}`} className="block">
                                            <CardTitle className="flex items-center gap-2 hover:underline">
                                                <Building2 className="w-5 h-5 text-red-600" />
                                                {restaurant.name}
                                            </CardTitle>
                                        </Link>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStartEditing(restaurant)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="flex-grow space-y-3">
                                <p className="text-sm text-slate-500">
                                    Created: {formatDistanceToNow(new Date(restaurant.createdAt), { addSuffix: true })}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <Mail className="w-4 h-4" />
                                    <span className="font-mono text-xs break-all">
                                        {adminEmail}
                                    </span>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col items-start gap-4 p-4 border-t">
                                <div className="flex justify-between items-center w-full">
                                    <Label htmlFor={`active-switch-${restaurant.id}`} className="font-medium text-sm">
                                        Status
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">{restaurant.isActive ? 'Active' : 'Inactive'}</span>
                                        <Switch
                                            id={`active-switch-${restaurant.id}`}
                                            checked={restaurant.isActive}
                                            onCheckedChange={() => handleStatusToggle(restaurant.id, restaurant.isActive)}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full">
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => handleImpersonate(restaurant.id)}>
                                        <KeyRound className="w-4 h-4 mr-2" />
                                        Impersonate
                                    </Button>
                                    <Button variant="destructive" size="sm" className="w-full" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteRestaurant(restaurant.id); }}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    );
                })
            )}
        </div>
    );


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <Building2 className="w-10 h-10 text-red-600" />
                            Super Admin Panel
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-2">
                            Manage all restaurants and their main administrators
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Restaurant
                        </Button>
                        <Button
                            onClick={() => {
                                if (confirm('Are you sure you want to logout?')) {
                                    logout();
                                }
                            }}
                            variant="outline"
                            className="border-red-600 text-red-600 hover:bg-red-50"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
                 {/* View Toggler */}
                 <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-lg w-fit">
                    <Button variant={view === 'dashboard' ? 'default' : 'ghost'} size="sm" onClick={() => setView('dashboard')} className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Button>
                    <Button variant={view === 'restaurants' ? 'default' : 'ghost'} size="sm" onClick={() => setView('restaurants')} className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                        <List className="w-4 h-4" /> Restaurants
                    </Button>
                </div>


                {/* Success/Error Messages */}
                {success && (
                    <Card className="border-green-500 bg-green-50 dark:bg-green-900/20">
                        <CardContent className="pt-6">
                            <p className="text-green-700 dark:text-green-400">{success}</p>
                        </CardContent>
                    </Card>
                )}

                {error && (
                    <Card className="border-red-500 bg-red-50 dark:bg-red-900/20">
                        <CardContent className="pt-6">
                            <p className="text-red-700 dark:text-red-400">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Create Restaurant Form */}
                {showCreateForm && (
                    <Card className="border-2 border-red-200 dark:border-red-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                Create New Restaurant
                            </CardTitle>
                            <CardDescription>
                                Create a new restaurant and generate admin credentials
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateRestaurant} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="restaurantName">Restaurant Name</Label>
                                        <Input
                                            id="restaurantName"
                                            placeholder="e.g., Pizza Palace"
                                            value={restaurantName}
                                            onChange={(e) => setRestaurantName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="restaurantId">Restaurant ID</Label>
                                        <Input
                                            id="restaurantId"
                                            placeholder="e.g., pizza-palace"
                                            value={restaurantId}
                                            onChange={handleRestaurantIdChange}
                                            required
                                        />
                                        <p className="text-xs text-slate-500">
                                            Admin email will be: admin@{restaurantId || 'restaurantid'}.dineezee
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="adminPassword">Admin Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="adminPassword"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter admin password (min 6 characters)"
                                            value={adminPassword}
                                            onChange={(e) => setAdminPassword(e.target.value)}
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="submit"
                                        disabled={isCreating}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        {isCreating ? 'Creating...' : 'Create Restaurant'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setShowCreateForm(false);
                                            setError('');
                                            setSuccess('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <LoaderCircle className="w-8 h-8 animate-spin text-red-600" />
                    </div>
                ) : view === 'dashboard' ? (
                    renderDashboard()
                ) : (
                    renderRestaurantList()
                )}

            </div>
            
            <Dialog open={!!credentialsToShow} onOpenChange={() => setCredentialsToShow(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Admin Credentials for {credentialsToShow?.username}</DialogTitle>
                        <DialogDescription>Use these credentials in a separate incognito window to log in as this restaurant's admin.</DialogDescription>
                    </DialogHeader>
                    {isCredentialsLoading ? (
                        <div className="flex justify-center items-center h-24">
                             <LoaderCircle className="w-8 h-8 animate-spin text-red-600" />
                        </div>
                    ) : (
                        <div className="space-y-4 pt-4">
                            <div>
                                <Label>Admin Email</Label>
                                <Input readOnly value={credentialsToShow?.email} />
                            </div>
                            <div>
                                <Label>Password</Label>
                                <PasswordCell password={credentialsToShow?.password} />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setCredentialsToShow(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
