

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
    
