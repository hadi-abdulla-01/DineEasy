

'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import type { Order, RemoteOrder, RestaurantSettings, AppUser, Branch } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Printer, Trash2, Edit, LoaderCircle } from 'lucide-react';
import { Invoice } from '@/components/ui/invoice';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/app/admin/auth-provider';
import { useRestaurantData } from '@/lib/client-data';


type CombinedOrder = (Order | RemoteOrder) & { type: 'Dine-in' | 'Remote' };

export default function SalesHistoryPage() {
  const { user } = useAuth();
  const { getOrders, getRemoteOrders, getSettings, getMainBranch, deleteOrder } = useRestaurantData();
  const [allOrders, setAllOrders] = useState<CombinedOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orderToPrint, setOrderToPrint] = useState<CombinedOrder | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const isGlobalAdmin = (user?.role === 'Admin' && !user?.branchId) || user?.username?.toLowerCase() === 'admin';

  const fetchOrders = async () => {
    if (!user) return;
    // If Global Admin: View All (undefined). If Branch Admin: View Specific Branch.
    const branchId = isGlobalAdmin ? undefined : user.branchId;

    const dineInOrders = await getOrders(branchId);
    const remoteOrders = await getRemoteOrders(branchId);
    const combined: CombinedOrder[] = [
      ...dineInOrders.map(o => ({ ...o, type: 'Dine-in' as const })),
      ...remoteOrders.map(o => ({ ...o, type: 'Remote' as const })),
    ];
    setAllOrders(combined.filter(o => 'status' in o ? o.status === 'completed' : true));
  }

  useEffect(() => {
    async function fetchInitialData() {
      if (!user) return;
      setIsLoading(true);

      let branchIdForSettings = user.branchId;
      if (isGlobalAdmin) {
        const mainBranch = await getMainBranch();
        if (mainBranch) {
          branchIdForSettings = mainBranch.id;
        }
      }

      const [fetchedSettings] = await Promise.all([
        getSettings(branchIdForSettings),
        fetchOrders()
      ]);

      setSettings(fetchedSettings);
      setIsLoading(false);
    }
    fetchInitialData();
  }, [user, isGlobalAdmin, getMainBranch, getSettings]);
  
  useEffect(() => {
    if (orderToPrint && invoiceRef.current && settings) {
        const content = invoiceRef.current;
        const printWindow = window.open('', '', 'height=800,width=600');
        if (printWindow) {
            const printSize = settings.printSettings?.invoicePrintSize || 'a4';
            const bodyStyle = printSize === 'a4' ? 'padding: 20px;' : 'padding: 0;';

            printWindow.document.write('<html><head><title>Invoice</title>');

            const styles = Array.from(document.styleSheets).map(sheet => {
                try {
                    if (sheet.href) {
                        return `<link rel="stylesheet" href="${'${sheet.href}'}">`;
                    }
                    if (sheet.cssRules) {
                        return `<style>${'${Array.from(sheet.cssRules).map(rule => rule.cssText).join('')}'}</style>`;
                    }
                } catch (e) {
                    console.warn('Could not copy stylesheet for printing:', e);
                }
                return '';
            }).join('\n');

            printWindow.document.head.innerHTML += styles;
            printWindow.document.write(`</head><body style="${'${bodyStyle}'}">`);
            printWindow.document.write(content.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }, 500);
        }
        setOrderToPrint(null);
    }
  }, [orderToPrint, settings]);

  const filteredOrders = useMemo(() => {
    if (!searchTerm) {
      return allOrders;
    }

    return allOrders.filter(order => {
      const customerName = 'customerName' in order ? order.customerName : (order.customerDetails?.name || '');
      const lowerCaseSearchTerm = searchTerm.toLowerCase();

      return (
        (order.invoiceNumber && order.invoiceNumber.toLowerCase().includes(lowerCaseSearchTerm)) ||
        order.id.toLowerCase().includes(lowerCaseSearchTerm) ||
        customerName.toLowerCase().includes(lowerCaseSearchTerm) ||
        (order.createdAt && format(new Date(order.createdAt), 'PPpp').toLowerCase().includes(lowerCaseSearchTerm))
      );
    });
  }, [allOrders, searchTerm]);

  const handlePrintInvoice = (order: CombinedOrder) => {
    setOrderToPrint(order);
  };

  const handleDeleteOrder = async (orderId: string, orderType: 'Dine-in' | 'Remote') => {
    await deleteOrder(orderId, orderType);
    fetchOrders(); // Refetch orders to update the list
  }

  const canDelete = user?.permissions?.salesHistory?.delete || user?.role === 'Admin';
  const canEdit = user?.permissions?.salesHistory?.edit || user?.role === 'Admin';

  const safeFormatDate = (dateString: string | undefined) => {
    if (!dateString) return 'No Date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return format(date, "PPpp");
    } catch (e) {
      return 'Invalid Date';
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading sales history...</p>
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
          <CardTitle className="font-headline">Sales History</CardTitle>
          <CardDescription>Search for past orders by Invoice #, Order ID, customer name, or date.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by Invoice #, Order ID, Customer Name, or Date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Search Results</CardTitle>
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
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="print-hide text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.invoiceNumber || 'N/A'}</TableCell>
                      <TableCell>{safeFormatDate(order.createdAt)}</TableCell>
                      <TableCell>{'customerName' in order ? order.customerName : (order.customerDetails?.name || 'N/A')}</TableCell>
                      <TableCell>{order.orderType}</TableCell>
                      <TableCell className="capitalize">
                        {order.paymentMethod === 'split' && order.payments ? (
                            <div>
                                <span className="font-medium">Split</span>
                                <div className="text-xs text-muted-foreground">
                                    {order.payments.map(p => (
                                        <div key={p.method}>
                                            {p.method}: {currencySymbol}{p.amount.toFixed(currencyDecimalPlaces)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            order.paymentMethod || '--'
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">{currencySymbol}{(order.total || 0).toFixed(currencyDecimalPlaces)}</TableCell>
                      <TableCell className="print-hide text-right flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => handlePrintInvoice(order)}>
                          <Printer className="mr-2 h-4 w-4" />
                          Print
                        </Button>
                        {canEdit && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/sales-history/${'${order.id}'}/edit?type=${'${order.type}'}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </Button>
                        )}
                        {canDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" disabled={user?.role === 'Admin'}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the order
                                  (Invoice: {order.invoiceNumber || order.id}). This will affect your sales reports.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteOrder(order.id, order.type)}>
                                  Yes, delete order
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No orders found matching your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <div className="hidden">
        <div ref={invoiceRef}>
            {orderToPrint && settings && <Invoice order={orderToPrint} settings={settings} />}
        </div>
      </div>
    </div>
  );
}

    