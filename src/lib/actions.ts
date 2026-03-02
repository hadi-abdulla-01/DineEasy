

'use server';

import { z } from 'zod';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';
import type { OrderItem, OrderStatus, MenuItem, Table, Order, AppUser, RestaurantSettings, AddonGroup, SelectedAddon, UserRole, InvoiceSettings, NavMenuKey, UserPermissions, AppliedTax, Tax, PrintSettings, Branch, MealSession, ActivityLog, CustomerDetails, RemoteOrder, DayOfWeek, Discount, DiscountApplicability, OTPRequest, Payment } from './definitions';
import {
    createOrder,
    updateTableStatus,
    updateOrderStatus,
    createTable,
    deleteTable,
    addMenuItem,
    updateMenuItem,
    toggleMenuItemAvailability,
    getOrdersByTableId,
    cancelOrdersForTable,
    createUserInFirestore,
    updateUser,
    deleteUser,
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
    getUserByUsername,
    getTableById,
    logActivity,
    getUserById,
    getBranchById,
    updateTable,
    updateOrder,
    addDiscount,
    updateDiscount,
    getFirestoreInstance,
    sendOtpNotification,
    createOtpRequest,
    verifyOtp,
    getUsers,
    getMenuItems,
} from './data';
import { getRestaurantById, getSubscriptionPlanById } from './server-actions';
import { randomUUID } from 'crypto';
import { doc, getDocFromServer, deleteField, runTransaction, Timestamp } from 'firebase/firestore';

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

export type PlaceOrderState = {
    errors?: {
        customerName?: string[];
        customerPhone?: string[];
    };
    message?: string | null;
    success?: boolean;
    orderId?: string;
} | null;

// Helper to convert Firestore doc to object with ID, specific for this server action context
function docToObjAction<T>(d: any): T {
    if (!d.exists()) return null as T;
    const data = d.data();
    // Convert Timestamps to ISO strings
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        }
    }
    return { ...data, id: d.id } as T;
}

