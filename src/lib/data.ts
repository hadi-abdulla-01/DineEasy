
'use server';
import type { Table, MenuItem, Order, RemoteOrder, OrderStatus, KitchenUser, OrderItem, RestaurantSettings, UserRole, AddonGroup, SelectedAddon, UserPermissions, NavMenuKey, AppliedTax, Tax, PrintSettings, Branch, MealSession, ActivityLog } from './definitions';
import { initializeFirebase } from '@/firebase/server';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    writeBatch,
    serverTimestamp,
    Timestamp,
    deleteField,
    runTransaction,
} from 'firebase/firestore';

const RESTAURANT_ID = 'dineeasee-restaurant';

const getFirestoreInstance = () => {
    return initializeFirebase().firestore;
}

const getCollections = () => {
    const firestore = getFirestoreInstance();
    return {
        restaurants: collection(firestore, 'restaurants'),
        tables: collection(firestore, `restaurants/${RESTAURANT_ID}/tables`),
        menuItems: collection(firestore, `restaurants/${RESTAURANT_ID}/menuItems`),
        orders: collection(firestore, `restaurants/${RESTAURANT_ID}/orders`),
        remoteOrders: collection(firestore, `restaurants/${RESTAURANT_ID}/remoteOrders`),
        kitchenUsers: collection(firestore, `restaurants/${RESTAURANT_ID}/kitchenUsers`),
        branches: collection(firestore, `restaurants/${RESTAURANT_ID}/branches`),
        activityLogs: collection(firestore, `restaurants/${RESTAURANT_ID}/activityLogs`),
        settings: doc(firestore, `restaurants/${RESTAURANT_ID}`),
    };
};

