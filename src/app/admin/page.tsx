
'use client';
import { useState, useEffect, useMemo } from 'react';
import type { Order, RemoteOrder, RestaurantSettings, Branch, MenuItem } from '@/lib/definitions';
import { useRestaurantData } from '@/lib/client-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { DollarSign, ShoppingCart, Users, TrendingUp, LoaderCircle } from 'lucide-react';
import { useAuth } from './auth-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CombinedOrder = (Order | RemoteOrder) & { type: 'Dine-in' | 'Remote' };

const chartConfig = {
    revenue: {
        label: 'Revenue',
        color: 'hsl(var(--primary))',
    },
} satisfies ChartConfig;

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function AdminDashboardPage() {
    const { user } = useAuth();
    const { getOrders, getRemoteOrders, getSettings, getMenuItems, getMainBranch, getBranches, restaurantId } = useRestaurantData();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');

    // Determine if the user is a Global Admin (Admin role + No specific branch assigned, OR the 'admin' superuser)
    const isGlobalAdmin = (user?.role === 'Admin' && !user?.branchId) || user?.username?.toLowerCase() === 'admin';

    useEffect(() => {
        if (isGlobalAdmin && restaurantId) {
            getBranches().then(setBranches);
        }
    }, [isGlobalAdmin, restaurantId, getBranches]);

    const [allOrders, setAllOrders] = useState<CombinedOrder[]>([]);
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        async function fetchData() {
            setIsLoading(true);

            // Determine target branch based on user role and filter
            // If Global Admin: Use filter (undefined for 'all', or specific ID)
            // If Branch User: Always use their assigned branchId
            const targetBranchId = isGlobalAdmin
                ? (selectedBranchFilter === 'all' ? undefined : selectedBranchFilter)
                : user!.branchId; // user is guaranteed non-null here

            // Determine settings execution context
            // Default to target branch if selected, otherwise fallback to Main Branch
            let settingsBranchId = targetBranchId;
            if (!settingsBranchId) {
                const mainBranch = await getMainBranch();
                settingsBranchId = mainBranch?.id;
            }

            if (!settingsBranchId) {
                // Should not happen for valid restaurants.
                console.error("Could not determine settings context");
                setIsLoading(false);
                return;
            }

            const fetchedSettings = await getSettings(settingsBranchId);
            setSettings(fetchedSettings);

            const [fetchedMenuItems, dineInOrders, remoteOrders] = await Promise.all([
                getMenuItems(targetBranchId),
                getOrders(targetBranchId),
                getRemoteOrders(targetBranchId)
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
    }, [user, selectedBranchFilter, isGlobalAdmin, getBranches, getOrders, getRemoteOrders, getSettings, getMenuItems, getMainBranch]);

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
                    if (item.status !== 'cancelled') {
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
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="font-headline">Welcome, {user.username}!</CardTitle>
                        <CardDescription>Here's a quick overview of your restaurant's performance.</CardDescription>
                    </div>
                    {isGlobalAdmin && (
                        <Select value={selectedBranchFilter} onValueChange={setSelectedBranchFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by branch" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Branches</SelectItem>
                                {branches.map(b => (
                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
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

