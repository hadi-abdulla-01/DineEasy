
'use server';

import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase/server';
import { getUserByEmail, createUserInFirestore } from './data';
import type { AppUser } from './definitions';
import { isSuperAdmin, extractRestaurantId } from './auth-utils';
import { createRestaurant, getRestaurantById } from './server-actions';


/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<{
    success: boolean;
    user?: AppUser;
    error?: string;
}> {
    try {
        const { auth } = initializeFirebase();
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // Get user data from Firestore
        const restaurantId = extractRestaurantId(email);
        
        if (isSuperAdmin(email)) {
            return {
                success: true,
                user: {
                    id: userCredential.user.uid,
                    username: 'Super Admin',
                    email: email,
                    role: 'Admin',
                    isSuperAdmin: true,
                    password: '', // Not stored
                    categories: ['All'],
                    branchId: '',
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
                }
            };
        }
        
        if (!restaurantId) {
            return { success: false, error: 'Invalid email format for restaurant user.' };
        }

        // Check if the restaurant is active before proceeding
        const restaurant = await getRestaurantById(restaurantId);
        if (!restaurant || !restaurant.isActive) {
            return { success: false, error: 'This restaurant account is currently inactive. Please contact support.' };
        }
        
        const userData = await getUserByEmail(email, restaurantId); 

        if (!userData) {
            return {
                success: false,
                error: 'User not found in database'
            };
        }


        return {
            success: true,
            user: userData
        };
    } catch (error: any) {
        console.error('Sign in error:', error);

        let errorMessage = 'Login failed';
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            errorMessage = 'Invalid email or password';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed attempts. Please try again later';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error: Unable to connect to authentication server. Please check your internet connection and try again.';
        } else if (error.code === 'auth/timeout') {
            errorMessage = 'Request timeout: The server took too long to respond. Please try again.';
        }

        return {
            success: false,
            error: errorMessage
        };
    }
}

/**
 * Create a new user in Firebase Auth and Firestore
 */
export async function createAuthUser(
    email: string,
    password: string,
    userData: Omit<AppUser, 'id' | 'email'>,
    restaurantId: string
): Promise<{
    success: boolean;
    user?: AppUser;
    error?: string;
}> {
    try {
        const { auth } = initializeFirebase();

        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUid = userCredential.user.uid;

        try {
            // Create user in Firestore
            const newUser = await createUserInFirestore({
                ...userData,
                email,
                firebaseUid
            }, restaurantId);

            return {
                success: true,
                user: newUser
            };
        } catch (firestoreError: any) {
            // Firestore creation failed, delete the Firebase Auth user to maintain consistency
            console.error(`Firestore error during user creation for ${email}:`, firestoreError);
            let cleanupSuccess = false;
            try {
                // Use Admin SDK to delete the user
                const { getAdminAuth } = await import('@/firebase/admin');
                const adminAuth = getAdminAuth();
                if (adminAuth) {
                    await adminAuth.deleteUser(firebaseUid);
                    console.log(`Deleted Firebase Auth user ${firebaseUid} due to Firestore creation failure`);
                    cleanupSuccess = true;
                } else {
                    console.warn('Admin Auth not available, cannot cleanup Firebase Auth user');
                    // Try to use client SDK as fallback (might not work on server)
                    try {
                        await userCredential.user.delete();
                        console.log(`Deleted Firebase Auth user ${firebaseUid} using client SDK`);
                        cleanupSuccess = true;
                    } catch (clientDeleteError: any) {
                        console.error(`Client SDK delete also failed for ${firebaseUid}:`, clientDeleteError);
                    }
                }
            } catch (deleteError: any) {
                console.error(`Failed to delete Firebase Auth user ${firebaseUid} after Firestore error:`, deleteError);
            }
            
            // Return appropriate error message
            if (!cleanupSuccess) {
                return {
                    success: false,
                    error: `User created in Auth but failed in database. Auth user ${firebaseUid} may need manual cleanup. Firestore error: ${firestoreError.message || 'Unknown error'}`
                };
            }
            
            // Return the Firestore error message
            return {
                success: false,
                error: `Failed to create user in database: ${firestoreError.message || 'Unknown error'}`
            };
        }
    } catch (error: any) {
        console.error('Create user error:', error);

        let errorMessage = 'Failed to create user';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Email already in use';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email format';
        } else if (error.message) {
            errorMessage = error.message;
        }

        return {
            success: false,
            error: errorMessage
        };
    }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
    try {
        const { auth } = initializeFirebase();
        await firebaseSignOut(auth);
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
    try {
        const { auth } = initializeFirebase();
        return auth.currentUser;
    } catch (error) {
        console.error('Get current user error:', error);
        return null;
    }
}
