









'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { OrderItem, OrderStatus, MenuItem, Table, RemoteOrder, Order, KitchenUser, RestaurantSettings, AddonGroup, SelectedAddon, UserRole, InvoiceSettings, NavMenuKey, UserPermissions, AppliedTax, Tax, PrintSettings, Branch } from './definitions';
import {
    createOrder,
    updateTableStatus,
    updateOrderStatus,
    createTable,
    deleteTable,
    addMenuItem,
    updateMenuItem,
    toggleMenuItemAvailability,
    addRemoteOrder,
    getOrdersByTableId,
    cancelOrdersForTable,
    createKitchenUser,
    updateKitchenUser,
    deleteKitchenUser,
    updateOrderItemStatus,
    cancelOrderItem,
    updateTablePosition,
    addItemsToOrder,
    getActiveOrders,
    getOrderById,
    updateSettings,
    getSettings,
    toggleMenuItemAddon,
    deleteOrder,
    updateOrderDetails,
    createBranch,
    deleteBranch,
    setMainBranch,
    getKitchenUserByUsername,
    getTableById,
    logActivity,
} from './data';


const OrderItemSchema = z.object({
    menuItemId: z.string(),
    quantity: z.number().min(1),
    name: z.string(),
    price: z.number(),
    status: z.enum(['active', 'cancelled']).optional(),
    isReady: z.boolean().optional(),
    orderItemId: z.string(), // Added for consistency
    category: z.string(), // Added for consistency
    selectedAddons: z.array(z.object({
        groupTitle: z.string(),
        optionName: z.string()
    })).optional(),
    notes: z.string().optional(),
});

type PlaceOrderState = {
    errors?: {
        customerName?: string[];
        customerPhone?: string[];
    };
    message?: string | null;
    success?: boolean;
    orderId?: string;
} | null;

export async function placeOrder(prevState: PlaceOrderState, formData: FormData): Promise<PlaceOrderState> {
    const tableId = formData.get('tableId') as string;
    const itemsJson = formData.get('items') as string;
    const orderNotes = formData.get('orderNotes') as string | undefined;
    const customerName = formData.get('customerName') as string;
    const customerPhone = formData.get('customerPhone') as string;
    const isCustomerFacing = formData.get('isCustomerFacing') === 'true';
    const createdByName = formData.get('createdByName') as string | null;


    const CustomerSchema = z.object({
        customerName: z.string().min(1, "Name is required."),
        customerPhone: z.string().min(1, "Phone is required."),
    });

    const validatedCustomerFields = CustomerSchema.safeParse({ customerName, customerPhone });

    if (!validatedCustomerFields.success) {
        return {
            errors: validatedCustomerFields.error.flatten().fieldErrors,
            message: 'Customer name and phone are required.',
        };
    }

    let branchId = formData.get('branchId') as string;
    if (!branchId) {
        const table = await getTableById(tableId);
        if (table?.branchId) {
            branchId = table.branchId;
        } else {
            return { message: "Could not determine branch for this table." };
        }
    }


    let parsedItems: unknown;
    try {
        parsedItems = JSON.parse(itemsJson);
    } catch {
        return { message: "Invalid order items." };
    }

    const validatedItems = z.array(OrderItemSchema).safeParse(parsedItems);
    if (!validatedItems.success || validatedItems.data.length === 0) {
        return { message: "Your cart is empty or contains invalid items." };
    }

    const newItems: OrderItem[] = validatedItems.data.map(item => ({
        ...item,
        isReady: false,
        status: 'active',
    }));

    const activeOrders = await getActiveOrders(branchId);
    const existingOrderForCustomer = activeOrders.find(o => o.tableId === tableId && o.customerPhone === customerPhone);

    let finalOrder: Order | undefined;

    try {
        if (existingOrderForCustomer) {
            finalOrder = await addItemsToOrder(existingOrderForCustomer.id, newItems, orderNotes);
            if (finalOrder && finalOrder.status === 'ready') {
                finalOrder = await updateOrderStatus(finalOrder.id, 'preparing');
            }
        } else {
            const orderToCreate = {
                tableId,
                branchId,
                customerName: customerName,
                customerPhone: customerPhone,
                items: newItems,
                orderType: 'Dine-in' as Order['orderType'],
                notes: orderNotes,
                createdByName: createdByName || (isCustomerFacing ? 'Customer' : undefined)
            };
            finalOrder = await createOrder(orderToCreate);
        }

        if (!finalOrder) {
            throw new Error("Failed to create or update order.");
        }

        await updateTableStatus(tableId, 'occupied');

    } catch (error) {
        console.error(error);
        return {
            message: 'Database Error: Failed to Place Order.',
        };
    }

    revalidatePath('/kitchen', 'layout');
    revalidatePath('/admin', 'layout');

    if (!isCustomerFacing) {
        redirect('/admin/table-order');
    }

    revalidatePath(`/order/${tableId}/status/${finalOrder.id}`);

    return { success: true, orderId: finalOrder.id };
}