export async function placeOrder(prevState: PlaceOrderState, formData: FormData): Promise<PlaceOrderState> {
    const tableId = formData.get('tableId') as string;
    const itemsJson = formData.get('items') as string;
    const orderNotes = formData.get('orderNotes') as string | undefined;
    const customerName = formData.get('customerName') as string;
    const customerPhone = formData.get('customerPhone') as string;
    const isCustomerFacing = formData.get('isCustomerFacing') === 'true';
    const createdByForm = formData.get('createdBy') as string | null;
    const existingOrderId = formData.get('existingOrderId') as string | null;


    if (isCustomerFacing) {
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
    }


    const restaurantId = formData.get('restaurantId') as string;

    let branchId = formData.get('branchId') as string;
    if (!branchId) {
        const table = await getTableById(tableId, restaurantId);
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

    let createdByName = isCustomerFacing ? 'Customer' : 'Staff';
    if (createdByForm) {
        const user = await getUserById(createdByForm, restaurantId);
        if (user) createdByName = user.username;
    }

    let finalOrder: Order | undefined;

    try {
        if (existingOrderId) {
            finalOrder = await addItemsToOrder(existingOrderId, newItems, orderNotes, restaurantId);
            if (finalOrder && finalOrder.status === 'ready') {
                finalOrder = await updateOrderStatus(finalOrder.id, 'preparing', undefined, restaurantId);
            }
        } else {
             const table = await getTableById(tableId, restaurantId);
            const orderToCreate = {
                tableId,
                branchId,
                customerName: customerName || `Table ${table?.number}`,
                customerPhone: customerPhone || 'N/A',
                items: newItems,
                orderType: 'Dine-in' as Order['orderType'],
                notes: orderNotes,
                createdByName: createdByName
            };
            finalOrder = await createOrder(orderToCreate, restaurantId);
        }

        if (!finalOrder) {
            throw new Error("Failed to create or update order.");
        }
        
        await updateTableStatus(tableId, 'occupied', restaurantId);
        
        const action = isCustomerFacing ? 'QR Order Placed' : 'POS Order Placed';
        await logActivity(createdByForm || 'customer', createdByName, action, `Order ID: ${finalOrder.id.slice(-6)}`, restaurantId);

    } catch (error) {
        console.error(error);
        return {
            message: 'Database Error: Failed to Place Order.',
        };
    }

    revalidatePath('/admin', 'layout');
    revalidatePath('/kitchen', 'layout');

    if (isCustomerFacing) {
        redirect(`/order/${tableId}/status/${finalOrder.id}?restaurantId=${restaurantId}`);
    }

    return { success: true, orderId: finalOrder.id };
}


export async function updateOrderStatusAction(formData: FormData) {
    const status = formData.get('status') as OrderStatus;
    const orderId = formData.get('orderId') as string;
    const paymentDetailsJSON = formData.get('paymentDetails') as string | null;
    const restaurantId = formData.get('restaurantId') as string;
    const redirectTo = formData.get('redirectTo') as string | null;

    let payments: Payment[] | undefined;
    let paymentMethod: Order['paymentMethod'] | undefined;

    if (paymentDetailsJSON) {
        try {
            payments = JSON.parse(paymentDetailsJSON);
            if (payments && payments.length > 1) {
                paymentMethod = 'split';
            } else if (payments && payments.length === 1) {
                paymentMethod = payments[0].method;
            }
        } catch (e) {
            console.error("Invalid payment details JSON:", e);
        }
    } else {
        // Fallback for forms that might still send the old format
        paymentMethod = formData.get('paymentMethod') as Order['paymentMethod'];
    }

    if (!status || !orderId) {
        return { success: false, message: 'Status and Order ID are required.' };
    }

    try {
        const order = await getOrderById(orderId, restaurantId);
        if (!order) {
            return { success: false, message: 'Order not found.' };
        }

        const updatedOrder = await updateOrderStatus(orderId, status, paymentMethod, restaurantId, payments);

        if (updatedOrder && (status === 'completed' || status === 'cancelled')) {
            if (updatedOrder.orderType === 'Dine-in' && updatedOrder.tableId) {
                const tableId = updatedOrder.tableId;
                const otherOrders = await getOrdersByTableId(tableId, restaurantId);
                const activeOrdersOnTable = otherOrders.filter(o => o.id !== orderId && o.status !== 'completed' && o.status !== 'cancelled');

                if (activeOrdersOnTable.length === 0) {
                    const table = await getTableById(tableId, restaurantId);
                    if (table) {
                        const tableUpdateData: Partial<Table> = { status: 'available' };
                        if (table.isDynamicQR) {
                            tableUpdateData.qrToken = randomUUID();
                        }
                        await updateTable(tableId, tableUpdateData, restaurantId);
                    }
                }
            }
        }

    } catch (error: any) {
        console.error('[updateOrderStatusAction] Error:', error);
        return { success: false, message: 'Database Error: Failed to Update Order Status.' };
    }

    if (status === 'completed' && redirectTo) {
        redirect(redirectTo);
    }
    
    return { success: true };
}


export async function updateKitchenOrderStatusAction(orderId: string, formData: FormData) {
    const status = formData.get('status') as OrderStatus;
    const restaurantId = formData.get('restaurantId') as string;

    if (!status) {
        return { message: 'Status is required.' };
    }

    try {
        await updateOrderStatus(orderId, status, undefined, restaurantId);
    } catch (error) {
        return { message: 'Database Error: Failed to update order status in kitchen.' };
    }
}


export async function updateOrderItemStatusAction(orderId: string, orderItemId: string, isReady: boolean, restaurantId?: string) {
    try {
        await updateOrderItemStatus(orderId, orderItemId, isReady, restaurantId);
    } catch (error) {
        return { message: 'Database Error: Failed to Update Item Status.' };
    }
}

export async function cancelOrderItemAction(orderId: string, orderItemId: string, restaurantId?: string) {
    try {
        await cancelOrderItem(orderId, orderItemId, restaurantId);
    } catch (error) {
        return { message: 'Database Error: Failed to cancel item.' };
    }
}

export async function createTableAction(formData: FormData) {
    const tableNumber = formData.get('tableNumber') as string;
    const branchId = formData.get('branchId') as string;
    const restaurantId = formData.get('restaurantId') as string;
    const floor = formData.get('floor') as string;

    if (tableNumber && branchId) {
        await createTable(tableNumber, branchId, restaurantId, floor);
        revalidatePath('/admin/tables');
    }
}

export async function addMenuItemAction(formData: FormData): Promise<{ newItem?: MenuItem; error?: string; }> {
    const restaurantId = formData.get('restaurantId') as string;
    const branchId = formData.get('branchId') as string;

    const restaurant = await getRestaurantById(restaurantId);
    if (restaurant && restaurant.subscriptionPlanId) {
        const plan = await getSubscriptionPlanById(restaurant.subscriptionPlanId);
        const currentMenuItems = await getMenuItems(branchId, restaurantId);

        if (plan && plan.maxMenuItems > 0 && currentMenuItems.length >= plan.maxMenuItems) {
            return { error: `Menu item limit of ${plan.maxMenuItems} reached for your current plan. Please contact the administrator.` };
        }
    }

    const name = formData.get('name') as string;
    const price = parseFloat(formData.get('price') as string);
    const description = formData.get('description') as string;
    const image = formData.get('image') as string | null;
    const category = formData.get('category') as string;
    const prepTimeValue = formData.get('prepTime');
    const prepTime = prepTimeValue ? Number(prepTimeValue) : undefined;
    const isBestSeller = formData.get('isBestSeller') === 'on';
    const isRecommended = formData.get('isRecommended') === 'on';
    const recommendationNote = formData.get('recommendationNote') as string | null;
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
        if (prepTime) {
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
                console.error("Failed to parse available sessions JSON", e);
            }
        }

        if (!branchId) {
            console.error("Branch ID is missing for new menu item");
            return { error: "Branch ID is missing. Could not add item." };
        }

        const newItem = await addMenuItem(newItemData, restaurantId);
        revalidatePath('/admin/menu');
        return { newItem };
    }
    return { error: "Failed to add item, please check your inputs." };
}

