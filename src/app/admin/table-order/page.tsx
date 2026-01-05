

'use client';

import { useEffect, useState } from "react";
import DraggableTableLayout from "@/components/draggable-table-layout";
import { useAuth } from "../auth-provider";
import { getMainBranch, getBranches } from "@/lib/data";
import type { Branch } from "@/lib/definitions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRestaurantData } from "@/lib/client-data";


export default function TableOrderPage() {
    const { user } = useAuth();
    const [allBranches, setAllBranches] = useState<Branch[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(user?.branchId);
    const [mainBranch, setMainBranch] = useState<Branch | null>(null);

    const isGlobalAdmin = (user?.role === 'Admin' && !user?.branchId) || user?.username?.toLowerCase() === 'admin';

    const { restaurantId } = useRestaurantData();

    useEffect(() => {
        async function fetchInitialData() {
            if (!restaurantId) return;

            const fetchedMainBranch = await getMainBranch(restaurantId);
            setMainBranch(fetchedMainBranch);

            if (isGlobalAdmin) {
                // Global Admin: Fetch all branches and default to Main Branch
                const branches = await getBranches(restaurantId);
                setAllBranches(branches);

                if (!selectedBranchId) {
                    setSelectedBranchId(fetchedMainBranch?.id);
                }
            } else {
                // Branch Admin: Enforce specific branch
                if (selectedBranchId !== user?.branchId) {
                    setSelectedBranchId(user?.branchId);
                }
            }
        }
        if (user && restaurantId) {
            fetchInitialData();
        }

    }, [user, isGlobalAdmin, selectedBranchId, restaurantId]);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="font-headline text-2xl font-semibold">Table Order</h2>
                {isGlobalAdmin && (
                    <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                        <SelectTrigger className="w-full sm:w-[220px]">
                            <SelectValue placeholder="Select a branch" />
                        </SelectTrigger>
                        <SelectContent>
                            {allBranches.map(branch => (
                                <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>
            <div>
                {selectedBranchId ? (
                    <DraggableTableLayout branchId={selectedBranchId} />
                ) : (
                    <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                        <p className="text-muted-foreground">Loading table data...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