export async function updateOrderStatusAction(orderId: string, formData: FormData) {
    const status = formData.get('status') as OrderStatus;
    const paymentMethod = formData.get('paymentMethod') as Order['paymentMethod'];

    if (!status) {
        return { message: 'Status is required.' };
    }
    try {
        const order = await getOrderById(orderId);
        if (!order) {
            return { message: 'Order not found.' };
        }

        const updatedOrder = await updateOrderStatus(orderId, status, paymentMethod);

        if (updatedOrder && (status === 'completed' || status === 'cancelled')) {
            if (updatedOrder.orderType === 'Dine-in') {
                const otherOrders = await getOrdersByTableId(updatedOrder.tableId);
                const activeOrdersOnTable = otherOrders.filter(o => o.id !== orderId && o.status !== 'completed' && o.status !== 'cancelled');
                if (activeOrdersOnTable.length === 0) {
                    await updateTableStatus(updatedOrder.tableId, 'available');
                }
            }
            revalidatePath('/admin');
        }

        revalidatePath('/kitchen', 'layout');
        revalidatePath('/admin/kitchen', 'page');
        revalidatePath(`/order/${order.tableId}/status/${order.id}`);
        revalidatePath('/admin/sales');
        revalidatePath('/admin/sales-history');

        if (status === 'completed') {
            redirect('/admin/kitchen');
        }

    } catch (error) {
        return { message: 'Database Error: Failed to Update Order Status.' };
    }
}

export async function updateKitchenOrderStatusAction(orderId: string, formData: FormData) {
    const status = formData.get('status') as OrderStatus;

    if (!status) {
        return { message: 'Status is required.' };
    }

    try {
        await updateOrderStatus(orderId, status);
        revalidatePath('/kitchen', 'layout');
        revalidatePath('/admin/kitchen', 'page');
    } catch (error) {
        return { message: 'Database Error: Failed to update order status in kitchen.' };
    }
}


export async function updateOrderItemStatusAction(orderId: string, orderItemId: string, isReady: boolean) {
    try {
        await updateOrderItemStatus(orderId, orderItemId, isReady);
        revalidatePath('/kitchen', 'layout');
        revalidatePath('/admin/kitchen', 'page');
    } catch (error) {
        return { message: 'Database Error: Failed to Update Item Status.' };
    }
}

export async function cancelOrderItemAction(orderId: string, orderItemId: string) {
    try {
        await cancelOrderItem(orderId, orderItemId);
        revalidatePath('/kitchen', 'layout');
        revalidatePath('/admin/kitchen', 'page');
        revalidatePath(`/order/[tableId]/status/[orderId]`, 'page');
    } catch (error) {
        return { message: 'Database Error: Failed to cancel item.' };
    }
}

export async function createTableAction(formData: FormData) {
    const tableNumber = formData.get('tableNumber');
    const branchId = formData.get('branchId') as string;
    if (tableNumber && branchId) {
        await createTable(Number(tableNumber), branchId);
        revalidatePath('/admin/tables');
        revalidatePath('/admin');
    }
}