export async function updateMenuItemAction(itemId: string, formData: FormData) {
    const name = formData.get('name') as string;
    const price = parseFloat(formData.get('price') as string);
    const description = formData.get('description') as string;
    const image = formData.get('image') as string | null;
    const category = formData.get('category') as string;
    const addonGroupsString = formData.get('addonGroups') as string | null;
    const prepTime = Number(formData.get('prepTime')) || undefined;
    const isBestSeller = formData.get('isBestSeller') === 'on';
    const isRecommended = formData.get('isRecommended') === 'on';
    const recommendationNote = formData.get('recommendationNote') as string | null;
    const availableSessionsString = formData.get('availableSessions') as string | null;
    const restaurantId = formData.get('restaurantId') as string;

    const updateData: Partial<MenuItem> = {};
    if (name) updateData.name = name;
    if (!isNaN(price)) updateData.price = price;
    if (description) updateData.description = description;
    if (image) updateData.imageId = image;
    if (category) updateData.category = category;

    updateData.isBestSeller = isBestSeller;
    updateData.isRecommended = isRecommended;

    if (recommendationNote !== null) updateData.recommendationNote = recommendationNote;
    if (prepTime !== undefined) updateData.prepTime = prepTime;

    if (availableSessionsString) {
        try {
            const sessions = JSON.parse(availableSessionsString);
            if (Array.isArray(sessions)) {
                updateData.availableSessions = sessions;
            }
        } catch (e) {
            console.error("Failed to parse available sessions JSON", e);
        }
    }

    if (addonGroupsString) {
        try {
            const groups = JSON.parse(addonGroupsString);
            if (Array.isArray(groups)) {
                updateData.addonGroups = groups;
            }
        } catch (e) {
            console.error("Failed to parse addon groups JSON", e);
        }
    }

    try {
        await updateMenuItem(itemId, updateData, restaurantId);
        revalidatePath('/admin/menu');
    } catch (error) {
        return { message: 'Database Error: Failed to update item.' };
    }
    redirect('/admin/menu');
}

export async function toggleMenuItemAvailabilityAction(itemId: string, isAvailable: boolean, restaurantId?: string) {
    await toggleMenuItemAvailability(itemId, isAvailable, restaurantId);
    revalidatePath('/admin/menu');
}

export async function toggleMenuItemAddonAction(itemId: string, isAddon: boolean, restaurantId?: string) {
    await toggleMenuItemAddon(itemId, isAddon, restaurantId);
    revalidatePath('/admin/menu');
}

export async function updateTableStatusAction(tableId: string, status: Table['status'], restaurantId?: string) {
    try {
        await updateTableStatus(tableId, status, restaurantId);
        if (status === 'available') {
            await cancelOrdersForTable(tableId, restaurantId);
        }
    } catch (error) {
        return { message: 'Database Error: Failed to Update Table Status.' };
    }
}

export async function createOrderAction(orderData: any, restaurantId: string) {
  const newOrder = await createOrder(orderData, restaurantId);
  return newOrder;
}

export async function createRemoteOrderAction(formData: FormData): Promise<RemoteOrder> {
    const cartJSON = formData.get('cart') as string;
    const cartItems = JSON.parse(cartJSON) as OrderItem[];

    const orderType = formData.get('orderType') as Order['orderType'];
    const createdByName = formData.get('createdByName') as string | null;
    const restaurantId = formData.get('restaurantId') as string;
    const branchId = formData.get('branchId') as string;
    const takeAwayTime = formData.get('takeAwayTime') as string | null;

    const customerDetails: CustomerDetails = {
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
        platform: formData.get('platform') as string,
    }

    const orderData = {
        orderType,
        customerName: customerDetails.name,
        customerPhone: customerDetails.phone,
        customerDetails,
        items: cartItems,
        branchId: branchId,
        createdByName: createdByName || undefined,
        notes: formData.get('orderNotes') as string | undefined,
        takeAwayTime: takeAwayTime || undefined,
    };
    
    const newOrder = await createOrder(orderData, restaurantId);

    const correctionForId = formData.get('correctionFor') as string;
    const correctionType = formData.get('correctionType') as 'Dine-in' | 'Remote';

    if (correctionForId) {
        await deleteOrder(correctionForId, correctionType, restaurantId);
    }

    revalidatePath('/admin/online-orders');
    revalidatePath('/admin/take-away');
    revalidatePath('/kitchen');

    return newOrder as unknown as RemoteOrder;
}

type CreateUserState = {
    message?: string;
} | undefined;


