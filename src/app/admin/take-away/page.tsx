
'use client';
import { RemoteOrderForm } from "@/components/remote-order-form";
import type { MenuItem, Order, RemoteOrder, Branch, RestaurantSettings } from "@/lib/definitions";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../auth-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRestaurantData } from "@/lib/client-data";
import { getOrderById, getRemoteOrderById } from "@/lib/data";

export default function TakeAwayPage() {
    const { user } = useAuth();
    const { getMenuItems, getBranches, getMainBranch, getSettings, restaurantId } = useRestaurantData();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [correctionOrder, setCorrectionOrder] = useState<Order | RemoteOrder | null>(null);
    const searchParams = useSearchParams();
    const correctionId = searchParams.get('correction_for');
    const correctionType = searchParams.get('order_type');

    const isGlobalAdmin = (user?.role === 'Admin' && !user?.branchId) || user?.username?.toLowerCase() === 'admin';
    const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(user?.branchId);
    const [branches, setBranches] = useState<Branch[]>([]);

    useEffect(() => {
        async function determineBranch() {
            if (!user || !restaurantId) return;

            if (isGlobalAdmin) {
                const [fetchedBranches, mainBranch] = await Promise.all([
                    getBranches(),
                    getMainBranch(),
                ]);
                setBranches(fetchedBranches);
                if (mainBranch && !selectedBranchId) {
                    setSelectedBranchId(mainBranch.id);
                }
            } else {
                setSelectedBranchId(user.branchId);
            }
        }
        determineBranch();
    }, [user, restaurantId, isGlobalAdmin, getBranches, getMainBranch, selectedBranchId]);

    const fetchBranchData = useCallback(async () => {
        if (!selectedBranchId) return;
        const [fetchedMenuItems, fetchedSettings] = await Promise.all([
            getMenuItems(selectedBranchId),
            getSettings(selectedBranchId)
        ]);
        setMenuItems(fetchedMenuItems);
        setSettings(fetchedSettings);
    }, [selectedBranchId, getMenuItems, getSettings]);


    useEffect(() => {
        if (selectedBranchId) {
            fetchBranchData();
        }

        if (correctionId && correctionType) {
            if (correctionType === 'Dine-in') {
                getOrderById(correctionId).then(order => setCorrectionOrder(order || null));
            } else {
                getRemoteOrderById(correctionId).then(order => setCorrectionOrder(order || null));
            }
        }
    }, [selectedBranchId, fetchBranchData, correctionId, correctionType]);


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

            {selectedBranchId && settings ? (
                <RemoteOrderForm
                    menu={menuItems}
                    orderType="Take-away"
                    onItemsUpdate={fetchBranchData}
                    correctionOrder={correctionOrder}
                    branchId={selectedBranchId}
                    settings={settings}
                />
            ) : (
                <div className="flex h-40 items-center justify-center border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">
                        {isGlobalAdmin ? "Select a branch to start a Take Away order." : "Loading menu..."}
                    </p>
                </div>
            )}
        </div>
    );
}

