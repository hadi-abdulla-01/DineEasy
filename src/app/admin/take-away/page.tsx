
'use client';
import { getMenuItems, getOrderById, getRemoteOrderById } from "@/lib/data";
import { RemoteOrderForm } from "@/components/remote-order-form";
import type { MenuItem, Order, RemoteOrder } from "@/lib/definitions";
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

    const fetchItems = useCallback(() => {
        if (!user?.branchId) {
            setIsLoading(false);
            return;
        };
        setIsLoading(true);
        getMenuItems(user.branchId).then(items => {
            setMenuItems(items);
            setIsLoading(false);
        });
    }, [user?.branchId]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    useEffect(() => {
        if (correctionId && correctionType) {
            if (correctionType === 'Dine-in') {
                getOrderById(correctionId).then(order => setCorrectionOrder(order || null));
            } else {
                getRemoteOrderById(correctionId).then(order => setCorrectionOrder(order || null));
            }
        }
    }, [correctionId, correctionType]);

    if (isLoading || !user?.branchId) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Loading menu...</p>
                </div>
            </div>
        );
    }

    return <RemoteOrderForm menu={menuItems} orderType="Take-away" onItemsUpdate={fetchItems} correctionOrder={correctionOrder} branchId={user.branchId} />;
}