export async function createUserAction(restaurantId: string, formData: FormData): Promise<CreateUserState> {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as UserRole;
    const branchId = formData.get('branchId') as string;
    const assignedTableId = formData.get('assignedTableId') as string | null;
    let categories = formData.getAll('categories').map(String);
    const permissionsString = formData.get('permissions') as string | null;
    const createdBy = formData.get('createdBy') as string | null;

    if (!username || !password || !role || !branchId) {
        return { message: "Missing required fields." };
    }

    if (role === 'Table' && !assignedTableId) {
        return { message: "An assigned table is required for the 'Table' role."};
    }

    if (!restaurantId) {
        return { message: "Could not determine restaurant for this action." };
    }

    if (password.length < 6) {
        return { message: "Password must be at least 6 characters." };
    }

    const existingUser = await getUserByUsername(username, restaurantId);
    if (existingUser) {
        return { message: "Username already exists. Please choose a different one." };
    }

    const restaurant = await getRestaurantById(restaurantId);
    if (restaurant && restaurant.subscriptionPlanId) {
        const plan = await getSubscriptionPlanById(restaurant.subscriptionPlanId);
        const currentUsers = await getUsers(restaurantId);

        if (plan && plan.maxUsers > 0 && currentUsers.length >= plan.maxUsers) {
            return { message: `User limit of ${plan.maxUsers} reached for your current plan. Please contact the software administrator to upgrade.` };
        }
    }

    let permissions: UserPermissions = {};
    if (permissionsString) {
        try {
            permissions = JSON.parse(permissionsString);
        } catch (e) {
            console.error("Failed to parse permissions JSON", e);
            return { message: "Invalid permissions data provided." };
        }
    }

    const uniqueCategories = Array.from(new Set(categories));

    try {
        const { createAuthUser } = await import('@/lib/auth');
        const { generateUserEmail } = await import('@/lib/auth-utils');

        const email = generateUserEmail(username, restaurantId, role === 'Admin');

        const authResult = await createAuthUser(email, password, {
            username,
            password,
            categories: uniqueCategories,
            role,
            permissions,
            branchId,
            assignedTableId: assignedTableId || undefined,
        }, restaurantId);

        if (!authResult.success) {
            return { message: authResult.error || "Failed to create user in Firebase Auth." };
        }

        if (createdBy) {
            const creator = await getUserById(createdBy, restaurantId);
            if (creator) {
                await logActivity(creator.id, creator.username, 'Created User', `Created new user: ${username} (${email}) with role ${role}`, restaurantId);
            }
        }

        revalidatePath('/admin/user-management');

        return { message: `User created successfully. Login email: ${email}` };
    } catch (error: any) {
        console.error('Error creating user:', error);
        return { message: error.message || "Failed to create user." };
    }
}


export async function updateUserAction(userId: string, formData: FormData): Promise<AppUser | undefined> {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as UserRole;
    const branchId = formData.get('branchId') as string;
    const assignedTableId = formData.get('assignedTableId') as string | null;
    const categories = formData.getAll('categories').map(String);
    const permissionsString = formData.get('permissions') as string | null;
    const updatedBy = formData.get('updatedBy') as string | null;
    const restaurantId = formData.get('restaurantId') as string;


    if (!permissionsString) {
        console.log("Validation failed: Missing permissions.");
        return;
    }
    const permissions: UserPermissions = JSON.parse(permissionsString);

    const uniqueCategories = Array.from(new Set(categories));

    const updateData: Partial<AppUser> & {[key: string]: any} = {};
    if (username) updateData.username = username;
    if (password) updateData.password = password;
    if (role) updateData.role = role;
    if (branchId) updateData.branchId = branchId;
    if (uniqueCategories.length > 0) updateData.categories = uniqueCategories;
    else if (role === 'Kitchen') {
        updateData.categories = [];
    }
    if (permissions) updateData.permissions = permissions;
    
    if (role === 'Table') {
        if (assignedTableId) {
            updateData.assignedTableId = assignedTableId;
        }
    } else {
        updateData.assignedTableId = deleteField();
    }


    try {
        const updatedUser = await updateUser(userId, updateData, restaurantId);
        if (updatedBy) {
            const updater = await getUserById(updatedBy, restaurantId);
            if (updater && updatedUser) {
                await logActivity(updater.id, updater.username, 'Updated User', `Updated profile for ${updatedUser.username}`, restaurantId);
            }
        }
        revalidatePath('/admin/user-management');
        return updatedUser;
    } catch (error) {
        console.error('Database Error: Failed to update user.', error);
        return undefined;
    }
}


export async function deleteUserAction(userId: string, deletedBy: string | null, restaurantId?: string) {
    try {
        const userToDelete = await getUserById(userId, restaurantId);
        if (userToDelete) {
            if (deletedBy) {
                const deleter = await getUserById(deletedBy, restaurantId);
                if (deleter) {
                    await logActivity(deleter.id, deleter.username, 'Deleted User', `Deleted user: ${userToDelete.username}`, restaurantId || 'dineeasee-restaurant');
                }
            }

            if (userToDelete.firebaseUid) {
                const { getAdminAuth } = await import('@/firebase/admin');
                const adminAuth = getAdminAuth();
                if (adminAuth) {
                    try {
                        await adminAuth.deleteUser(userToDelete.firebaseUid);
                        console.log(`Deleted Auth User for restaurant ${restaurantId}: ${userToDelete.firebaseUid}`);
                    } catch (e) {
                        console.warn(`Failed to delete auth user ${userToDelete.firebaseUid}:`, e);
                    }
                } else {
                    console.warn("Skipping Firebase Auth deletion: Warning - Admin Auth could not be initialized. Check FIREBASE_SERVICE_ACCOUNT_KEY.");
                }
            }
        }
        await deleteUser(userId, restaurantId);
        revalidatePath('/admin/user-management');
    } catch (error) {
        console.error("Error deleting user:", error);
        return { message: 'Database Error: Failed to delete user.' };
    }
}

