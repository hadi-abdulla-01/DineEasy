

'use server';

import { getAdminApp, getAdminAuth } from '@/firebase/admin';
import { getFirestore as getAdminFirestore, FieldValue, query as adminQuery, where as adminWhere, limit as adminLimit } from 'firebase-admin/firestore';
import type { AppUser, Order, RemoteOrder, RestaurantSettings } from './definitions';
import { createAuthUser } from '@/lib/auth';
import { generateUserEmail } from '@/lib/auth-utils';
import { unstable_noStore as noStore, revalidatePath } from 'next/cache';

/**
 * Get an instance of the Admin Firestore SDK.
 */
async function getAdminFirestoreInstance() {
    const app = getAdminApp();
    return getAdminFirestore(app);
}

// --- Global Stats from data.ts ---

export async function getGlobalStats() {
    noStore();
    try {
        const firestore = await getAdminFirestoreInstance();
        // Temporarily disable the collectionGroup query to avoid index errors on setup
        // In a production environment with the correct index, this would be re-enabled.
        // const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        // const newOrdersRef = firestore.collectionGroup('orders').where('createdAt', '>=', twentyFourHoursAgo);
        // const newOrdersSnapshot = await newOrdersRef.get();
        // return { newOrdersCount: newOrdersSnapshot.size };
        return { newOrdersCount: 0 };

    } catch (e: any) {
        console.error("Error fetching global stats:", e);
        // We throw a more informative error that includes the original message
        throw new Error(`Could not fetch global stats. Original error: ${e.message}. This might be due to a missing Firestore index for collection group queries.`);
    }
}


export async function getGlobalUserCount() {
    noStore();
    try {
        const firestore = await getAdminFirestoreInstance();
        const usersRef = firestore.collectionGroup('kitchenUsers');
        const snapshot = await usersRef.get();
        return snapshot.size;
    } catch(e: any) {
        console.error("Error fetching global user count:", e);
        throw new Error(`Could not fetch global user count. Original error: ${e.message}. This might be due to a missing Firestore index for collection group queries.`);
    }
}

export async function getRestaurantLeaderboard(limit = 5): Promise<{id: string, name: string, totalSales: number, orderCount: number}[]> {
    noStore();
    try {
        const firestore = await getAdminFirestoreInstance();
        const restaurants = await getAllRestaurants();
        const leaderboard: {id: string, name: string, totalSales: number, orderCount: number}[] = [];

        for (const restaurant of restaurants) {
            const ordersRef = firestore.collection(`restaurants/${restaurant.id}/orders`);
            const remoteOrdersRef = firestore.collection(`restaurants/${restaurant.id}/remoteOrders`);

            const [ordersSnapshot, remoteOrdersSnapshot] = await Promise.all([
                ordersRef.where('status', '==', 'completed').get(),
                remoteOrdersRef.get(),
            ]);

            const allCompletedOrders: (Order | RemoteOrder)[] = [];
            
            ordersSnapshot.forEach(doc => {
                const data = doc.data();
                allCompletedOrders.push({
                    ...data,
                    createdAt: (data.createdAt as FirebaseFirestore.Timestamp).toDate().toISOString()
                } as Order);
            });
            remoteOrdersSnapshot.forEach(doc => {
                const data = doc.data();
                allCompletedOrders.push({
                    ...data,
                    createdAt: (data.createdAt as FirebaseFirestore.Timestamp).toDate().toISOString()
                } as RemoteOrder);
            });
            
            const totalSales = allCompletedOrders.reduce((sum, order) => sum + (order.total || 0), 0);
            const orderCount = allCompletedOrders.length;

            leaderboard.push({
                id: restaurant.id,
                name: restaurant.name,
                totalSales,
                orderCount
            });
        }

        return leaderboard.sort((a, b) => b.totalSales - a.totalSales).slice(0, limit);
    } catch (e: any) {
        console.error("Error fetching restaurant leaderboard:", e);
        throw new Error(`Could not fetch restaurant leaderboard. Original error: ${e.message}. This might be due to a missing Firestore index for collection group queries.`);
    }
}

export async function getDefaultRestaurantSettings(): Promise<Partial<RestaurantSettings>> {
    noStore();
    try {
        const firestore = await getAdminFirestoreInstance();
        const settingsRef = firestore.doc('platform/default-settings');
        const docSnap = await settingsRef.get();
        if (docSnap.exists) {
            return docSnap.data() as Partial<RestaurantSettings>;
        }
        return {}; // Return empty object if not configured yet
    } catch (e: any) {
        console.error("Error fetching default restaurant settings:", e);
        return {};
    }
}

