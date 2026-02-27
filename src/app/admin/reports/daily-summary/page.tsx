
'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import type { Order, RemoteOrder, RestaurantSettings, Branch } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, LoaderCircle, Printer, DollarSign, ShoppingCart, CreditCard, Users, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useAuth } from '@/app/admin/auth-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRestaurantData } from '@/lib/client-data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type CombinedOrder = (Order | RemoteOrder);
type ItemPerformance = { name: string; quantity: number; revenue: number };
type EmployeePerformance = { name: string; orderCount: number; revenue: number };

export default function DailySummaryPage() {
    const { user } = useAuth();
    const { getOrders, getRemoteOrders, getSettings, getBranches, getMainBranch, getBranchById, logActivity, restaurantId } = useRestaurantData();
    
    const [allOrders, setAllOrders] = useState<CombinedOrder[]>([]);
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [currentBranchName, setCurrentBranchName] = useState<string>('');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [branchFilter, setBranchFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(true);

    const reportRef = useRef<HTMLDivElement>(null);
    const [printDialogOpen, setPrintDialogOpen] = useState(false);
    const [printSelections, setPrintSelections] = useState({
        summary: true,
        items: true,
        employees: true,
    });

    const isGlobalAdmin = (user?.role === 'Admin' && !user?.branchId) || user?.username?.toLowerCase() === 'admin';
    
    useEffect(() => {
        if (user && restaurantId) {
            logActivity(user.id, user.username, 'Viewed Report', `Viewed Daily Summary Report`, restaurantId);
        }
    }, [user, logActivity, restaurantId]);

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

            setIsLoading(false);
        }
        fetchInitialData();
    }, [user, isGlobalAdmin, getBranches, getMainBranch, getBranchById]);

    useEffect(() => {
        async function fetchDataForBranch() {
            if (!branchFilter || !date) return;
            setIsLoading(true);
            
            const targetBranchId = branchFilter === 'all' ? undefined : branchFilter;
            const dateRange = { from: startOfDay(date), to: endOfDay(date) };

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

    const dailyStats = useMemo(() => {
        let totalRevenue = 0;
        const totalOrders = allOrders.length;
        let cashRevenue = 0;
        let cardRevenue = 0;

        for (const order of allOrders) {
            totalRevenue += order.total;

            if (order.payments && order.payments.length > 0) {
                for (const payment of order.payments) {
                    if (payment.method === 'cash') {
                        cashRevenue += payment.amount;
                    } else if (payment.method === 'card') {
                        cardRevenue += payment.amount;
                    }
                }
            } else if (order.paymentMethod === 'cash') {
                cashRevenue += order.total;
            } else if (order.paymentMethod === 'card') {
                cardRevenue += order.total;
            }
        }
        
        return { totalRevenue, totalOrders, cashRevenue, cardRevenue };
    }, [allOrders]);
    
    const itemStats: ItemPerformance[] = useMemo(() => {
        const statsByName: { [name: string]: { quantity: number; revenue: number } } = {};
        allOrders.forEach(order => {
            order.items.forEach(item => {
                if (item.status !== 'cancelled') {
                    if (!statsByName[item.name]) {
                        statsByName[item.name] = { quantity: 0, revenue: 0 };
                    }
                    statsByName[item.name].quantity += item.quantity;
                    statsByName[item.name].revenue += item.price * item.quantity;
                }
            });
        });
        return Object.entries(statsByName).map(([name, data]) => ({ name, ...data })).sort((a,b) => b.quantity - a.quantity);
    }, [allOrders]);
    
    const employeeStats: EmployeePerformance[] = useMemo(() => {
        const statsByName: { [name: string]: { orderCount: number; revenue: number } } = {};
        allOrders.forEach(order => {
            const employeeName = order.createdByName || 'Unassigned';
            if (!statsByName[employeeName]) {
                statsByName[employeeName] = { orderCount: 0, revenue: 0 };
            }
            statsByName[employeeName].orderCount += 1;
            statsByName[employeeName].revenue += order.total;
        });
        return Object.entries(statsByName).map(([name, data]) => ({ name, ...data })).sort((a,b) => b.orderCount - a.orderCount);
    }, [allOrders]);
    
    const executePrint = () => {
        const content = reportRef.current;
        if (!content || !settings) return;
        const printNode = content.cloneNode(true) as HTMLElement;

        if (!printSelections.summary) printNode.querySelector('#print-summary')?.remove();
        if (!printSelections.items) printNode.querySelector('#print-items')?.remove();
        if (!printSelections.employees) printNode.querySelector('#print-employees')?.remove();

        const printWindow = window.open('', '', 'height=800,width=1000');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Daily Summary Report</title>');
            const styles = Array.from(document.styleSheets).map(sheet => {
                try {
                    if (sheet.href) return `<link rel="stylesheet" href="${'${sheet.href}'}">`;
                    return `<style>${'${Array.from(sheet.cssRules).map(rule => rule.cssText).join('')}'}</style>`;
                } catch (e) { return ''; }
            }).join('\n');

            const printSpecificStyles = `
              @media print {
                @page { size: A4 portrait; margin: 1.5cm; }
                body { font-family: sans-serif; font-size: 10pt; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                .print-hide { display: none !important; }
                #print-header { margin-bottom: 20px; text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .card-print-override { border: none !important; box-shadow: none !important; background-color: transparent !important; padding: 0 !important; margin-top: 24px; break-inside: avoid; }
                table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                th, td { font-size: 9pt; padding: 6px 4px; border: 1px solid #ddd; text-align: left; }
                th { font-weight: 600; background-color: #f2f2f2 !important; }
                tr:nth-child(even) { background-color: #f9f9f9 !important; }
                tfoot { font-weight: bold; background-color: #f2f2f2 !important; }
                h1,h2,h3 { color: black !important; }
                .grid-print-override { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
              }
            `;
            
            printWindow.document.head.innerHTML = `<style>${'${printSpecificStyles}'}</style>` + styles;
            printWindow.document.write('</head><body>');
            const reportDate = date ? format(date, 'PPP') : 'N/A';
            const branchName = isGlobalAdmin
                ? (branchFilter === 'all' ? 'All Branches' : branches.find(b => b.id === branchFilter)?.name || 'Unknown Branch')
                : currentBranchName || 'Unknown Branch';
            const reportHeader = `
                <div id="print-header">
                    <h1 style="font-size: 22px; font-weight: bold; margin: 0;">${'${settings.restaurantName}'}</h1>
                    <h2 style="font-size: 16px; font-weight: bold; margin: 4px 0;">Daily Summary Report</h2>
                    <p style="font-size: 12px; color: #555; margin: 0;">${'${branchName}'}</p>
                    <p style="font-size: 12px; color: #555; margin: 0;">Date: ${'${reportDate}'}</p>
                </div>
            `;
            printWindow.document.write(reportHeader);

            printNode.querySelectorAll('.card-print-source').forEach(el => el.classList.add('card-print-override'));
            printNode.querySelector('#print-summary > div')?.classList.add('grid-print-override');

            printWindow.document.write(printNode.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            setTimeout(() => { printWindow.focus(); printWindow.print(); printWindow.close(); }, 500);
        }
        setPrintDialogOpen(false);
    };

    if (isLoading || !settings || !user) {
        return (
          <div className="flex h-[80vh] items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading Daily Summary...</p>
            </div>
          </div>
        );
    }
    
    const currencySymbol = settings.currencySymbol || '$';
    const currencyDecimalPlaces = settings.currencyDecimalPlaces ?? 2;

    const formatCurrency = (amount: number) => `${'${currencySymbol}'}${amount.toFixed(currencyDecimalPlaces)}`;

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle className="font-headline">Daily Summary Report</CardTitle>
                        <CardDescription>A complete sales overview for a selected day.</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        {isGlobalAdmin && (
                            <Select value={branchFilter} onValueChange={setBranchFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by branch" /></SelectTrigger>
                                <SelectContent>
                                <SelectItem value="all">All Branches</SelectItem>
                                {branches.map(branch => (<SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        )}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button id="date" variant={'outline'} className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, 'LLL dd, y') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar initialFocus mode="single" selected={date} onSelect={setDate} />
                            </PopoverContent>
                        </Popover>
                        <Button variant="outline" onClick={() => setPrintDialogOpen(true)} className="w-full sm:w-auto print-hide">
                            <Printer className="mr-2 h-4 w-4" /> Print Report
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            <div ref={reportRef}>
                <div id="print-summary" className="card-print-source">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Sales</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(dailyStats.totalRevenue)}</div></CardContent></Card>
                        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Cash Sales</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(dailyStats.cashRevenue)}</div></CardContent></Card>
                        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Card/Other Sales</CardTitle><CreditCard className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(dailyStats.cardRevenue)}</div></CardContent></Card>
                        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Orders</CardTitle><ShoppingCart className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{dailyStats.totalOrders}</div></CardContent></Card>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <Card id="print-items" className="card-print-source">
                        <CardHeader><CardTitle className="font-headline flex items-center gap-2"><ChefHat className="h-5 w-5 text-primary"/>Items Sold Summary</CardTitle></CardHeader>
                        <CardContent>
                            <Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Total Revenue</TableHead></TableRow></TableHeader><TableBody>
                            {itemStats.length > 0 ? itemStats.map(item => (
                                <TableRow key={item.name}><TableCell className="font-medium">{item.name}</TableCell><TableCell className="text-right">{item.quantity}</TableCell><TableCell className="text-right font-mono">{formatCurrency(item.revenue)}</TableCell></TableRow>
                            )) : <TableRow><TableCell colSpan={3} className="text-center h-24">No items sold on this day.</TableCell></TableRow>}
                            </TableBody></Table>
                        </CardContent>
                    </Card>
                    <Card id="print-employees" className="card-print-source">
                        <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Users className="h-5 w-5 text-primary"/>Orders by Employee</CardTitle></CardHeader>
                        <CardContent>
                            <Table><TableHeader><TableRow><TableHead>Employee</TableHead><TableHead className="text-right">Orders</TableHead><TableHead className="text-right">Total Revenue</TableHead></TableRow></TableHeader><TableBody>
                            {employeeStats.length > 0 ? employeeStats.map(emp => (
                                <TableRow key={emp.name}><TableCell className="font-medium">{emp.name}</TableCell><TableCell className="text-right">{emp.orderCount}</TableCell><TableCell className="text-right font-mono">{formatCurrency(emp.revenue)}</TableCell></TableRow>
                            )) : <TableRow><TableCell colSpan={3} className="text-center h-24">No employee sales data for this day.</TableCell></TableRow>}
                            </TableBody></Table>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
                <DialogContent>
                <DialogHeader><DialogTitle>Print Report Options</DialogTitle><DialogDescription>Select the sections to print.</DialogDescription></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex items-center space-x-2"><Checkbox id="print-summary-cb" checked={printSelections.summary} onCheckedChange={(c) => setPrintSelections(s => ({ ...s, summary: !!c }))} /><Label htmlFor="print-summary-cb">Sales Summary</Label></div>
                    <div className="flex items-center space-x-2"><Checkbox id="print-items-cb" checked={printSelections.items} onCheckedChange={(c) => setPrintSelections(s => ({ ...s, items: !!c }))} /><Label htmlFor="print-items-cb">Items Sold Table</Label></div>
                    <div className="flex items-center space-x-2"><Checkbox id="print-employees-cb" checked={printSelections.employees} onCheckedChange={(c) => setPrintSelections(s => ({ ...s, employees: !!c }))} /><Label htmlFor="print-employees-cb">Employee Sales Table</Label></div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>Cancel</Button>
                    <Button onClick={executePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

    