export async function updateTablePositionAction(tableId: string, position: { x: number; y: number }, restaurantId?: string) {
    try {
        await updateTablePosition(tableId, position, restaurantId);
    } catch (error) {
        console.error("Failed to update table position:", error);
        return { message: 'Database Error: Failed to update table position.' };
    }
}

export async function updateSettingsAction(formData: FormData) {
    const branchId = formData.get('branchId') as string | undefined;
    const restaurantId = formData.get('restaurantId') as string;

    const newSettings: Partial<RestaurantSettings & Branch> = {};

    if (formData.has('restaurantName')) newSettings.restaurantName = formData.get('restaurantName') as string;
    if (formData.has('restaurantAddress')) newSettings.restaurantAddress = formData.get('restaurantAddress') as string;

    if (formData.has('taxName')) newSettings.taxName = formData.get('taxName') as string;
    if (formData.has('taxNumber')) newSettings.taxNumber = formData.get('taxNumber') as string;
    if (formData.has('currencySymbol')) newSettings.currencySymbol = formData.get('currencySymbol') as string;
    if (formData.has('currencyDecimalPlaces')) newSettings.currencyDecimalPlaces = Number(formData.get('currencyDecimalPlaces'));
    if (formData.has('timezone')) newSettings.timezone = formData.get('timezone') as string;
    if (formData.has('endOfDayTime')) newSettings.endOfDayTime = formData.get('endOfDayTime') as string;
    if (formData.has('qrCodeColor')) newSettings.qrCodeColor = formData.get('qrCodeColor') as string;
    if (formData.has('qrCodeBackgroundColor')) newSettings.qrCodeBackgroundColor = formData.get('qrCodeBackgroundColor') as string;

    if (formData.has('taxes')) {
        try {
            newSettings.taxes = JSON.parse(formData.get('taxes') as string);
        } catch (e) { console.error("Failed to parse taxes JSON", e); }
    }

    if (formData.has('posSettings')) {
        try {
            newSettings.posSettings = JSON.parse(formData.get('posSettings') as string);
        } catch (e) { console.error("Failed to parse posSettings JSON", e); }
    }

    const qrCodeLogo = formData.get('qrCodeLogo');
    if (qrCodeLogo === 'null' || qrCodeLogo === null) {
        newSettings.qrCodeLogo = undefined;
    } else if (qrCodeLogo) {
        newSettings.qrCodeLogo = qrCodeLogo as string;
    }

    if (formData.has('onlineOrderingEnabledSwitch')) {
        newSettings.onlineOrderingEnabled = formData.get('onlineOrderingEnabledSwitch') === 'on';
    }
    if (formData.has('deliveryFee')) newSettings.deliveryFee = Number(formData.get('deliveryFee'));
    if (formData.has('minimumOrderValue')) newSettings.minimumOrderValue = Number(formData.get('minimumOrderValue'));

    if (formData.has('onlineOrderPlatforms')) {
        try {
            newSettings.onlineOrderPlatforms = JSON.parse(formData.get('onlineOrderPlatforms') as string);
        } catch (e) { console.error("Failed to parse online order platforms JSON", e); }
    }

    if (formData.has('invoiceSettings')) {
        try {
            newSettings.invoiceSettings = JSON.parse(formData.get('invoiceSettings') as string);
        } catch (e) { console.error("Failed to parse invoice settings JSON", e); }
    }

    if (formData.has('printSettings')) {
        try {
            newSettings.printSettings = JSON.parse(formData.get('printSettings') as string);
        } catch (e) { console.error("Failed to parse print settings JSON", e); }
    }
    
    if (formData.has('multiFloorEnabled')) {
        newSettings.multiFloorEnabled = formData.get('multiFloorEnabled') === 'true';
    }

    if (formData.has('floors')) {
        try {
            newSettings.floors = JSON.parse(formData.get('floors') as string);
        } catch (e) { console.error("Failed to parse floors JSON", e); }
    }

    if (formData.has('defaultFloor')) {
        newSettings.defaultFloor = formData.get('defaultFloor') as string;
    }


    try {
        await updateSettings(branchId, newSettings, restaurantId);
        revalidatePath('/', 'layout');
    } catch (error) {
        return { message: 'Database Error: Failed to update settings.' };
    }
}


export async function deleteOrderAction(orderId: string, orderType: 'Dine-in' | 'Remote', restaurantId: string = 'dineeasee-restaurant') {
    try {
        await deleteOrder(orderId, orderType, restaurantId);
    } catch (error) {
        return { message: 'Database Error: Failed to delete order.' };
    }
}

export async function updateOrderDetailsAction(orderId: string, orderType: Order['orderType'] | RemoteOrder['orderType'], formData: FormData) {
    const customerName = formData.get('customerName') as string;
    const customerPhone = formData.get('customerPhone') as string;
    const restaurantId = formData.get('restaurantId') as string;

    const updateData = { customerName, customerPhone };

    try {
        await updateOrderDetails(orderId, orderType, updateData, restaurantId);
        revalidatePath('/admin/sales-history');
    } catch (error) {
        console.error(error);
        return { message: "Failed to update order details." };
    }
    redirect('/admin/sales-history');
}

