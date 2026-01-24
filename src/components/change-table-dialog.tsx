'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { changeOrderTableAction } from '@/lib/actions';
import type { Order, Table } from '@/lib/definitions';

export function ChangeTableDialog({
    order,
    tables,
    isOpen,
    onOpenChange,
    restaurantId,
    onTableChanged
}: {
    order: Order;
    tables: Table[];
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    restaurantId: string;
    onTableChanged?: () => void;
}) {
    const [newTableId, setNewTableId] = useState('');
    const { toast } = useToast();

    const handleChangeTable = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData();

        if (!newTableId) {
            toast({ variant: 'destructive', title: 'Please select a new table.' });
            return;
        }
        formData.append('orderId', order.id);
        formData.append('newTableId', newTableId);
        formData.append('restaurantId', restaurantId);

        const result = await changeOrderTableAction(formData);

        if (result?.message) {
            toast({ variant: 'destructive', title: result.message });
        } else {
            toast({ title: 'Table Changed', description: `Order moved to new table successfully.` });
            if (onTableChanged) {
                onTableChanged();
            }
            onOpenChange(false);
        }
    };

    const availableTables = tables.filter(t => t.id !== order.tableId);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change Table for Order #{order.id.slice(-4)}</DialogTitle>
                    <DialogDescription>
                        Current Table: {order.table?.number}. Select a new table for this order.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleChangeTable} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-table">New Table</Label>
                        <Select onValueChange={setNewTableId} value={newTableId}>
                            <SelectTrigger id="new-table">
                                <SelectValue placeholder="Select a new table" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableTables.map(table => (
                                    <SelectItem key={table.id} value={table.id}>
                                        Table {table.number}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit">Move Order</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
