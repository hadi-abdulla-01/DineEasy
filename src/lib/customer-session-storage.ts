'use client';

const memoryStore = new Map<string, string>();

function getStorageKey(tableId: string): string {
    return `dineeasy-customer-${tableId}`;
}

/**
 * Safely reads customer session info for a table without throwing in iOS Safari Private Mode,
 * "Block All Cookies" mode, or restricted in-app WebViews.
 */
export function getCustomerSessionStorage<T = Record<string, any>>(tableId: string): T | null {
    const key = getStorageKey(tableId);
    if (typeof window === 'undefined') return null;

    try {
        const raw = window.sessionStorage.getItem(key);
        if (raw) {
            memoryStore.set(key, raw);
            return JSON.parse(raw) as T;
        }
    } catch {
        // sessionStorage blocked or unavailable
    }

    try {
        const rawLocal = window.localStorage.getItem(key);
        if (rawLocal) {
            memoryStore.set(key, rawLocal);
            return JSON.parse(rawLocal) as T;
        }
    } catch {
        // localStorage blocked or unavailable
    }

    const mem = memoryStore.get(key);
    if (mem) {
        try {
            return JSON.parse(mem) as T;
        } catch {
            return null;
        }
    }

    return null;
}

/**
 * Safely writes customer session info for a table across sessionStorage, localStorage,
 * and an in-memory fallback so navigation never fails when WebKit restricts storage.
 */
export function setCustomerSessionStorage(tableId: string, value: Record<string, any>): void {
    const key = getStorageKey(tableId);
    const serialized = JSON.stringify(value);
    memoryStore.set(key, serialized);

    if (typeof window === 'undefined') return;

    try {
        window.sessionStorage.setItem(key, serialized);
    } catch {
        // Ignore storage errors in restricted WebViews / Private Browsing
    }

    try {
        window.localStorage.setItem(key, serialized);
    } catch {
        // Ignore storage errors in restricted WebViews / Private Browsing
    }
}

/**
 * Safely removes customer session info for a table.
 */
export function clearCustomerSessionStorage(tableId: string): void {
    const key = getStorageKey(tableId);
    memoryStore.delete(key);

    if (typeof window === 'undefined') return;

    try {
        window.sessionStorage.removeItem(key);
    } catch {
        // Ignore
    }

    try {
        window.localStorage.removeItem(key);
    } catch {
        // Ignore
    }
}
