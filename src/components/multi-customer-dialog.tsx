
'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, PlusCircle } from "lucide-react";
import type { Table, Order } from "@/lib/definitions";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MultiCustomerDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    table: Table & { orders: Order[] };
}

export function MultiCustomerDialog({ isOpen, onOpenChange, table }: MultiCustomerDialogProps) {
    const router = useRouter();

    if (!table) return null;

    const handleNewCustomer = () => {
        router.push(`/admin/tables/${table.id}/order`);
        onOpenChange(false);
    }
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-headline text-xl">Table {table.number} is Occupied</DialogTitle>
                    <DialogDescription>
                        Choose an existing order to add to, or start a new order for a new customer.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <h4 className="font-semibold text-sm text-muted-foreground">Existing Orders at this Table</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {table.orders.map(order => (
                            <Link
                                key={order.id}
                                href={`/admin/tables/${table.id}/order?add_items=true&order_id=${order.id}`}
                                className="block"
                            >
                                <Button
                                    variant="outline"
                                    className="w-full justify-start h-auto py-2"
                                >
                                    <User className="mr-3 h-5 w-5 text-muted-foreground" />
                                    <div className="text-left">
                                        <p className="font-semibold">{order.customerName}</p>
                                        <p className="text-xs text-muted-foreground">Order ID: ...{order.id.slice(-4)}</p>
                                    </div>
                                </Button>
                            </Link>
                        ))}
                    </div>
                </div>

                <Separator />

                <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
                    <Button onClick={handleNewCustomer} className="w-full">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Start New Order for New Customer
                    </Button>
                     <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