// Helper to convert Firestore doc to object with ID
function docToObj<T>(d: any): T {
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


// --- Settings ---
let settingsCache: Record<string, RestaurantSettings> = {};

export async function getSettings(branchId?: string): Promise<RestaurantSettings> {
    const firestore = getFirestoreInstance();

    // 1. Fetch global settings
    const globalSettingsRef = doc(firestore, 'restaurants', RESTAURANT_ID);
    const globalSettingsSnap = await getDoc(globalSettingsRef);
    const globalSettings = docToObj<Restaurant>(globalSettingsSnap) || {};

    const defaultSettings: RestaurantSettings = {
        restaurantName: globalSettings.name || 'DineEZee',
        restaurantAddress: globalSettings.address || '123 Foodie Lane, Gourmet City',
        currencySymbol: '$',
        taxes: [],
        currencyDecimalPlaces: 2,
        qrCodeColor: globalSettings.qrCodeColor,
        qrCodeBackgroundColor: globalSettings.qrCodeBackgroundColor,
        qrCodeLogo: globalSettings.qrCodeLogo,
        onlineOrderPlatforms: globalSettings.onlineOrderPlatforms,
        menuCategories: ['Meals', 'Snacks', 'Beverages', 'Desserts'], // Default categories
    };

    if (!branchId) {
        return defaultSettings;
    }

    // DISABLED CACHE - Always fetch fresh data to ensure immediate updates
    // if (settingsCache[branchId]) return settingsCache[branchId];

    // 2. Fetch branch-specific settings
    const branchRef = doc(firestore, `restaurants/${RESTAURANT_ID}/branches`, branchId);
    const branchSnap = await getDoc(branchRef);
    const branchData = docToObj<Branch>(branchSnap);

    if (!branchData) {
        // If branch not found, return global defaults
        return defaultSettings;
    }

    // 3. Merge global and branch settings
    const finalSettings = {
        ...defaultSettings,
        // Branch-specific overrides global
        restaurantName: branchData.restaurantName || defaultSettings.restaurantName,
        restaurantAddress: branchData.restaurantAddress || defaultSettings.restaurantAddress,
        currencySymbol: branchData.currencySymbol || defaultSettings.currencySymbol,
        taxes: branchData.taxes || defaultSettings.taxes,
        currencyDecimalPlaces: branchData.currencyDecimalPlaces ?? defaultSettings.currencyDecimalPlaces,
        qrCodeColor: branchData.qrCodeColor || defaultSettings.qrCodeColor,
        qrCodeBackgroundColor: branchData.qrCodeBackgroundColor || defaultSettings.qrCodeBackgroundColor,
        qrCodeLogo: branchData.qrCodeLogo || defaultSettings.qrCodeLogo,
        onlineOrderPlatforms: branchData.onlineOrderPlatforms || defaultSettings.onlineOrderPlatforms,
        // Branch-only settings
        onlineOrderingEnabled: branchData.onlineOrderingEnabled ?? true,
        deliveryFee: branchData.deliveryFee ?? 0,
        minimumOrderValue: branchData.minimumOrderValue ?? 0,
        invoiceSettings: branchData.invoiceSettings,
        printSettings: branchData.printSettings,
        // Session settings
        mealSessions: branchData.mealSessions,
        manualSessionOverride: branchData.manualSessionOverride,
        // Timezone setting
        timezone: branchData.timezone,
        // Category settings - use branch categories or fall back to defaults
        menuCategories: branchData.menuCategories || defaultSettings.menuCategories,
    };

    // Cache disabled for immediate updates
    // settingsCache[branchId] = finalSettings;
    return finalSettings;
}

export async function updateSettings(branchId: string | undefined, newSettings: Partial<RestaurantSettings>): Promise<void> {
    const firestore = getFirestoreInstance();

    // If branchId is provided, it's a branch setting update
    if (branchId) {
        const branchRef = doc(firestore, `restaurants/${RESTAURANT_ID}/branches`, branchId);
        const updatePayload: { [k: string]: any } = { ...newSettings };
        if (newSettings.qrCodeLogo === undefined) {
            updatePayload.qrCodeLogo = deleteField();
        }
        await updateDoc(branchRef, updatePayload);
        delete settingsCache[branchId]; // Invalidate cache
    } else {
        // Otherwise, it's a global restaurant setting update
        const restaurantRef = doc(firestore, 'restaurants', RESTAURANT_ID);
        await setDoc(restaurantRef, newSettings, { merge: true });
        // Invalidate all caches as global settings affect all branches
        settingsCache = {};
    }
}


const generateInvoiceNumberForType = async (orderType: Order['orderType'], branchId: string): Promise<{ invoiceNumber: string }> => {
    const firestore = getFirestoreInstance();
    const branchRef = doc(firestore, `restaurants/${RESTAURANT_ID}/branches`, branchId);
    let invoiceNumber = '';

    try {
        await runTransaction(firestore, async (transaction) => {
            const branchDoc = await transaction.get(branchRef);
            if (!branchDoc.exists()) {
                throw new Error('Branch document does not exist!');
            }
            const settings = branchDoc.data() as Branch;

            const defaultInvoiceSettings: Required<Branch['invoiceSettings']> = {
                useUnifiedNumbering: true,
                unified: { prefix: 'INV-', nextNumber: 1 },
                dineIn: { prefix: 'DI-', nextNumber: 1 },
                online: { prefix: 'ON-', nextNumber: 1 },
                takeAway: { prefix: 'TA-', nextNumber: 1 },
            };

            const invSettings: Required<Branch['invoiceSettings']> = {
                ...defaultInvoiceSettings,
                ...settings.invoiceSettings,
                unified: { ...defaultInvoiceSettings.unified, ...settings.invoiceSettings?.unified },
                dineIn: { ...defaultInvoiceSettings.dineIn, ...settings.invoiceSettings?.dineIn },
                online: { ...defaultInvoiceSettings.online, ...settings.invoiceSettings?.online },
                takeAway: { ...defaultInvoiceSettings.takeAway, ...settings.invoiceSettings?.takeAway },
            };

            let prefix: string;
            let nextNumber: number;
            let fieldToUpdate: string;

            if (invSettings.useUnifiedNumbering) {
                prefix = invSettings.unified.prefix;
                nextNumber = invSettings.unified.nextNumber;
                fieldToUpdate = 'invoiceSettings.unified.nextNumber';
            } else {
                switch (orderType) {
                    case 'Dine-in':
                        prefix = invSettings.dineIn.prefix;
                        nextNumber = invSettings.dineIn.nextNumber;
                        fieldToUpdate = 'invoiceSettings.dineIn.nextNumber';
                        break;
                    case 'Online':
                        prefix = invSettings.online.prefix;
                        nextNumber = invSettings.online.nextNumber;
                        fieldToUpdate = 'invoiceSettings.online.nextNumber';
                        break;
                    case 'Take-away':
                        prefix = invSettings.takeAway.prefix;
                        nextNumber = invSettings.takeAway.nextNumber;
                        fieldToUpdate = 'invoiceSettings.takeAway.nextNumber';
                        break;
                    default:
                        prefix = invSettings.unified.prefix;
                        nextNumber = invSettings.unified.nextNumber;
                        fieldToUpdate = 'invoiceSettings.unified.nextNumber';
                }
            }

            invoiceNumber = `${prefix}${nextNumber}`;
            const newNextNumber = nextNumber + 1;

            transaction.update(branchRef, { [fieldToUpdate]: newNextNumber });
        });
    } catch (e) {
        console.error("Invoice number generation failed, falling back to random.", e);
        // Fallback for when transaction fails (e.g. branch doesn't exist yet)
        invoiceNumber = `ERR-${Date.now()}`;
    }


    return { invoiceNumber };
};


// --- Branches ---
export async function getBranches(): Promise<Branch[]> {
    const branchesRef = getCollections().branches;
    const q = query(branchesRef, orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => docToObj<Branch>(d));
}

export async function getMainBranch(): Promise<Branch | null> {
    const branchesRef = getCollections().branches;
    const q = query(branchesRef, where('isMain', '==', true));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        const allBranchesSnap = await getDocs(query(branchesRef, orderBy('name')));
        if(allBranchesSnap.empty) {
             return null;
        }
        // If no main branch is set, return the first one alphabetically.
        return docToObj<Branch>(allBranchesSnap.docs[0]);
    }
    return docToObj<Branch>(snapshot.docs[0]);
}