export async function updateDefaultRestaurantSettings(settings: Partial<RestaurantSettings>): Promise<{ success: boolean; error?: string }> {
    try {
        const firestore = await getAdminFirestoreInstance();
        const settingsRef = firestore.doc('platform/default-settings');
        await settingsRef.set(settings, { merge: true });
        return { success: true };
    } catch (e: any) {
        console.error("Error updating default restaurant settings:", e);
        return { success: false, error: e.message || 'Failed to update default settings.' };
    }
}

// --- Restaurant Management from restaurant-management.ts ---

export async function createRestaurant(
    restaurantId: string,
    restaurantName: string,
    adminUser: Omit<AppUser, 'id' | 'email' | 'firebaseUid'> & { password: string }
): Promise<{ success: boolean; restaurantId: string; error?: string }> {
    try {
        const firestore = await getAdminFirestoreInstance();
        const restaurantRef = firestore.doc(`restaurants/${restaurantId}`);

        const existingRestaurant = await restaurantRef.get();
        if (existingRestaurant.exists) {
            return { success: false, restaurantId: '', error: `Restaurant ID "${restaurantId}" already exists.` };
        }
        
        // 1. Create Firebase Auth user
        const adminEmail = generateUserEmail('admin', restaurantId, true);
        const adminAuth = getAdminAuth();
        if (!adminAuth) {
            throw new Error("Firebase Admin Auth SDK is not initialized.");
        }
        let authUserRecord;
        try {
            authUserRecord = await adminAuth.createUser({
                email: adminEmail,
                password: adminUser.password,
                displayName: adminUser.username,
            });
        } catch (authError: any) {
            if (authError.code === 'auth/email-already-exists') {
                return { success: false, restaurantId: '', error: `An authentication account for ${adminEmail} already exists. Please choose a different Restaurant ID.` };
            }
            throw authError;
        }

        // 2. Create Restaurant Doc
        const defaultSettings = await getDefaultRestaurantSettings();
        
        const restaurantData: Partial<RestaurantSettings> & { name: string; createdAt: FieldValue; isActive: boolean } = {
            ...defaultSettings,
            name: restaurantName,
            restaurantName: restaurantName,
            createdAt: FieldValue.serverTimestamp(),
            isActive: true,
        };

        restaurantData.invoiceSettings = {
            ...(defaultSettings.invoiceSettings || {}),
            useUnifiedNumbering: true,
            unified: { prefix: 'INV-', nextNumber: 1 },
            dineIn: { prefix: 'DI-', nextNumber: 1 },
            online: { prefix: 'ON-', nextNumber: 1 },
            takeAway: { prefix: 'TA-', nextNumber: 1 },
        };

        await restaurantRef.set(restaurantData);

        // 3. Create Main Branch
        const mainBranchRef = firestore.collection(`restaurants/${restaurantId}/branches`).doc();
        await mainBranchRef.set({
            name: 'Main Branch',
            isMain: true,
            createdAt: FieldValue.serverTimestamp(),
            restaurantName: restaurantName,
            restaurantAddress: defaultSettings.restaurantAddress || '',
            currencySymbol: defaultSettings.currencySymbol || '$',
            currencyDecimalPlaces: defaultSettings.currencyDecimalPlaces ?? 2,
            menuCategories: defaultSettings.menuCategories || ['Meals', 'Snacks', 'Beverages', 'Desserts'],
            taxes: defaultSettings.taxes || [],
        });

        // 4. Create Firestore User Doc (omitting password)
        const { password, ...adminUserDataForFirestore } = adminUser;
        const adminUserRef = firestore.collection(`restaurants/${restaurantId}/kitchenUsers`).doc();
        await adminUserRef.set({
            ...adminUserDataForFirestore,
            email: adminEmail,
            firebaseUid: authUserRecord.uid,
            branchId: mainBranchRef.id,
            createdAt: FieldValue.serverTimestamp(),
        });

        return {
            success: true,
            restaurantId: restaurantId
        };
    } catch (error: any) {
        console.error('Error creating restaurant:', error);
        return {
            success: false,
            restaurantId: '',
            error: error.message || 'Failed to create restaurant'
        };
    }
}


export async function getAllRestaurants(): Promise<Array<{
    id: string;
    name: string;
    createdAt: string;
    isActive: boolean;
}>> {
    noStore();
    try {
        const firestore = await getAdminFirestoreInstance();
        const restaurantsRef = firestore.collection('restaurants');
        const snapshot = await restaurantsRef.get();

        return snapshot.docs.map(doc => {
            const data = doc.data();
            const createdAtDate = (data.createdAt as FirebaseFirestore.Timestamp)?.toDate() || new Date();
            return {
                id: doc.id,
                name: data.name || 'Unnamed Restaurant',
                createdAt: createdAtDate.toISOString(),
                isActive: data.isActive ?? true,
            };
        });
    } catch (error: any) {
        console.error('Error getting restaurants:', error);
        throw new Error(`Could not get all restaurants. Original error: ${error.message}`);
    }
}


