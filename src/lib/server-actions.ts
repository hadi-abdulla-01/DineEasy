
'use server';

import { getAdminApp } from '@/firebase/admin';
import { getFirestore as getAdminFirestore, FieldValue } from 'firebase-admin/firestore';
import type { AppUser, Order, RemoteOrder } from './definitions';
import { createAuthUser } from '@/lib/auth';
import { generateUserEmail } from '@/lib/auth-utils';
import { unstable_noStore as noStore } from 'next/cache';

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
        
        const ordersRef = firestore.collectionGroup('orders');
        const remoteOrdersRef = firestore.collectionGroup('remoteOrders');
        
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        
        const newOrdersQuery = ordersRef.where('createdAt', '>=', twentyFourHoursAgo);
        const newRemoteOrdersQuery = remoteOrdersRef.where('createdAt', '>=', twentyFourHoursAgo);

        const [
            newOrdersSnap,
            newRemoteOrdersSnap
        ] = await Promise.all([
            newOrdersQuery.get(),
            newRemoteOrdersQuery.get()
        ]);

        const newOrdersCount = newOrdersSnap.size + newRemoteOrdersSnap.size;
        
        return { totalSales: 0, totalOrders: 0, newOrdersCount };
    } catch(e: any) {
        console.error("Error fetching global stats:", e.message);
        // This is a super admin function. If it fails, it's likely a config issue.
        // We'll throw so it's visible, rather than returning bad data.
        throw new Error("Could not fetch global stats. Ensure Firebase Admin SDK is configured correctly.");
    }
}


export async function getGlobalUserCount() {
    noStore();
    const firestore = await getAdminFirestoreInstance();
    const usersRef = firestore.collectionGroup('kitchenUsers');
    const snapshot = await usersRef.get();
    return snapshot.size;
}

export async function getRestaurantLeaderboard(limit = 5): Promise<{id: string, name: string, totalSales: number, orderCount: number}[]> {
    noStore();
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
}


// --- Restaurant Management from restaurant-management.ts ---

export async function createRestaurant(
    restaurantId: string,
    restaurantName: string,
    adminUser: Omit<AppUser, 'id'>
): Promise<{ success: boolean; restaurantId: string; error?: string }> {
    try {
        const firestore = await getAdminFirestoreInstance();
        const restaurantRef = firestore.doc(`restaurants/${restaurantId}`);
        
        const restaurantData = {
            name: restaurantName,
            createdAt: FieldValue.serverTimestamp(),
            isActive: true,
            restaurantName: restaurantName,
            restaurantAddress: '',
            currencySymbol: '$',
            currencyDecimalPlaces: 2,
            taxes: [],
            menuCategories: [],
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
        await restaurantRef.set(restaurantData);

        const mainBranchRef = firestore.collection(`restaurants/${restaurantId}/branches`).doc();
        await mainBranchRef.set({
            name: 'Main Branch',
            isMain: true,
            createdAt: FieldValue.serverTimestamp(),
            restaurantName: restaurantName,
            restaurantAddress: '',
            currencySymbol: '$',
            currencyDecimalPlaces: 2,
            menuCategories: ['Meals', 'Snacks', 'Beverages', 'Desserts'],
            taxes: [],
        });

        const adminUserRef = firestore.collection(`restaurants/${restaurantId}/kitchenUsers`).doc();
        await adminUserRef.set({
            ...adminUser,
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
        throw error;
    }
}


export async function getRestaurantById(restaurantId: string): Promise<{ id: string; name: string } | null> {
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

        return { success: true };
    } catch (error: any) {
        console.error('Error deleting restaurant:', error);
        return {
            success: false,
            error: error.message || 'Failed to delete restaurant'
        };
    }
}
