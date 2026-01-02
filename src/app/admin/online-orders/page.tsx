
'use client';
import { getMenuItems, getCurrentSession } from "@/lib/data";
import { RemoteOrderForm } from "@/components/remote-order-form";
import type { MenuItem, MealSession } from "@/lib/definitions";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../auth-provider";
import { Clock } from "lucide-react";
import { LoaderCircle } from "lucide-react";

export default function OnlineOrdersPage() {
    const { user } = useAuth();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [session, setSession] = useState<MealSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchItems = useCallback(async () => {
        if (!user?.branchId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const [currentSession, allMenuItems] = await Promise.all([
                getCurrentSession(user.branchId),
                getMenuItems(user.branchId)
            ]);

            setSession(currentSession);

            const availableMenuItems = allMenuItems.filter(item => {
                if (!item.isAvailable) return false;
                if (!currentSession || !item.availableSessions || item.availableSessions.length === 0) {
                    return true;
                }
                return item.availableSessions.includes(currentSession.id);
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
        if (user?.branchId) {
            fetchItems();
        } else {
            setIsLoading(false);
        }
    }, [user?.branchId, fetchItems]);

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
        <div className="space-y-4">
             {session && (
                <div className="bg-primary/10 border-l-4 border-primary text-primary-foreground p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                         <Clock className="h-5 w-5 text-primary" />
                         <div>
                            <p className="font-bold text-primary">Current Session: {session.name}</p>
                            <p className="text-sm text-primary/80">{session.startTime} - {session.endTime}</p>
                        </div>
                    </div>
                </div>
            )}
            <RemoteOrderForm menu={menuItems} orderType="Online" onItemsUpdate={fetchItems} branchId={user.branchId} />
        </div>
    );
}
