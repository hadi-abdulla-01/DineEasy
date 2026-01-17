

'use client';

import { useEffect, useState } from "react";
import DraggableTableLayout from "@/components/draggable-table-layout";
import { useAuth } from "../auth-provider";
import type { Branch, RestaurantSettings } from "@/lib/definitions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRestaurantData } from "@/lib/client-data";


export default function TableOrderPage() {
    const { user } = useAuth();
    const { getBranches, getMainBranch, getSettings, restaurantId } = useRestaurantData();
    const [allBranches, setAllBranches] = useState<Branch[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(undefined);
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [floorFilter, setFloorFilter] = useState<string | undefined>(undefined);

    const isGlobalAdmin = (user?.role === 'Admin' && !user?.branchId) || user?.username?.toLowerCase() === 'admin';

    useEffect(() => {
        async function fetchInitialData() {
            if (!user || !restaurantId) return;

            if (!isGlobalAdmin && user.branchId) {
                if (selectedBranchId !== user.branchId) {
                    setSelectedBranchId(user.branchId);
                }
                return;
            }

            if (isGlobalAdmin) {
                const [fetchedBranches, fetchedMainBranch] = await Promise.all([
                    getBranches(),
                    getMainBranch()
                ]);

                setAllBranches(fetchedBranches);

                if (!selectedBranchId && fetchedMainBranch) {
                    setSelectedBranchId(fetchedMainBranch.id);
                }
            }
        }

        fetchInitialData();

    }, [user, restaurantId, isGlobalAdmin, selectedBranchId, getBranches, getMainBranch]);
    
    useEffect(() => {
        if (selectedBranchId) {
            getSettings(selectedBranchId).then(s => {
                setSettings(s);
                // If multi-floor is enabled, set the filter.
                // Otherwise, the filter remains undefined (showing all tables for the branch).
                if (s?.multiFloorEnabled && s.floors && s.floors.length > 0) {
                    // Default to the designated default floor, or the first floor if none is set.
                    setFloorFilter(s.defaultFloor || s.floors[0]);
                } else {
                    setFloorFilter(undefined);
                }
            });
        }
    }, [selectedBranchId, getSettings]);


    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="font-headline text-2xl font-semibold">Table Order</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {isGlobalAdmin && (
                        <Select value={selectedBranchId || ''} onValueChange={setSelectedBranchId}>
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
                    {settings?.multiFloorEnabled && (settings.floors?.length ?? 0) > 1 && (
                      <Select value={floorFilter} onValueChange={setFloorFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Filter by floor" />
                        </SelectTrigger>
                        <SelectContent>
                          {settings.floors?.map(floor => (
                            <SelectItem key={floor} value={floor}>{floor}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                </div>
            </div>
            <div>
                {selectedBranchId ? (
                    <DraggableTableLayout branchId={selectedBranchId} floorFilter={floorFilter} />
                ) : (
                    <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                        <p className="text-muted-foreground">Loading table data...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
