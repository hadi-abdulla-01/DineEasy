

'use client';

import { useEffect, useState } from "react";
import DraggableTableLayout from "@/components/draggable-table-layout";
import { useAuth } from "../auth-provider";
import { getMainBranch, getBranches } from "@/lib/data";
import type { Branch } from "@/lib/definitions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function TableOrderPage() {
    const { user } = useAuth();
    const [allBranches, setAllBranches] = useState<Branch[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(user?.branchId);
    const [mainBranch, setMainBranch] = useState<Branch | null>(null);

    const isMainBranchManager = user?.role === 'Manager' && user?.branchId === mainBranch?.id;
    const canManageAllBranches = user?.role === 'Admin' || isMainBranchManager;


    useEffect(() => {
        async function fetchInitialData() {
            const fetchedMainBranch = await getMainBranch();
            setMainBranch(fetchedMainBranch);

            if (user?.role === 'Admin' && !selectedBranchId) {
                setSelectedBranchId(fetchedMainBranch?.id);
            } else if (user?.branchId) {
                setSelectedBranchId(user.branchId);
            }

            if (canManageAllBranches) {
                getBranches().then(setAllBranches);
            }
        }
        if(user) {
            fetchInitialData();
        }

    }, [user, canManageAllBranches, selectedBranchId]);

    return (
        <div className="space-y-8">
             <div className="flex justify-between items-center">
                <h2 className="font-headline text-2xl font-semibold">Table Order</h2>
                 {canManageAllBranches && (
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