export async function addMenuItemAction(formData: FormData) {
    const name = formData.get('name') as string;
    const price = parseFloat(formData.get('price') as string);
    const description = formData.get('description') as string;
    const image = formData.get('image') as string | null;
    const category = (formData.get('category') === 'new' ? formData.get('newCategory') : formData.get('category')) as string;
    const prepTimeValue = formData.get('prepTime');
    const prepTime = prepTimeValue ? Number(prepTimeValue) : undefined;
    const isBestSeller = formData.get('isBestSeller') === 'on';
    const isRecommended = formData.get('isRecommended') === 'on';
    const recommendationNote = formData.get('recommendationNote') as string | null;
    const branchId = formData.get('branchId') as string;
    const availableSessionsString = formData.get('availableSessions') as string | null;


    if (name && !isNaN(price) && description && category) {
        const newItemData: Omit<MenuItem, 'id' | 'isAvailable'> = {
            name,
            price,
            description,
            category,
            imageId: image || `placeholder-${Date.now()}`,
            isBestSeller,
            isRecommended,
            branchId
        };
        if (prepTime !== undefined && !isNaN(prepTime)) {
            newItemData.prepTime = prepTime;
        }
        if (recommendationNote) {
            newItemData.recommendationNote = recommendationNote;
        }
        if (availableSessionsString) {
            try {
                const sessions = JSON.parse(availableSessionsString);
                if (Array.isArray(sessions)) {
                    newItemData.availableSessions = sessions;
                }
            } catch (e) {
                console.error("Failed to parse available sessions JSON");
            }
        }

        await addMenuItem(newItemData);
        revalidatePath('/admin/menu');
        revalidatePath('/order', 'layout');
        revalidatePath('/admin/user-management');
    }
}

export async function updateMenuItemAction(itemId: string, formData: FormData) {
    const name = formData.get('name') as string;
    const price = parseFloat(formData.get('price') as string);
    const description = formData.get('description') as string;
    const image = formData.get('image') as string | null;
    const category = (formData.get('category') === 'new' ? formData.get('newCategory') : formData.get('category')) as string;
    const addonGroupsString = formData.get('addonGroups') as string | null;
    const prepTime = Number(formData.get('prepTime')) || undefined;
    const isBestSeller = formData.get('isBestSeller') === 'on';
    const isRecommended = formData.get('isRecommended') === 'on';
    const recommendationNote = formData.get('recommendationNote') as string | null;
    const availableSessionsString = formData.get('availableSessions') as string | null;


    const updateData: Partial<MenuItem> = {};
    if (name) updateData.name = name;
    if (!isNaN(price)) updateData.price = price;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (image) updateData.imageId = image;

    if (prepTime !== undefined && !isNaN(prepTime)) {
        updateData.prepTime = prepTime;
    } else {
        updateData.prepTime = undefined;
    }


    if (addonGroupsString) {
        try {
            updateData.addonGroups = JSON.parse(addonGroupsString) as AddonGroup[];
        } catch (e) {
            console.error("Failed to parse addon groups JSON");
        }
    }

    // Add best seller and recommended fields
    updateData.isBestSeller = isBestSeller;
    updateData.isRecommended = isRecommended;
    if (recommendationNote) {
        updateData.recommendationNote = recommendationNote;
    }

    // Handle available sessions
    if (availableSessionsString) {
        try {
            const sessions = JSON.parse(availableSessionsString);
            if (Array.isArray(sessions)) {
                updateData.availableSessions = sessions;
            }
        } catch (e) {
            console.error("Failed to parse available sessions JSON");
        }
    }


    try {
        await updateMenuItem(itemId, updateData);
        revalidatePath('/admin/menu');
        revalidatePath(`/admin/menu/${itemId}/edit`);
        revalidatePath('/order', 'layout');
        revalidatePath('/admin/user-management');
    } catch (error) {
        return { message: 'Database Error: Failed to update item.' };
    }
    redirect('/admin/menu');
}

export async function toggleMenuItemAvailabilityAction(itemId: string, isAvailable: boolean) {
    await toggleMenuItemAvailability(itemId, isAvailable);
    revalidatePath('/admin/menu');
    revalidatePath('/order', 'layout');
}

export async function toggleMenuItemAddonAction(itemId: string, isAddon: boolean) {
    await toggleMenuItemAddon(itemId, isAddon);
    revalidatePath('/admin/menu');
    revalidatePath(`/admin/menu/${itemId}/edit`);
}

export async function updateTableStatusAction(tableId: string, status: Table['status']) {
    try {
        await updateTableStatus(tableId, status);
        if (status === 'available') {
            await cancelOrdersForTable(tableId);
        }
        revalidatePath('/admin');
        revalidatePath('/admin/tables');
        revalidatePath('/kitchen');
    } catch (error) {
        return { message: 'Database Error: Failed to Update Table Status.' };
    }
}