export async function getBranchById(id: string): Promise<Branch | null> {
    if (!id) return null;
    const firestore = getFirestoreInstance();
    const docRef = doc(firestore, `restaurants/${RESTAURANT_ID}/branches`, id);
    const docSnap = await getDoc(docRef);
    return docToObj<Branch>(docSnap);
}


export async function createBranch(name: string, isMain: boolean = false): Promise<Branch> {
    const firestore = getFirestoreInstance();
    const branchesRef = getCollections().branches;
    const batch = writeBatch(firestore);

    if (isMain) {
        const mainBranchQuery = query(branchesRef, where('isMain', '==', true));
        const mainBranchesSnap = await getDocs(mainBranchQuery);
        mainBranchesSnap.forEach(doc => {
            batch.update(doc.ref, { isMain: false });
        });
    }

    const newBranchRef = doc(branchesRef);
    // Add default settings to the new branch
    const defaultSettings: Partial<RestaurantSettings> = {
        restaurantName: name,
        restaurantAddress: '123 Foodie Lane, Gourmet City',
        currencySymbol: '$',
        taxes: [],
        currencyDecimalPlaces: 2,
        onlineOrderingEnabled: true,
        deliveryFee: 0,
        minimumOrderValue: 0,
        invoiceSettings: {
            useUnifiedNumbering: true,
            unified: { prefix: 'INV-', nextNumber: 1 },
            dineIn: { prefix: 'DI-', nextNumber: 1 },
            online: { prefix: 'ON-', nextNumber: 1 },
            takeAway: { prefix: 'TA-', nextNumber: 1 },
        }
    };
    const newBranchData = { name, isMain, ...defaultSettings };
    batch.set(newBranchRef, newBranchData);

    await batch.commit();
    return { ...newBranchData, id: newBranchRef.id };
}

export async function deleteBranch(branchId: string): Promise<void> {
    const branchesRef = getCollections().branches;
    const branchRef = doc(branchesRef, branchId);
    await deleteDoc(branchRef);
}

export async function setMainBranch(newMainBranchId: string): Promise<void> {
    const firestore = getFirestoreInstance();
    const branchesRef = getCollections().branches;
    const batch = writeBatch(firestore);

    // Unset the old main branch
    const mainBranchQuery = query(branchesRef, where('isMain', '==', true));
    const mainBranchesSnap = await getDocs(mainBranchQuery);
    mainBranchesSnap.forEach(doc => {
        batch.update(doc.ref, { isMain: false });
    });

    // Set the new main branch
    const newMainBranchRef = doc(branchesRef, newMainBranchId);
    batch.update(newMainBranchRef, { isMain: true });

    await batch.commit();
}


