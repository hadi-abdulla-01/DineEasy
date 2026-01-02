
'use client';
import { useState, useEffect, useMemo } from 'react';
import type { Order, RemoteOrder, RestaurantSettings, Branch, MenuItem } from '@/lib/definitions';
import { getOrders, getRemoteOrders, getSettings, getBranches, getMainBranch, getMenuItems, createBranch, getKitchenUsers, createKitchenUser } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { DollarSign, ShoppingCart, Users, TrendingUp, LoaderCircle } from 'lucide-react';
import { useAuth } from './auth-provider';

type CombinedOrder = (Order | RemoteOrder) & { type: 'Dine-in' | 'Remote' };

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

async function seedInitialData() {
    console.log("Checking if initial data seeding is required...");
    const branches = await getBranches();
    if (branches.length === 0) {
        console.log("No branches found. Seeding initial 'Main Branch'.");
        const mainBranch = await createBranch('Main Branch', true);

        const users = await getKitchenUsers();
        if (users.length === 0) {
            console.log("No users found. Seeding initial 'admin' user.");
            await createKitchenUser({
                username: 'admin',
                password: 'admin123', // You can change this after logging in
                categories: ['All'],
                role: 'Admin',
                branchId: mainBranch.id,
                permissions: {
                    dashboard: { view: true },
                    tableOrder: { view: true },
                    tables: { view: true, create: true, edit: true, delete: true },
                    menu: { view: true, create: true, edit: true, delete: true },
                    kitchen: { view: true },
                    sales: { view: true },
                    salesHistory: { view: true, edit: true, delete: true },
                    onlineOrders: { view: true, create: true },
                    takeAway: { view: true, create: true },
                    userManagement: { view: true, create: true, edit: true, delete: true },
                    settings: { view: true, edit: true },
                }
            });
            console.log("Initial admin user created.");
        }
        console.log("Initial data seeding complete.");
        return true; // Indicates data was seeded
    }
    console.log("Initial data already exists. No seeding required.");
    return false; // Indicates no seeding was done
}


export default function AdminDashboardPage() {
    const { user } = useAuth();
    const [allOrders, setAllOrders] = useState<CombinedOrder[]>([]);
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        async function fetchData() {
            setIsLoading(true);

            // Seed initial data if necessary, only for Admin users
            if (user.role === 'Admin') {
                const wasSeeded = await seedInitialData();
                if (wasSeeded) {
                    // If we just seeded, we need to refetch some data to get the new branch
                    window.location.reload(); // Simple way to force a full refresh
                    return;
                }
            }
            
            // 1. Determine which branch settings to load.
            let settingsBranchId = user.branchId;
            if (user.role === 'Admin' && !settingsBranchId) {
                const mainBranch = await getMainBranch();
                if (mainBranch) {
                    settingsBranchId = mainBranch.id;
                }
            }

            // If we still don't have a branch ID for settings, we can't proceed.
            if (!settingsBranchId) {
                console.error("Could not determine branch for fetching settings.");
                setIsLoading(false);
                return;
            }

            const fetchedSettings = await getSettings(settingsBranchId);
            setSettings(fetchedSettings);

            // 2. Determine which branch's data to fetch. Admin gets all.
            const dataBranchId = user.role === 'Admin' ? undefined : user.branchId;

            const [fetchedMenuItems, dineInOrders, remoteOrders] = await Promise.all([
                getMenuItems(dataBranchId),
                getOrders(dataBranchId),
                getRemoteOrders(dataBranchId)
            ]);

            setMenuItems(fetchedMenuItems);
            
            const combined: CombinedOrder[] = [
                ...dineInOrders.map(o => ({ ...o, type: 'Dine-in' as const })),
                ...remoteOrders.map(o => ({ ...o, type: 'Remote' as const })),
            ];
            
            setAllOrders(combined.filter(o => 'status' in o ? o.status === 'completed' : true));
            setIsLoading(false);
        }
        
        fetchData();
    }, [user, user?.branchId]); // Depend on user and branchId for stability

    const stats = useMemo(() => {
        const totalRevenue = allOrders.reduce((acc, order) => acc + (order.total || 0), 0);
        const totalOrders = allOrders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        return { totalRevenue, totalOrders, averageOrderValue };
    }, [allOrders]);

    const mostOrderedItems = useMemo(() => {
        const itemCounts: { [key: string]: { name: string, count: number } } = {};
        allOrders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    if(item.status !== 'cancelled') {
                        if (itemCounts[item.menuItemId]) {
                            itemCounts[item.menuItemId].count += item.quantity;
                        } else {
                            const menuItem = menuItems.find(m => m.id === item.menuItemId);
                            itemCounts[item.menuItemId] = { name: menuItem?.name || item.name, count: item.quantity };
                        }
                    }
                });
            }
        });

        return Object.values(itemCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [allOrders, menuItems]);


    if (isLoading || !settings || !user) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        );
    }
  
    const currencySymbol = settings.currencySymbol || '$';
    const currencyDecimalPlaces = settings.currencyDecimalPlaces ?? 2;

    return (
        <div className="space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Welcome, {user.username}!</CardTitle>
                    <CardDescription>Here's a quick overview of your restaurant's performance.</CardDescription>
                </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{currencySymbol}{stats.totalRevenue.toFixed(currencyDecimalPlaces)}</div>
                        <p className="text-xs text-muted-foreground">from all completed orders</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalOrders}</div>
                        <p className="text-xs text-muted-foreground">Completed orders</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{currencySymbol}{stats.averageOrderValue.toFixed(currencyDecimalPlaces)}</div>
                        <p className="text-xs text-muted-foreground">per completed order</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Item</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold truncate">{mostOrderedItems[0]?.name || 'N/A'}</div>
                        <p className="text-xs text-muted-foreground">{mostOrderedItems[0] ? `${mostOrderedItems[0].count} units sold` : 'No sales data'}</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-8">
                <CardHeader>
                    <CardTitle className="font-headline">Most Popular Items</CardTitle>
                    <CardDescription>Top 5 best-selling items from completed orders.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={mostOrderedItems}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    dataKey="count"
                                    nameKey="name"
                                >
                                    {mostOrderedItems.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                 <Tooltip
                                    cursor={{ fill: 'hsl(var(--accent))' }}
                                    content={<ChartTooltipContent
                                        formatter={(value, name) => `${value} units`}
                                        indicator="dot"
                                        nameKey="name"
                                    />}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
}
