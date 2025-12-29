
'use client';
import { getMenuItems, getOrderById, getRemoteOrderById } from "@/lib/data";
import { RemoteOrderForm } from "@/components/remote-order-form";
import type { MenuItem, Order, RemoteOrder } from "@/lib/definitions";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../auth-provider";

export default function TakeAwayPage() {
    const { user } = useAuth();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [correctionOrder, setCorrectionOrder] = useState<Order | RemoteOrder | null>(null);
    const searchParams = useSearchParams();
    const correctionId = searchParams.get('correction_for');
    const correctionType = searchParams.get('order_type');

    const fetchItems = useCallback(() => {
        if (!user?.branchId) return;
        getMenuItems(user.branchId).then(setMenuItems);
    }, [user]);

    useEffect(() => {
        fetchItems();
        if (correctionId && correctionType) {
            if (correctionType === 'Dine-in') {
                getOrderById(correctionId).then(order => setCorrectionOrder(order || null));
            } else {
                getRemoteOrderById(correctionId).then(order => setCorrectionOrder(order || null));
            }
        }
    }, [fetchItems, correctionId, correctionType]);

    if (!user) {
        return <div>Loading...</div>;
    }

    return <RemoteOrderForm menu={menuItems} orderType="Take-away" onItemsUpdate={fetchItems} correctionOrder={correctionOrder} branchId={user.branchId} />;
}
