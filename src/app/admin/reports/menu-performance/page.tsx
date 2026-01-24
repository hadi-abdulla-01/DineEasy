

'use client';
import { useState, useEffect, useMemo } from 'react';
import type { Order, RemoteOrder, RestaurantSettings, Branch, MenuItem } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, LoaderCircle, Star, Puzzle, Tractor, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/app/admin/auth-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRestaurantData } from '@/lib/client-data';
import { ScrollArea } from '@/components/ui/scroll-area';

type CombinedOrder = (Order | RemoteOrder) & { type: 'Dine-in' | 'Remote' };
type MenuItemPerformance = {
    id: string;
    name: string;
    quantity: number;
    revenue: number;
};
type PerformanceCategories = {
    stars: MenuItemPerformance[];
    puzzles: MenuItemPerformance[];
    plowhorses: MenuItemPerformance[];
    dogs: MenuItemPerformance[];
};

function PerformanceCategoryCard({ title, description, icon, items, currencySymbol, currencyDecimalPlaces }: { title: string, description: string, icon: React.ReactNode, items: MenuItemPerformance[], currencySymbol: string, currencyDecimalPlaces: number }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="bg-muted p-3 rounded-lg">
                        {icon}
                    </div>
                    <div>
                        <CardTitle className="font-headline">{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-64">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Revenue</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length > 0 ? items.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right font-mono">{currencySymbol}{item.revenue.toFixed(currencyDecimalPlaces)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">No items in this category.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

export default function MenuPerformancePage() {
    const { user } = useAuth();
    const { getOrders, getRemoteOrders, getSettings, getBranches, getMainBranch, getMenuItems } = useRestaurantData();
    const [allOrders, setAllOrders] = useState<CombinedOrder[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [date, setDate] = useState<DateRange | undefined>(undefined);
    const [branchFilter, setBranchFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(true);

    const isGlobalAdmin = (user?.role === 'Admin' && !user?.branchId) || user?.username?.toLowerCase() === 'admin';

    useEffect(() => {
        async function fetchInitialData() {
            if (!user) return;
            setIsLoading(true);

            // Fetch branches and main branch if global admin
            if (isGlobalAdmin) {
                const [fetchedBranches, fetchedMainBranch] = await Promise.all([getBranches(), getMainBranch()]);
                setBranches(fetchedBranches);
                if (fetchedMainBranch) {
                    setBranchFilter(fetchedMainBranch.id);
                }
            } else {
                setBranchFilter(user.branchId);
            }

            setDate({
                from: startOfDay(new Date(new Date().setDate(new Date().getDate() - 30))),
                to: endOfDay(new Date()),
            });

            setIsLoading(false);
        }
        fetchInitialData();
    }, [user, isGlobalAdmin, getBranches, getMainBranch]);

    useEffect(() => {
        async function fetchDataForBranch() {
            if (!branchFilter) return;
            setIsLoading(true);
            
            const targetBranchId = branchFilter === 'all' ? undefined : branchFilter;

            const [fetchedSettings, fetchedOrders, fetchedRemoteOrders, fetchedMenuItems] = await Promise.all([
                getSettings(targetBranchId),
                getOrders(targetBranchId),
                getRemoteOrders(targetBranchId),
                getMenuItems(targetBranchId)
            ]);

            setSettings(fetchedSettings);
            const combined: CombinedOrder[] = [
                ...fetchedOrders.map(o => ({ ...o, type: 'Dine-in' as const })),
                ...fetchedRemoteOrders.map(o => ({ ...o, type: 'Remote' as const })),
            ];
            setAllOrders(combined.filter(o => o.status === 'completed'));
            setMenuItems(fetchedMenuItems);
            setIsLoading(false);
        }
        fetchDataForBranch();
    }, [branchFilter, getSettings, getOrders, getRemoteOrders, getMenuItems]);

    const performanceData: PerformanceCategories = useMemo(() => {
        const itemStats: { [key: string]: { name: string, quantity: number, revenue: number } } = {};
        
        const filteredOrders = allOrders.filter(order => {
            if (!date?.from) return false;
            const orderDate = new Date(order.createdAt);
            const fromDate = startOfDay(date.from);
            const toDate = date.to ? endOfDay(date.to) : endOfDay(date.from);
            return orderDate >= fromDate && orderDate <= toDate;
        });

        filteredOrders.forEach(order => {
            order.items.forEach(item => {
                if (item.status === 'cancelled') return;
                
                if (!itemStats[item.menuItemId]) {
                    const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
                    itemStats[item.menuItemId] = {
                        name: menuItem?.name || item.name,
                        quantity: 0,
                        revenue: 0,
                    };
                }
                itemStats[item.menuItemId].quantity += item.quantity;
                itemStats[item.menuItemId].revenue += item.price * item.quantity;
            });
        });

        const performanceItems: MenuItemPerformance[] = Object.entries(itemStats).map(([id, data]) => ({ id, ...data }));
        
        if (performanceItems.length === 0) {
            return { stars: [], puzzles: [], plowhorses: [], dogs: [] };
        }

        const totalQuantity = performanceItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalRevenue = performanceItems.reduce((sum, item) => sum + item.revenue, 0);
        const avgQuantity = totalQuantity / performanceItems.length;
        const avgRevenue = totalRevenue / performanceItems.length;

        const categories: PerformanceCategories = {
            stars: [],
            puzzles: [],
            plowhorses: [],
            dogs: [],
        };

        performanceItems.forEach(item => {
            const highPopularity = item.quantity > avgQuantity;
            const highRevenue = item.revenue > avgRevenue;

            if (highPopularity && highRevenue) categories.stars.push(item);
            else if (!highPopularity && highRevenue) categories.puzzles.push(item);
            else if (highPopularity && !highRevenue) categories.plowhorses.push(item);
            else categories.dogs.push(item);
        });
        
        // Sort each category by revenue
        Object.values(categories).forEach(arr => arr.sort((a, b) => b.revenue - a.revenue));

        return categories;

    }, [allOrders, menuItems, date]);

    if (isLoading || !settings || !user) {
        return (
          <div className="flex h-[80vh] items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading Menu Performance Report...</p>
            </div>
          </div>
        );
    }
    
    const currencySymbol = settings.currencySymbol || '$';
    const currencyDecimalPlaces = settings.currencyDecimalPlaces ?? 2;

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle className="font-headline">Menu Performance Report</CardTitle>
                        <CardDescription>Analyze item popularity and profitability (revenue).</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        {isGlobalAdmin && (
                            <Select value={branchFilter} onValueChange={setBranchFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filter by branch" />
                                </SelectTrigger>
                                <SelectContent>
                                <SelectItem value="all">All Branches</SelectItem>
                                {branches.map(branch => (
                                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                        )}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                id="date"
                                variant={'outline'}
                                className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                    <>
                                        {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                                    </>
                                    ) : (
                                    format(date.from, 'LLL dd, y')
                                    )
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PerformanceCategoryCard 
                    title="Stars"
                    description="High popularity, high revenue. Your best items!"
                    icon={<Star className="h-6 w-6 text-yellow-500" />}
                    items={performanceData.stars}
                    currencySymbol={currencySymbol}
                    currencyDecimalPlaces={currencyDecimalPlaces}
                />
                <PerformanceCategoryCard 
                    title="Puzzles"
                    description="Low popularity, high revenue. Profitable, but need a sales boost."
                    icon={<Puzzle className="h-6 w-6 text-blue-500" />}
                    items={performanceData.puzzles}
                    currencySymbol={currencySymbol}
                    currencyDecimalPlaces={currencyDecimalPlaces}
                />
                <PerformanceCategoryCard 
                    title="Plowhorses"
                    description="High popularity, low revenue. Popular staples, but less profitable."
                    icon={<Tractor className="h-6 w-6 text-green-500" />}
                    items={performanceData.plowhorses}
                    currencySymbol={currencySymbol}
                    currencyDecimalPlaces={currencyDecimalPlaces}
                />
                <PerformanceCategoryCard 
                    title="Dogs"
                    description="Low popularity, low revenue. Consider removing or revamping."
                    icon={<Trash2 className="h-6 w-6 text-red-500" />}
                    items={performanceData.dogs}
                    currencySymbol={currencySymbol}
                    currencyDecimalPlaces={currencyDecimalPlaces}
                />
            </div>
        </div>
    );
}
