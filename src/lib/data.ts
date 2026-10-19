

'use server';
import type { Table, MenuItem, Order, RemoteOrder, OrderStatus, AppUser, OrderItem, RestaurantSettings, UserRole, AddonGroup, SelectedAddon, InvoiceSettings, NavMenuKey, UserPermissions, AppliedTax, Tax, PrintSettings, Branch, MealSession, ActivityLog, CustomerDetails, RemoteOrder, DayOfWeek, Discount, DiscountApplicability, OTPRequest, Payment } from './definitions';
import { initializeFirebase } from '@/firebase/server';
import { getAdminMessaging } from '@/firebase/admin';
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
    getDocFromServer,
} from 'firebase/firestore';
import { unstable_noStore as noStore } from 'next/cache';
import { getSubscriptionPlanById, getAdminForRestaurant } from './server-actions';

export async function getFirestoreInstance() {
    return initializeFirebase().firestore;
}

const getCollections = async (restaurantId: string) => {
    const firestore = await getFirestoreInstance();
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
    const adminUser = await getUserByUsername('admin', restaurantId);
    if (!adminUser) {
        console.log("No admin user found. Seeding initial admin user.");
        const mainBranch = await getMainBranch(restaurantId);
        if (mainBranch) {
            await createUserInFirestore({
                username: 'admin',
                password: 'admin123', // In a real app, this should be securely hashed
                categories: ['All'],
                role: 'Admin',
                branchId: mainBranch.id, // Assign Admin to Main Branch by default
                permissions: {
                    dashboard: { view: true },
                    pos: { view: true },
                    tableOrder: { view: true },
                    tables: { view: true, create: true, edit: true, delete: true },
                    menu: { view: true, create: true, edit: true, delete: true },
                    kitchen: { view: true },
                    sales: { view: true },
                    salesHistory: { view: true, edit: true, delete: true },
                    menuPerformance: { view: true },
                    employeePerformance: { view: true },
                    peakHours: { view: true },
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
        const mainBranch = await getOrCreateMainBranch(restaurantId);
        const menuItems = await getMenuItems(mainBranch?.id, restaurantId);
        let tables = await getTables(mainBranch?.id, restaurantId);

        if (tables.length === 0) {
            console.log("No tables found for main branch. Seeding a sample table.");
            await createTable("1", mainBranch.id, restaurantId);
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
    const firestore = await getFirestoreInstance();

    // 1. Fetch global settings from the restaurant document
    const globalSettingsRef = doc(firestore, 'restaurants', restaurantId);
    const globalSettingsSnap = await getDoc(globalSettingsRef);
    const globalSettings = docToObj<any>(globalSettingsSnap) || {};

    // 2. Define hardcoded default settings as a fallback
    const defaultSettings: RestaurantSettings = {
        restaurantName: 'DineEZee',
        restaurantAddress: '123 Foodie Lane, Gourmet City',
        currencySymbol: '$',
        taxes: [],
        currencyDecimalPlaces: 2,
        taxName: '',
        taxNumber: '',
        qrCodeColor: '#000000',
        qrCodeBackgroundColor: '#FFFFFF',
        onlineOrderPlatforms: [],
        menuCategories: [],
        onlineOrderingEnabled: true,
        deliveryFee: 0,
        minimumOrderValue: 0,
        endOfDayTime: '00:00',
        invoiceSettings: {
            useUnifiedNumbering: true,
            unified: { prefix: 'INV-', nextNumber: 1 },
            dineIn: { prefix: 'DI-', nextNumber: 1 },
            online: { prefix: 'ON-', nextNumber: 1 },
            takeAway: { prefix: 'TA-', nextNumber: 1 },
        },
        printSettings: {
            invoicePrintSize: 'a4',
            invoiceCustomWidth: 80,
            kitchenTicketPrintSize: 'thermal80mm',
            kitchenTicketCustomWidth: 80,
            salesReportPrintSize: 'a4',
            salesReportCustomWidth: 210,
            invoiceHeaderText: '',
            invoiceFooterText: '',
            invoiceTitle: 'Invoice',
            showRestaurantAddress: true,
            showCustomerDetails: true,
            itemHeaderFontSize: 10,
            itemBodyFontSize: 9,
        },
        posSettings: {
            cashDenominations: [10, 20, 50, 100],
            enableOnScreenKeyboard: false,
            enableDineInOTP: false,
        },
        kdsSettings: {
            enableSoundAlerts: true,
            orderTypeColors: {
                dineIn: '#FBBF24',
                takeAway: '#3B82F6',
                online: '#10B981',
            },
        },
        mealSessions: [],
        multiFloorEnabled: false,
        floors: [],
        defaultFloor: '',
        discounts: [],
    };
    
    // 3. Create base settings by layering global settings over defaults
    const baseSettings: RestaurantSettings = {
        ...defaultSettings,
        ...globalSettings,
        // Deep merge nested objects to prevent them from being completely overwritten
        invoiceSettings: { ...defaultSettings.invoiceSettings, ...(globalSettings.invoiceSettings || {}) },
        printSettings: { ...defaultSettings.printSettings, ...(globalSettings.printSettings || {}) },
        posSettings: { ...defaultSettings.posSettings, ...(globalSettings.posSettings || {}) },
        kdsSettings: {
            ...defaultSettings.kdsSettings,
            ...(globalSettings.kdsSettings || {}),
            orderTypeColors: {
                ...defaultSettings.kdsSettings!.orderTypeColors,
                ...(globalSettings.kdsSettings?.orderTypeColors || {}),
            },
        },
        manualSessionOverride: globalSettings.manualSessionOverride ?? defaultSettings.manualSessionOverride,
    };

    // If no specific branch is requested, return the merged global/default settings
    if (!branchId) {
        return baseSettings;
    }

    // 4. Fetch branch-specific settings
    const branchRef = doc(firestore, `restaurants/${restaurantId}/branches`, branchId);
    const branchSnap = await getDoc(branchRef);

    if (!branchSnap.exists()) {
        return baseSettings; // Return base settings if the specific branch doesn't exist
    }

    const branchData = docToObj<Branch>(branchSnap);

    // 5. Merge branch settings over the base settings for the final configuration
    const mergedSettings: RestaurantSettings = {
        ...baseSettings,
        ...branchData,
        // Deep merge nested objects again, with branch settings having the highest priority
        invoiceSettings: { ...baseSettings.invoiceSettings, ...(branchData.invoiceSettings || {}) },
        printSettings: { ...baseSettings.printSettings, ...(branchData.printSettings || {}) },
        posSettings: { ...baseSettings.posSettings, ...(branchData.posSettings || {}) },
        kdsSettings: {
            ...baseSettings.kdsSettings,
            ...(branchData.kdsSettings || {}),
            orderTypeColors: {
                ...baseSettings.kdsSettings!.orderTypeColors,
                ...(branchData.kdsSettings?.orderTypeColors || {}),
            },
        },
        manualSessionOverride: branchData.manualSessionOverride ?? baseSettings.manualSessionOverride,
        mealSessions: branchData.mealSessions || baseSettings.mealSessions,
        menuCategories: branchData.menuCategories || baseSettings.menuCategories,
        discounts: branchData.discounts || baseSettings.discounts,
    };

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
    const firestore = await getFirestoreInstance();

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
    const firestore = await getFirestoreInstance();
    const branchRef = doc(firestore, `restaurants/${restaurantId}/branches`, branchId);
    let invoiceNumber = '';

    try {
        await runTransaction(firestore, async (transaction) => {
            const branchDoc = await transaction.get(branchRef);
            if (!branchDoc.exists()) {
                throw new Error(`Branch document with ID "${branchId}" does not exist in restaurant "${restaurantId}"!`);
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
    } catch (error) {
        console.error("Error generating invoice number in transaction:", error);
        // Fallback to a simple timestamp-based number if transaction fails
        invoiceNumber = `ERR-${Date.now()}`;
    }


    return { invoiceNumber };
};


// --- Branches ---
export async function getBranches(restaurantId: string = 'dineeasee-restaurant'): Promise<Branch[]> {
    const collections = await getCollections(restaurantId);
    const branchesRef = collections.branches;
    const q = query(branchesRef, orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => docToObj<Branch>(d));
}

async function getOrCreateMainBranch(restaurantId: string = 'dineeasee-restaurant'): Promise<Branch> {
    const firestore = await getFirestoreInstance();
    const collections = await getCollections(restaurantId);
    const branchesRef = collections.branches;
    
    // First, try to find an existing main branch
    const mainBranchQuery = query(branchesRef, where('isMain', '==', true), limit(1));
    const mainBranchSnap = await getDocs(mainBranchQuery);
    if (!mainBranchSnap.empty) {
        return docToObj<Branch>(mainBranchSnap.docs[0]);
    }
    
    // If no main branch, check if any branch exists
    const anyBranchQuery = query(branchesRef, limit(1));
    const anyBranchSnap = await getDocs(anyBranchQuery);
    if (!anyBranchSnap.empty) {
        // If a branch exists, make it the main one
        const firstBranch = docToObj<Branch>(anyBranchSnap.docs[0]);
        await updateDoc(doc(branchesRef, firstBranch.id), { isMain: true });
        return { ...firstBranch, isMain: true };
    }
    
    // If no branches exist at all, create a new "Main Branch"
    console.log(`No branches found for restaurant ${restaurantId}. Creating a new "Main Branch".`);
    return createBranch('Main Branch', true, restaurantId);
}


export async function getMainBranch(restaurantId: string = 'dineeasee-restaurant'): Promise<Branch | null> {
    const collections = await getCollections(restaurantId);
    const branchesRef = collections.branches;
    const q = query(branchesRef, where('isMain', '==', true));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    return docToObj<Branch>(snapshot.docs[0]);
}

export async function getBranchById(id: string, restaurantId: string = 'dineeasee-restaurant'): Promise<Branch | null> {
    if (!id) return null;
    const firestore = await getFirestoreInstance();
    const docRef = doc(firestore, `restaurants/${restaurantId}/branches`, id);
    const docSnap = await getDoc(docRef);
    return docToObj<Branch>(docSnap);
}

export async function createBranch(name: string, isMain: boolean = false, restaurantId: string = 'dineeasee-restaurant'): Promise<Branch> {
    const firestore = await getFirestoreInstance();
    const collections = await getCollections(restaurantId);
    const branchesRef = collections.branches;
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
    const collections = await getCollections(restaurantId);
    const branchesRef = collections.branches;
    const branchRef = doc(branchesRef, branchId);
    await deleteDoc(branchRef);
}

export async function setMainBranch(branchId: string, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const firestore = await getFirestoreInstance();
    const collections = await getCollections(restaurantId);
    const branchesRef = collections.branches;
    const batch = writeBatch(firestore);

    const mainBranchQuery = query(branchesRef, where('isMain', '==', true));
    const mainBranchesSnap = await getDocs(mainBranchQuery);
    mainBranchesSnap.forEach(doc => {
        batch.update(doc.ref, { isMain: false });
    });

    const newMainBranchRef = doc(branchesRef, branchId);
    batch.update(newMainBranchRef, { isMain: true });

    await batch.commit();
}


// Tables
export async function getTables(branchId?: string, restaurantId: string = 'dineeasee-restaurant'): Promise<Table[]> {
    const collections = await getCollections(restaurantId);
    const tablesRef = collections.tables;
    const q = branchId ? query(tablesRef, where('branchId', '==', branchId)) : query(tablesRef);
    const snapshot = await getDocs(q);
    const tables = snapshot.docs.map(d => {
        const table = docToObj<Table>(d);
        if (table) {
            table.restaurantId = restaurantId; // Add restaurantId
        }
        return table;
    }).filter((t): t is Table => t !== null); // Filter out nulls
    
    return tables.sort((a, b) => String(a.number).localeCompare(String(b.number), undefined, { numeric: true }));
}


export async function getTableById(id: string, restaurantId: string = 'dineeasee-restaurant'): Promise<Table | undefined> {
    noStore();
    try {
        if (!id) return undefined;
        const firestore = await getFirestoreInstance();
        const docRef = doc(firestore, `restaurants/${restaurantId}/tables`, id);
        const docSnap = await getDocFromServer(docRef);

        if (docSnap.exists()) {
            const table = docToObj<Table>(docSnap);
            if (table && !table.restaurantId) {
                table.restaurantId = restaurantId;
            }
            return table;
        }
        
        console.warn(`Table with ID "${id}" not found in restaurant "${restaurantId}".`);
        return undefined;

    } catch (error) {
        console.error("[getTableById] Critical error fetching table:", error);
        return undefined;
    }
}

export async function getTableByNumber(tableNumber: string, branchId: string, restaurantId: string = 'dineeasee-restaurant'): Promise<Table | null> {
    const collections = await getCollections(restaurantId);
    const tablesRef = collections.tables;
    const q = query(tablesRef, where('branchId', '==', branchId), where('number', '==', tableNumber));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    return docToObj<Table>(snapshot.docs[0]);
}

export async function createTable(tableNumber: string, branchId: string, restaurantId: string = 'dineeasee-restaurant', floor?: string): Promise<Table> {
    const collections = await getCollections(restaurantId);
    const tablesRef = collections.tables;
    const newTableData: Omit<Table, 'id'> = {
        number: tableNumber,
        status: 'available' as const,
        position: { x: 20, y: 20 },
        branchId,
        floor: floor || '',
        isDynamicQR: false,
        qrToken: '',
        pairingCode: '',
        shape: 'square',
    };
    const docRef = await addDoc(tablesRef, newTableData);
    return { ...newTableData, id: docRef.id };
}

export async function updateTable(tableId: string, updateData: Partial<Table>, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const firestore = await getFirestoreInstance();
    const tableRef = doc(firestore, `restaurants/${restaurantId}/tables`, tableId);
    await updateDoc(tableRef, updateData);
}

export async function updateTableStatus(tableId: string, status: Table['status'], restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    await updateTable(tableId, { status }, restaurantId);
}

export async function updateTablePosition(tableId: string, position: { x: number; y: number }, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    await updateTable(tableId, { position }, restaurantId);
}

export async function deleteTable(tableId: string, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const firestore = await getFirestoreInstance();
    const tableRef = doc(firestore, `restaurants/${restaurantId}/tables`, tableId);
    await deleteDoc(tableRef);
}

export async function updateDynamicQRForAllTables(branchId: string, isDynamic: boolean, restaurantId: string = 'dineeasee-restaurant', floor?: string): Promise<void> {
    const firestore = await getFirestoreInstance();
    const collections = await getCollections(restaurantId);
    const tablesRef = collections.tables;
    
    // Base query for the branch
    const q = query(tablesRef, where('branchId', '==', branchId));
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        return;
    }

    const { randomUUID } = require('crypto');
    const batch = writeBatch(firestore);

    snapshot.docs.forEach(docSnap => {
        const table = docToObj<Table>(docSnap);

        // Local filtering for the floor, as Firestore doesn't support all complex filters we might need
        let shouldUpdate = true;
        if (floor && floor !== 'all') {
            if (floor === '__none__') {
                if (table.floor && table.floor !== '') {
                    shouldUpdate = false; // This table has a floor, but we want 'No Floor'
                }
            } else {
                if (table.floor !== floor) {
                    shouldUpdate = false; // This table's floor doesn't match the filter
                }
            }
        }
        
        if (shouldUpdate) {
            const updateData: Partial<Table> = { 
                isDynamicQR: isDynamic,
                qrToken: isDynamic ? randomUUID() : ''
            };
            batch.update(doc(tablesRef, docSnap.id), updateData);
        }
    });

    await batch.commit();
}


// Menu Items
export async function getMenuItems(branchId?: string, restaurantId: string = 'dineeasee-restaurant'): Promise<MenuItem[]> {
    const collections = await getCollections(restaurantId);
    const menuItemsRef = collections.menuItems;
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
    const firestore = await getFirestoreInstance();
    const docRef = doc(firestore, `restaurants/${restaurantId}/menuItems`, id);
    const docSnap = await getDoc(docRef);
    return docToObj<MenuItem>(docSnap);
}

export async function addMenuItem(itemData: Omit<MenuItem, 'id' | 'isAvailable'>, restaurantId: string = 'dineeasee-restaurant'): Promise<MenuItem> {
    const collections = await getCollections(restaurantId);
    const menuItemsRef = collections.menuItems;
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
    const firestore = await getFirestoreInstance();
    const itemRef = doc(firestore, `restaurants/${restaurantId}/menuItems`, id);
    const updateData = { ...itemData };
    if (itemData.prepTime === undefined) {
        (updateData as any).prepTime = deleteField();
    }
    await updateDoc(itemRef, updateData);
    return getMenuItemById(id, restaurantId);
}

export async function toggleMenuItemAvailability(id: string, isAvailable: boolean, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const firestore = await getFirestoreInstance();
    const itemRef = doc(firestore, `restaurants/${restaurantId}/menuItems`, id);
    await updateDoc(itemRef, { isAvailable });
}

export async function toggleMenuItemAddon(id: string, isAddon: boolean, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const firestore = await getFirestoreInstance();
    const itemRef = doc(firestore, `restaurants/${restaurantId}/menuItems`, id);
    await updateDoc(itemRef, { isAddon });
}

export async function deleteMenuItem(id: string, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const firestore = await getFirestoreInstance();
    const itemRef = doc(firestore, `restaurants/${restaurantId}/menuItems`, id);
    await deleteDoc(itemRef);
}

// Orders
export async function getOrders(
    branchId?: string,
    restaurantId: string = 'dineeasee-restaurant',
    dateRange?: { from: Date; to: Date }
): Promise<Order[]> {
    const collections = await getCollections(restaurantId);
    const ordersRef = collections.orders;
    
    let q = branchId ? query(ordersRef, where('branchId', '==', branchId)) : query(ordersRef);
    
    const snapshot = await getDocs(q);
    let orders = snapshot.docs.map(d => docToObj<Order>(d));

    if (dateRange && dateRange.from && dateRange.to) {
        const settings = await getSettings(branchId, restaurantId);
        const endOfDayTime = settings?.endOfDayTime;
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

        if (endOfDayTime && timeRegex.test(endOfDayTime)) {
            const [hours, minutes] = endOfDayTime.split(':').map(Number);
            const offsetInMillis = (hours * 60 + minutes) * 60 * 1000;
            
            orders = orders.filter(order => {
                if (!order.createdAt) return false;
                const createdAt = new Date(order.createdAt);
                const adjustedCreatedAt = new Date(createdAt.getTime() - offsetInMillis);
                return adjustedCreatedAt >= dateRange.from && adjustedCreatedAt <= dateRange.to;
            });
        } else {
            orders = orders.filter(order => {
                if (!order.createdAt) return false;
                const createdAt = new Date(order.createdAt);
                return createdAt >= dateRange.from && createdAt <= dateRange.to;
            });
        }
    }
    
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}


export async function getOrderById(id: string, restaurantId: string = 'dineeasee-restaurant'): Promise<Order | undefined> {
    if (!id) return undefined;
    const firestore = await getFirestoreInstance();
    const docRef = doc(firestore, `restaurants/${restaurantId}/orders`, id);
    const docSnap = await getDoc(docRef);
    return docToObj<Order>(docSnap);
}

export async function getOrdersByTableId(tableId: string, restaurantId: string = 'dineeasee-restaurant'): Promise<Order[]> {
    noStore();
    const collections = await getCollections(restaurantId);
    const ordersRef = collections.orders;
    const q = query(ordersRef, where('tableId', '==', tableId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => docToObj<Order>(d));
}

export async function getActiveOrders(branchId?: string, restaurantId: string = 'dineeasee-restaurant'): Promise<Order[]> {
    const collections = await getCollections(restaurantId);
    const ordersRef = collections.orders;
    const q = query(ordersRef, where('status', 'in', ['received', 'preparing', 'ready']));
    const snapshot = await getDocs(q);
    let orders = snapshot.docs.map(d => docToObj<Order>(d));
    if (branchId) {
        orders = orders.filter(order => order.branchId === branchId);
    }
    return orders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'status' | 'items' | 'taxes' | 'totalTaxAmount' | 'total' | 'subtotal'> & { items: OrderItem[] }, restaurantId: string = 'dineeasee-restaurant'): Promise<Order> {
    const { invoiceNumber } = await generateInvoiceNumberForType(orderData.orderType, orderData.branchId, restaurantId);
    const collections = await getCollections(restaurantId);
    const ordersRef = collections.orders;
    const settings = await getSettings(orderData.branchId, restaurantId);
    const subtotal = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const appliedTaxes: AppliedTax[] = (settings.taxes || []).map(tax => ({
        ...tax,
        amount: subtotal * (tax.rate / 100)
    }));
    const totalTaxAmount = appliedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
    const discount = orderData.discount || 0;
    const total = subtotal - discount + totalTaxAmount;

    const newOrderData = { ...orderData, invoiceNumber, subtotal, taxes: appliedTaxes, totalTaxAmount, total, discount, createdAt: serverTimestamp(), status: 'received' as const };
    const docRef = await addDoc(ordersRef, newOrderData);
    return { ...newOrderData, id: docRef.id, createdAt: new Date().toISOString() } as Order;
}

export async function addItemsToOrder(orderId: string, items: OrderItem[], notes?: string, restaurantId: string = 'dineeasee-restaurant'): Promise<Order | undefined> {
    const firestore = await getFirestoreInstance();
    const orderRef = doc(firestore, `restaurants/${restaurantId}/orders`, orderId);
    const orderDoc = await getDoc(orderRef);
    const order = docToObj<Order>(orderDoc);

    if (order) {
        const updatedItems = [...order.items, ...items];
        const settings = await getSettings(order.branchId, restaurantId);
        const subtotal = updatedItems.reduce((sum, item) => item.status !== 'cancelled' ? sum + item.price * item.quantity : sum, 0);
        const appliedTaxes: AppliedTax[] = (settings.taxes || []).map(tax => ({ name: tax.name, rate: tax.rate, amount: subtotal * (tax.rate / 100) }));
        const totalTaxAmount = appliedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
        const total = subtotal + totalTaxAmount - (order.discount || 0);
        const updateData: Partial<Order> = { items: updatedItems, subtotal, taxes: appliedTaxes, totalTaxAmount, total };
        if (notes) {
            updateData.notes = order.notes ? `${order.notes}\n${notes}` : notes;
        }
        await updateDoc(orderRef, updateData);
        return getOrderById(orderId, restaurantId);
    }
    return undefined;
}

export async function updateOrder(orderId: string, data: Partial<Omit<Order, 'id'>>, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const firestore = await getFirestoreInstance();
    const orderRef = doc(firestore, `restaurants/${restaurantId}/orders`, orderId);
    await updateDoc(orderRef, data);
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, paymentMethod?: Order['paymentMethod'], restaurantId: string = 'dineeasee-restaurant', payments?: Payment[]): Promise<Order | undefined> {
    const firestore = await getFirestoreInstance();
    const orderRef = doc(firestore, `restaurants/${restaurantId}/orders`, orderId);
    const updateData: { [key: string]: any } = { status };
    
    if (status === 'completed') {
        if (paymentMethod) {
            updateData.paymentMethod = paymentMethod;
        }
        if (payments && payments.length > 0) {
            updateData.payments = payments;
        }
    }
    
    await updateDoc(orderRef, updateData);
    return getOrderById(orderId, restaurantId);
}


export async function updateOrderItemStatus(orderId: string, orderItemId: string, isReady: boolean, restaurantId: string = 'dineeasee-restaurant'): Promise<Order | undefined> {
    const firestore = await getFirestoreInstance();
    const orderRef = doc(firestore, `restaurants/${restaurantId}/orders`, orderId);
    const order = await getOrderById(orderId, restaurantId);
    if (order) {
        const items = order.items.map(item => item.orderItemId === orderItemId ? { ...item, isReady } : item);
        await updateDoc(orderRef, { items });
    }
    return getOrderById(orderId, restaurantId);
}

export async function cancelOrderItem(orderId: string, orderItemId: string, restaurantId: string = 'dineeasee-restaurant'): Promise<Order | undefined> {
    const firestore = await getFirestoreInstance();
    const orderRef = doc(firestore, `restaurants/${restaurantId}/orders`, orderId);
    const order = await getOrderById(orderId, restaurantId);
    if (order) {
        const settings = await getSettings(order.branchId, restaurantId);
        const items = order.items.map(item => item.orderItemId === orderItemId ? { ...item, status: 'cancelled' as const } : item);
        const activeItems = items.filter(i => i.status !== 'cancelled');
        const subtotal = activeItems.reduce((sum, current) => sum + (current.price * current.quantity), 0);
        const appliedTaxes: AppliedTax[] = (settings.taxes || []).map(tax => ({ name: tax.name, rate: tax.rate, amount: subtotal * (tax.rate / 100) }));
        const totalTaxAmount = appliedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
        const total = subtotal + totalTaxAmount - (order.discount || 0);
        await updateDoc(orderRef, { items, subtotal, taxes: appliedTaxes, totalTaxAmount, total });
    }
    return getOrderById(orderId, restaurantId);
}

export async function cancelOrdersForTable(tableId: string, restaurantId: string = 'dineeasee-restaurant') {
    const firestore = await getFirestoreInstance();
    const collections = await getCollections(restaurantId);
    const ordersRef = collections.orders;
    const q = query(ordersRef, where('tableId', '==', tableId));
    const snapshot = await getDocs(q);
    const batch = writeBatch(firestore);
    const activeStatuses: OrderStatus[] = ['received', 'preparing', 'ready'];

    snapshot.docs.forEach(d => {
        const order = d.data() as Order;
        if (activeStatuses.includes(order.status)) {
            batch.update(d.ref, { status: 'cancelled' });
        }
    });
    await batch.commit();
}

export async function deleteOrder(orderId: string, orderType: 'Dine-in' | 'Remote', restaurantId: string = 'dineeasee-restaurant') {
    const firestore = await getFirestoreInstance();
    const collectionName = orderType === 'Dine-in' ? 'orders' : 'remoteOrders';
    const docRef = doc(firestore, `restaurants/${restaurantId}/${collectionName}`, orderId);
    await deleteDoc(docRef);
}

export async function updateFullOrder(
    orderId: string,
    orderType: 'Dine-in' | 'Take-away' | 'Online',
    updateData: {
        items: OrderItem[],
        customerName?: string,
        customerPhone?: string,
        tableId?: string,
        paymentMethod?: 'cash' | 'card' | 'qr',
        address?: string,
        platform?: string,
        takeAwayTime?: string,
        notes?: string,
        discount?: number,
    },
    restaurantId: string = 'dineeasee-restaurant'
): Promise<Order | RemoteOrder | undefined> {
    const firestore = await getFirestoreInstance();
    const isDineIn = orderType === 'Dine-in';
    const collectionName = isDineIn ? 'orders' : 'remoteOrders';
    const orderRef = doc(firestore, `restaurants/${restaurantId}/${collectionName}`, orderId);

    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
        throw new Error("Order to update not found");
    }
    const order = docToObj<Order | RemoteOrder>(orderSnap);

    const settings = await getSettings(order.branchId, restaurantId);

    // Recalculate totals
    const subtotal = updateData.items.reduce((sum, item) => item.status !== 'cancelled' ? sum + item.price * item.quantity : sum, 0);
    const appliedTaxes: AppliedTax[] = (settings.taxes || []).map(tax => ({
        ...tax,
        amount: subtotal * (tax.rate / 100)
    }));
    const totalTaxAmount = appliedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
    const discount = updateData.discount ?? (order.discount ?? 0);
    const total = subtotal - discount + totalTaxAmount;

    const payload: { [key: string]: any } = {
        items: updateData.items,
        subtotal,
        total,
        taxes: appliedTaxes,
        totalTaxAmount,
        discount,
        updatedAt: serverTimestamp(),
    };

    if (updateData.notes) payload.notes = updateData.notes;
    if (updateData.paymentMethod) payload.paymentMethod = updateData.paymentMethod;

    if (isDineIn && 'tableId' in order) {
        if (updateData.customerName) (payload as Partial<Order>).customerName = updateData.customerName;
        if (updateData.customerPhone) (payload as Partial<Order>).customerPhone = updateData.customerPhone;
        if (updateData.tableId) (payload as Partial<Order>).tableId = updateData.tableId;
    } else if (!isDineIn && 'customerDetails' in order) {
        const remoteOrder = order as RemoteOrder;
        const customerDetails: Partial<CustomerDetails> = {};
        if (updateData.customerName) customerDetails.name = updateData.customerName;
        if (updateData.customerPhone) customerDetails.phone = updateData.customerPhone;
        if (updateData.address) customerDetails.address = updateData.address;
        if (updateData.platform) customerDetails.platform = updateData.platform;

        payload.customerDetails = {
            ...remoteOrder.customerDetails,
            ...customerDetails
        };
        if (updateData.takeAwayTime) (payload as Partial<RemoteOrder>).takeAwayTime = updateData.takeAwayTime;
    }

    await updateDoc(orderRef, payload);

    const updatedDocSnap = await getDoc(orderRef);
    return docToObj<Order | RemoteOrder>(updatedDocSnap);
}


// Remote Orders
export async function getRemoteOrders(
    branchId?: string,
    restaurantId: string = 'dineeasee-restaurant',
    dateRange?: { from: Date; to: Date }
): Promise<RemoteOrder[]> {
    const collections = await getCollections(restaurantId);
    const remoteOrdersRef = collections.remoteOrders;

    let q = branchId ? query(remoteOrdersRef, where('branchId', '==', branchId)) : query(remoteOrdersRef);
    
    const snapshot = await getDocs(q);
    let orders = snapshot.docs.map(d => docToObj<RemoteOrder>(d));

    if (dateRange && dateRange.from && dateRange.to) {
        const settings = await getSettings(branchId, restaurantId);
        const endOfDayTime = settings?.endOfDayTime;
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

        if (endOfDayTime && timeRegex.test(endOfDayTime)) {
            const [hours, minutes] = endOfDayTime.split(':').map(Number);
            const offsetInMillis = (hours * 60 + minutes) * 60 * 1000;
            
            orders = orders.filter(order => {
                if (!order.createdAt) return false;
                const createdAt = new Date(order.createdAt);
                const adjustedCreatedAt = new Date(createdAt.getTime() - offsetInMillis);
                return adjustedCreatedAt >= dateRange.from && adjustedCreatedAt <= dateRange.to;
            });
        } else {
            orders = orders.filter(order => {
                if (!order.createdAt) return false;
                const createdAt = new Date(order.createdAt);
                return createdAt >= dateRange.from && createdAt <= dateRange.to;
            });
        }
    }

    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}


export async function getRemoteOrderById(id: string, restaurantId: string = 'dineeasee-restaurant'): Promise<RemoteOrder | undefined> {
    if (!id) return undefined;
    const firestore = await getFirestoreInstance();
    const docRef = doc(firestore, `restaurants/${restaurantId}/remoteOrders`, id);
    const docSnap = await getDoc(docRef);
    return docToObj<RemoteOrder>(docSnap);
}

export async function addRemoteOrder(orderData: Omit<RemoteOrder, 'id' | 'createdAt' | 'items' | 'taxes' | 'totalTaxAmount' | 'total' | 'subtotal'> & { items: Omit<OrderItem, 'orderItemId' | 'category' | 'isReady' | 'status' | 'selectedAddons' | 'notes'>[], takeAwayTime?: string }, restaurantId: string = 'dineeasee-restaurant'): Promise<RemoteOrder> {
    const firestore = await getFirestoreInstance();
    const { invoiceNumber } = await generateInvoiceNumberForType(orderData.orderType, orderData.branchId, restaurantId);
    const settings = await getSettings(orderData.branchId, restaurantId);
    const batch = writeBatch(firestore);
    const subtotal = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const appliedTaxes: AppliedTax[] = (settings.taxes || []).map(tax => ({ name: tax.name, rate: tax.rate, amount: subtotal * (tax.rate / 100) }));
    const totalTaxAmount = appliedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
    const discount = orderData.discount || 0;
    const total = subtotal - discount + totalTaxAmount;
    const collections = await getCollections(restaurantId);
    const remoteOrdersRef = collections.remoteOrders;
    const newRemoteOrderRef = doc(remoteOrdersRef);
    const remoteOrderPayload: any = { ...orderData, invoiceNumber, subtotal, taxes: appliedTaxes, totalTaxAmount, total, discount, createdAt: serverTimestamp() };
    if (orderData.notes) {
        remoteOrderPayload.notes = orderData.notes;
    }
    if (orderData.takeAwayTime) {
        remoteOrderPayload.takeAwayTime = orderData.takeAwayTime;
    }
    batch.set(newRemoteOrderRef, remoteOrderPayload);
    const ordersRef = collections.orders;
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
        discount,
        taxes: appliedTaxes,
        totalTaxAmount,
        total,
        orderType: orderData.orderType,
        notes: orderData.notes,
        createdAt: new Date().toISOString(),
    };
    if (orderData.takeAwayTime) {
        orderPayload.takeAwayTime = orderData.takeAwayTime;
    }
    batch.set(newOrderRef, { ...orderPayload, createdAt: serverTimestamp() });
    await batch.commit();
    return { ...remoteOrderPayload, id: newRemoteOrderRef.id, createdAt: new Date().toISOString() } as RemoteOrder;
}

// --- Users ---
export async function getUsers(restaurantId: string = 'dineeasee-restaurant'): Promise<AppUser[]> {
    const collections = await getCollections(restaurantId);
    const usersRef = collections.kitchenUsers;
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(d => {
        const user = docToObj<AppUser>(d);
        if (user) {
            user.restaurantId = restaurantId;
        }
        return user;
    }).filter((u): u is AppUser => u !== null);
}

export async function getUserById(userId: string, restaurantId: string = 'dineeasee-restaurant'): Promise<AppUser | undefined> {
    if (!userId) return undefined;
    const firestore = await getFirestoreInstance();
    const docRef = doc(firestore, `restaurants/${restaurantId}/kitchenUsers`, userId);
    const docSnap = await getDoc(docRef);
    const user = docToObj<AppUser>(docSnap);
    if(user && !user.restaurantId) {
        user.restaurantId = restaurantId;
    }
    return user;
}

export async function getUserByUsername(username: string, restaurantId: string = 'dineeasee-restaurant'): Promise<AppUser | undefined> {
    const collections = await getCollections(restaurantId);
    const usersRef = collections.kitchenUsers;
    const q = query(usersRef, where('username', '==', username));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return undefined;
    const user = docToObj<AppUser>(snapshot.docs[0]);
    if(user && !user.restaurantId) {
        user.restaurantId = restaurantId;
    }
    return user;
}

export async function getUserByEmail(email: string, restaurantId: string = 'dineeasee-restaurant'): Promise<AppUser | undefined> {
    if (!restaurantId) {
        console.warn("getUserByEmail called without restaurantId");
        return undefined;
    }
    const collections = await getCollections(restaurantId);
    const usersRef = collections.kitchenUsers;
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return undefined;
    const user = docToObj<AppUser>(snapshot.docs[0]);
    if(user && !user.restaurantId) {
        user.restaurantId = restaurantId;
    }
    return user;
}

export async function createUserInFirestore(userData: Omit<AppUser, 'id'>, restaurantId: string = 'dineeasee-restaurant'): Promise<AppUser> {
    const collections = await getCollections(restaurantId);
    const usersRef = collections.kitchenUsers;
    const newUserPayload = { ...userData, restaurantId };
    const docRef = await addDoc(usersRef, newUserPayload);
    return { ...newUserPayload, id: docRef.id };
}

export async function updateUser(userId: string, updateData: Partial<AppUser>, restaurantId: string = 'dineeasee-restaurant'): Promise<AppUser | undefined> {
    const firestore = await getFirestoreInstance();
    const userRef = doc(firestore, `restaurants/${restaurantId}/kitchenUsers`, userId);
    await updateDoc(userRef, updateData);
    return getUserById(userId, restaurantId);
}

export async function deleteUser(userId: string, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const firestore = await getFirestoreInstance();
    const userRef = doc(firestore, `restaurants/${restaurantId}/kitchenUsers`, userId);
    await deleteDoc(userRef);
}

export async function updateOrderDetails(orderId: string, orderType: Order['orderType'] | RemoteOrder['orderType'], updateData: { customerName: string; customerPhone: string; }, restaurantId: string = 'dineeasee-restaurant') {
    const firestore = await getFirestoreInstance();
    const collectionName = orderType === 'Dine-in' ? 'orders' : 'remoteOrders';
    const docRef = doc(firestore, `restaurants/${restaurantId}/${collectionName}`, orderId);
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
        if (!session.isActive || !session.startTime || !session.endTime) {
            return false;
        }
        const [startHour, startMin] = session.startTime.split(':').map(Number);
        const [endHour, endMin] = session.endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        // Handle overnight sessions
        if (endMinutes < startMinutes) {
            // Session crosses midnight (e.g., 22:00 - 02:00)
            return currentMinutes >= startMinutes || currentMinutes < endMinutes;
        } else {
            // Normal session within same day
            return currentMinutes >= startMinutes && currentMinutes < endMinutes;
        }
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
export async function getDiscounts(branchId: string, restaurantId: string = 'dineeasee-restaurant'): Promise<Discount[]> {
    const settings = await getSettings(branchId, restaurantId);
    return settings.discounts || [];
}

export async function addDiscount(branchId: string, discountData: Omit<Discount, 'id'>, restaurantId: string = 'dineeasee-restaurant'): Promise<Discount> {
    const settings = await getSettings(branchId, restaurantId);
    const currentDiscounts = settings.discounts || [];
    const newDiscount: Discount = { ...discountData, id: `discount-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
    const updatedDiscounts = [...currentDiscounts, newDiscount];
    await updateSettings(branchId, { discounts: updatedDiscounts }, restaurantId);
    return newDiscount;
}

export async function updateDiscount(branchId: string, discountId: string, updates: Partial<Omit<Discount, 'id'>>, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const settings = await getSettings(branchId, restaurantId);
    const updatedDiscounts = (settings.discounts || []).map(d => d.id === discountId ? { ...d, ...updates } : d);
    await updateSettings(branchId, { discounts: updatedDiscounts }, restaurantId);
}

export async function deleteDiscount(branchId: string, discountId: string, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const settings = await getSettings(branchId, restaurantId);
    const updatedDiscounts = (settings.discounts || []).filter(d => d.id !== discountId);
    await updateSettings(branchId, { discounts: updatedDiscounts }, restaurantId);
}

// --- Activity Logs ---
export async function logActivity(userId: string, username: string, action: string, details: string, restaurantId: string = 'dineeasee-restaurant'): Promise<void> {
    const collections = await getCollections(restaurantId);
    const activityLogsRef = collections.activityLogs;
    await addDoc(activityLogsRef, {
        userId,
        username,
        action,
        details,
        timestamp: serverTimestamp()
    });
}

export async function getActivityLogs(limitCount: number = 20, restaurantId: string = 'dineeasee-restaurant'): Promise<ActivityLog[]> {
    const collections = await getCollections(restaurantId);
    const activityLogsRef = collections.activityLogs;
    const q = query(activityLogsRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => docToObj<ActivityLog>(d));
}

export async function getActivityLogsByUser(userId: string, limitCount: number = 20, restaurantId: string = 'dineeasee-restaurant'): Promise<ActivityLog[]> {
    noStore();
    const collections = await getCollections(restaurantId);
    const activityLogsRef = collections.activityLogs;
    
    // This query fails without a composite index. We'll fetch and sort in code.
    const q = query(
        activityLogsRef,
        where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(d => docToObj<ActivityLog>(d));
    
    // Sort logs by timestamp descending in code
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Apply the limit after sorting
    return logs.slice(0, limitCount);
}

// --- OTP Management ---

export async function createOtpRequest(tableId: string, restaurantId: string, customerName: string, customerPhone: string): Promise<OTPRequest | null> {
    const firestore = await getFirestoreInstance();
    const table = await getTableById(tableId, restaurantId);
    if (!table) {
        throw new Error('Table not found');
    }
    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
    const otpRequest: Omit<OTPRequest, 'id'> = {
        tableId,
        tableNumber: table.number,
        branchId: table.branchId,
        restaurantId,
        otp,
        customerName,
        customerPhone,
        createdAt: serverTimestamp(),
    };

    const otpRequestsRef = collection(firestore, `restaurants/${restaurantId}/otpRequests`);
    const docRef = await addDoc(otpRequestsRef, otpRequest);
    
    const newOtpRequest = await getDoc(docRef);
    return docToObj<OTPRequest>(newOtpRequest);
}

export async function verifyOtp(reqId: string, otp: string, restaurantId: string): Promise<boolean> {
    noStore();
    const firestore = await getFirestoreInstance();
    const otpRef = doc(firestore, `restaurants/${restaurantId}/otpRequests`, reqId);
    const docSnap = await getDoc(otpRef);

    if (!docSnap.exists()) {
        console.error(`OTP request with ID ${reqId} not found in restaurant ${restaurantId}.`);
        return false;
    }
    const request = docSnap.data() as OTPRequest;

    // Check if OTP matches and is not expired (e.g., 5 minutes)
    const now = new Date();
    const createdAt = (request.createdAt as Timestamp).toDate();
    const fiveMinutes = 5 * 60 * 1000;

    if (request.otp === otp && now.getTime() - createdAt.getTime() < fiveMinutes) {
        // Optionally, delete the OTP request after successful verification
        await deleteDoc(docSnap.ref);
        return true;
    }

    return false;
}

export async function sendOtpNotification(otpRequest: OTPRequest): Promise<void> {
    const messaging = getAdminMessaging();
    if (!messaging) {
        console.error("Admin Messaging SDK not initialized. Cannot send OTP notification.");
        return;
    }

    const firestore = await getFirestoreInstance();

    // 1. Get users in the branch with the 'receiveOtp' permission.
    const usersRef = collection(firestore, `restaurants/${otpRequest.restaurantId}/kitchenUsers`);
    const usersQuery = query(usersRef, where('branchId', '==', otpRequest.branchId));
    const usersSnapshot = await getDocs(usersQuery);
    const usersInBranch = usersSnapshot.docs.map(d => docToObj<AppUser>(d));
    const staffToNotify = usersInBranch.filter(u => u.permissions?.receiveOtp?.view);
    const staffIds = staffToNotify.map(s => s.id);

    if (staffIds.length === 0) {
        console.log(`No staff with OTP permission found in branch ${otpRequest.branchId}.`);
        return;
    }

    // 2. Get the FCM tokens for those specific users.
    const tokensRef = collection(firestore, `restaurants/${otpRequest.restaurantId}/fcmTokens`);
    // Firestore 'in' query is limited to 30 items. If there are more staff, this will fail.
    const tokensQuery = query(tokensRef, where('userId', 'in', staffIds));
    const tokensSnapshot = await getDocs(tokensQuery);

    if (tokensSnapshot.empty) {
        console.log(`No device tokens found for OTP-enabled staff in branch ${otpRequest.branchId}.`);
        return;
    }

    const targetTokens = tokensSnapshot.docs.map(doc => doc.data().token);

    const message = {
        notification: {
            title: `OTP for Table ${otpRequest.tableNumber}`,
            body: `Your OTP is ${otpRequest.otp} for ${otpRequest.customerName}`,
        },
        data: {
            otp: otpRequest.otp,
            tableNumber: otpRequest.tableNumber,
            customerName: otpRequest.customerName,
            type: 'OTP_NOTIFICATION'
        },
        tokens: targetTokens,
    };

    try {
        const response = await messaging.sendEachForMulticast(message);
        console.log(`OTP notification sent: ${response.successCount} success, ${response.failureCount} failure.`);
    } catch (error) {
        console.error('Error sending OTP notification:', error);
    }
}

    
