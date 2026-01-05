
'use client';
import { RemoteOrderForm } from "@/components/remote-order-form";
import type { MenuItem, Order, RemoteOrder, Branch } from "@/lib/definitions";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../auth-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRestaurantData } from "@/lib/client-data";
import { getOrderById, getRemoteOrderById } from "@/lib/data";

export default function TakeAwayPage() {
    const { user } = useAuth();
    const { getMenuItems, getBranches } = useRestaurantData();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [correctionOrder, setCorrectionOrder] = useState<Order | RemoteOrder | null>(null);
    const searchParams = useSearchParams();
    const correctionId = searchParams.get('correction_for');
    const correctionType = searchParams.get('order_type');

    const isGlobalAdmin = (user?.role === 'Admin' && !user?.branchId) || user?.username?.toLowerCase() === 'admin';
    const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(user?.branchId);
    const [branches, setBranches] = useState<Branch[]>([]);

    useEffect(() => {
        if (isGlobalAdmin) {
            getBranches().then(setBranches);
        }
    }, [isGlobalAdmin, getBranches]);

    const fetchItems = useCallback(() => {
        if (!selectedBranchId) return;
        getMenuItems(selectedBranchId).then(setMenuItems);
    }, [selectedBranchId, getMenuItems]);

    useEffect(() => {
        fetchItems();
        if (correctionId && correctionType) {
            if (correctionType === 'Dine-in') {
                getOrderById(correctionId).then(order => setCorrectionOrder(order || null));
            } else {
                getRemoteOrderById(correctionId).then(order => setCorrectionOrder(order || null));
            }
        }
    }, [fetchItems, correctionId, correctionType]);

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-4">
            {isGlobalAdmin && (
                <div className="flex justify-end p-2">
                    <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                        <SelectTrigger className="w-[200px] bg-background">
                            <SelectValue placeholder="Select Branch" />
                        </SelectTrigger>
                        <SelectContent>
                            {branches.map(b => (
                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {selectedBranchId ? (
                <RemoteOrderForm
                    menu={menuItems}
                    orderType="Take-away"
                    onItemsUpdate={fetchItems}
                    correctionOrder={correctionOrder}
                    branchId={selectedBranchId}
                />
            ) : (
                <div className="flex h-40 items-center justify-center border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Select a branch to start a Take Away order.</p>
                </div>
            )}
        </div>
    );
}