// Tables
export async function getTables(branchId?: string): Promise<Table[]> {
    const tablesRef = getCollections().tables;
    const q = branchId ? query(tablesRef, where('branchId', '==', branchId)) : query(tablesRef);
    const snapshot = await getDocs(q);
    const tables = snapshot.docs.map(d => docToObj<Table>(d));
    // Sort in application code to avoid needing a composite index
    return tables.sort((a, b) => (a.number as number) - (b.number as number));
}
export async function getTableById(id: string): Promise<Table | undefined> {
    if (!id) return undefined;
    const firestore = getFirestoreInstance();
    const docRef = doc(firestore, `restaurants/${RESTAURANT_ID}/tables`, id);
    const docSnap = await getDoc(docRef);
    return docToObj<Table>(docSnap);
}
export async function createTable(tableNumber: number, branchId: string): Promise<Table> {
    const tablesRef = getCollections().tables;
    const newTableData = {
        number: tableNumber,
        status: 'available' as const,
        position: { x: 20, y: 20 },
        branchId,
    };
    const docRef = await addDoc(tablesRef, newTableData);
    return { ...newTableData, id: docRef.id };
}
export async function updateTableStatus(tableId: string, status: Table['status']): Promise<void> {
    const tablesRef = getCollections().tables;
    const tableRef = doc(tablesRef, tableId);
    await updateDoc(tableRef, { status });
}
export async function updateTablePosition(tableId: string, position: { x: number; y: number }): Promise<void> {
    const tableRef = doc(getFirestoreInstance(), `restaurants/${RESTAURANT_ID}/tables`, tableId);
    await updateDoc(tableRef, { position });
}
export async function deleteTable(tableId: string): Promise<void> {
    const tablesRef = getCollections().tables;
    const tableRef = doc(tablesRef, tableId);
    await deleteDoc(tableRef);
}

// Menu Items
export async function getMenuItems(branchId?: string): Promise<MenuItem[]> {
    const menuItemsRef = getCollections().menuItems;
    const q = branchId ? query(menuItemsRef, where('branchId', '==', branchId)) : query(menuItemsRef);
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(d => docToObj<MenuItem>(d));
    items.sort((a, b) => {
        if (a.isAvailable && !b.isAvailable) return -1;
        if (!a.isAvailable && b.isAvailable) return 1;
        return a.name.localeCompare(b.name);
    });
    return items;
}
export async function getMenuItemById(id: string): Promise<MenuItem | undefined> {
    if (!id) return undefined;
    const firestore = getFirestoreInstance();
    const docRef = doc(firestore, `restaurants/${RESTAURANT_ID}/menuItems`, id);
    const docSnap = await getDoc(docRef);
    return docToObj<MenuItem>(docSnap);
}

export async function addMenuItem(itemData: Omit<MenuItem, 'id' | 'isAvailable'>): Promise<MenuItem> {
    const menuItemsRef = getCollections().menuItems;
    const newItemData: any = {
        ...itemData,
        isAvailable: true,
        isAddon: itemData.isAddon ?? false,
        addonGroups: itemData.addonGroups ?? [],
        createdAt: serverTimestamp()
    };

    if (itemData.prepTime === undefined || isNaN(itemData.prepTime)) {
        delete newItemData.prepTime;
    }

    const docRef = await addDoc(menuItemsRef, newItemData);
    return { ...newItemData, id: docRef.id, createdAt: new Date().toISOString() } as MenuItem;
}

export async function updateMenuItem(id: string, itemData: Partial<MenuItem>): Promise<MenuItem | undefined> {
    const menuItemsRef = getCollections().menuItems;
    const itemRef = doc(menuItemsRef, id);

    const updateData = { ...itemData };
    if (itemData.prepTime === undefined) {
        (updateData as any).prepTime = deleteField();
    }

    await updateDoc(itemRef, updateData);
    return getMenuItemById(id);
}

export async function toggleMenuItemAvailability(id: string, isAvailable: boolean): Promise<void> {
    const menuItemsRef = getCollections().menuItems;
    const itemRef = doc(menuItemsRef, id);
    await updateDoc(itemRef, { isAvailable });
}
export async function toggleMenuItemAddon(id: string, isAddon: boolean): Promise<void> {
    const menuItemsRef = getCollections().menuItems;
    const itemRef = doc(menuItemsRef, id);
    await updateDoc(itemRef, { isAddon });
}

