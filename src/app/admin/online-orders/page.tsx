
'use client';
import { RemoteOrderForm } from "@/components/remote-order-form";
import type { MenuItem, RestaurantSettings } from "@/lib/definitions";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../auth-provider";
import { useRestaurantData } from "@/lib/client-data";
import { AdminMenuSkeleton } from "@/components/skeletons";

export default function OnlineOrdersPage() {
    const { user } = useAuth();
    const { getMenuItems, getMainBranch, getSettings, restaurantId } = useRestaurantData();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [branchId, setBranchId] = useState<string | undefined>(undefined);
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function determineBranch() {
            if (user) {
                if (user.branchId) {
                    setBranchId(user.branchId);
                } else {
                    // For global admin, default to main branch
                    const mainBranch = await getMainBranch();
                    if (mainBranch) {
                        setBranchId(mainBranch.id);
                    }
                }
            }
        }
        if (restaurantId) {
            determineBranch();
        }
    }, [user, getMainBranch, restaurantId]);

    const fetchItemsAndSettings = useCallback(async () => {
        if (!branchId || !restaurantId) return;
        setIsLoading(true);
        try {
            const [fetchedMenuItems, fetchedSettings] = await Promise.all([
                getMenuItems(branchId),
                getSettings(branchId)
            ]);
            setMenuItems(fetchedMenuItems);
            setSettings(fetchedSettings);
        } catch (error) {
            console.error("Failed to fetch menu and settings", error);
        } finally {
            setIsLoading(false);
        }
    }, [branchId, getMenuItems, getSettings, restaurantId]);

    useEffect(() => {
        if (branchId) {
            fetchItemsAndSettings();
        }
    }, [branchId, fetchItemsAndSettings]);

    if (!user || (isLoading && !settings)) {
        return <AdminMenuSkeleton label="Loading online order menu" />;
    }

    if (!branchId) {
        return (
            <div className="flex h-[80vh] items-center justify-center rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground text-center">No branches found for this restaurant.<br />Please create a branch in settings.</p>
            </div>
        );
    }

    return (
        <RemoteOrderForm
            menu={menuItems}
            orderType="Online"
            onItemsUpdate={fetchItemsAndSettings}
            branchId={branchId}
            settings={settings}
        />
    );
}
