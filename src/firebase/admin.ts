import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

export function getAdminApp(): App {
    if (getApps().length > 0) {
        return getApp();
    }

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
        // If we are strictly server-side, this error should be caught.
        // However, during build or without proper env, this might crash.
        // We return a partially working app or throw?
        // User request implies they want this functionality.
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not defined in environment variables.');
    }

    let serviceAccount;
    try {
        serviceAccount = JSON.parse(serviceAccountKey);
    } catch (e) {
        throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON.');
    }

    return initializeApp({
        credential: cert(serviceAccount),
    });
}

export function getAdminAuth() {
    try {
        const app = getAdminApp();
        return getAuth(app);
    } catch (e) {
        console.error("Firebase Admin Initialization Error:", e);
        return null;
    }
}