export async function addRemoteOrderAction(formData: FormData) {
    const cartJSON = formData.get('cart') as string;
    const cartItems = JSON.parse(cartJSON);

    const customerDetails = {
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
        platform: formData.get('platform') as string,
    }

    const orderType = formData.get('orderType') as Order['orderType'];
    const createdByName = formData.get('createdByName') as string | null;

    const newOrderData = {
        orderType,
        customerDetails,
        items: cartItems,
        branchId: formData.get('branchId') as string,
        createdByName: createdByName,
    };

    const newRemoteOrder = await addRemoteOrder(newOrderData);

    const correctionForId = formData.get('correctionFor') as string;
    const correctionType = formData.get('correctionType') as 'Dine-in' | 'Remote';

    if (correctionForId && correctionType) {
        await deleteOrder(correctionForId, correctionType);
    }

    revalidatePath('/admin/online-orders');
    revalidatePath('/admin/take-away');
    revalidatePath('/kitchen', 'layout');
    revalidatePath('/admin', 'layout');
    revalidatePath('/admin/sales-history');
    revalidatePath('/admin/sales');

    return newRemoteOrder;
}

type CreateUserState = {
    message?: string;
} | undefined;


export async function createKitchenUserAction(prevState: CreateUserState, formData: FormData): Promise<CreateUserState> {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as UserRole;
    const branchId = formData.get('branchId') as string;
    let categories = formData.getAll('categories').map(String);
    const permissionsString = formData.get('permissions') as string | null;

    if (!username || !password || !role || !branchId) {
        return { message: "Missing required fields." };
    }

    // Check for unique username
    const existingUser = await getKitchenUserByUsername(username);
    if (existingUser) {
        return { message: "Username already exists. Please choose a different one." };
    }

    if (!permissionsString) {
        return { message: "Missing permissions." };
    }
    const permissions: UserPermissions = JSON.parse(permissionsString);

    // Remove duplicates
    const uniqueCategories = Array.from(new Set(categories));

    const newUser = await createKitchenUser({ username, password, categories: uniqueCategories, role, permissions, branchId });
    await logActivity(newUser.id, newUser.username, 'Created User', `Created new user: ${username} with role ${role}`);

    revalidatePath('/admin/user-management');

    return { message: "User created successfully." };
}


export async function updateKitchenUserAction(userId: string, formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as UserRole;
    const branchId = formData.get('branchId') as string;
    const categories = formData.getAll('categories').map(String);
    const permissionsString = formData.get('permissions') as string | null;

    if (!permissionsString) {
        console.log("Validation failed: Missing permissions.");
        return;
    }
    const permissions: UserPermissions = JSON.parse(permissionsString);

    // Remove duplicates
    const uniqueCategories = Array.from(new Set(categories));

    const updateData: Partial<KitchenUser> = {};
    if (username) updateData.username = username;
    if (password) updateData.password = password; // In a real app, this should be hashed
    if (role) updateData.role = role;
    if (branchId) updateData.branchId = branchId;
    if (uniqueCategories.length > 0) updateData.categories = uniqueCategories;
    else if (role === 'Kitchen') { // If kitchen user has no categories selected, set it to an empty array
        updateData.categories = [];
    }
    if (permissions) updateData.permissions = permissions;


    try {
        const updatedUser = await updateKitchenUser(userId, updateData);
        if (updatedUser) {
            await logActivity(userId, updatedUser.username, 'Updated Profile', `Updated profile for ${username}`);
        }
        revalidatePath('/admin/user-management');
    } catch (error) {
        return { message: 'Database Error: Failed to update user.' };
    }
    redirect('/admin/user-management');
}


export async function deleteKitchenUserAction(userId: string) {
    try {
        const userToDelete = await getKitchenUserById(userId);
        if (userToDelete) {
             await deleteKitchenUser(userId);
             await logActivity(userId, userToDelete.username, 'Deleted User', `Deleted user: ${userToDelete.username}`);
        }
        revalidatePath('/admin/user-management');
    } catch (error) {
        return { message: 'Database Error: Failed to delete user.' };
    }
}

export async function updateTablePositionAction(tableId: string, position: { x: number; y: number }) {
    try {
        await updateTablePosition(tableId, position);
        revalidatePath('/admin');
    } catch (error) {
        console.error("Failed to update table position:", error);
        return { message: 'Database Error: Failed to update table position.' };
    }
}

