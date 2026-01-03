'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useAuth } from '@/app/admin/auth-provider';
import { extractRestaurantId } from '@/lib/auth-utils';

type RestaurantContextType = {
    restaurantId: string | null;
};

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();

    // Extract restaurant ID from user's email
    const restaurantId = user?.email ? extractRestaurantId(user.email) : null;

    return (
        <RestaurantContext.Provider value={{ restaurantId }}>
            {children}
        </RestaurantContext.Provider>
    );
}

export function useRestaurantId(): string {
    const context = useContext(RestaurantContext);
    if (context === undefined) {
        throw new Error('useRestaurantId must be used within a RestaurantProvider');
    }

    // Return restaurant ID or fallback to default
    return context.restaurantId || 'dineeasee-restaurant';
}