export async function deleteTableAction(tableId: string, restaurantId?: string) {
    try {
        await deleteTable(tableId, restaurantId);
    } catch (error) {
        console.error('Error in deleteTableAction:', error);
        return { message: 'Database Error: Failed to delete table.' };
    }
}

export async function updateTableFloorAction(tableId: string, floor: string, restaurantId?: string) {
    try {
        await updateTable(tableId, { floor }, restaurantId);
    } catch (error) {
        console.error('Error updating table floor:', error);
        return { message: 'Database Error: Failed to update table floor.' };
    }
}

export async function updateTableShapeAction(tableId: string, shape: 'rectangle' | 'square' | 'circle', restaurantId?: string) {
    try {
        await updateTable(tableId, { shape }, restaurantId);
    } catch (error) {
        console.error('Error updating table shape:', error);
        return { message: 'Database Error: Failed to update table shape.' };
    }
}


// Branch Actions
export async function createBranchAction(formData: FormData) {
    const branchName = formData.get('branchName') as string;
    const restaurantId = formData.get('restaurantId') as string;
    if (branchName) {
        await createBranch(branchName, false, restaurantId);
        revalidatePath('/admin/settings/branches');
    }
}

export async function deleteBranchAction(branchId: string, restaurantId?: string) {
    await deleteBranch(branchId, restaurantId);
    revalidatePath('/admin/settings/branches');
}

export async function setMainBranchAction(branchId: string, restaurantId?: string) {
    await setMainBranch(branchId, restaurantId);
    revalidatePath('/admin/settings/branches');
}

// Session Management Actions
import { addMealSession, updateMealSession, deleteMealSession } from './data';

export async function addMealSessionAction(formData: FormData) {
    const branchId = formData.get('branchId') as string;
    const restaurantId = formData.get('restaurantId') as string;
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
        }, restaurantId);
        revalidatePath('/admin/settings/sessions');
    } catch (error) {
        return { message: 'Database Error: Failed to add session.' };
    }
}

export async function updateMealSessionAction(formData: FormData) {
    const branchId = formData.get('branchId') as string;
    const restaurantId = formData.get('restaurantId') as string;
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
        }, restaurantId);

        revalidatePath('/admin/settings/sessions');
    } catch (error) {
        return { message: 'Database Error: Failed to update session.' };
    }
}

export async function deleteMealSessionAction(branchId: string, sessionId: string, restaurantId?: string) {
    try {
        await deleteMealSession(branchId, sessionId, restaurantId);
        revalidatePath('/admin/settings/sessions');
    } catch (error) {
        return { message: 'Database Error: Failed to delete session.' };
    }
}

export async function updateManualSessionOverrideAction(formData: FormData) {
    const branchId = formData.get('branchId') as string;
    const restaurantId = formData.get('restaurantId') as string;
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
        }, restaurantId);
        revalidatePath('/admin/settings/sessions');
    } catch (error) {
        return { message: 'Database Error: Failed to update manual session override.' };
    }
}

// --- Category Management Actions ---
export async function addMenuCategoryAction(formData: FormData) {
    const branchId = formData.get('branchId') as string;
    const categoryName = formData.get('categoryName') as string;
    const restaurantId = formData.get('restaurantId') as string;

    if (!branchId || !categoryName || !restaurantId) {
        return { message: 'Missing required fields.' };
    }

    try {
        const { addMenuCategory } = await import('./data');
        await addMenuCategory(branchId, categoryName.trim(), restaurantId);
        revalidatePath('/admin/settings/categories', 'page');
        revalidatePath('/admin/menu', 'page');
    } catch (error) {
        if (error instanceof Error) {
            return { message: error.message };
        }
        return { message: 'Database Error: Failed to add category.' };
    }
}


export async function removeMenuCategoryAction(formData: FormData) {
    const branchId = formData.get('branchId') as string;
    const categoryName = formData.get('categoryName') as string;
    const restaurantId = formData.get('restaurantId') as string;

    if (!branchId || !categoryName || !restaurantId) {
        return { message: 'Missing required fields.' };
    }

    try {
        const { removeMenuCategory } = await import('./data');
        await removeMenuCategory(branchId, categoryName, restaurantId);
        revalidatePath('/admin/settings/categories', 'page');
        revalidatePath('/admin/menu', 'page');
    } catch (error) {
        if (error instanceof Error) {
            return { message: error.message };
        }
        return { message: 'Database Error: Failed to remove category.' };
    }
}