export async function updateSettingsAction(formData: FormData) {
    const branchId = formData.get('branchId') as string | undefined;

    if (!branchId && formData.has('branchId')) {
        // This case handles a form that's supposed to be for a branch but branchId is empty.
        // We probably should throw an error or handle it gracefully.
        // For now, let's assume it's a global update if branchId is falsy.
    }


    const newSettings: Partial<RestaurantSettings & Branch> = {};

    // Global Restaurant Settings
    if (formData.has('restaurantName')) newSettings.restaurantName = formData.get('restaurantName') as string;
    if (formData.has('restaurantAddress')) newSettings.restaurantAddress = formData.get('restaurantAddress') as string;

    // Branch-Specific or Global Fallback Settings
    if (formData.has('currencySymbol')) newSettings.currencySymbol = formData.get('currencySymbol') as string;
    if (formData.has('currencyDecimalPlaces')) newSettings.currencyDecimalPlaces = Number(formData.get('currencyDecimalPlaces'));
    if (formData.has('qrCodeColor')) newSettings.qrCodeColor = formData.get('qrCodeColor') as string;
    if (formData.has('qrCodeBackgroundColor')) newSettings.qrCodeBackgroundColor = formData.get('qrCodeBackgroundColor') as string;

    if (formData.has('taxes')) {
        const taxesString = formData.get('taxes') as string;
        try {
            const taxes = JSON.parse(taxesString);
            if (Array.isArray(taxes)) {
                newSettings.taxes = taxes as Tax[];
            }
        } catch (e) {
            console.error("Failed to parse taxes JSON", e);
        }
    }

    const qrCodeLogo = formData.get('qrCodeLogo');
    if (qrCodeLogo === 'null' || qrCodeLogo === null) {
        newSettings.qrCodeLogo = undefined;
    } else if (qrCodeLogo) {
        newSettings.qrCodeLogo = qrCodeLogo as string;
    }

    if (formData.has('onlineOrderingEnabled')) newSettings.onlineOrderingEnabled = formData.get('onlineOrderingEnabled') === 'true';
    if (formData.has('deliveryFee')) newSettings.deliveryFee = Number(formData.get('deliveryFee'));
    if (formData.has('minimumOrderValue')) newSettings.minimumOrderValue = Number(formData.get('minimumOrderValue'));

    if (formData.has('onlineOrderPlatforms')) {
        const platformsString = formData.get('onlineOrderPlatforms') as string;
        try {
            const platforms = JSON.parse(platformsString);
            if (Array.isArray(platforms)) {
                newSettings.onlineOrderPlatforms = platforms;
            }
        } catch (e) {
            console.error("Failed to parse online order platforms JSON", e);
        }
    }

    if (formData.has('invoiceSettings')) {
        const invoiceSettingsString = formData.get('invoiceSettings') as string;
        try {
            const settings = JSON.parse(invoiceSettingsString);
            if (typeof settings.useUnifiedNumbering === 'boolean') {
                newSettings.invoiceSettings = settings as InvoiceSettings;
            }
        } catch (e) {
            console.error("Failed to parse invoice settings JSON", e);
        }
    }

    if (formData.has('printSettings')) {
        const printSettingsString = formData.get('printSettings') as string;
        try {
            const settings = JSON.parse(printSettingsString);
            if (settings.invoicePrintSize && settings.kitchenTicketPrintSize) {
                newSettings.printSettings = settings as PrintSettings;
            }
        } catch (e) {
            console.error("Failed to parse print settings JSON", e);
        }
    }

    try {
        await updateSettings(branchId, newSettings);
        revalidatePath('/', 'layout'); // Revalidate all pages that might use settings
    } catch (error) {
        return { message: 'Database Error: Failed to update settings.' };
    }
}


export async function deleteOrderAction(orderId: string, orderType: 'Dine-in' | 'Remote') {
    try {
        await deleteOrder(orderId, orderType);
        revalidatePath('/admin/sales-history');
        revalidatePath('/admin/sales');
    } catch (error) {
        return { message: 'Database Error: Failed to delete order.' };
    }
}

export async function updateOrderDetailsAction(orderId: string, orderType: Order['orderType'] | RemoteOrder['orderType'], formData: FormData) {
    const customerName = formData.get('customerName') as string;
    const customerPhone = formData.get('customerPhone') as string;

    const updateData = { customerName, customerPhone };

    try {
        await updateOrderDetails(orderId, orderType, updateData);
        revalidatePath('/admin/sales-history');
    } catch (error) {
        console.error(error);
        return { message: "Failed to update order details." };
    }
    redirect('/admin/sales-history');
}

export async function deleteTableAction(tableId: string) {
    try {
        await deleteTable(tableId);
        revalidatePath('/admin/tables');
        revalidatePath('/admin');
    } catch (error) {
        return { message: 'Database Error: Failed to delete table.' };
    }
}


