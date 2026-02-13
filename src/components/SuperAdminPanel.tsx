
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
    LoaderCircle, Edit, Save, X, KeyRound, Settings, ClipboardList, ToggleRight, Megaphone, Check, CircleDollarSign, FileText, Star,
    Calendar as CalendarIcon
} from 'lucide-react';
import { generateUserEmail } from '@/lib/auth-utils';
import {
    createRestaurant, getAllRestaurants, deleteRestaurant, getGlobalStats,
    getGlobalUserCount, getRestaurantLeaderboard, updateRestaurantStatus,
    updateRestaurantName, getSubscriptionPlans, type SubscriptionPlan, updateRestaurantValidity,
    updateRestaurantSubscriptionPlan,
    getAdminForRestaurant
} from '@/lib/server-actions';
import Link from 'next/link';
import type { AppUser, NavMenuKey, UserPermissions, BillingStatus } from '@/lib/definitions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, formatDistanceToNow } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PasswordCell } from './password-cell';
import { ALL_PERMISSIONS_CONFIG } from '@/lib/permissions';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';


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

const getCurrencySymbol = (currency: string | undefined) => {
    if (currency === 'USD') return '$';
    if (currency === 'INR') return '₹';
    if (currency === 'EUR') return '€';
    return currency ? `${currency} ` : '$';
}

