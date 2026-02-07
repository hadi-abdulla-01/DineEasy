

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
        // Note: For multi-tenant, you might need to determine restaurantId differently
        const restaurantId = extractRestaurantId(email);
        if (!restaurantId && !isSuperAdmin(email)) {
            return { success: false, error: 'Invalid email format for restaurant user.' };
        }

        const userData = await getUserByEmail(email, restaurantId || 'dineeasee-restaurant'); // Fallback to default for now

        if (!userData && !isSuperAdmin(email)) {
            return {
                success: false,
                error: 'User not found in database'
            };
        }

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
                        onlineOrders: { view: true, create: true },
                        takeAway: { view: true, create: true },
                        userManagement: { view: true, create: true, edit: true, delete: true },
                        settings: { view: true, edit: true },
                    }
                }
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

        // Create user in Firestore
        const newUser = await createUserInFirestore({
            ...userData,
            email,
            firebaseUid: userCredential.user.uid
        }, restaurantId);

        return {
            success: true,
            user: newUser
        };
    } catch (error: any) {
        console.error('Create user error:', error);

        let errorMessage = 'Failed to create user';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Email already in use';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password is too weak';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email format';
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