export async function changeOrderTableAction(formData: FormData) {
    const orderId = formData.get('orderId') as string;
    const newTableId = formData.get('newTableId') as string;
    const restaurantId = formData.get('restaurantId') as string;

    if (!orderId || !newTableId || !restaurantId) {
        return { message: 'Missing required data to change table.' };
    }

    try {
        const order = await getOrderById(orderId, restaurantId);
        if (!order || !order.tableId) {
            return { message: 'Order not found or it is not a dine-in order.' };
        }

        const oldTableId = order.tableId;

        if (oldTableId === newTableId) {
            return { message: 'Order is already at this table.' };
        }

        // Fetch details for both tables to get their numbers
        const oldTable = await getTableById(oldTableId, restaurantId);
        const newTable = await getTableById(newTableId, restaurantId);
        
        if (!newTable) {
            return { message: 'New table not found.' };
        }

        const updatePayload: Partial<Order> = { tableId: newTableId };

        // Check if the customer name matches the old table name pattern
        if (oldTable && order.customerName === `Table ${oldTable.number}`) {
            updatePayload.customerName = `Table ${newTable.number}`;
        }
        
        // 1. Update the order's tableId and potentially customerName.
        await updateOrder(orderId, updatePayload, restaurantId);

        // 2. Update status of the new table to 'occupied'
        await updateTableStatus(newTableId, 'occupied', restaurantId);

        // 3. Check if the old table has any other active orders
        const otherOrdersOnOldTable = await getOrdersByTableId(oldTableId, restaurantId);
        
        // The order has been moved, so it shouldn't be considered when checking the old table's status.
        const activeOrdersOnOldTable = otherOrdersOnOldTable.filter(
            o => o.id !== orderId && o.status !== 'completed' && o.status !== 'cancelled'
        );

        if (activeOrdersOnOldTable.length === 0) {
            await updateTableStatus(oldTableId, 'available', restaurantId);
        }

    } catch (error) {
        console.error("Failed to change order table:", error);
        return { message: 'Database Error: Failed to change table.' };
    }
}

// Discount Actions
export async function createDiscountAction(formData: FormData) {
    try {
        const branchId = formData.get('branchId') as string;
        const restaurantId = formData.get('restaurantId') as string;
        
        const discountData: Omit<Discount, 'id'> = {
          name: formData.get('name') as string,
          description: formData.get('description') as string,
          type: formData.get('type') as DiscountType,
          value: Number(formData.get('value')),
          isActive: formData.get('isActive') === 'on',
          startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string).toISOString() : undefined,
          endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string).toISOString() : undefined,
          startTime: formData.get('startTime') as string || undefined,
          endTime: formData.get('endTime') as string || undefined,
          daysOfWeek: JSON.parse(formData.get('daysOfWeek') as string || '[]') as DayOfWeek[],
          applicability: formData.get('applicability') as DiscountApplicability,
          applicableCategories: JSON.parse(formData.get('applicableCategories') as string || '[]'),
          applicableItems: JSON.parse(formData.get('applicableItems') as string || '[]'),
          branchId,
        };
        await addDiscount(branchId, discountData, restaurantId);
        revalidatePath('/admin/settings/discounts');
    } catch (error) {
        if (error instanceof Error) return { error: error.message };
        return { error: 'Failed to create discount.' };
    }
}

export async function updateDiscountAction(discountId: string, formData: FormData) {
    try {
        const branchId = formData.get('branchId') as string;
        const restaurantId = formData.get('restaurantId') as string;

        const updates: Partial<Discount> = {
          name: formData.get('name') as string,
          description: formData.get('description') as string,
          type: formData.get('type') as DiscountType,
          value: Number(formData.get('value')),
          isActive: formData.get('isActive') === 'on',
          startDate: formData.get('startDate') ? new Date(formData.get('startDate') as string).toISOString() : undefined,
          endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string).toISOString() : undefined,
          startTime: formData.get('startTime') as string || undefined,
          endTime: formData.get('endTime') as string || undefined,
          daysOfWeek: JSON.parse(formData.get('daysOfWeek') as string || '[]'),
          applicability: formData.get('applicability') as DiscountApplicability,
          applicableCategories: JSON.parse(formData.get('applicableCategories') as string || '[]'),
          applicableItems: JSON.parse(formData.get('applicableItems') as string || '[]'),
        };

        await updateDiscount(branchId, discountId, updates, restaurantId);
        revalidatePath('/admin/settings/discounts');
    } catch (error) {
        if (error instanceof Error) return { error: error.message };
        return { error: 'Failed to update discount.' };
    }
}

export async function deleteDiscountAction(discountId: string, branchId: string, restaurantId: string) {
    const { deleteDiscount } = await import('./data');
    try {
        await deleteDiscount(branchId, discountId, restaurantId);
        revalidatePath('/admin/settings/discounts');
    } catch(error) {
        if (error instanceof Error) return { error: error.message };
        return { error: 'Failed to delete discount.' };
    }
}

export async function toggleTableDynamicQRAction(tableId: string, isDynamic: boolean, restaurantId: string) {
    if (!tableId || !restaurantId) {
        return { success: false, message: 'Missing required data.' };
    }

    try {
        const updateData: Partial<Table> = { 
            isDynamicQR: isDynamic,
            qrToken: isDynamic ? randomUUID() : ''
        };
        await updateTable(tableId, updateData, restaurantId);
        revalidatePath('/admin/tables'); // Revalidate to update the UI if needed
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle dynamic QR for table:", error);
        return { success: false, message: "Failed to update table." };
    }
}

export async function resetTableQRTokenAction(tableId: string, restaurantId: string) {
    if (!tableId || !restaurantId) {
        return { success: false, message: 'Missing required data.' };
    }

    try {
        const updateData: Partial<Table> = {
            qrToken: randomUUID()
        };
        await updateTable(tableId, updateData, restaurantId);
        revalidatePath('/admin/tables');
        return { success: true };
    } catch (error) {
        console.error("Failed to reset QR token for table:", error);
        return { success: false, message: "Failed to reset token." };
    }
}

