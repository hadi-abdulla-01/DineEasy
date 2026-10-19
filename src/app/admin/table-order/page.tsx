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
    const [isLoadingSettings, setIsLoadingSettings] = useState(true); // To manage settings loading

    const isGlobalAdmin = (user?.role === 'Admin' && !user?.branchId) || user?.username?.toLowerCase() === 'admin';

    useEffect(() => {
        async function fetchInitialData() {
            if (!user || !restaurantId) return;

            if (isGlobalAdmin) {
                const [fetchedBranches, fetchedMainBranch] = await Promise.all([
                    getBranches(),
                    getMainBranch()
                ]);

                setAllBranches(fetchedBranches);

                if (!selectedBranchId) { // Only set if not already set
                    setSelectedBranchId(fetchedMainBranch?.id || fetchedBranches[0]?.id);
                }
            } else {
                setSelectedBranchId(user.branchId);
            }
        }

        fetchInitialData();
    }, [user, restaurantId, isGlobalAdmin, getBranches, getMainBranch, selectedBranchId]); // Keep selectedBranchId to prevent re-fetch loops
    
    useEffect(() => {
        if (selectedBranchId) {
            setIsLoadingSettings(true); // Set loading to true when branch changes
            getSettings(selectedBranchId).then(s => {
                setSettings(s);
                // If multi-floor is enabled, set the filter.
                // Otherwise, the filter is undefined, showing all tables for the branch.
                if (s?.multiFloorEnabled && s.floors && s.floors.length > 0) {
                    setFloorFilter(s.defaultFloor || s.floors[0]);
                } else {
                    setFloorFilter(undefined);
                }
                setIsLoadingSettings(false); // Set loading to false after settings are fetched
            });
        }
    }, [selectedBranchId, getSettings]);


    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="font-headline text-2xl font-semibold">Table Order</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {isGlobalAdmin && (
                        <Select value={selectedBranchId || ''} onValueChange={(value) => {
                            // Reset floor filter when changing branch to prevent stale filter
                            setFloorFilter(undefined); 
                            setSelectedBranchId(value);
                        }}>
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
                    {settings?.multiFloorEnabled && (settings.floors?.length ?? 0) > 1 && !isLoadingSettings && (
                      <Select value={floorFilter || ''} onValueChange={setFloorFilter}>
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
                {isLoadingSettings || !selectedBranchId ? (
                    <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                        <p className="text-muted-foreground">Loading tables...</p>
                    </div>
                ) : (
                    <DraggableTableLayout branchId={selectedBranchId} floorFilter={floorFilter} />
                )}
            </div>
        </div>
    );
}
