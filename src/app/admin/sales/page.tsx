

'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import type { Order, RemoteOrder, RestaurantSettings, Branch } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, DollarSign, ShoppingCart, User, Printer, LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay, eachDayOfInterval, parseISO } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { useAuth } from '../auth-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRestaurantData } from '@/lib/client-data';


type CombinedOrder = (Order | RemoteOrder) & { type: 'Dine-in' | 'Remote' };

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export default function SalesReportPage() {
  const { user } = useAuth();
  const { getOrders, getRemoteOrders, getSettings, getBranches, getMainBranch } = useRestaurantData();
  const [allOrders, setAllOrders] = useState<CombinedOrder[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [mainBranch, setMainBranch] = useState<Branch | null>(null);
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [branchFilter, setBranchFilter] = useState('all');
  const reportRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchInitialSettings() {
      if (!user) return;
      setIsLoading(true);
      const fetchedMainBranch = await getMainBranch();
      setMainBranch(fetchedMainBranch);

      let branchIdForSettings = user.branchId;
      if (user.role === 'Admin' && fetchedMainBranch) {
        branchIdForSettings = fetchedMainBranch.id;
      }

      if (branchIdForSettings) {
        const fetchedSettings = await getSettings(branchIdForSettings);
        setSettings(fetchedSettings);
      } else {
        // Fallback for user without branch or if main branch doesn't exist
        const globalSettings = await getSettings();
        setSettings(globalSettings);
      }

      const fetchedBranches = await getBranches();
      setBranches(fetchedBranches);

      setDate({
        from: startOfDay(new Date(new Date().setDate(new Date().getDate() - 7))),
        to: endOfDay(new Date()),
      });

      setIsLoading(false);
    }
    fetchInitialSettings();
  }, [user]);

  useEffect(() => {
    if (user && mainBranch) {
      const isMainBranchManager = user.role === 'Manager' && user.branchId === mainBranch.id;
      const canManageAllBranches = user.role === 'Admin' || isMainBranchManager;

      if (canManageAllBranches && mainBranch) {
        // Default Admin/Main Manager to 'all' branches view
        setBranchFilter('all');
      } else {
        setBranchFilter(user.branchId);
      }
    } else if (user) {
      setBranchFilter(user.branchId);
    }
  }, [user, mainBranch]);

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;

      const dineInOrders = await getOrders();
      const remoteOrders = await getRemoteOrders();

      const combined: CombinedOrder[] = [
        ...dineInOrders.map(o => ({ ...o, type: 'Dine-in' as const })),
        ...remoteOrders.map(o => ({ ...o, type: 'Remote' as const })),
      ];

      setAllOrders(combined.filter(o => 'status' in o ? o.status === 'completed' : true));
    }
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const filteredOrders = useMemo(() => {
    if (!date?.from) return [];

    const fromDate = startOfDay(date.from);
    const toDate = date.to ? endOfDay(date.to) : endOfDay(date.from);

    return allOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const branchMatch = branchFilter === 'all' || !branchFilter || ('branchId' in order && order.branchId === branchFilter);
      return orderDate >= fromDate && orderDate <= toDate && branchMatch;
    });
  }, [allOrders, date, branchFilter]);

  const totalRevenue = useMemo(() => filteredOrders.reduce((acc, order) => acc + order.total, 0), [filteredOrders]);
  const totalOrders = filteredOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const dailyRevenueData = useMemo(() => {
    if (!date?.from || !date.to) return [];

    const dailyData: { [key: string]: number } = {};
    const interval = eachDayOfInterval({ start: date.from, end: date.to });

    interval.forEach(day => {
      const formattedDate = format(day, 'yyyy-MM-dd');
      dailyData[formattedDate] = 0;
    });

    filteredOrders.forEach(order => {
      const formattedDate = format(parseISO(order.createdAt), 'yyyy-MM-dd');
      if (dailyData[formattedDate] !== undefined) {
        dailyData[formattedDate] += order.total;
      }
    });

    return Object.keys(dailyData).map(dateKey => ({
      date: format(new Date(dateKey), 'MMM d'),
      revenue: dailyData[dateKey]
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredOrders, date]);

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank', 'height=800,width=1000');
    if (printWindow && reportRef.current) {
      const styles = Array.from(document.styleSheets)
        .map(styleSheet => {
          try {
            return Array.from(styleSheet.cssRules)
              .map(rule => rule.cssText)
              .join('');
          } catch (e) {
            console.log('Access to stylesheet %s is denied. Skipping.', styleSheet.href);
            return '';
          }
        })
        .join('');

      printWindow.document.write('<html><head><title>Sales Report</title>');
      printWindow.document.write(`<style>${styles}</style></head><body>`);
      printWindow.document.write(reportRef.current.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  if (isLoading || !settings || !user) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading sales report...</p>
        </div>
      </div>
    );
  }

  const isMainBranchManager = mainBranch && user.branchId === mainBranch.id;
  const canManageAllBranches = user.role === 'Admin' || isMainBranchManager;
  const currencySymbol = settings.currencySymbol || '$';
  const currencyDecimalPlaces = settings.currencyDecimalPlaces ?? 2;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="font-headline">Sales Report</CardTitle>
            <CardDescription>View sales analytics for your restaurant.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {canManageAllBranches && (
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
            <Button variant="outline" onClick={handlePrintReport} className="w-full sm:w-auto">
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div ref={reportRef}>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currencySymbol}{totalRevenue.toFixed(currencyDecimalPlaces)}</div>
              <p className="text-xs text-muted-foreground">in selected period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">Completed orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currencySymbol}{averageOrderValue.toFixed(currencyDecimalPlaces)}</div>
              <p className="text-xs text-muted-foreground">per completed order</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="font-headline">Daily Revenue</CardTitle>
            <CardDescription>Revenue from completed orders per day.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyRevenueData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `${currencySymbol}${value}`} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--accent))', radius: 'var(--radius)' }}
                    content={<ChartTooltipContent
                      formatter={(value) => `${currencySymbol}${Number(value).toFixed(currencyDecimalPlaces)}`}
                      indicator="dot"
                    />}
                  />
                  <Bar dataKey="revenue" fill="#CB1E1D" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="font-headline">Order Details</CardTitle>
            <CardDescription>A list of completed orders in the selected date range.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Placed By</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.invoiceNumber || 'N/A'}</TableCell>
                        <TableCell>{format(new Date(order.createdAt), "PPpp")}</TableCell>
                        <TableCell>{'customerName' in order ? order.customerName : order.customerDetails.name}</TableCell>
                        <TableCell>{order.orderType}</TableCell>
                        <TableCell>{order.createdByName || 'N/A'}</TableCell>
                        <TableCell className="capitalize">{order.paymentMethod || '--'}</TableCell>
                        <TableCell className="text-right font-mono">{currencySymbol}{order.total.toFixed(currencyDecimalPlaces)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No orders found for this period.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

