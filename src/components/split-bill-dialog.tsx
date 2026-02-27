'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { OrderItem, RestaurantSettings } from '@/lib/definitions';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

// Simplified order type for the dialog props
type SplitOrder = {
  id: string;
  invoiceNumber?: string | null;
  items: OrderItem[];
  total: number;
};

export function SplitBillDialog({
  open,
  onOpenChange,
  order,
  settings,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: SplitOrder | null;
  settings: RestaurantSettings | null;
}) {
  const [tab, setTab] = useState<'evenly' | 'items'>('evenly');
  const [numEvenSplits, setNumEvenSplits] = useState(2);
  const [numItemSplits, setNumItemSplits] = useState(2);
  const [itemAssignments, setItemAssignments] = useState<Record<string, number>>({});

  useEffect(() => {
    if (order) {
      const initialAssignments: Record<string, number> = {};
      order.items.forEach((item) => {
        initialAssignments[item.orderItemId] = 0; // 0 for unassigned
      });
      setItemAssignments(initialAssignments);
      setNumEvenSplits(2);
      setNumItemSplits(2);
    }
  }, [order]);

  const itemSplitBills = useMemo(() => {
    const bills = Array.from({ length: numItemSplits }, () => ({ items: [] as OrderItem[], total: 0 }));
    let unassignedTotal = 0;
    const unassignedItems: OrderItem[] = [];

    if (order) {
      order.items.forEach((item: OrderItem) => {
        const assignedBillIndex = itemAssignments[item.orderItemId];
        if (assignedBillIndex > 0 && assignedBillIndex <= numItemSplits) {
          bills[assignedBillIndex - 1].items.push(item);
          bills[assignedBillIndex - 1].total += item.price * item.quantity;
        } else {
          unassignedItems.push(item);
          unassignedTotal += item.price * item.quantity;
        }
      });
    }
    return { bills, unassignedItems, unassignedTotal };
  }, [itemAssignments, numItemSplits, order]);

  if (!order || !settings) return null;

  const currencySymbol = settings.currencySymbol || '$';
  const currencyDecimalPlaces = settings.currencyDecimalPlaces ?? 2;

  const handleAssignItem = (orderItemId: string, billIndex: number) => {
    setItemAssignments(prev => ({ ...prev, [orderItemId]: billIndex }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Split Bill for Order #{order.invoiceNumber || order.id.slice(-6)}</DialogTitle>
          <DialogDescription>
            Total amount to split: <span className="font-bold">{currencySymbol}{order.total.toFixed(currencyDecimalPlaces)}</span>
          </DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(value) => setTab(value as 'evenly' | 'items')} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="evenly">Split Evenly</TabsTrigger>
            <TabsTrigger value="items">Split By Item</TabsTrigger>
          </TabsList>
          <TabsContent value="evenly" className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="flex items-center gap-4">
              <Label htmlFor="numEvenSplits" className="text-lg">Split into</Label>
              <Input
                id="numEvenSplits"
                type="number"
                min="2"
                value={numEvenSplits}
                onChange={(e) => setNumEvenSplits(Math.max(2, parseInt(e.target.value) || 2))}
                className="w-24 text-lg text-center"
              />
              <span className="text-lg">ways</span>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Each person pays</p>
              <p className="text-4xl font-bold font-mono">{currencySymbol}{(order.total / numEvenSplits).toFixed(currencyDecimalPlaces)}</p>
            </div>
          </TabsContent>
          <TabsContent value="items" className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-4 my-4">
              <Label htmlFor="numItemSplits">Number of Bills</Label>
              <Input
                id="numItemSplits"
                type="number"
                min="2"
                value={numItemSplits}
                onChange={(e) => setNumItemSplits(Math.max(2, parseInt(e.target.value) || 2))}
                className="w-20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base">Order Items</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-3">
                      {order.items.map((item: OrderItem) => (
                        <div key={item.orderItemId} className="flex justify-between items-center text-sm">
                          <span className="flex-1">{item.quantity}x {item.name}</span>
                          <Select
                            value={String(itemAssignments[item.orderItemId] || 0)}
                            onValueChange={(value) => handleAssignItem(item.orderItemId, parseInt(value))}
                          >
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Unassigned</SelectItem>
                              {Array.from({ length: numItemSplits }, (_, i) => i + 1).map(n => (
                                <SelectItem key={n} value={String(n)}>Bill {n}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  {itemSplitBills.bills.map((bill, index) => (
                    <Card key={index}>
                      <CardHeader className="flex-row justify-between items-center pb-2">
                        <CardTitle className="text-base">Bill {index + 1}</CardTitle>
                        <p className="font-mono font-bold">{currencySymbol}{bill.total.toFixed(currencyDecimalPlaces)}</p>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {bill.items.map(item => <li key={item.orderItemId}>{item.quantity}x {item.name}</li>)}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                  {itemSplitBills.unassignedItems.length > 0 && (
                    <Card className="border-dashed">
                      <CardHeader className="flex-row justify-between items-center pb-2">
                        <CardTitle className="text-base text-muted-foreground">Unassigned</CardTitle>
                        <p className="font-mono font-bold">{currencySymbol}{itemSplitBills.unassignedTotal.toFixed(currencyDecimalPlaces)}</p>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {itemSplitBills.unassignedItems.map(item => <li key={item.orderItemId}>{item.quantity}x {item.name}</li>)}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
