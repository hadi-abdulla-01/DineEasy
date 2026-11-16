'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
    getAuth,
    initializeAuth,
    browserLocalPersistence,
    browserSessionPersistence,
    inMemoryPersistence,
} from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export function getClientFirebase() {
    const isNew = getApps().length === 0;
    const app = isNew ? initializeApp(firebaseConfig) : getApp();
    const firestore = getFirestore(app);
    let auth;
    try {
        auth = isNew
            ? initializeAuth(app, {
                  persistence: [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence],
              })
            : getAuth(app);
    } catch {
        auth = getAuth(app);
    }
    return { app, firestore, auth };
}