// Branch Actions
export async function createBranchAction(formData: FormData) {
    const branchName = formData.get('branchName') as string;
    if (branchName) {
        await createBranch(branchName);
        revalidatePath('/admin/settings/branches');
    }
}

export async function deleteBranchAction(branchId: string) {
    await deleteBranch(branchId);
    revalidatePath('/admin/settings/branches');
}

export async function setMainBranchAction(branchId: string) {
    await setMainBranch(branchId);
    revalidatePath('/admin/settings/branches');
}

// Session Management Actions
import { addMealSession, updateMealSession, deleteMealSession } from './data';
import type { MealSession } from './definitions';

export async function addMealSessionAction(formData: FormData) {
    const branchId = formData.get('branchId') as string;
    const name = formData.get('name') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const greeting = formData.get('greeting') as string;
    const displayMessage = formData.get('displayMessage') as string;
    const isActive = formData.get('isActive') === 'true';

    if (!branchId || !name || !startTime || !endTime || !greeting || !displayMessage) {
        return { message: 'Missing required fields.' };
    }

    try {
        await addMealSession(branchId, {
            name,
            startTime,
            endTime,
            greeting,
            displayMessage,
            isActive,
        });
        revalidatePath('/admin/settings');
        revalidatePath('/admin/menu');
        revalidatePath('/order', 'layout');
    } catch (error) {
        return { message: 'Database Error: Failed to add session.' };
    }
}

export async function updateMealSessionAction(formData: FormData) {
    const branchId = formData.get('branchId') as string;
    const sessionId = formData.get('sessionId') as string;
    const name = formData.get('name') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const greeting = formData.get('greeting') as string;
    const displayMessage = formData.get('displayMessage') as string;
    const isActive = formData.get('isActive') === 'true';

    if (!branchId || !sessionId) {
        return { message: 'Missing required fields.' };
    }

    try {
        await updateMealSession(branchId, sessionId, {
            name,
            startTime,
            endTime,
            greeting,
            displayMessage,
            isActive,
        });
        revalidatePath('/admin/settings');
        revalidatePath('/admin/menu');
        revalidatePath('/order', 'layout');
    } catch (error) {
        return { message: 'Database Error: Failed to update session.' };
    }
}

export async function deleteMealSessionAction(branchId: string, sessionId: string) {
    try {
        await deleteMealSession(branchId, sessionId);
        revalidatePath('/admin/settings');
        revalidatePath('/admin/menu');
        revalidatePath('/order', 'layout');
    } catch (error) {
        return { message: 'Database Error: Failed to delete session.' };
    }
}

export async function updateManualSessionOverrideAction(formData: FormData) {
    const branchId = formData.get('branchId') as string;
    const enabled = formData.get('enabled') === 'true';
    const sessionId = formData.get('sessionId') as string | null;

    if (!branchId) {
        return { message: 'Missing branch ID.' };
    }

    try {
        await updateSettings(branchId, {
            manualSessionOverride: {
                enabled,
                sessionId: enabled ? sessionId : null,
            },
        });
        revalidatePath('/admin/settings');
        revalidatePath('/admin/settings/sessions');
        revalidatePath('/order', 'layout');
    } catch (error) {
        return { message: 'Database Error: Failed to update manual session override.' };
    }
}

// --- Category Management Actions ---

export async function addMenuCategoryAction(formData: FormData) {
    const branchId = formData.get('branchId') as string;
    const categoryName = formData.get('categoryName') as string;

    if (!branchId || !categoryName) {
        return { message: 'Missing required fields.' };
    }

    try {
        const { addMenuCategory } = await import('./data');
        await addMenuCategory(branchId, categoryName.trim());
        revalidatePath('/admin/settings/categories');
        revalidatePath('/admin/menu');
    } catch (error) {
        if (error instanceof Error) {
            return { message: error.message };
        }
        return { message: 'Database Error: Failed to add category.' };
    }
}

export async function removeMenuCategoryAction(branchId: string, categoryName: string) {
    if (!branchId || !categoryName) {
        return { message: 'Missing required fields.' };
    }

    try {
        const { removeMenuCategory } = await import('./data');
        await removeMenuCategory(branchId, categoryName);
        revalidatePath('/admin/settings/categories');
        revalidatePath('/admin/menu');
    } catch (error) {
        if (error instanceof Error) {
            return { message: error.message };
        }
        return { message: 'Database Error: Failed to remove category.' };
    }
}
