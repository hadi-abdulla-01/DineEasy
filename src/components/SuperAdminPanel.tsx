

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/admin/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Building2,
    Plus,
    Mail,
    Users,
    Trash2,
    Eye,
    EyeOff,
    LogOut
} from 'lucide-react';
import { createAuthUser } from '@/lib/auth';
import { generateUserEmail } from '@/lib/auth-utils';
import { createRestaurant, getAllRestaurants, deleteRestaurant } from '@/lib/restaurant-management';
import Link from 'next/link';
import type { AppUser } from '@/lib/definitions';

export default function SuperAdminPanel() {
    const { logout } = useAuth();
    const [restaurants, setRestaurants] = useState<Array<{
        id: string;
        name: string;
        createdAt: string;
        isActive: boolean;
    }>>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Form state
    const [restaurantName, setRestaurantName] = useState('');
    const [restaurantId, setRestaurantId] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadRestaurants();
    }, []);

    const loadRestaurants = async () => {
        try {
            setIsLoading(true);
            const data = await getAllRestaurants();
            setRestaurants(data);
        } catch (err) {
            console.error('Error loading restaurants:', err);
        } finally {
            setIsLoading(false);
        }
    };

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
            // Generate admin email
            const adminEmail = generateUserEmail('admin', restaurantId, true);

            // Create Firebase Auth user first
            const authResult = await createAuthUser(adminEmail, adminPassword, {
                username: 'admin',
                password: adminPassword, // Stored for reference
                role: 'Admin',
                categories: ['All'],
                branchId: '', // Will be set after restaurant creation
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
            });

            if (!authResult.success) {
                setError(authResult.error || 'Failed to create admin user');
                setIsCreating(false);
                return;
            }

            // Create restaurant with admin user
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <Building2 className="w-10 h-10 text-red-600" />
                            Super Admin Panel
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-2">
                            Manage all restaurants and their main administrators
                        </p>
                    </div>
                    <div className="flex gap-3">
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

                {/* Restaurants List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-center text-slate-500">Loading restaurants...</p>
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
                                <Link href={`/admin/superadmin/restaurants/${restaurant.id}`} key={restaurant.id} className="block rounded-lg transition-all hover:shadow-xl hover:-translate-y-1">
                                    <Card className="h-full cursor-pointer">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <CardTitle className="flex items-center gap-2">
                                                        <Building2 className="w-5 h-5 text-red-600" />
                                                        {restaurant.name}
                                                    </CardTitle>
                                                    <p className="text-sm text-slate-500 mt-1">Restaurant</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleDeleteRestaurant(restaurant.id);
                                                    }}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <Mail className="w-4 h-4" />
                                                <span className="font-mono text-xs">
                                                    {adminEmail}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <Users className="w-4 h-4" />
                                                <span>
                                                    Admin can create branches & users
                                                </span>
                                            </div>
                                            <div className="pt-3 border-t">
                                                <p className="text-xs text-slate-500">Restaurant ID: {restaurant.id}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