export async function pairDeviceAction(formData: FormData) {
    const tableId = formData.get('tableId') as string;
    const pairingCode = formData.get('pairingCode') as string;
    const restaurantId = formData.get('restaurantId') as string;

    if (!tableId || !restaurantId || !pairingCode) {
        return { success: false, message: 'Missing required data.' };
    }

    try {
        await updateTable(tableId, { pairingCode }, restaurantId);
        revalidatePath('/admin/tables');
        return { success: true };
    } catch (error) {
        console.error("Failed to pair device:", error);
        return { success: false, message: "Database error: Failed to pair device." };
    }
}

export async function validateTableAction(
  tableId: string,
  restaurantId: string,
  token: string | null
): Promise<{ success: boolean; tableNumber?: string; error?: string }> {
  noStore();
  try {
    const firestore = await getFirestoreInstance();
    const docRef = doc(firestore, `restaurants/${restaurantId}/tables`, tableId);
    const docSnap = await getDocFromServer(docRef);

    if (!docSnap.exists()) {
        return { success: false, error: 'This table does not exist or the restaurant ID is incorrect.' };
    }
    
    const tableData = docSnap.data() as Omit<Table, 'id'>;
    if (!tableData) {
        return { success: false, error: 'Failed to process table data.' };
    }

    const table: Table = { ...tableData, id: docSnap.id, restaurantId };
    
    if (table.isDynamicQR) {
      if (!token) {
        return { success: false, error: 'This is a dynamic QR code and requires a token, which is missing from the URL. Please re-scan.' };
      }
      if (table.qrToken !== token) {
        return { success: false, error: `This QR code is invalid or has expired. Please ask for a new one.` };
      }
    }

    return { success: true, tableNumber: table.number };
  } catch (err) {
    console.error("Error in validateTableAction:", err);
    return { success: false, error: "A server error occurred while trying to validate the table." };
  }
}
      

export async function requestOrderAccessAction(
    prevState: { error?: string; redirectTo?: string; success?: boolean } | null,
    formData: FormData
): Promise<{ error?: string; redirectTo?: string; success?: boolean }> {
    noStore();
    const tableId = formData.get('tableId') as string;
    const restaurantId = formData.get('restaurantId') as string;
    const token = formData.get('token') as string | null;
    const customerName = formData.get('customerName') as string;
    const customerPhone = formData.get('customerPhone') as string;

    if (!customerName || !customerPhone) {
        return { error: 'Name and phone number are required.' };
    }

    try {
        const validation = await validateTableAction(tableId, restaurantId, token);
        if (!validation.success) {
            return { error: validation.error };
        }

        const table = await getTableById(tableId, restaurantId);
        if (!table || !table.branchId) {
            return { error: 'Could not determine the branch for this table.' };
        }

        // Check for an existing active order for this customer at this table
        const activeOrders = await getActiveOrders(table.branchId, restaurantId);
        const existingOrder = activeOrders.find(order =>
            order.tableId === tableId &&
            order.customerPhone === customerPhone
        );

        if (existingOrder) {
            // If an active order exists, redirect straight to the status page, bypassing OTP
            return { redirectTo: `/order/${tableId}/status/${existingOrder.id}?restaurantId=${restaurantId}` };
        }

        const settings = await getSettings(table.branchId, restaurantId);
        const useOtp = settings.posSettings?.enableDineInOTP;

        if (useOtp) {
            const otpRequest = await createOtpRequest(tableId, restaurantId, customerName, customerPhone);
            if (otpRequest) {
                await sendOtpNotification(otpRequest);
                return { redirectTo: `/order/${tableId}/verify?reqId=${otpRequest.id}&name=${encodeURIComponent(customerName)}&phone=${encodeURIComponent(customerPhone)}&restaurantId=${restaurantId}` };
            } else {
                return { error: 'Failed to create OTP request.' };
            }
        } else {
            // For non-OTP, just return success. Client will handle sessionStorage and redirect.
            return { success: true };
        }
    } catch (e: any) {
        console.error(e);
        return { error: e.message || 'An unexpected error occurred.' };
    }
}


export async function verifyOtpAction(
    prevState: { error?: string; success?: boolean; message?: string } | null,
    formData: FormData
): Promise<{ error?: string; success?: boolean; message?: string; }> {
    noStore();
    const reqId = formData.get('reqId') as string;
    const otp = formData.get('otp') as string;
    const restaurantId = formData.get('restaurantId') as string;

    if (!reqId || !otp || !restaurantId) {
        return { error: 'Missing required data.' };
    }

    try {
        const isValid = await verifyOtp(reqId, otp, restaurantId);

        if (isValid) {
            return { success: true, message: 'OTP Verified Successfully!' };
        } else {
            return { success: false, error: 'Invalid or expired OTP. Please try again.' };
        }

    } catch (e: any) {
        console.error(e);
        return { error: e.message || 'An unexpected error occurred during verification.' };
    }
}
