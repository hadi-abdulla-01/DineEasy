
import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';

const ADMIN_APP_NAME = 'DineEzeeAdmin';

export function getAdminApp(): App {
    const existingApp = getApps().find(app => app.name === ADMIN_APP_NAME);
    if (existingApp) {
        return existingApp;
    }

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
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
    }, ADMIN_APP_NAME);
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

export function getAdminMessaging() {
    try {
        const app = getAdminApp();
        return getMessaging(app);
    } catch (e) {
        console.error("Firebase Admin Initialization Error:", e);
        return null;
    }
}

    