// Orders
export async function getOrders(branchId?: string): Promise<Order[]> {
    const ordersRef = getCollections().orders;
    const snapshot = await getDocs(ordersRef);
    let orders = snapshot.docs.map(d => docToObj<Order>(d));

    if (branchId) {
        orders = orders.filter(order => order.branchId === branchId);
    }

    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getOrderById(id: string): Promise<Order | undefined> {
    if (!id) return undefined;
    const firestore = getFirestoreInstance();
    const docRef = doc(firestore, `restaurants/${RESTAURANT_ID}/orders`, id);
    const docSnap = await getDoc(docRef);
    return docToObj<Order>(docSnap);
}

export async function getOrdersByTableId(tableId: string): Promise<Order[]> {
    const ordersRef = getCollections().orders;
    const q = query(ordersRef, where('tableId', '==', tableId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => docToObj<Order>(d));
}

export async function getActiveOrders(branchId?: string): Promise<Order[]> {
    const ordersRef = getCollections().orders;
    const q = query(ordersRef, where('status', 'in', ['received', 'preparing', 'ready']));
    const snapshot = await getDocs(q);
    let orders = snapshot.docs.map(d => docToObj<Order>(d));

    if (branchId) {
        orders = orders.filter(order => order.branchId === branchId);
    }

    return orders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'status' | 'items' | 'paymentMethod' | 'taxes' | 'totalTaxAmount' | 'total' | 'subtotal'> & { items: OrderItem[] }): Promise<Order> {
    const { invoiceNumber } = await generateInvoiceNumberForType(orderData.orderType, orderData.branchId);
    const ordersRef = getCollections().orders;

    const settings = await getSettings(orderData.branchId);
    const subtotal = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const appliedTaxes: AppliedTax[] = (settings.taxes || []).map(tax => ({
        name: tax.name,
        rate: tax.rate,
        amount: subtotal * (tax.rate / 100)
    }));
    const totalTaxAmount = appliedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
    const total = subtotal + totalTaxAmount;

    const newOrderData = {
        ...orderData,
        invoiceNumber,
        subtotal,
        taxes: appliedTaxes,
        totalTaxAmount,
        total,
        createdAt: serverTimestamp(),
        status: 'received' as const,
    };
    const docRef = await addDoc(ordersRef, newOrderData);
    return { ...newOrderData, id: docRef.id, createdAt: new Date().toISOString() } as Order;
}

export async function addItemsToOrder(orderId: string, items: OrderItem[], notes?: string): Promise<Order | undefined> {
    const ordersRef = getCollections().orders;
    const orderRef = doc(ordersRef, orderId);
    const orderDoc = await getDoc(orderRef);
    const order = docToObj<Order>(orderDoc);

    if (order) {
        const updatedItems = [...order.items, ...items];

        const settings = await getSettings(order.branchId);
        const subtotal = updatedItems.reduce((sum, item) => item.status !== 'cancelled' ? sum + item.price * item.quantity : sum, 0);

        const appliedTaxes: AppliedTax[] = (settings.taxes || []).map(tax => ({
            name: tax.name,
            rate: tax.rate,
            amount: subtotal * (tax.rate / 100)
        }));
        const totalTaxAmount = appliedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
        const total = subtotal + totalTaxAmount;

        const updateData: Partial<Order> = {
            items: updatedItems,
            subtotal,
            taxes: appliedTaxes,
            totalTaxAmount,
            total,
        };

        if (notes) {
            updateData.notes = order.notes ? `${order.notes}\n${notes}` : notes;
        }

        await updateDoc(orderRef, updateData);
        return getOrderById(orderId);
    }
    return undefined;
}


export async function updateOrderStatus(orderId: string, status: OrderStatus, paymentMethod?: Order['paymentMethod']): Promise<Order | undefined> {
    const ordersRef = getCollections().orders;
    const orderRef = doc(ordersRef, orderId);
    const updateData: Partial<Order> = { status };
    if (status === 'completed' && paymentMethod) {
        updateData.paymentMethod = paymentMethod;
    }
    await updateDoc(orderRef, updateData);
    return getOrderById(orderId);
}

export async function updateOrderItemStatus(orderId: string, orderItemId: string, isReady: boolean): Promise<Order | undefined> {
    const ordersRef = getCollections().orders;
    const orderRef = doc(ordersRef, orderId);
    const order = await getOrderById(orderId);
    if (order) {
        const items = order.items.map(item => {
            if (item.orderItemId === orderItemId) {
                return { ...item, isReady };
            }
            return item;
        });
        await updateDoc(orderRef, { items });
    }
    return getOrderById(orderId);
}

export async function cancelOrderItem(orderId: string, orderItemId: string): Promise<Order | undefined> {
    const ordersRef = getCollections().orders;
    const orderRef = doc(ordersRef, orderId);
    const order = await getOrderById(orderId);

    if (order) {
        const settings = await getSettings(order.branchId);
        const items = order.items.map(item => {
            if (item.orderItemId === orderItemId) {
                return { ...item, status: 'cancelled' as const };
            }
            return item;
        });

        const activeItems = items.filter(i => i.status !== 'cancelled');
        const subtotal = activeItems.reduce((sum, current) => sum + (current.price * current.quantity), 0);

        const appliedTaxes: AppliedTax[] = (settings.taxes || []).map(tax => ({
            name: tax.name,
            rate: tax.rate,
            amount: subtotal * (tax.rate / 100)
        }));
        const totalTaxAmount = appliedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
        const total = subtotal + totalTaxAmount;

        await updateDoc(orderRef, { items, subtotal, taxes: appliedTaxes, totalTaxAmount, total });
    }
    return getOrderById(orderId);
}


export async function cancelOrdersForTable(tableId: string) {
    const firestore = getFirestoreInstance();
    const ordersRef = getCollections().orders;
    const q = query(ordersRef, where('tableId', '==', tableId), where('status', 'in', ['received', 'preparing', 'ready']));
    const snapshot = await getDocs(q);
    const batch = writeBatch(firestore);
    snapshot.docs.forEach(d => {
        batch.update(d.ref, { status: 'cancelled' });
    });
    await batch.commit();
}

export async function deleteOrder(orderId: string, orderType: 'Dine-in' | 'Remote') {
    const firestore = getFirestoreInstance();
    let docRef;

    if (orderType === 'Dine-in') {
        docRef = doc(firestore, `restaurants/${RESTAURANT_ID}/orders`, orderId);
    } else {
        docRef = doc(firestore, `restaurants/${RESTAURANT_ID}/remoteOrders`, orderId);
    }

    await deleteDoc(docRef);
}

// Remote Orders
export async function getRemoteOrders(branchId?: string): Promise<RemoteOrder[]> {
    const remoteOrdersRef = getCollections().remoteOrders;
    const snapshot = await getDocs(remoteOrdersRef);
    let orders = snapshot.docs.map(d => docToObj<RemoteOrder>(d));

    if (branchId) {
        orders = orders.filter(order => order.branchId === branchId);
    }

    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getRemoteOrderById(id: string): Promise<RemoteOrder | undefined> {
    if (!id) return undefined;
    const firestore = getFirestoreInstance();
    const docRef = doc(firestore, `restaurants/${RESTAURANT_ID}/remoteOrders`, id);
    const docSnap = await getDoc(docRef);
    return docToObj<RemoteOrder>(docSnap);
}


export async function addRemoteOrder(orderData: Omit<RemoteOrder, 'id' | 'createdAt' | 'paymentMethod' | 'items' | 'taxes' | 'totalTaxAmount' | 'total' | 'subtotal'> & { items: Omit<OrderItem, 'orderItemId' | 'category' | 'isReady' | 'status' | 'selectedAddons' | 'notes'>[] }): Promise<RemoteOrder> {
    const firestore = getFirestoreInstance();
    const { invoiceNumber } = await generateInvoiceNumberForType(orderData.orderType, orderData.branchId);
    const settings = await getSettings(orderData.branchId);

    const batch = writeBatch(firestore);

    const subtotal = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const appliedTaxes: AppliedTax[] = (settings.taxes || []).map(tax => ({
        name: tax.name,
        rate: tax.rate,
        amount: subtotal * (tax.rate / 100)
    }));
    const totalTaxAmount = appliedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
    const total = subtotal + totalTaxAmount;

    // 1. Create RemoteOrder
    const remoteOrdersRef = getCollections().remoteOrders;
    const newRemoteOrderRef = doc(remoteOrdersRef);
    const remoteOrderPayload = {
        ...orderData,
        invoiceNumber,
        subtotal,
        taxes: appliedTaxes,
        totalTaxAmount,
        total,
        createdAt: serverTimestamp(),
    };
    batch.set(newRemoteOrderRef, remoteOrderPayload);

    // 2. Create standard Order for kitchen view
    const ordersRef = getCollections().orders;
    const newOrderRef = doc(ordersRef);
    const orderPayload: Omit<Order, 'id'> = {
        createdAt: new Date().toISOString(),
        invoiceNumber,
        status: 'received',
        tableId: 'tbl-remote',
        customerName: orderData.customerDetails.name,
        customerPhone: orderData.customerDetails.phone,
        branchId: orderData.branchId,
        items: orderData.items.map((item, index) => ({
            ...item,
            orderItemId: `${newOrderRef.id}-item-${index}`,
            category: '', // This should be fetched if needed, simplified for now
            isReady: false,
            status: 'active',
        })),
        subtotal,
        taxes: appliedTaxes,
        totalTaxAmount,
        total,
        orderType: orderData.orderType,
        notes: orderData.orderType === 'Take-away' && orderData.customerDetails.takeAwayTime ? `Pickup Time: ${orderData.customerDetails.takeAwayTime}` : undefined,
    };
    batch.set(newOrderRef, { ...orderPayload, createdAt: serverTimestamp() });

    await batch.commit();

    return { ...remoteOrderPayload, id: newRemoteOrderRef.id, createdAt: new Date().toISOString() } as RemoteOrder;
}

// Kitchen Users
export async function getKitchenUsers(): Promise<KitchenUser[]> {
    const kitchenUsersRef = getCollections().kitchenUsers;
    const snapshot = await getDocs(kitchenUsersRef);
    return snapshot.docs.map(d => docToObj<KitchenUser>(d));
}

export async function getKitchenUserById(userId: string): Promise<KitchenUser | undefined> {
    if (!userId) return undefined;
    const firestore = getFirestoreInstance();
    const docRef = doc(firestore, `restaurants/${RESTAURANT_ID}/kitchenUsers`, userId);
    const docSnap = await getDoc(docRef);
    return docToObj<KitchenUser>(docSnap);
}

export async function getKitchenUserByUsername(username: string): Promise<KitchenUser | undefined> {
    const kitchenUsersRef = getCollections().kitchenUsers;
    const q = query(kitchenUsersRef, where('username', '==', username));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return undefined;
    }
    return docToObj<KitchenUser>(snapshot.docs[0]);
}

export async function createKitchenUser(userData: Omit<KitchenUser, 'id'>): Promise<KitchenUser> {
    const kitchenUsersRef = getCollections().kitchenUsers;
    const newUserPayload = {
        ...userData,
    };
    const docRef = await addDoc(kitchenUsersRef, newUserPayload);
    return { ...newUserPayload, id: docRef.id };
}

export async function updateKitchenUser(userId: string, updateData: Partial<KitchenUser>): Promise<KitchenUser | undefined> {
    const kitchenUsersRef = getCollections().kitchenUsers;
    const userRef = doc(kitchenUsersRef, userId);
    await updateDoc(userRef, updateData);
    return getKitchenUserById(userId);
}

export async function deleteKitchenUser(userId: string): Promise<void> {
    const kitchenUsersRef = getCollections().kitchenUsers;
    const userRef = doc(kitchenUsersRef, userId);
    await deleteDoc(userRef);
}

export async function updateOrderDetails(orderId: string, orderType: Order['orderType'] | RemoteOrder['orderType'], updateData: { customerName: string; customerPhone: string; }) {
    const firestore = getFirestoreInstance();
    let docRef;
    let payload;

    if (orderType === 'Dine-in') {
        docRef = doc(firestore, `restaurants/${RESTAURANT_ID}/orders`, orderId);
        payload = {
            customerName: updateData.customerName,
            customerPhone: updateData.customerPhone
        };
    } else { // 'Online' or 'Take-away', which are RemoteOrders
        docRef = doc(firestore, `restaurants/${RESTAURANT_ID}/remoteOrders`, orderId);
        payload = {
            'customerDetails.name': updateData.customerName,
            'customerDetails.phone': updateData.customerPhone
        };
    }

    await updateDoc(docRef, payload);
}

// --- Meal Sessions ---

/**
 * Get current active session based on time or manual override
 */
export async function getCurrentSession(branchId: string): Promise<MealSession | null> {
    const settings = await getSettings(branchId);
    if (!settings.mealSessions || settings.mealSessions.length === 0) {
        return null;
    }

    // Check for manual override first
    if (settings.manualSessionOverride?.enabled && settings.manualSessionOverride.sessionId) {
        const manualSession = settings.mealSessions.find(
            s => s.id === settings.manualSessionOverride!.sessionId
        );
        if (manualSession) {
            return manualSession;
        }
    }

    // Use configured timezone (defaults to Asia/Kolkata for India)
    const timezone = settings.timezone || 'Asia/Kolkata';
    const now = new Date();

    // Convert current time to the restaurant's timezone
    const { toZonedTime } = require('date-fns-tz');
    const zonedNow = toZonedTime(now, timezone);
    const currentMinutes = zonedNow.getHours() * 60 + zonedNow.getMinutes();

    const activeSession = settings.mealSessions.find(session => {
        if (!session.isActive) return false;

        const [startHour, startMin] = session.startTime.split(':').map(Number);
        const [endHour, endMin] = session.endTime.split(':').map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        // Handle sessions that cross midnight
        if (endMinutes < startMinutes) {
            // Session crosses midnight (e.g., 22:00 - 02:00)
            return currentMinutes >= startMinutes || currentMinutes < endMinutes;
        } else {
            // Normal session within same day
            return currentMinutes >= startMinutes && currentMinutes < endMinutes;
        }
    });

    return activeSession || null;
}

/**
 * Get menu items filtered by current session
 * Items with no assigned sessions are always available
 */
export async function getAvailableMenuItemsForSession(branchId: string, sessionId?: string): Promise<MenuItem[]> {
    const allItems = await getMenuItems(branchId);

    // If no session specified, return all items
    if (!sessionId) {
        return allItems;
    }

    // Filter items: include those with no sessions OR those that include this session
    return allItems.filter(item => {
        if (!item.availableSessions || item.availableSessions.length === 0) {
            return true; // Available at all times
        }
        return item.availableSessions.includes(sessionId);
    });
}

/**
 * Add a new meal session to branch settings
 */
export async function addMealSession(branchId: string, sessionData: Omit<MealSession, 'id'>): Promise<MealSession> {
    const settings = await getSettings(branchId);
    const currentSessions = settings.mealSessions || [];

    const newSession: MealSession = {
        ...sessionData,
        id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const updatedSessions = [...currentSessions, newSession];
    await updateSettings(branchId, { mealSessions: updatedSessions });

    return newSession;
}

/**
 * Update an existing meal session
 */
export async function updateMealSession(branchId: string, sessionId: string, updates: Partial<Omit<MealSession, 'id'>>): Promise<void> {
    const settings = await getSettings(branchId);
    const currentSessions = settings.mealSessions || [];

    const updatedSessions = currentSessions.map(session =>
        session.id === sessionId ? { ...session, ...updates } : session
    );

    await updateSettings(branchId, { mealSessions: updatedSessions });
}

/**
 * Delete a meal session
 */
export async function deleteMealSession(branchId: string, sessionId: string): Promise<void> {
    const settings = await getSettings(branchId);
    const currentSessions = settings.mealSessions || [];

    const updatedSessions = currentSessions.filter(session => session.id !== sessionId);
    await updateSettings(branchId, { mealSessions: updatedSessions });
}

// --- Menu Categories ---

/**
 * Get menu categories for a branch
 */
export async function getMenuCategories(branchId: string): Promise<string[]> {
    const settings = await getSettings(branchId);
    return settings.menuCategories || ['Meals', 'Snacks', 'Beverages', 'Desserts'];
}

/**
 * Add a new menu category
 */
export async function addMenuCategory(branchId: string, categoryName: string): Promise<void> {
    const settings = await getSettings(branchId);
    const currentCategories = settings.menuCategories || ['Meals', 'Snacks', 'Beverages', 'Desserts'];

    // Check if category already exists
    if (currentCategories.includes(categoryName)) {
        throw new Error('Category already exists');
    }

    const updatedCategories = [...currentCategories, categoryName];
    await updateSettings(branchId, { menuCategories: updatedCategories });
}

/**
 * Remove a menu category
 */
export async function removeMenuCategory(branchId: string, categoryName: string): Promise<void> {
    const settings = await getSettings(branchId);
    const currentCategories = settings.menuCategories || [];

    // Check if any menu items use this category
    const menuItems = await getMenuItems(branchId);
    const itemsWithCategory = menuItems.filter(item => item.category === categoryName);

    if (itemsWithCategory.length > 0) {
        throw new Error(`Cannot delete category "${categoryName}". ${itemsWithCategory.length} menu item(s) are using it.`);
    }

    const updatedCategories = currentCategories.filter(cat => cat !== categoryName);
    await updateSettings(branchId, { menuCategories: updatedCategories });
}

// --- Activity Log ---
export async function logActivity(userId: string, username: string, action: string, details: string): Promise<void> {
    const activityLogsRef = getCollections().activityLogs;
    await addDoc(activityLogsRef, {
        userId,
        username,
        action,
        details,
        timestamp: serverTimestamp(),
    });
}

export async function getActivityLogsByUser(userId: string): Promise<ActivityLog[]> {
    const activityLogsRef = getCollections().activityLogs;
    const q = query(activityLogsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(d => docToObj<ActivityLog>(d));
    // Sort in code to avoid needing a composite index
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