export default function SuperAdminPanel() {
    const { logout } = useAuth();
    const { toast } = useToast();
    const [restaurants, setRestaurants] = useState<Awaited<ReturnType<typeof getAllRestaurants>>>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // View state
    const [view, setView] = useState<'dashboard' | 'restaurants' | 'settings'>('dashboard');

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
    const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [validityDates, setValidityDates] = useState<Record<string, Date | undefined>>({});


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
            const initialDates: Record<string, Date | undefined> = {};
            data.forEach(r => {
                if (r.nextBillingDate) {
                    initialDates[r.id] = new Date(r.nextBillingDate);
                }
            });
            setValidityDates(initialDates);
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
    
    const loadPlans = async () => {
        const plans = await getSubscriptionPlans();
        setSubscriptionPlans(plans);
        if (plans.length > 0 && !selectedPlanId) {
            setSelectedPlanId(plans[0].id);
        }
    }

    useEffect(() => {
        if (view === 'dashboard') {
            loadDashboardData();
        } else if (view === 'restaurants') {
            loadRestaurants();
            loadPlans(); // Also load plans for the restaurant list view
        } else {
            setIsLoading(false);
        }
    }, [view]);
    
    useEffect(() => {
        if (showCreateForm) {
            loadPlans();
        }
    }, [showCreateForm]);

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

        if (!restaurantName || !restaurantId || !adminPassword || !selectedPlanId) {
            setError('All fields are required');
            return;
        }

        if (adminPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsCreating(true);

        try {
            const restaurantResult = await createRestaurant(
                restaurantId,
                restaurantName,
                { username: 'admin', password: adminPassword, role: 'Admin', categories: ['All'], branchId: '' },
                selectedPlanId
            );

            if (restaurantResult.success) {
                const adminEmail = generateUserEmail('admin', restaurantId, true);
                setSuccess(`Restaurant created successfully! Admin can login with: ${adminEmail}`);
                setRestaurantName('');
                setRestaurantId('');
                setAdminPassword('');
                setShowCreateForm(false);
                if (view === 'restaurants') {
                    loadRestaurants();
                } else {
                    setView('restaurants');
                }
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
    
    const getBillingStatusBadge = (status: BillingStatus | undefined) => {
        switch (status) {
            case 'active': return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>;
            case 'trial': return <Badge variant="secondary" className="bg-blue-600 text-white hover:bg-blue-700">Trial</Badge>;
            case 'overdue': return <Badge variant="destructive">Overdue</Badge>;
            case 'cancelled': return <Badge variant="outline">Cancelled</Badge>;
            default: return <Badge variant="outline">N/A</Badge>;
        }
    };

    const handleDateChange = async (restaurantId: string, date: Date | undefined) => {
        if (!date) return;
        
        const previousDate = validityDates[restaurantId];
        setValidityDates(prev => ({...prev, [restaurantId]: date}));

        const result = await updateRestaurantValidity(restaurantId, date);
        if(result.success) {
            toast({ title: "Success", description: "Validity date updated." });
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error || "Failed to update validity date." });
            setValidityDates(prev => ({...prev, [restaurantId]: previousDate}));
        }
    };

    const handlePlanChange = async (restaurantId: string, newPlanId: string) => {
        const originalPlanId = restaurants.find(r => r.id === restaurantId)?.subscriptionPlanId;
        
        // Optimistic update
        setRestaurants(prev => prev.map(r => r.id === restaurantId ? { ...r, subscriptionPlanId: newPlanId === 'none' ? undefined : newPlanId } : r));

        const result = await updateRestaurantSubscriptionPlan(restaurantId, newPlanId);

        if (result.success) {
            toast({ title: 'Success', description: 'Restaurant plan updated successfully.' });
            loadRestaurants(); 
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to update plan.' });
            // Revert on failure
            setRestaurants(prev => prev.map(r => r.id === restaurantId ? { ...r, subscriptionPlanId: originalPlanId } : r));
        }
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
        <Card>
            <CardHeader>
                 <CardTitle>All Restaurants</CardTitle>
                 <CardDescription>Manage all restaurant accounts on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Subscription</TableHead>
                            <TableHead>Billing Status</TableHead>
                            <TableHead>Validity Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">
                                    <LoaderCircle className="mx-auto animate-spin" />
                                </TableCell>
                            </TableRow>
                        ) : restaurants.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">
                                    No restaurants found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            restaurants.map((restaurant) => {
                                return (
                                <TableRow key={restaurant.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <Link href={`/admin/superadmin/restaurants/${restaurant.id}`} className="font-medium hover:underline">{restaurant.name}</Link>
                                            <span className="text-xs text-muted-foreground font-mono">{restaurant.id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={restaurant.isActive}
                                                onCheckedChange={() => handleStatusToggle(restaurant.id, restaurant.isActive)}
                                                id={`status-switch-${restaurant.id}`}
                                            />
                                            <Label htmlFor={`status-switch-${restaurant.id}`} className={cn(restaurant.isActive ? 'text-green-600' : 'text-red-600')}>{restaurant.isActive ? 'Active' : 'Inactive'}</Label>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {subscriptionPlans.length > 0 ? (
                                            <Select
                                                value={restaurant.subscriptionPlanId || 'none'}
                                                onValueChange={(newPlanId) => handlePlanChange(restaurant.id, newPlanId)}
                                            >
                                                <SelectTrigger className="w-40 text-xs h-8">
                                                    <SelectValue placeholder="Select a plan" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">No Plan</SelectItem>
                                                    {subscriptionPlans.map(p => (
                                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <span>{subscriptionPlans.find(p => p.id === restaurant.subscriptionPlanId)?.name || 'N/A'}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {getBillingStatusBadge(restaurant.billingStatus as BillingStatus | undefined)}
                                    </TableCell>
                                    <TableCell>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {validityDates[restaurant.id] ? format(validityDates[restaurant.id]!, 'PP') : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={validityDates[restaurant.id]}
                                                    onSelect={(date) => handleDateChange(restaurant.id, date)}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleImpersonate(restaurant.id)}><KeyRound className="w-4 h-4 mr-2"/>Impersonate</Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteRestaurant(restaurant.id)}><Trash2 className="w-4 h-4 mr-2"/>Delete</Button>
                                    </TableCell>
                                </TableRow>
                            )})
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
    
    const renderSettings = () => (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">System, Configuration & Financials</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/admin/superadmin/plans">
                    <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-transform">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                               <Star className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <CardTitle>Subscription Plans</CardTitle>
                                <CardDescription>Manage subscription tiers and permissions.</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>
                 <Link href="/admin/superadmin/defaults">
                    <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-transform">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                               <ClipboardList className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <CardTitle>Default Templates</CardTitle>
                                <CardDescription>Manage default settings for new restaurants.</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>
                 <Link href="/admin/superadmin/billing">
                    <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-transform">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                               <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle>Platform Billing</CardTitle>
                                <CardDescription>View billing status for all restaurants.</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>
                <Link href="/admin/superadmin/revenue">
                    <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-transform">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                               <CircleDollarSign className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <CardTitle>Revenue Dashboard</CardTitle>
                                <CardDescription>View platform-wide revenue analytics.</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>
                <Card className="h-full cursor-not-allowed opacity-60">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <ToggleRight className="h-6 w-6 text-slate-500" />
                        </div>
                        <div>
                            <CardTitle>Feature Flags</CardTitle>
                            <CardDescription>Enable or disable features for the platform.</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
                <Card className="h-full cursor-not-allowed opacity-60">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <Megaphone className="h-6 w-6 text-slate-500" />
                        </div>
                        <div>
                            <CardTitle>Broadcast Announcements</CardTitle>
                            <CardDescription>Send messages to all restaurant admins.</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            </div>
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
                    <Button variant={view === 'settings' ? 'default' : 'ghost'} size="sm" onClick={() => setView('settings')} className="gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                        <Settings className="w-4 h-4" /> System Config
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    <div className="space-y-2">
                                        <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
                                        <Select value={selectedPlanId} onValueChange={setSelectedPlanId} required>
                                            <SelectTrigger id="subscriptionPlan">
                                                <SelectValue placeholder="Select a plan..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {subscriptionPlans.map(plan => (
                                                    <SelectItem key={plan.id} value={plan.id}>{plan.name} ({getCurrencySymbol(plan.currency)}{(plan.price / 100).toFixed(2)}/mo)</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="submit"
                                        disabled={isCreating}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        {isCreating ? <><LoaderCircle className="animate-spin mr-2"/> Creating...</> : 'Create Restaurant'}
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
                ) : view === 'restaurants' ? (
                    renderRestaurantList()
                ) : (
                    renderSettings()
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

    

    