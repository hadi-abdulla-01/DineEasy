
'use client';
import { getMenuItems, getOrderById, getRemoteOrderById, getCurrentSession } from "@/lib/data";
import { RemoteOrderForm } from "@/components/remote-order-form";
import type { MenuItem, Order, RemoteOrder, MealSession } from "@/lib/definitions";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../auth-provider";
import { LoaderCircle } from "lucide-react";

export default function TakeAwayPage() {
    const { user } = useAuth();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [correctionOrder, setCorrectionOrder] = useState<Order | RemoteOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const searchParams = useSearchParams();
    const correctionId = searchParams.get('correction_for');
    const correctionType = searchParams.get('order_type');

    const fetchItems = useCallback(async () => {
        if (!user?.branchId) return; // Guard clause

        try {
            const [session, allMenuItems] = await Promise.all([
                getCurrentSession(user.branchId),
                getMenuItems(user.branchId)
            ]);

            const availableMenuItems = allMenuItems.filter(item => {
                if (!item.isAvailable) return false;
                // If no sessions are configured for the item, or no session is active, it's available.
                if (!session || !item.availableSessions || item.availableSessions.length === 0) {
                    return true;
                }
                // Otherwise, check if the item is in the current session.
                return item.availableSessions.includes(session.id);
            });
            setMenuItems(availableMenuItems);
        } catch (error) {
            console.error("Failed to fetch take-away menu items:", error);
            setMenuItems([]);
        } finally {
            setIsLoading(false);
        }
    }, [user?.branchId]);

    useEffect(() => {
        if (user?.branchId) {
            setIsLoading(true);
            fetchItems();
        } else {
            setIsLoading(false);
        }
    }, [user?.branchId, fetchItems]);

    useEffect(() => {
        if (correctionId && correctionType) {
            if (correctionType === 'Dine-in') {
                getOrderById(correctionId).then(order => setCorrectionOrder(order || null));
            } else {
                getRemoteOrderById(correctionId).then(order => setCorrectionOrder(order || null));
            }
        } else {
            setCorrectionOrder(null);
        }
    }, [correctionId, correctionType]);

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
    
    if (!user?.branchId) {
         return (
            <div className="flex h-[60vh] items-center justify-center">
                <p className="text-muted-foreground">Could not determine user's branch.</p>
            </div>
        );
    }

    return <RemoteOrderForm menu={menuItems} orderType="Take-away" onItemsUpdate={fetchItems} correctionOrder={correctionOrder} branchId={user.branchId} />;
}
