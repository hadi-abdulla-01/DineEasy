
'use client';
import { getMenuItems, getOrderById, getRemoteOrderById, getCurrentSession } from "@/lib/data";
import { RemoteOrderForm } from "@/components/remote-order-form";
import type { MenuItem, Order, RemoteOrder, MealSession } from "@/lib/definitions";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../auth-provider";
import { Clock, LoaderCircle } from "lucide-react";

export default function TakeAwayPage() {
    const { user } = useAuth();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [correctionOrder, setCorrectionOrder] = useState<Order | RemoteOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [session, setSession] = useState<MealSession | null>(null);
    const searchParams = useSearchParams();
    const correctionId = searchParams.get('correction_for');
    const correctionType = searchParams.get('order_type');

    const fetchItems = useCallback(async () => {
        if (!user?.branchId) return; // Guard clause

        try {
            const [currentSession, allMenuItems] = await Promise.all([
                getCurrentSession(user.branchId),
                getMenuItems(user.branchId)
            ]);

            setSession(currentSession);

            const availableMenuItems = allMenuItems.filter(item => {
                if (!item.isAvailable) return false;
                // If no sessions are configured for the item, or no session is active, it's available.
                if (!currentSession || !item.availableSessions || item.availableSessions.length === 0) {
                    return true;
                }
                // Otherwise, check if the item is in the current session.
                return item.availableSessions.includes(currentSession.id);
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
            <RemoteOrderForm menu={menuItems} orderType="Take-away" onItemsUpdate={fetchItems} correctionOrder={correctionOrder} branchId={user.branchId} />
        </div>
    );
}
