'use client';

import { OrderForm } from "@/components/order-form";
import { notFound, useRouter } from "next/navigation";
import type { Order, MenuItem, RestaurantSettings } from "@/lib/definitions";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "@/app/admin/auth-provider";
import { useRestaurantData } from "@/lib/client-data";

export default function PlaceOrderPage() {
    const { user } = useAuth();
    const { getMenuItems, getTableById, getActiveOrders, getSettings, restaurantId } = useRestaurantData();
    const router = useRouter();

    const [table, setTable] = useState<{ id: string, branchId: string, number: string, restaurantId?: string } | null>(null);
    const [settings, setSettings] = useState<RestaurantSettings | null>(null);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user || user.role !== 'Table' || !user.assignedTableId) {
            // This shouldn't happen if routing is correct, but as a safeguard
            // redirect to admin dashboard or login.
            router.replace('/admin');
            return;
        }

        const tableId = user.assignedTableId;

        async function loadData() {
            setIsLoading(true);
            try {
                const fetchedTable = await getTableById(tableId);

                if (!fetchedTable || !fetchedTable.branchId) {
                    notFound();
                    return;
                }
                setTable({
                    id: fetchedTable.id,
                    branchId: fetchedTable.branchId,
                    number: fetchedTable.number,
                    restaurantId: restaurantId,
                });
                
                const [fetchedMenuItems, fetchedSettings] = await Promise.all([
                    getMenuItems(fetchedTable.branchId),
                    getSettings(fetchedTable.branchId)
                ]);
                setMenuItems(fetchedMenuItems);
                setSettings(fetchedSettings);
            } catch (error) {
                console.error("Failed to load data for place order page:", error);
            } finally {
                setIsLoading(false);
            }
        }
        if (restaurantId) {
            loadData();
        }
    }, [user, restaurantId, getTableById, getMenuItems, getSettings, router]);

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Loading Order Screen...</p>
                </div>
            </div>
        );
    }

    if (!table) {
        return notFound();
    }

    return (
        <div>
            <OrderForm 
                menu={menuItems} 
                tableId={table.id} 
                isCustomerFacing={false} // Staff is placing order
                settings={settings}
                restaurantId={restaurantId}
            />
        </div>
    );
}
