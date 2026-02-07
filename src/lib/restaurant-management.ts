
'use server';

import { initializeFirebase } from '@/firebase/server';
import {
    collection,
    doc,
    setDoc,
    serverTimestamp,
    getDocs,
    getDoc,
    deleteDoc
} from 'firebase/firestore';
import type { AppUser } from './definitions';

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
        const firestore = initializeFirebase().firestore;

        // Create restaurant document
        const restaurantRef = doc(firestore, 'restaurants', restaurantId);

        await setDoc(restaurantRef, {
            name: restaurantName,
            createdAt: serverTimestamp(),
            isActive: true,
            // Default settings
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
        });

        // Create main branch for this restaurant
        const mainBranchRef = doc(collection(firestore, `restaurants/${restaurantId}/branches`));
        await setDoc(mainBranchRef, {
            name: 'Main Branch',
            isMain: true,
            createdAt: serverTimestamp(),
            // Inherit restaurant settings
            restaurantName: restaurantName,
            restaurantAddress: '',
            currencySymbol: '$',
            currencyDecimalPlaces: 2,
            menuCategories: ['Meals', 'Snacks', 'Beverages', 'Desserts'],
            taxes: [],
        });

        // Create admin user for this restaurant
        const adminUserRef = doc(collection(firestore, `restaurants/${restaurantId}/kitchenUsers`));
        await setDoc(adminUserRef, {
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
        const firestore = initializeFirebase().firestore;
        const restaurantsRef = collection(firestore, 'restaurants');
        const snapshot = await getDocs(restaurantsRef);

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || 'Unnamed Restaurant',
                createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                isActive: data.isActive ?? true,
            };
        });
    } catch (error) {
        console.error('Error getting restaurants:', error);
        return [];
    }
}

/**
 * Get a single restaurant by its ID
 */
export async function getRestaurantById(restaurantId: string): Promise<{ id: string; name: string } | null> {
    try {
        const firestore = initializeFirebase().firestore;
        const restaurantRef = doc(firestore, 'restaurants', restaurantId);
        const docSnap = await getDoc(restaurantRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                name: data.name || 'Unnamed Restaurant',
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting restaurant by ID:', error);
        return null;
    }
}

/**
 * Delete a restaurant and all its data
 */
export async function deleteRestaurant(restaurantId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const firestore = initializeFirebase().firestore;

        // 1. Delete all users from Firebase Authentication
        try {
            const { getAdminAuth } = await import('@/firebase/admin');
            const adminAuth = getAdminAuth();
            if (adminAuth) {
                const usersRef = collection(firestore, `restaurants/${restaurantId}/kitchenUsers`);
                const usersSnapshot = await getDocs(usersRef);

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
            // Continue to delete Firestore data even if Auth deletion fails partially
        }

        // 2. Delete all subcollections
        const subcollections = ['branches', 'kitchenUsers', 'menuItems', 'orders', 'remoteOrders', 'tables', 'activityLogs'];

        for (const subcollection of subcollections) {
            const subcollectionRef = collection(firestore, `restaurants/${restaurantId}/${subcollection}`);
            const snapshot = await getDocs(subcollectionRef);

            const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
            await Promise.all(deletePromises);
        }

        // 3. Delete restaurant document
        const restaurantRef = doc(firestore, 'restaurants', restaurantId);
        await deleteDoc(restaurantRef);

        return { success: true };
    } catch (error: any) {
        console.error('Error deleting restaurant:', error);
        return {
            success: false,
            error: error.message || 'Failed to delete restaurant'
        };
    }
}
