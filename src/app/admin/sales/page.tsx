

'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import type { Order, RemoteOrder, RestaurantSettings, Branch } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, DollarSign, ShoppingCart, User, Printer, LoaderCircle, TrendingUp, Pizza, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay, eachDayOfInterval, parseISO } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { useAuth } from '../auth-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRestaurantData } from '@/lib/client-data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';


type CombinedOrder = (Order | RemoteOrder) & { type: 'Dine-in' | 'Remote' };

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

const PIE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];


export default function SalesReportPage() {
  const { user } = useAuth();
  const { getOrders, getRemoteOrders, getSettings, getBranches, getMainBranch, getBranchById } = useRestaurantData();
  const [allOrders, setAllOrders] = useState<CombinedOrder[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [mainBranch, setMainBranch] = useState<Branch | null>(null);
  const [currentBranchName, setCurrentBranchName] = useState<string>('');
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [branchFilter, setBranchFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printSelections, setPrintSelections] = useState({
    summaryCards: true,
    revenueByOrderTypeChart: true,
    topSellingItemsChart: true,
    detailsTable: true,
  });
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [customerNameFilter, setCustomerNameFilter] = useState('');


  const isGlobalAdmin = (user?.role === 'Admin' && !user?.branchId) || user?.username?.toLowerCase() === 'admin';

  useEffect(() => {
    async function fetchInitialSettings() {
      if (!user) return;
      setIsLoading(true);
      const fetchedMainBranch = await getMainBranch();
      setMainBranch(fetchedMainBranch);

      let branchIdForSettings = user.branchId;
      if (isGlobalAdmin && fetchedMainBranch) {
        branchIdForSettings = fetchedMainBranch.id;
      }

      if (branchIdForSettings) {
        const fetchedSettings = await getSettings(branchIdForSettings);
        setSettings(fetchedSettings);
      } else {
        const globalSettings = await getSettings();
        setSettings(globalSettings);
      }

      if (isGlobalAdmin) {
        const fetchedBranches = await getBranches();
        setBranches(fetchedBranches);
      } else if (user.branchId) {
          const branch = await getBranchById(user.branchId);
          if (branch) {
              setCurrentBranchName(branch.name);
          }
      }


      setDate({
        from: startOfDay(new Date(new Date().setDate(new Date().getDate() - 7))),
        to: endOfDay(new Date()),
      });

      setIsLoading(false);
    }
    fetchInitialSettings();
  }, [user, isGlobalAdmin, getMainBranch, getSettings, getBranches, getBranchById]);

  useEffect(() => {
    async function fetchOrders() {
      if (!user || !date?.from) return;
      setIsLoading(true);
      const dateRange = {
        from: startOfDay(date.from),
        to: date.to ? endOfDay(date.to) : new Date(),
      };
      
      const targetBranchId = isGlobalAdmin ? (branchFilter === 'all' ? undefined : branchFilter) : user.branchId;
      
      const dineInOrders = await getOrders(targetBranchId, dateRange);
      const remoteOrders = await getRemoteOrders(targetBranchId, dateRange);

      const combined: CombinedOrder[] = [
        ...dineInOrders.map(o => ({ ...o, type: 'Dine-in' as const })),
        ...remoteOrders.map(o => ({ ...o, type: 'Remote' as const })),
      ];

      setAllOrders(combined.filter(o => 'status' in o ? o.status === 'completed' : true));
      setIsLoading(false);
    }
    if (user) {
      fetchOrders();
    }
  }, [user, date, branchFilter, getOrders, getRemoteOrders, isGlobalAdmin]);

  const filteredOrders = useMemo(() => {
    return allOrders.filter(order => {
      const typeMatch = orderTypeFilter === 'all' || order.orderType === orderTypeFilter;
      const paymentMatch = paymentMethodFilter === 'all' || order.paymentMethod === paymentMethodFilter;
      const customerName = 'customerName' in order ? order.customerName : (order.customerDetails?.name || '');
      const nameMatch = customerNameFilter ? customerName.toLowerCase().includes(customerNameFilter.toLowerCase()) : true;

      return typeMatch && paymentMatch && nameMatch;
    });
  }, [allOrders, orderTypeFilter, paymentMethodFilter, customerNameFilter]);

  const detailedStats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((acc, order) => acc + order.total, 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const revenueByOrderType: { name: string, revenue: number }[] = [];
    const orderTypeMap: Record<string, number> = {};

    filteredOrders.forEach(order => {
      const type = order.orderType || 'Other';
      if (orderTypeMap[type]) {
        orderTypeMap[type] += order.total;
      } else {
        orderTypeMap[type] = order.total;
      }
    });

    for (const [name, revenue] of Object.entries(orderTypeMap)) {
      revenueByOrderType.push({ name: name.charAt(0).toUpperCase() + name.slice(1), revenue });
    }

    const itemSales: { [key: string]: { name: string, quantity: number, revenue: number } } = {};
    filteredOrders.forEach(order => {
      if(order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (item.status !== 'cancelled') {
            if (itemSales[item.menuItemId]) {
              itemSales[item.menuItemId].quantity += item.quantity;
              itemSales[item.menuItemId].revenue += item.price * item.quantity;
            } else {
              itemSales[item.menuItemId] = { name: item.name, quantity: item.quantity, revenue: item.price * item.quantity };
            }
          }
        });
      }
    });
    const topSellingItems = Object.values(itemSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      revenueByOrderType: revenueByOrderType.filter(t => t.revenue > 0),
      topSellingItems,
    };
  }, [filteredOrders]);


  const executePrint = () => {
    const content = reportRef.current;
    if (!content || !settings) return;

    // Create a clone to avoid modifying the live DOM
    const printNode = content.cloneNode(true) as HTMLElement;

    // Selectively remove nodes from the clone based on user selection
    if (!printSelections.summaryCards) {
      printNode.querySelector('#print-summary-cards')?.remove();
    }
    if (!printSelections.revenueByOrderTypeChart) {
      printNode.querySelector('#print-order-type-chart')?.remove();
    }
    if (!printSelections.topSellingItemsChart) {
      printNode.querySelector('#print-top-items-chart')?.remove();
    }
    if (!printSelections.detailsTable) {
      printNode.querySelector('#print-details-table')?.remove();
    }

    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
        printWindow.document.write('<html><head><title>Sales Report</title>');

        const styles = Array.from(document.styleSheets).map(sheet => {
            try {
                if (sheet.href) {
                    return `<link rel="stylesheet" href="${sheet.href}">`;
                }
                if (sheet.cssRules) {
                    return `<style>${Array.from(sheet.cssRules).map(rule => rule.cssText).join('')}</style>`;
                }
            } catch (e) {
                console.warn('Could not copy stylesheet for printing:', e);
            }
            return '';
        }).join('\n');

        const printSpecificStyles = `
          @media print {
            @page {
              size: A4 portrait;
              margin: 1.5cm;
            }
            body {
              font-family: sans-serif;
              font-size: 10pt;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-hide { 
              display: none !important;
            }
            #print-header {
                margin-bottom: 20px;
                text-align: center;
                border-bottom: 2px solid #333;
                padding-bottom: 10px;
            }
            .card-print-override {
                border: 1px solid #ddd !important;
                box-shadow: none !important;
                background-color: transparent !important;
                padding: 1rem !important;
                margin-top: 24px;
                break-inside: avoid;
            }
            .card-print-override .recharts-responsive-container {
                width: 100% !important;
                height: 250px !important; /* Fixed height for charts */
            }
            #print-summary-cards {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 16px;
                border: none !important;
                padding: 0 !important;
                box-shadow: none !important;
            }
            #print-summary-cards > div { /* targets inner cards */
                border: 1px solid #ccc !important;
                padding: 12px !important;
                border-radius: 8px;
                box-shadow: none !important;
            }
            #print-details-table {
                margin-top: 24px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 16px;
            }
            th, td {
              font-size: 9pt;
              padding: 6px 4px;
              border: 1px solid #ddd;
              word-break: break-word;
              text-align: left;
            }
            th {
              font-weight: 600;
              background-color: #f2f2f2 !important;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9 !important;
            }
            tfoot {
              font-weight: bold;
              background-color: #f2f2f2 !important;
            }
            h1,h2,h3 {
                color: black !important;
            }
          }
        `;
        
        printWindow.document.head.innerHTML += `<style>${printSpecificStyles}</style>` + styles;
        printWindow.document.write('</head><body>');
        
        const fromDate = date?.from ? format(date.from, 'PPP') : 'N/A';
        const toDate = date?.to ? format(date.to, 'PPP') : 'N/A';
        const branchName = isGlobalAdmin
            ? (branchFilter === 'all' ? 'All Branches' : branches.find(b => b.id === branchFilter)?.name || 'Unknown Branch')
            : currentBranchName || 'Unknown Branch';

        const reportHeader = `
            <div id="print-header">
                <h1 style="font-size: 22px; font-weight: bold; margin: 0;">${settings.restaurantName}</h1>
                <h2 style="font-size: 16px; font-weight: bold; margin: 4px 0;">Sales Report</h2>
                <p style="font-size: 12px; color: #555; margin: 0;">${branchName}</p>
                <p style="font-size: 12px; color: #555; margin: 0;">Date Range: ${fromDate} - ${toDate}</p>
            </div>
        `;
        printWindow.document.write(reportHeader);

        printNode.querySelectorAll<HTMLDivElement>('#print-order-type-chart, #print-top-items-chart, #print-details-table').forEach(el => {
            el.classList.add('card-print-override');
        });

        printWindow.document.write(printNode.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 500);
    }
    setPrintDialogOpen(false);
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
            <Button variant="outline" onClick={() => setPrintDialogOpen(true)} className="w-full sm:w-auto print-hide">
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div ref={reportRef}>
        <div id="print-summary-cards" className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currencySymbol}{detailedStats.totalRevenue.toFixed(currencyDecimalPlaces)}</div>
              <p className="text-xs text-muted-foreground">in selected period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{detailedStats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">Completed orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currencySymbol}{detailedStats.averageOrderValue.toFixed(currencyDecimalPlaces)}</div>
              <p className="text-xs text-muted-foreground">per completed order</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-8">
            <Card id="print-order-type-chart" className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Percent className="h-5 w-5"/> Revenue by Order Type</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                        <ResponsiveContainer>
                             <PieChart>
                                <Pie
                                    data={detailedStats.revenueByOrderType}
                                    dataKey="revenue"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={(props) => `${(props.percent * 100).toFixed(0)}%`}
                                >
                                     {detailedStats.revenueByOrderType.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                 <Tooltip
                                    cursor={{ fill: 'hsl(var(--accent))' }}
                                    content={<ChartTooltipContent
                                        formatter={(value) => `${currencySymbol}${Number(value).toFixed(currencyDecimalPlaces)}`}
                                        nameKey="name"
                                    />}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card id="print-top-items-chart" className="lg:col-span-3">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><TrendingUp className="h-5 w-5"/> Top Selling Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                         <ResponsiveContainer>
                            <BarChart data={detailedStats.topSellingItems} layout="vertical" margin={{ left: 20, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12, width: 120 }} width={120} />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--accent))' }}
                                    content={<ChartTooltipContent
                                        formatter={(value) => `${currencySymbol}${Number(value).toFixed(currencyDecimalPlaces)}`}
                                        nameKey="name"
                                    />}
                                />
                                <Bar dataKey="revenue" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>


        <Card id="print-details-table" className="mt-8">
          <CardHeader>
            <CardTitle className="font-headline">Order Details</CardTitle>
            <CardDescription>A list of completed orders in the selected date range.</CardDescription>
            <div className="flex flex-col sm:flex-row gap-2 pt-4 print-hide">
                <Input
                    placeholder="Search by customer name..."
                    value={customerNameFilter}
                    onChange={(e) => setCustomerNameFilter(e.target.value)}
                    className="w-full sm:max-w-xs"
                />
                <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Dine-in">Dine-in</SelectItem>
                        <SelectItem value="Take-away">Take-away</SelectItem>
                        <SelectItem value="Online">Online</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by Payment" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Payments</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card/Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>
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
                 <TableFooter>
                    <TableRow>
                        <TableCell colSpan={6} className="text-right font-bold">Grand Total</TableCell>
                        <TableCell className="text-right font-bold font-mono">{currencySymbol}{detailedStats.totalRevenue.toFixed(currencyDecimalPlaces)}</TableCell>
                    </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

       <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print Report Options</DialogTitle>
            <DialogDescription>
              Select the sections of the report you would like to print.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="print-summary"
                checked={printSelections.summaryCards}
                onCheckedChange={(checked) => setPrintSelections(s => ({ ...s, summaryCards: !!checked }))}
              />
              <Label htmlFor="print-summary" className="cursor-pointer">Summary Cards</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="print-revenue"
                checked={printSelections.revenueByOrderTypeChart}
                onCheckedChange={(checked) => setPrintSelections(s => ({ ...s, revenueByOrderTypeChart: !!checked }))}
              />
              <Label htmlFor="print-revenue" className="cursor-pointer">Revenue by Order Type Chart</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="print-top-items"
                checked={printSelections.topSellingItemsChart}
                onCheckedChange={(checked) => setPrintSelections(s => ({ ...s, topSellingItemsChart: !!checked }))}
              />
              <Label htmlFor="print-top-items" className="cursor-pointer">Top Selling Items Chart</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="print-table"
                checked={printSelections.detailsTable}
                onCheckedChange={(checked) => setPrintSelections(s => ({ ...s, detailsTable: !!checked }))}
              />
              <Label htmlFor="print-table" className="cursor-pointer">Order Details Table</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>Cancel</Button>
            <Button onClick={executePrint}>
              <Printer className="mr-2 h-4 w-4" /> Print Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    
