
'use client';
import { getMenuItems } from "@/lib/data";
import { RemoteOrderForm } from "@/components/remote-order-form";
import type { MenuItem } from "@/lib/definitions";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../auth-provider";

export default function OnlineOrdersPage() {
    const { user } = useAuth();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    
    const fetchItems = useCallback(() => {
        if (!user?.branchId) return;
        getMenuItems(user.branchId).then(setMenuItems);
    }, [user]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <RemoteOrderForm menu={menuItems} orderType="Online" onItemsUpdate={fetchItems} branchId={user.branchId} />
    );
}
