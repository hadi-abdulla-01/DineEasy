
import { getMenuItems, getTableById, getActiveOrders, getSettings, getOrderById, getCurrentSession } from "@/lib/data";
import { OrderForm } from "@/components/order-form";
import { OrderHeader } from "@/components/order-header";
import { notFound, redirect } from "next/navigation";
import type { Order } from "@/lib/definitions";

type OrderPageProps = {
    params: {
        tableId: string;
    };
    searchParams?: {
        add_items?: string;
        order_id?: string;
    };
};

export default async function OrderPage(props: OrderPageProps) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const { tableId } = params;
    const isAddingItems = searchParams?.add_items === 'true';
    const existingOrderId = searchParams?.order_id;

    const table = await getTableById(tableId);
    if (!table || !table.branchId) {
        notFound();
    }

    const settings = await getSettings(table.branchId);
    const allMenuItems = await getMenuItems(table.branchId);

    // Get current session
    const currentSession = await getCurrentSession(table.branchId);

    // Filter menu items by current session
    const menuItems = allMenuItems.filter(item => {
        // If item has no sessions assigned, it's available at all times
        if (!item.availableSessions || item.availableSessions.length === 0) {
            return true;
        }
        // If no current session, only show items with no sessions
        if (!currentSession) {
            return false;
        }
        // Check if current session is in the item's available sessions
        return item.availableSessions.includes(currentSession.id);
    });

    let activeOrderForTable: Order | undefined;
    if (existingOrderId) {
        activeOrderForTable = await getOrderById(existingOrderId);
    } else {
        const activeOrders = await getActiveOrders(table.branchId);
        activeOrderForTable = activeOrders.find(order => order.tableId === tableId);
    }

    // If an active order exists AND the user is not intentionally adding more items, redirect to status page.
    if (activeOrderForTable && !isAddingItems) {
        redirect(`/order/${tableId}/status/${activeOrderForTable.id}`);
    }

    return (
        <div className="min-h-screen bg-[#f5f5f5] pb-20">
            {/* Header with time-based greeting */}
            <OrderHeader
                restaurantName={settings.restaurantName}
                tableNumber={table.number}
                currentSession={currentSession}
            />

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6 max-w-md">
                <OrderForm
                    menu={menuItems}
                    tableId={tableId}
                    isCustomerFacing={true}
                    existingOrder={activeOrderForTable}
                    currentSession={currentSession}
                />
            </main>
        </div>
    )
}