export async function getRestaurantById(restaurantId: string): Promise<{ id: string; name: string, isActive: boolean; } | null> {
    noStore();
    try {
        const firestore = await getAdminFirestoreInstance();
        const restaurantRef = firestore.doc(`restaurants/${restaurantId}`);
        const docSnap = await restaurantRef.get();

        if (docSnap.exists) {
            const data = docSnap.data();
            if (data) {
                return {
                    id: docSnap.id,
                    name: data.name || 'Unnamed Restaurant',
                    isActive: data.isActive ?? true,
                };
            }
        }
        return null;
    } catch (error: any) {
        console.error('Error getting restaurant by ID:', error);
        throw error;
    }
}


export async function deleteRestaurant(restaurantId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const firestore = await getAdminFirestoreInstance();

        try {
            const { getAdminAuth } = await import('@/firebase/admin');
            const adminAuth = getAdminAuth();
            if (adminAuth) {
                const usersRef = firestore.collection(`restaurants/${restaurantId}/kitchenUsers`);
                const usersSnapshot = await usersRef.get();

                const authDeletePromises = usersSnapshot.docs.map(async (doc) => {
                    const userData = doc.data();
                    if (userData.firebaseUid) {
                        try {
                            await adminAuth.deleteUser(userData.firebaseUid);
                            console.log(`Deleted Auth User for restaurant ${restaurantId}: ${userData.firebaseUid}`);
                        } catch (e) {
                            console.warn(`Failed to delete auth user ${userData.firebaseUid}:`, e);
                        }
                    }
                });
                await Promise.all(authDeletePromises);
            }
        } catch (authError) {
            console.error('Error dealing with Firebase Auth deletion:', authError);
        }

        const subcollections = ['branches', 'kitchenUsers', 'menuItems', 'orders', 'remoteOrders', 'tables', 'activityLogs', 'discounts', 'fcmTokens', 'otpRequests'];
        for (const subcollection of subcollections) {
            const subcollectionRef = firestore.collection(`restaurants/${restaurantId}/${subcollection}`);
            const snapshot = await subcollectionRef.get();
            if (!snapshot.empty) {
                const batch = firestore.batch();
                snapshot.docs.forEach(d => batch.delete(d.ref));
                await batch.commit();
            }
        }

        const restaurantRef = firestore.doc(`restaurants/${restaurantId}`);
        await restaurantRef.delete();

        revalidatePath('/admin/superadmin');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting restaurant:', error);
        return {
            success: false,
            error: error.message || 'Failed to delete restaurant'
        };
    }
}

export async function updateRestaurantStatus(restaurantId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    try {
        const firestore = await getAdminFirestoreInstance();
        const restaurantRef = firestore.doc(`restaurants/${restaurantId}`);
        await restaurantRef.update({ isActive });
        revalidatePath('/admin/superadmin');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating restaurant status:', error);
        return { success: false, error: error.message || 'Failed to update status' };
    }
}

export async function updateRestaurantName(restaurantId: string, newName: string): Promise<{ success: boolean; error?: string }> {
    if (!newName.trim()) {
        return { success: false, error: "Restaurant name cannot be empty." };
    }
    try {
        const firestore = await getAdminFirestoreInstance();
        const restaurantRef = firestore.doc(`restaurants/${restaurantId}`);
        await restaurantRef.update({ name: newName, restaurantName: newName });
        revalidatePath('/admin/superadmin');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating restaurant name:', error);
        return { success: false, error: error.message || 'Failed to update name' };
    }
}

export async function getAdminForRestaurant(restaurantId: string): Promise<AppUser | null> {
    noStore();
    try {
        const firestore = await getAdminFirestoreInstance();
        const usersRef = firestore.collection(`restaurants/${restaurantId}/kitchenUsers`);
        const q = adminQuery(usersRef, adminWhere('role', '==', 'Admin'), adminLimit(1));
        const snapshot = await q.get();

        if (snapshot.empty) {
            return null;
        }

        const adminDoc = snapshot.docs[0];
        const data = adminDoc.data();
        
        return {
            id: adminDoc.id,
            username: data.username,
            email: data.email,
            password: data.password,
            role: data.role,
            categories: data.categories,
            branchId: data.branchId,
        } as AppUser;
    } catch (e: any) {
        console.error("Error fetching admin for restaurant:", e);
        return null;
    }
}


