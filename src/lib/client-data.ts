/**
 * Client-side data access wrappers
 * These functions use the restaurant context to automatically pass the correct restaurant ID
 * Import these in client components instead of the server functions from data.ts
 */

'use client';

import { useRestaurantId } from '@/contexts/restaurant-context';
import { useMemo } from 'react';
import * as serverData from './data';
import type {
    Table,
    MenuItem,
    Order,
    RemoteOrder,
    KitchenUser,
    RestaurantSettings,
    Branch,
    ActivityLog,
    Tax,
    OrderItem
} from './definitions';

/**
 * Hook to get data functions with restaurant context
 * Usage: const { getTables, getMenuItems, ... } = useRestaurantData();
 */
export function useRestaurantData() {
    const restaurantId = useRestaurantId();

    return useMemo(() => ({
        // Tables
        getTables: (branchId?: string) => serverData.getTables(branchId, restaurantId),
        getTableById: (id: string) => serverData.getTableById(id, restaurantId),
        createTable: (tableNumber: number, branchId: string) => serverData.createTable(tableNumber, branchId, restaurantId),
        updateTableStatus: (id: string, status: Table['status']) => serverData.updateTableStatus(id, status, restaurantId),
        updateTablePosition: (id: string, position: { x: number; y: number }) => serverData.updateTablePosition(id, position, restaurantId),
        deleteTable: (id: string) => serverData.deleteTable(id, restaurantId),

        // Menu Items
        getMenuItems: (branchId?: string) => serverData.getMenuItems(branchId, restaurantId),
        getMenuItemById: (id: string) => serverData.getMenuItemById(id, restaurantId),
        addMenuItem: (item: Omit<MenuItem, 'id' | 'isAvailable'>) => serverData.addMenuItem(item, restaurantId),
        updateMenuItem: (id: string, item: Partial<MenuItem>) => serverData.updateMenuItem(id, item, restaurantId),
        toggleMenuItemAvailability: (id: string, isAvailable: boolean) => serverData.toggleMenuItemAvailability(id, isAvailable, restaurantId),
        toggleMenuItemAddon: (id: string, isAddon: boolean) => serverData.toggleMenuItemAddon(id, isAddon, restaurantId),
        deleteMenuItem: (id: string) => serverData.deleteMenuItem(id, restaurantId),

        // Orders
        getOrders: (branchId?: string) => serverData.getOrders(branchId, restaurantId),
        getOrderById: (id: string) => serverData.getOrderById(id, restaurantId),
        getOrdersByTableId: (tableId: string) => serverData.getOrdersByTableId(tableId, restaurantId),
        getActiveOrders: (branchId?: string) => serverData.getActiveOrders(branchId, restaurantId),
        createOrder: (order: Omit<Order, 'id' | 'createdAt' | 'status' | 'items' | 'paymentMethod' | 'taxes' | 'totalTaxAmount' | 'total' | 'subtotal'> & { items: any[] }) => serverData.createOrder(order, restaurantId),
        addItemsToOrder: (orderId: string, items: any[], notes?: string) => serverData.addItemsToOrder(orderId, items, notes, restaurantId),
        updateOrderStatus: (id: string, status: any, paymentMethod?: any) => serverData.updateOrderStatus(id, status, paymentMethod, restaurantId),
        updateOrderItemStatus: (orderId: string, itemId: string, isReady: boolean) => serverData.updateOrderItemStatus(orderId, itemId, isReady, restaurantId),
        cancelOrderItem: (orderId: string, itemId: string) => serverData.cancelOrderItem(orderId, itemId, restaurantId),
        cancelOrdersForTable: (tableId: string) => serverData.cancelOrdersForTable(tableId, restaurantId),
        deleteOrder: (id: string, type: 'Dine-in' | 'Remote') => serverData.deleteOrder(id, type, restaurantId),
        updateFullOrder: (orderId: string, orderType: 'Dine-in' | 'Take-away' | 'Online', updateData: { items: OrderItem[], customerName?: string, customerPhone?: string, tableId?: string, paymentMethod?: 'cash' | 'card' | 'qr', address?: string, platform?: string, takeAwayTime?: string }) => serverData.updateFullOrder(orderId, orderType, updateData, restaurantId),

        // Remote Orders
        getRemoteOrders: (branchId?: string) => serverData.getRemoteOrders(branchId, restaurantId),
        getRemoteOrderById: (id: string) => serverData.getRemoteOrderById(id, restaurantId),
        addRemoteOrder: (order: any) => serverData.addRemoteOrder(order, restaurantId),

        // Kitchen Users
        getKitchenUsers: () => serverData.getKitchenUsers(restaurantId),
        getKitchenUserById: (id: string) => serverData.getKitchenUserById(id, restaurantId),
        getKitchenUserByUsername: (username: string) => serverData.getKitchenUserByUsername(username, restaurantId),
        getKitchenUserByEmail: (email: string) => serverData.getKitchenUserByEmail(email, restaurantId),
        createKitchenUser: (user: Omit<KitchenUser, 'id'>) => serverData.createKitchenUserInFirestore(user, restaurantId),
        updateKitchenUser: (id: string, user: Partial<KitchenUser>) => serverData.updateKitchenUser(id, user, restaurantId),
        deleteKitchenUser: (id: string) => serverData.deleteKitchenUser(id, restaurantId),

        // Branches
        getBranches: () => serverData.getBranches(restaurantId),
        getMainBranch: () => serverData.getMainBranch(restaurantId),
        getBranchById: (id: string) => serverData.getBranchById(id, restaurantId),
        createBranch: (name: string, isMain: boolean) => serverData.createBranch(name, isMain, restaurantId),
        setMainBranch: (id: string) => serverData.setMainBranch(id, restaurantId),
        deleteBranch: (id: string) => serverData.deleteBranch(id, restaurantId),

        // Settings
        getSettings: (branchId?: string) => serverData.getSettings(branchId, restaurantId),
        updateSettings: (branchId: string | undefined, settings: Partial<RestaurantSettings>) =>
            serverData.updateSettings(branchId, settings, restaurantId),

        // Activity Logs
        logActivity: (userId: string, username: string, action: string, details: string) =>
            serverData.logActivity(userId, username, action, details, restaurantId),
        getActivityLogs: (limit?: number) => serverData.getActivityLogs(limit, restaurantId),

        // Restaurant ID
        restaurantId,
    }), [restaurantId]);
}
