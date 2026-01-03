'use server';

import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
} from 'firebase/auth';
import { initializeFirebase } from '@/firebase/server';
import { getKitchenUserByEmail, createKitchenUser } from './data';
import type { KitchenUser } from './definitions';
import { isSuperAdmin } from './auth-utils';



/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<{
    success: boolean;
    user?: KitchenUser;
    error?: string;
    isSuperAdmin?: boolean;
}> {
    try {
        const { auth } = initializeFirebase();
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // Check if super admin
        if (isSuperAdmin(email)) {
            return {
                success: true,
                isSuperAdmin: true,
                user: {
                    id: userCredential.user.uid,
                    username: 'Super Admin',
                    email: email,
                    role: 'Admin',
                    password: '', // Not stored
                    categories: ['All'],
                    branchId: '',
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
                }
            };
        }

        // Get user data from Firestore
        const userData = await getKitchenUserByEmail(email);

        if (!userData) {
            return {
                success: false,
                error: 'User not found in database'
            };
        }

        return {
            success: true,
            user: userData,
            isSuperAdmin: false
        };
    } catch (error: any) {
        console.error('Sign in error:', error);

        let errorMessage = 'Login failed';
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
            errorMessage = 'Invalid email or password';
        } else if (error.code === 'auth/user-not-found') {
            errorMessage = 'User not found';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed attempts. Please try again later';
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
    userData: Omit<KitchenUser, 'id' | 'email'>
): Promise<{
    success: boolean;
    user?: KitchenUser;
    error?: string;
}> {
    try {
        const { auth } = initializeFirebase();

        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Create user in Firestore
        const newUser = await createKitchenUser({
            ...userData,
            email,
            firebaseUid: userCredential.user.uid
        });

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
