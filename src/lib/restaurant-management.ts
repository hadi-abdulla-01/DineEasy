

'use server';

import { getAdminApp } from '@/firebase/admin';
import { getFirestore, serverTimestamp, FieldValue } from 'firebase-admin/firestore';
import type { AppUser } from './definitions';

/**
 * Get an instance of the Admin Firestore SDK.
 */
async function getAdminFirestoreInstance() {
    const app = getAdminApp();
    return getFirestore(app);
}

/**
 * Create a new restaurant (tenant) in the multi-tenant SaaS structure
 * Each restaurant gets its own document with subcollections
 */
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
            createdAt: serverTimestamp(),
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
            createdAt: serverTimestamp(),
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
            createdAt: serverTimestamp(),
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

/**
 * Get all restaurants (for super admin)
 */
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

/**
 * Get a single restaurant by its ID
 */
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

/**
 * Delete a restaurant and all its data
 */
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
    