'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import type { Order, RemoteOrder, RestaurantSettings, Branch } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, LoaderCircle, User, BarChart, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useAuth } from '@/app/admin/auth-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRestaurantData } from '@/lib/client-data';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type CombinedOrder = (Order | RemoteOrder);
type EmployeePerformance = {
    name: string;
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
};

const chartConfig = {
    revenue: {
        label: 'Revenue',
        color: 'hsl(var(--primary))',
    },
} satisfies ChartConfig;

export default function EmployeePerformancePage() {
    const { user } = useAuth();
    const { getOrders, getRemoteOrders, getSettings, getBranches, getMainBranch, getBranchById } = useRestaurantData();
    const [allOrders, setAllOrders] = useState<CombinedOrder[]>([]);
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [currentBranchName, setCurrentBranchName] = useState<string>('');
    const [date, setDate] = useState<DateRange | undefined>(undefined);
    const [branchFilter, setBranchFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(true);

    const reportRef = useRef<HTMLDivElement>(null);
    const [printDialogOpen, setPrintDialogOpen] = useState(false);
    const [printSelections, setPrintSelections] = useState({
        revenueChart: true,
        detailsTable: true,
    });

    const isGlobalAdmin = (user?.role === 'Admin' && !user?.branchId) || user?.username?.toLowerCase() === 'admin';

    useEffect(() => {
        async function fetchInitialData() {
            if (!user) return;
            setIsLoading(true);

            if (isGlobalAdmin) {
                const [fetchedBranches, fetchedMainBranch] = await Promise.all([getBranches(), getMainBranch()]);
                setBranches(fetchedBranches);
                if (fetchedMainBranch) {
                    setBranchFilter(fetchedMainBranch.id);
                }
            } else {
                setBranchFilter(user.branchId);
                const branch = await getBranchById(user.branchId);
                if (branch) {
                    setCurrentBranchName(branch.name);
                }
            }

            setDate({
                from: startOfDay(new Date(new Date().setDate(new Date().getDate() - 30))),
                to: endOfDay(new Date()),
            });

            setIsLoading(false);
        }
        fetchInitialData();
    }, [user, isGlobalAdmin, getBranches, getMainBranch, getBranchById]);

    useEffect(() => {
        async function fetchDataForBranch() {
            if (!branchFilter || !date?.from) return;
            setIsLoading(true);
            
            const targetBranchId = branchFilter === 'all' ? undefined : branchFilter;
            const dateRange = {
                from: startOfDay(date.from),
                to: date.to ? endOfDay(date.to) : endOfDay(date.from),
            };

            const [fetchedSettings, fetchedOrders, fetchedRemoteOrders] = await Promise.all([
                getSettings(targetBranchId),
                getOrders(targetBranchId, dateRange),
                getRemoteOrders(targetBranchId, dateRange)
            ]);

            setSettings(fetchedSettings);
            const combined: CombinedOrder[] = [
                ...fetchedOrders.map(o => ({ ...o, type: 'Dine-in' as const })),
                ...fetchedRemoteOrders.map(o => ({ ...o, type: 'Remote' as const })),
            ];
            setAllOrders(combined.filter(o => o.status === 'completed'));
            setIsLoading(false);
        }
        fetchDataForBranch();
    }, [branchFilter, date, getSettings, getOrders, getRemoteOrders]);

    const performanceData: EmployeePerformance[] = useMemo(() => {
        const statsByName: { [name: string]: { totalRevenue: number; totalOrders: number; } } = {};

        const employeeOrders = allOrders.filter(order => order.createdByName && order.createdByName !== 'Customer');

        employeeOrders.forEach(order => {
            const employeeName = order.createdByName || 'Unassigned';
            if (!statsByName[employeeName]) {
                statsByName[employeeName] = { totalRevenue: 0, totalOrders: 0 };
            }
            statsByName[employeeName].totalRevenue += order.total;
            statsByName[employeeName].totalOrders += 1;
        });

        return Object.entries(statsByName).map(([name, stats]) => ({
            name,
            totalRevenue: stats.totalRevenue,
            totalOrders: stats.totalOrders,
            averageOrderValue: stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0,
        })).sort((a, b) => b.totalRevenue - a.totalRevenue);

    }, [allOrders]);
    
    const executePrint = () => {
        const content = reportRef.current;
        if (!content || !settings) return;

        const printNode = content.cloneNode(true) as HTMLElement;

        if (!printSelections.revenueChart) {
          printNode.querySelector('#print-revenue-chart')?.remove();
        }
        if (!printSelections.detailsTable) {
          printNode.querySelector('#print-details-table')?.remove();
        }

        const printWindow = window.open('', '', 'height=800,width=1000');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Employee Performance Report</title>');

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
                    height: 250px !important;
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
                    <h2 style="font-size: 16px; font-weight: bold; margin: 4px 0;">Employee Performance Report</h2>
                    <p style="font-size: 12px; color: #555; margin: 0;">${branchName}</p>
                    <p style="font-size: 12px; color: #555; margin: 0;">Date Range: ${fromDate} - ${toDate}</p>
                </div>
            `;
            printWindow.document.write(reportHeader);

            printNode.querySelectorAll<HTMLDivElement>('#print-revenue-chart, #print-details-table').forEach(el => {
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
              <p className="text-muted-foreground">Loading Employee Performance Report...</p>
            </div>
          </div>
        );
    }
    
    const currencySymbol = settings.currencySymbol || '$';
    const currencyDecimalPlaces = settings.currencyDecimalPlaces ?? 2;

    const totalRevenueAll = performanceData.reduce((acc, emp) => acc + emp.totalRevenue, 0);
    const totalOrdersAll = performanceData.reduce((acc, emp) => acc + emp.totalOrders, 0);

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle className="font-headline">Employee Performance Report</CardTitle>
                        <CardDescription>Analyze sales performance by staff member.</CardDescription>
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card id="print-revenue-chart">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2">
                                <BarChart className="h-5 w-5 text-primary"/>
                                Total Revenue by Employee
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig} className="h-[300px] w-full">
                                <ResponsiveContainer>
                                    <RechartsBarChart data={performanceData} margin={{ left: -10, right: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis
                                            tickFormatter={(value) => `${currencySymbol}${value}`}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'hsl(var(--accent))' }}
                                            content={<ChartTooltipContent
                                                formatter={(value) => `${currencySymbol}${Number(value).toFixed(currencyDecimalPlaces)}`}
                                                nameKey="name"
                                            />}
                                        />
                                        <Bar dataKey="totalRevenue" name="Total Revenue" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={80} />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <Card id="print-details-table">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2">
                            <User className="h-5 w-5 text-primary"/>
                            Performance Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee</TableHead>
                                        <TableHead className="text-right">Total Revenue</TableHead>
                                        <TableHead className="text-right">Total Orders</TableHead>
                                        <TableHead className="text-right">Avg. Order Value</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {performanceData.length > 0 ? performanceData.map(emp => (
                                        <TableRow key={emp.name}>
                                            <TableCell className="font-medium">{emp.name}</TableCell>
                                            <TableCell className="text-right font-mono">{currencySymbol}{emp.totalRevenue.toFixed(currencyDecimalPlaces)}</TableCell>
                                            <TableCell className="text-right">{emp.totalOrders}</TableCell>
                                            <TableCell className="text-right font-mono">{currencySymbol}{emp.averageOrderValue.toFixed(currencyDecimalPlaces)}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground h-24">No sales data for this period.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell className="font-bold">Total</TableCell>
                                        <TableCell className="text-right font-bold font-mono">{currencySymbol}{totalRevenueAll.toFixed(currencyDecimalPlaces)}</TableCell>
                                        <TableCell className="text-right font-bold">{totalOrdersAll}</TableCell>
                                        <TableCell />
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
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
                        id="print-revenue-chart"
                        checked={printSelections.revenueChart}
                        onCheckedChange={(checked) => setPrintSelections(s => ({ ...s, revenueChart: !!checked }))}
                    />
                    <Label htmlFor="print-revenue-chart" className="cursor-pointer">Revenue by Employee Chart</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                    <Checkbox
                        id="print-details-table"
                        checked={printSelections.detailsTable}
                        onCheckedChange={(checked) => setPrintSelections(s => ({ ...s, detailsTable: !!checked }))}
                    />
                    <Label htmlFor="print-details-table" className="cursor-pointer">Performance Details Table</Label>
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
