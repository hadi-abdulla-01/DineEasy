

'use server';
import type { Table, MenuItem, Order, RemoteOrder, OrderStatus, KitchenUser, OrderItem, RestaurantSettings, UserRole, AddonGroup, SelectedAddon, InvoiceSettings, AppliedTax, Tax, PrintSettings, Branch, UserPermissions, NavMenuKey, MealSession, ActivityLog } from './definitions';
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
    limit,
    writeBatch,
    serverTimestamp,
    Timestamp,
    deleteField,
    runTransaction,
    collectionGroup,
} from 'firebase/firestore';

const getFirestoreInstance = () => {
    return initializeFirebase().firestore;
}

const getCollections = (restaurantId: string) => {
    const firestore = getFirestoreInstance();
    return {
        restaurants: collection(firestore, 'restaurants'),
        tables: collection(firestore, `restaurants/${restaurantId}/tables`),
        menuItems: collection(firestore, `restaurants/${restaurantId}/menuItems`),
        orders: collection(firestore, `restaurants/${restaurantId}/orders`),
        remoteOrders: collection(firestore, `restaurants/${restaurantId}/remoteOrders`),
        kitchenUsers: collection(firestore, `restaurants/${restaurantId}/kitchenUsers`),
        branches: collection(firestore, `restaurants/${restaurantId}/branches`),
        activityLogs: collection(firestore, `restaurants/${restaurantId}/activityLogs`),
        settings: doc(firestore, `restaurants/${restaurantId}`),
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

async function seedInitialAdminUser(restaurantId: string) {
    const adminUser = await getKitchenUserByUsername('admin', restaurantId);
    if (!adminUser) {
        console.log("No admin user found. Seeding initial admin user.");
        const mainBranch = await getMainBranch(restaurantId);
        if (mainBranch) {
            await createKitchenUserInFirestore({
                username: 'admin',
                password: 'admin123', // In a real app, this should be securely hashed
                categories: ['All'],
                role: 'Admin',
                branchId: mainBranch.id, // Assign Admin to Main Branch by default
                permissions: {
                    dashboard: { view: true },
                    tableOrder: { view: true },
                    tables: { view: true, create: true, edit: true, delete: true },
                    menu: { view: true, create: true, edit: true, delete: true },
                    kitchen: { view: true },
                    sales: { view: true },
                    salesHistory: { view: true, edit: true, delete: true },
                    onlineOrders: { view: true, create: true },
                    takeAway: { view: true, create: true },
                    userManagement: { view: true, create: true, edit: true, delete: true },
                    settings: { view: true, edit: true },
                }
            }, restaurantId);
        } else {
            console.error("Could not create admin user: No main branch found.");
        }
    }
}

async function seedInitialOrder(restaurantId: string) {
    const orders = await getOrders(undefined, restaurantId);
    if (orders.length === 0) {
        console.log("No orders found. Seeding a sample order.");
        const mainBranch = await getMainBranch(restaurantId);
        const menuItems = await getMenuItems(mainBranch?.id, restaurantId);
        let tables = await getTables(mainBranch?.id, restaurantId);

        if (!mainBranch) {
            console.error("Cannot seed order: Main branch not found.");
            return;
        }

        if (tables.length === 0) {
            console.log("No tables found for main branch. Seeding a sample table.");
            await createTable(1, mainBranch.id, restaurantId);
            tables = await getTables(mainBranch.id, restaurantId);
        }

        if (menuItems.length > 0 && tables.length > 0) {
            const sampleItems: OrderItem[] = menuItems.slice(0, 2).map((item, index) => ({
                orderItemId: `sample-item-${index}`,
                menuItemId: item.id,
                quantity: 1,
                name: item.name,
                price: item.price,
                category: item.category,
                isReady: false,
                status: 'active',
            }));

            await createOrder({
                tableId: tables[0].id,
                branchId: mainBranch.id,
                customerName: 'Sample Customer',
                customerPhone: '555-0100',
                items: sampleItems,
                orderType: 'Dine-in',
                notes: 'This is a sample order created automatically.'
            }, restaurantId);
        } else {
            console.error("Cannot seed order: No menu items or tables found for the main branch.");
        }
    }
}


// --- Settings ---
let settingsCache: Record<string, RestaurantSettings> = {};

export async function getSettings(branchId?: string, restaurantId: string = 'dineeasee-restaurant'): Promise<RestaurantSettings> {
    const firestore = getFirestoreInstance();

    // 1. Fetch global settings
    const globalSettingsRef = doc(firestore, 'restaurants', restaurantId);
    const globalSettingsSnap = await getDoc(globalSettingsRef);
    const globalSettings = docToObj<any>(globalSettingsSnap) || {};

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
        menuCategories: globalSettings.menuCategories || [], // Removed hardcoded default categories
        onlineOrderingEnabled: true,
        deliveryFee: 0,
        minimumOrderValue: 0,
        invoiceSettings: {
            useUnifiedNumbering: true,
            unified: { prefix: 'INV-', nextNumber: 1 },
            dineIn: { prefix: 'DI-', nextNumber: 1 },
            online: { prefix: 'ON-', nextNumber: 1 },
            takeAway: { prefix: 'TA-', nextNumber: 1 },
        },
        printSettings: undefined,
        mealSessions: globalSettings.mealSessions || [],
        manualSessionOverride: undefined,
        timezone: undefined,
    };

    if (!branchId) {
        return defaultSettings;
    }

    // Check cache first
    const cacheKey = `${restaurantId}-${branchId}`;
    if (settingsCache[cacheKey]) return settingsCache[cacheKey];

    // 2. Fetch branch-specific settings
    const branchRef = doc(firestore, `restaurants/${restaurantId}/branches`, branchId);
    const branchSnap = await getDoc(branchRef);
    const branchData = docToObj<Branch>(branchSnap);

    if (!branchData) {
        // If branch not found, return global defaults
        return defaultSettings;
    }

    // 3. Merge: branch-specific settings override global defaults
    const mergedSettings: RestaurantSettings = {
        ...defaultSettings,
        restaurantName: branchData.restaurantName || defaultSettings.restaurantName,
        restaurantAddress: branchData.restaurantAddress || defaultSettings.restaurantAddress,
        currencySymbol: branchData.currencySymbol || defaultSettings.currencySymbol,
        currencyDecimalPlaces: branchData.currencyDecimalPlaces ?? defaultSettings.currencyDecimalPlaces,
        taxes: branchData.taxes || defaultSettings.taxes,
        invoiceSettings: branchData.invoiceSettings || defaultSettings.invoiceSettings,
        printSettings: branchData.printSettings || defaultSettings.printSettings,
        mealSessions: branchData.mealSessions || defaultSettings.mealSessions,
        manualSessionOverride: branchData.manualSessionOverride ?? defaultSettings.manualSessionOverride,
        onlineOrderingEnabled: branchData.onlineOrderingEnabled ?? defaultSettings.onlineOrderingEnabled,
        deliveryFee: branchData.deliveryFee ?? defaultSettings.deliveryFee,
        minimumOrderValue: branchData.minimumOrderValue ?? defaultSettings.minimumOrderValue,
        menuCategories: branchData.menuCategories || defaultSettings.menuCategories,
        qrCodeColor: branchData.qrCodeColor || defaultSettings.qrCodeColor,
        qrCodeBackgroundColor: branchData.qrCodeBackgroundColor || defaultSettings.qrCodeBackgroundColor,
        qrCodeLogo: branchData.qrCodeLogo || defaultSettings.qrCodeLogo,
        onlineOrderPlatforms: branchData.onlineOrderPlatforms || defaultSettings.onlineOrderPlatforms,
        timezone: branchData.timezone || defaultSettings.timezone,
    };

    // Cache the result
    settingsCache[cacheKey] = mergedSettings;
    return mergedSettings;
}


async function seedInitialData(restaurantId: string = 'dineeasee-restaurant') {
    const branches = await getBranches(restaurantId);
    if (branches.length > 0) {
        await seedInitialAdminUser(restaurantId);
        await seedInitialOrder(restaurantId);
    }
}

export async function updateSettings(branchId: string | undefined, newSettings: Partial<RestaurantSettings>, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const firestore = getFirestoreInstance();

    if (branchId) {
        const branchRef = doc(firestore, `restaurants/${restaurantId}/branches`, branchId);
        const updatePayload: { [k: string]: any } = { ...newSettings };
        if (newSettings.qrCodeLogo === undefined) {
            updatePayload.qrCodeLogo = deleteField();
        }
        await updateDoc(branchRef, updatePayload);
        delete settingsCache[`${restaurantId}-${branchId}`];
    } else {
        const restaurantRef = doc(firestore, 'restaurants', restaurantId);
        await setDoc(restaurantRef, newSettings, { merge: true });
        settingsCache = {};
    }
}


const generateInvoiceNumberForType = async (orderType: Order['orderType'], branchId: string, restaurantId: string = 'dineeasee-restaurant'): Promise<{ invoiceNumber: string }> => {
    const firestore = getFirestoreInstance();
    const branchRef = doc(firestore, `restaurants/${restaurantId}/branches`, branchId);
    let invoiceNumber = '';

    await runTransaction(firestore, async (transaction) => {
        const branchDoc = await transaction.get(branchRef);
        if (!branchDoc.exists()) {
            throw new Error('Branch document does not exist!');
        }
        const settings = branchDoc.data() as Branch;

        const defaultInvoiceSettings: InvoiceSettings = {
            useUnifiedNumbering: true,
            unified: { prefix: 'INV-', nextNumber: 1 },
            dineIn: { prefix: 'DI-', nextNumber: 1 },
            online: { prefix: 'ON-', nextNumber: 1 },
            takeAway: { prefix: 'TA-', nextNumber: 1 },
        };

        const invSettings: InvoiceSettings = {
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

    return { invoiceNumber };
};


// --- Branches ---
export async function getBranches(restaurantId: string = 'dineeasee-restaurant'): Promise<Branch[]> {
    const branchesRef = getCollections(restaurantId).branches;
    const q = query(branchesRef, orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => docToObj<Branch>(d));
}

export async function getMainBranch(restaurantId: string = 'dineeasee-restaurant'): Promise<Branch | null> {
    const branchesRef = getCollections(restaurantId).branches;
    const q = query(branchesRef, where('isMain', '==', true));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        const allBranches = await getBranches(restaurantId);
        if (allBranches.length > 0) {
            await setMainBranch(allBranches[0].id, restaurantId);
            return getBranchById(allBranches[0].id, restaurantId);
        }
        const newMainBranch = await createBranch('Main Branch', true, restaurantId);
        return newMainBranch;
    }
    return docToObj<Branch>(snapshot.docs[0]);
}

export async function getBranchById(id: string, restaurantId: string = 'dineeasee-restaurant'): Promise<Branch | null> {
    if (!id) return null;
    const firestore = getFirestoreInstance();
    const docRef = doc(firestore, `restaurants/${restaurantId}/branches`, id);
    const docSnap = await getDoc(docRef);
    return docToObj<Branch>(docSnap);
}

export async function createBranch(name: string, isMain: boolean = false, restaurantId: string = 'dineeasee-restaurant'): Promise<Branch> {
    const firestore = getFirestoreInstance();
    const branchesRef = getCollections(restaurantId).branches;
    const batch = writeBatch(firestore);

    if (isMain) {
        const mainBranchQuery = query(branchesRef, where('isMain', '==', true));
        const mainBranchesSnap = await getDocs(mainBranchQuery);
        mainBranchesSnap.forEach(doc => {
            batch.update(doc.ref, { isMain: false });
        });
    }

    const newBranchRef = doc(branchesRef);
    const defaultSettings: Partial<RestaurantSettings> = {
        restaurantName: name,
        restaurantAddress: '123 Foodie Lane, Gourmet City',
        currencySymbol: '$',
        taxes: [],
        currencyDecimalPlaces: 2,
        menuCategories: ['Meals', 'Snacks', 'Beverages', 'Desserts'],
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

export async function deleteBranch(branchId: string, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const branchesRef = getCollections(restaurantId).branches;
    const branchRef = doc(branchesRef, branchId);
    await deleteDoc(branchRef);
}

export async function setMainBranch(newMainBranchId: string, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const firestore = getFirestoreInstance();
    const branchesRef = getCollections(restaurantId).branches;
    const batch = writeBatch(firestore);

    const mainBranchQuery = query(branchesRef, where('isMain', '==', true));
    const mainBranchesSnap = await getDocs(mainBranchQuery);
    mainBranchesSnap.forEach(doc => {
        batch.update(doc.ref, { isMain: false });
    });

    const newMainBranchRef = doc(branchesRef, newMainBranchId);
    batch.update(newMainBranchRef, { isMain: true });

    await batch.commit();
}


// Tables
export async function getTables(branchId?: string, restaurantId: string = 'dineeasee-restaurant'): Promise<Table[]> {
    const tablesRef = getCollections(restaurantId).tables;
    const q = branchId ? query(tablesRef, where('branchId', '==', branchId)) : query(tablesRef);
    const snapshot = await getDocs(q);
    const tables = snapshot.docs.map(d => docToObj<Table>(d));
    return tables.sort((a, b) => (a.number && b.number) ? a.number - b.number : -1);
}

export async function getTableById(id: string, restaurantId: string = 'dineeasee-restaurant'): Promise<Table | undefined> {
    try {
        if (!id) return undefined;
        const firestore = getFirestoreInstance();
        const docRef = doc(firestore, `restaurants/${restaurantId}/tables`, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const table = docToObj<Table>(docSnap);
            if (!table.restaurantId) {
                table.restaurantId = restaurantId;
            }
            return table;
        }

        const restaurantsRef = collection(firestore, 'restaurants');
        const restaurantsSnap = await getDocs(restaurantsRef);

        const checks = restaurantsSnap.docs.map(async (rDoc) => {
            if (rDoc.id === restaurantId) return null;
            const tRef = doc(firestore, `restaurants/${rDoc.id}/tables`, id);
            const tSnap = await getDoc(tRef);
            if (tSnap.exists()) {
                const t = docToObj<Table>(tSnap);
                t.restaurantId = rDoc.id;
                return t;
            }
            return null;
        });

        const results = await Promise.all(checks);
        const found = results.find(r => r !== null);
        return found || undefined;
    } catch (error) {
        console.error("[getTableById] Critical error fetching table:", error);
        throw error;
    }
}

export async function createTable(tableNumber: number, branchId: string, restaurantId: string = 'dineeasee-restaurant'): Promise<Table> {
    const tablesRef = getCollections(restaurantId).tables;
    const newTableData = {
        number: tableNumber,
        status: 'available' as const,
        position: { x: 20, y: 20 },
        branchId,
    };
    const docRef = await addDoc(tablesRef, newTableData);
    return { ...newTableData, id: docRef.id };
}

export async function updateTableStatus(tableId: string, status: Table['status'], restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const tableRef = doc(getFirestoreInstance(), `restaurants/${restaurantId}/tables`, tableId);
    await updateDoc(tableRef, { status });
}

export async function updateTablePosition(tableId: string, position: { x: number; y: number }, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const tableRef = doc(getFirestoreInstance(), `restaurants/${restaurantId}/tables`, tableId);
    await updateDoc(tableRef, { position });
}

export async function deleteTable(tableId: string, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const tableRef = doc(getFirestoreInstance(), `restaurants/${restaurantId}/tables`, tableId);
    await deleteDoc(tableRef);
}

// Menu Items
export async function getMenuItems(branchId?: string, restaurantId: string = 'dineeasee-restaurant'): Promise<MenuItem[]> {
    const menuItemsRef = getCollections(restaurantId).menuItems;
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

export async function getMenuItemById(id: string, restaurantId: string = 'dineeasee-restaurant'): Promise<MenuItem | undefined> {
    if (!id) return undefined;
    const docRef = doc(getFirestoreInstance(), `restaurants/${restaurantId}/menuItems`, id);
    const docSnap = await getDoc(docRef);
    return docToObj<MenuItem>(docSnap);
}

export async function addMenuItem(itemData: Omit<MenuItem, 'id' | 'isAvailable'>, restaurantId: string = 'dineeasee-restaurant'): Promise<MenuItem> {
    const menuItemsRef = getCollections(restaurantId).menuItems;
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

export async function updateMenuItem(id: string, itemData: Partial<MenuItem>, restaurantId: string = 'dineeasee-restaurant'): Promise<MenuItem | undefined> {
    const itemRef = doc(getFirestoreInstance(), `restaurants/${restaurantId}/menuItems`, id);
    const updateData = { ...itemData };
    if (itemData.prepTime === undefined) {
        (updateData as any).prepTime = deleteField();
    }
    await updateDoc(itemRef, updateData);
    return getMenuItemById(id, restaurantId);
}

export async function toggleMenuItemAvailability(id: string, isAvailable: boolean, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const itemRef = doc(getFirestoreInstance(), `restaurants/${restaurantId}/menuItems`, id);
    await updateDoc(itemRef, { isAvailable });
}

export async function toggleMenuItemAddon(id: string, isAddon: boolean, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const itemRef = doc(getFirestoreInstance(), `restaurants/${restaurantId}/menuItems`, id);
    await updateDoc(itemRef, { isAddon });
}

export async function deleteMenuItem(id: string, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const itemRef = doc(getFirestoreInstance(), `restaurants/${restaurantId}/menuItems`, id);
    await deleteDoc(itemRef);
}

// Orders
export async function getOrders(branchId?: string, restaurantId: string = 'dineeasee-restaurant'): Promise<Order[]> {
    const ordersRef = getCollections(restaurantId).orders;
    const q = branchId ? query(ordersRef, where('branchId', '==', branchId)) : query(ordersRef);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => docToObj<Order>(d)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getOrderById(id: string, restaurantId: string = 'dineeasee-restaurant'): Promise<Order | undefined> {
    if (!id) return undefined;
    const docRef = doc(getFirestoreInstance(), `restaurants/${restaurantId}/orders`, id);
    const docSnap = await getDoc(docRef);
    return docToObj<Order>(docSnap);
}

export async function getOrdersByTableId(tableId: string, restaurantId: string = 'dineeasee-restaurant'): Promise<Order[]> {
    const ordersRef = getCollections(restaurantId).orders;
    const q = query(ordersRef, where('tableId', '==', tableId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => docToObj<Order>(d));
}

export async function getActiveOrders(branchId?: string, restaurantId: string = 'dineeasee-restaurant'): Promise<Order[]> {
    const ordersRef = getCollections(restaurantId).orders;
    const q = query(ordersRef, where('status', 'in', ['received', 'preparing', 'ready']));
    const snapshot = await getDocs(q);
    let orders = snapshot.docs.map(d => docToObj<Order>(d));
    if (branchId) {
        orders = orders.filter(order => order.branchId === branchId);
    }
    return orders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'status' | 'items' | 'paymentMethod' | 'taxes' | 'totalTaxAmount' | 'total' | 'subtotal'> & { items: OrderItem[] }, restaurantId: string = 'dineeasee-restaurant'): Promise<Order> {
    const { invoiceNumber } = await generateInvoiceNumberForType(orderData.orderType, orderData.branchId, restaurantId);
    const ordersRef = getCollections(restaurantId).orders;
    const settings = await getSettings(orderData.branchId, restaurantId);
    const subtotal = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const appliedTaxes: AppliedTax[] = (settings.taxes || []).map(tax => ({
        name: tax.name,
        rate: tax.rate,
        amount: subtotal * (tax.rate / 100)
    }));
    const totalTaxAmount = appliedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
    const total = subtotal + totalTaxAmount;

    const newOrderData = { ...orderData, invoiceNumber, subtotal, taxes: appliedTaxes, totalTaxAmount, total, createdAt: serverTimestamp(), status: 'received' as const };
    const docRef = await addDoc(ordersRef, newOrderData);
    const order = { ...newOrderData, id: docRef.id, createdAt: new Date().toISOString() } as Order;

    // Send push notification to kitchen devices (works on Vercel)
    try {
        // Use absolute URL for server-side fetch
        const baseUrl = typeof window !== 'undefined'
            ? window.location.origin
            : process.env.NEXT_PUBLIC_SITE_URL || 'https://dineeasy-ochre.vercel.app';

        await fetch(`${baseUrl}/api/send-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                restaurantId,
                branchId: orderData.branchId,
                order: {
                    id: docRef.id,
                    orderType: orderData.orderType,
                    customerName: orderData.customerName,
                    items: orderData.items,
                },
            }),
        });
        console.log('📱 Push notification sent for order:', docRef.id);
    } catch (error) {
        console.error('❌ Failed to send push notification:', error);
        // Don't fail the order creation if notification fails
    }

    return order;
}

export async function addItemsToOrder(orderId: string, items: OrderItem[], notes?: string, restaurantId: string = 'dineeasee-restaurant'): Promise<Order | undefined> {
    const orderRef = doc(getFirestoreInstance(), `restaurants/${restaurantId}/orders`, orderId);
    const orderDoc = await getDoc(orderRef);
    const order = docToObj<Order>(orderDoc);

    if (order) {
        const updatedItems = [...order.items, ...items];
        const settings = await getSettings(order.branchId, restaurantId);
        const subtotal = updatedItems.reduce((sum, item) => item.status !== 'cancelled' ? sum + item.price * item.quantity : sum, 0);
        const appliedTaxes: AppliedTax[] = (settings.taxes || []).map(tax => ({ name: tax.name, rate: tax.rate, amount: subtotal * (tax.rate / 100) }));
        const totalTaxAmount = appliedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
        const total = subtotal + totalTaxAmount;
        const updateData: Partial<Order> = { items: updatedItems, subtotal, taxes: appliedTaxes, totalTaxAmount, total };
        if (notes) {
            updateData.notes = order.notes ? `${order.notes}\n${notes}` : notes;
        }
        await updateDoc(orderRef, updateData);
        return getOrderById(orderId, restaurantId);
    }
    return undefined;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, paymentMethod?: Order['paymentMethod'], restaurantId: string = 'dineeasee-restaurant'): Promise<Order | undefined> {
    const orderRef = doc(getFirestoreInstance(), `restaurants/${restaurantId}/orders`, orderId);
    const updateData: Partial<Order> = { status };
    if (status === 'completed' && paymentMethod) {
        updateData.paymentMethod = paymentMethod;
    }
    await updateDoc(orderRef, updateData);
    return getOrderById(orderId, restaurantId);
}

export async function updateOrderItemStatus(orderId: string, orderItemId: string, isReady: boolean, restaurantId: string = 'dineeasee-restaurant'): Promise<Order | undefined> {
    const orderRef = doc(getFirestoreInstance(), `restaurants/${restaurantId}/orders`, orderId);
    const order = await getOrderById(orderId, restaurantId);
    if (order) {
        const items = order.items.map(item => item.orderItemId === orderItemId ? { ...item, isReady } : item);
        await updateDoc(orderRef, { items });
    }
    return getOrderById(orderId, restaurantId);
}

export async function cancelOrderItem(orderId: string, orderItemId: string, restaurantId: string = 'dineeasee-restaurant'): Promise<Order | undefined> {
    const orderRef = doc(getFirestoreInstance(), `restaurants/${restaurantId}/orders`, orderId);
    const order = await getOrderById(orderId, restaurantId);
    if (order) {
        const settings = await getSettings(order.branchId, restaurantId);
        const items = order.items.map(item => item.orderItemId === orderItemId ? { ...item, status: 'cancelled' as const } : item);
        const activeItems = items.filter(i => i.status !== 'cancelled');
        const subtotal = activeItems.reduce((sum, current) => sum + (current.price * current.quantity), 0);
        const appliedTaxes: AppliedTax[] = (settings.taxes || []).map(tax => ({ name: tax.name, rate: tax.rate, amount: subtotal * (tax.rate / 100) }));
        const totalTaxAmount = appliedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
        const total = subtotal + totalTaxAmount;
        await updateDoc(orderRef, { items, subtotal, taxes: appliedTaxes, totalTaxAmount, total });
    }
    return getOrderById(orderId, restaurantId);
}

export async function cancelOrdersForTable(tableId: string, restaurantId: string = 'dineeasee-restaurant') {
    const ordersRef = getCollections(restaurantId).orders;
    const q = query(ordersRef, where('tableId', '==', tableId), where('status', 'in', ['received', 'preparing', 'ready']));
    const snapshot = await getDocs(q);
    const batch = writeBatch(getFirestoreInstance());
    snapshot.docs.forEach(d => {
        batch.update(d.ref, { status: 'cancelled' });
    });
    await batch.commit();
}

export async function deleteOrder(orderId: string, orderType: 'Dine-in' | 'Remote', restaurantId: string = 'dineeasee-restaurant') {
    const collectionName = orderType === 'Dine-in' ? 'orders' : 'remoteOrders';
    const docRef = doc(getFirestoreInstance(), `restaurants/${restaurantId}/${collectionName}`, orderId);
    await deleteDoc(docRef);
}

// Remote Orders
export async function getRemoteOrders(branchId?: string, restaurantId: string = 'dineeasee-restaurant'): Promise<RemoteOrder[]> {
    const remoteOrdersRef = getCollections(restaurantId).remoteOrders;
    const q = branchId ? query(remoteOrdersRef, where('branchId', '==', branchId)) : query(remoteOrdersRef);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => docToObj<RemoteOrder>(d)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getRemoteOrderById(id: string, restaurantId: string = 'dineeasee-restaurant'): Promise<RemoteOrder | undefined> {
    if (!id) return undefined;
    const docRef = doc(getFirestoreInstance(), `restaurants/${restaurantId}/remoteOrders`, id);
    const docSnap = await getDoc(docRef);
    return docToObj<RemoteOrder>(docSnap);
}

export async function addRemoteOrder(orderData: Omit<RemoteOrder, 'id' | 'createdAt' | 'paymentMethod' | 'items' | 'taxes' | 'totalTaxAmount' | 'total' | 'subtotal'> & { items: Omit<OrderItem, 'orderItemId' | 'category' | 'isReady' | 'status' | 'selectedAddons' | 'notes'>[], takeAwayTime?: string }, restaurantId: string = 'dineeasee-restaurant'): Promise<RemoteOrder> {
    const firestore = getFirestoreInstance();
    const { invoiceNumber } = await generateInvoiceNumberForType(orderData.orderType, orderData.branchId, restaurantId);
    const settings = await getSettings(orderData.branchId, restaurantId);
    const batch = writeBatch(firestore);
    const subtotal = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const appliedTaxes: AppliedTax[] = (settings.taxes || []).map(tax => ({ name: tax.name, rate: tax.rate, amount: subtotal * (tax.rate / 100) }));
    const totalTaxAmount = appliedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
    const total = subtotal + totalTaxAmount;
    const remoteOrdersRef = getCollections(restaurantId).remoteOrders;
    const newRemoteOrderRef = doc(remoteOrdersRef);
    const remoteOrderPayload: any = { ...orderData, invoiceNumber, subtotal, taxes: appliedTaxes, totalTaxAmount, total, createdAt: serverTimestamp() };
    if (orderData.takeAwayTime) {
        remoteOrderPayload.takeAwayTime = orderData.takeAwayTime;
    }
    batch.set(newRemoteOrderRef, remoteOrderPayload);
    const ordersRef = getCollections(restaurantId).orders;
    const newOrderRef = doc(ordersRef);
    const orderPayload: Partial<Order> = {
        invoiceNumber,
        status: 'received',
        tableId: 'tbl-remote',
        customerName: orderData.customerDetails.name,
        customerPhone: orderData.customerDetails.phone,
        branchId: orderData.branchId,
        createdByName: orderData.createdByName,
        items: orderData.items.map((item, index) => ({ ...item, orderItemId: `${newOrderRef.id}-item-${index}`, category: '', isReady: false, status: 'active' })),
        subtotal,
        taxes: appliedTaxes,
        totalTaxAmount,
        total,
        orderType: orderData.orderType,
        createdAt: new Date().toISOString(),
    };
    if (orderData.takeAwayTime) {
        orderPayload.takeAwayTime = orderData.takeAwayTime;
    }
    batch.set(newOrderRef, { ...orderPayload, createdAt: serverTimestamp() });
    await batch.commit();
    return { ...remoteOrderPayload, id: newRemoteOrderRef.id, createdAt: new Date().toISOString() } as RemoteOrder;
}

// Kitchen Users
export async function getKitchenUsers(restaurantId: string = 'dineeasee-restaurant'): Promise<KitchenUser[]> {
    const kitchenUsersRef = getCollections(restaurantId).kitchenUsers;
    const snapshot = await getDocs(kitchenUsersRef);
    return snapshot.docs.map(d => docToObj<KitchenUser>(d));
}

export async function getKitchenUserById(userId: string, restaurantId: string = 'dineeasee-restaurant'): Promise<KitchenUser | undefined> {
    if (!userId) return undefined;
    const docRef = doc(getFirestoreInstance(), `restaurants/${restaurantId}/kitchenUsers`, userId);
    const docSnap = await getDoc(docRef);
    return docToObj<KitchenUser>(docSnap);
}

export async function getKitchenUserByUsername(username: string, restaurantId: string = 'dineeasee-restaurant'): Promise<KitchenUser | undefined> {
    const kitchenUsersRef = getCollections(restaurantId).kitchenUsers;
    const q = query(kitchenUsersRef, where('username', '==', username));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return undefined;
    return docToObj<KitchenUser>(snapshot.docs[0]);
}

export async function getKitchenUserByEmail(email: string, restaurantId: string = 'dineeasee-restaurant'): Promise<KitchenUser | undefined> {
    const kitchenUsersRef = getCollections(restaurantId).kitchenUsers;
    const q = query(kitchenUsersRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return undefined;
    return docToObj<KitchenUser>(snapshot.docs[0]);
}

export async function createKitchenUserInFirestore(userData: Omit<KitchenUser, 'id'>, restaurantId: string = 'dineeasee-restaurant'): Promise<KitchenUser> {
    const kitchenUsersRef = getCollections(restaurantId).kitchenUsers;
    const newUserPayload = { ...userData };
    const docRef = await addDoc(kitchenUsersRef, newUserPayload);
    return { ...newUserPayload, id: docRef.id };
}

export async function updateKitchenUser(userId: string, updateData: Partial<KitchenUser>, restaurantId: string = 'dineeasee-restaurant'): Promise<KitchenUser | undefined> {
    const userRef = doc(getFirestoreInstance(), `restaurants/${restaurantId}/kitchenUsers`, userId);
    await updateDoc(userRef, updateData);
    return getKitchenUserById(userId, restaurantId);
}

export async function deleteKitchenUser(userId: string, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const userRef = doc(getFirestoreInstance(), `restaurants/${restaurantId}/kitchenUsers`, userId);
    await deleteDoc(userRef);
}

export async function updateOrderDetails(orderId: string, orderType: Order['orderType'] | RemoteOrder['orderType'], updateData: { customerName: string; customerPhone: string; }, restaurantId: string = 'dineeasee-restaurant') {
    const collectionName = orderType === 'Dine-in' ? 'orders' : 'remoteOrders';
    const docRef = doc(getFirestoreInstance(), `restaurants/${restaurantId}/${collectionName}`, orderId);
    const payload = orderType === 'Dine-in'
        ? { customerName: updateData.customerName, customerPhone: updateData.customerPhone }
        : { 'customerDetails.name': updateData.customerName, 'customerDetails.phone': updateData.customerPhone };
    await updateDoc(docRef, payload);
}

// --- Meal Sessions ---
export async function getCurrentSession(branchId: string, restaurantId: string = 'dineeasee-restaurant'): Promise<MealSession | null> {
    const settings = await getSettings(branchId, restaurantId);
    if (!settings.mealSessions || settings.mealSessions.length === 0) return null;
    if (settings.manualSessionOverride?.enabled && settings.manualSessionOverride.sessionId) {
        return settings.mealSessions.find(s => s.id === settings.manualSessionOverride!.sessionId) || null;
    }
    const { toZonedTime } = await import('date-fns-tz');
    const zonedNow = toZonedTime(new Date(), settings.timezone || 'UTC');
    const currentMinutes = zonedNow.getHours() * 60 + zonedNow.getMinutes();
    return settings.mealSessions.find(session => {
        if (!session.isActive) return false;
        const [startHour, startMin] = session.startTime.split(':').map(Number);
        const [endHour, endMin] = session.endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        return endMinutes < startMinutes
            ? currentMinutes >= startMinutes || currentMinutes < endMinutes
            : currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }) || null;
}

export async function addMealSession(branchId: string, sessionData: Omit<MealSession, 'id'>, restaurantId: string = 'dineeasee-restaurant'): Promise<MealSession> {
    const settings = await getSettings(branchId, restaurantId);
    const currentSessions = settings.mealSessions || [];
    const newSession: MealSession = { ...sessionData, id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
    const updatedSessions = [...currentSessions, newSession];
    await updateSettings(branchId, { mealSessions: updatedSessions }, restaurantId);
    return newSession;
}

export async function updateMealSession(branchId: string, sessionId: string, updates: Partial<Omit<MealSession, 'id'>>, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const settings = await getSettings(branchId, restaurantId);
    const updatedSessions = (settings.mealSessions || []).map(session => session.id === sessionId ? { ...session, ...updates } : session);
    await updateSettings(branchId, { mealSessions: updatedSessions }, restaurantId);
}

export async function deleteMealSession(branchId: string, sessionId: string, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const settings = await getSettings(branchId, restaurantId);
    const updatedSessions = (settings.mealSessions || []).filter(session => session.id !== sessionId);
    await updateSettings(branchId, { mealSessions: updatedSessions }, restaurantId);
}

// --- Menu Categories ---
export async function getMenuCategories(branchId: string, restaurantId: string = 'dineeasee-restaurant'): Promise<string[]> {
    const settings = await getSettings(branchId, restaurantId);
    return settings.menuCategories || [];
}

export async function addMenuCategory(branchId: string, categoryName: string, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const settings = await getSettings(branchId, restaurantId);
    const currentCategories = settings.menuCategories || [];
    if (currentCategories.map(c => c.toLowerCase()).includes(categoryName.toLowerCase())) {
        throw new Error('Category already exists');
    }
    const updatedCategories = [...currentCategories, categoryName];
    await updateSettings(branchId, { menuCategories: updatedCategories }, restaurantId);
    delete settingsCache[`${restaurantId}-${branchId}`];
}

export async function removeMenuCategory(branchId: string, categoryName: string, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const settings = await getSettings(branchId, restaurantId);
    const menuItems = await getMenuItems(branchId, restaurantId);

    const itemsWithCategory = menuItems.filter(item => item.category.trim().toLowerCase() === categoryName.trim().toLowerCase());
    if (itemsWithCategory.length > 0) {
        throw new Error(`Cannot delete category "${categoryName}". ${itemsWithCategory.length} menu item(s) are using it.`);
    }

    const currentCategories = settings.menuCategories || [];
    const updatedCategories = currentCategories.filter(cat => cat.trim().toLowerCase() !== categoryName.trim().toLowerCase());

    await updateSettings(branchId, { menuCategories: updatedCategories }, restaurantId);
    delete settingsCache[`${restaurantId}-${branchId}`];
}

// --- Activity Log ---
export async function logActivity(userId: string, username: string, action: string, details: string, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const activityLogsRef = getCollections(restaurantId).activityLogs;
    await addDoc(activityLogsRef, { userId, username, action, details, timestamp: serverTimestamp() });
}

export async function getActivityLogs(limitCount: number = 20, restaurantId: string = 'dineeasee-restaurant'): Promise<ActivityLog[]> {
    const activityLogsRef = getCollections(restaurantId).activityLogs;
    const q = query(activityLogsRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => docToObj<ActivityLog>(d));
}

export async function getActivityLogsByUser(userId: string, restaurantId: string = 'dineeasee-restaurant'): Promise<ActivityLog[]> {
    const activityLogsRef = getCollections(restaurantId).activityLogs;
    const q = query(activityLogsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => docToObj<ActivityLog>(d)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Ensure initial data is seeded on startup
seedInitialData('dineeasee-restaurant').catch(console.error);



