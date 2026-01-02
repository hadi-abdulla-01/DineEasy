
'use client';
import { getMenuItems, getCurrentSession } from "@/lib/data";
import { RemoteOrderForm } from "@/components/remote-order-form";
import type { MenuItem, MealSession } from "@/lib/definitions";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../auth-provider";
import { LoaderCircle } from "lucide-react";

export default function OnlineOrdersPage() {
    const { user } = useAuth();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchItems = useCallback(async () => {
        if (!user?.branchId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const [allMenuItems, session] = await Promise.all([
                getMenuItems(user.branchId),
                getCurrentSession(user.branchId)
            ]);

            const availableMenuItems = allMenuItems.filter(item => {
                if (!item.isAvailable) return false;
                if (!session || !item.availableSessions || item.availableSessions.length === 0) {
                    return true;
                }
                return item.availableSessions.includes(session.id);
            });
            setMenuItems(availableMenuItems);
        } catch (error) {
            console.error("Failed to fetch menu items:", error);
            setMenuItems([]); // Set empty on error
        } finally {
            setIsLoading(false);
        }
    }, [user?.branchId]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Loading menu...</p>
                </div>
            </div>
        );
    }
    
    if (!user) {
        return <div>Loading...</div>;
    }


    return (
        <RemoteOrderForm menu={menuItems} orderType="Online" onItemsUpdate={fetchItems} branchId={user.branchId} />
    );
}
