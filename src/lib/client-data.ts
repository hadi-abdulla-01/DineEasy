
/**
 * Client-side data access wrappers
 * These functions use the restaurant context to automatically pass the correct restaurant ID
 * Import these in client components instead of the server functions from data.ts
 */

'use client';

import { useRestaurantId } from '@/contexts/restaurant-context';
import { useMemo, useCallback } from 'react';
import * as serverData from './data';
import type {
    Table,
    MenuItem,
    Order,
    RemoteOrder,
    AppUser,
    RestaurantSettings,
    Branch,
    ActivityLog,
    Tax,
    OrderItem,
    Discount
} from './definitions';

/**
 * Hook to get data functions with restaurant context
 * Usage: const { getTables, getMenuItems, ... } = useRestaurantData();
 */
export function useRestaurantData() {
    const restaurantId = useRestaurantId();

    const getTables = useCallback((branchId?: string) => serverData.getTables(branchId, restaurantId), [restaurantId]);
    const getTableById = useCallback((id: string) => serverData.getTableById(id, restaurantId), [restaurantId]);
    const createTable = useCallback((tableNumber: number, branchId: string) => serverData.createTable(tableNumber, branchId, restaurantId), [restaurantId]);
    const updateTableStatus = useCallback((id: string, status: Table['status']) => serverData.updateTableStatus(id, status, restaurantId), [restaurantId]);
    const updateTablePosition = useCallback((id: string, position: { x: number; y: number }) => serverData.updateTablePosition(id, position, restaurantId), [restaurantId]);
    const deleteTable = useCallback((id: string) => serverData.deleteTable(id, restaurantId), [restaurantId]);
    const getMenuItems = useCallback((branchId?: string) => serverData.getMenuItems(branchId, restaurantId), [restaurantId]);
    const getMenuItemById = useCallback((id: string) => serverData.getMenuItemById(id, restaurantId), [restaurantId]);
    const addMenuItem = useCallback((item: Omit<MenuItem, 'id' | 'isAvailable'>) => serverData.addMenuItem(item, restaurantId), [restaurantId]);
    const updateMenuItem = useCallback((id: string, item: Partial<MenuItem>) => serverData.updateMenuItem(id, item, restaurantId), [restaurantId]);
    const toggleMenuItemAvailability = useCallback((id: string, isAvailable: boolean) => serverData.toggleMenuItemAvailability(id, isAvailable, restaurantId), [restaurantId]);
    const toggleMenuItemAddon = useCallback((id: string, isAddon: boolean) => serverData.toggleMenuItemAddon(id, isAddon, restaurantId), [restaurantId]);
    const deleteMenuItem = useCallback((id: string) => serverData.deleteMenuItem(id, restaurantId), [restaurantId]);
    const getOrders = useCallback((branchId?: string, dateRange?: { from: Date; to: Date }) => serverData.getOrders(branchId, restaurantId, dateRange), [restaurantId]);
    const getOrderById = useCallback((id: string) => serverData.getOrderById(id, restaurantId), [restaurantId]);
    const getOrdersByTableId = useCallback((tableId: string) => serverData.getOrdersByTableId(tableId, restaurantId), [restaurantId]);
    const getActiveOrders = useCallback((branchId?: string) => serverData.getActiveOrders(branchId, restaurantId), [restaurantId]);
    const createOrder = useCallback((order: Omit<Order, 'id' | 'createdAt' | 'status' | 'items' | 'paymentMethod' | 'taxes' | 'totalTaxAmount' | 'total' | 'subtotal'> & { items: any[] }) => serverData.createOrder(order, restaurantId), [restaurantId]);
    const addItemsToOrder = useCallback((orderId: string, items: any[], notes?: string) => serverData.addItemsToOrder(orderId, items, notes, restaurantId), [restaurantId]);
    const updateOrderStatus = useCallback((id: string, status: any, paymentMethod?: any) => serverData.updateOrderStatus(id, status, paymentMethod, restaurantId), [restaurantId]);
    const updateOrderItemStatus = useCallback((orderId: string, itemId: string, isReady: boolean) => serverData.updateOrderItemStatus(orderId, itemId, isReady, restaurantId), [restaurantId]);
    const cancelOrderItem = useCallback((orderId: string, itemId: string) => serverData.cancelOrderItem(orderId, itemId, restaurantId), [restaurantId]);
    const cancelOrdersForTable = useCallback((tableId: string) => serverData.cancelOrdersForTable(tableId, restaurantId), [restaurantId]);
    const deleteOrder = useCallback((id: string, type: 'Dine-in' | 'Remote') => serverData.deleteOrder(id, type, restaurantId), [restaurantId]);
    const updateFullOrder = useCallback((orderId: string, orderType: 'Dine-in' | 'Take-away' | 'Online', updateData: { items: OrderItem[], customerName?: string, customerPhone?: string, tableId?: string, paymentMethod?: 'cash' | 'card' | 'qr', address?: string, platform?: string, takeAwayTime?: string }) => serverData.updateFullOrder(orderId, orderType, updateData, restaurantId), [restaurantId]);
    const getRemoteOrders = useCallback((branchId?: string, dateRange?: { from: Date; to: Date }) => serverData.getRemoteOrders(branchId, restaurantId, dateRange), [restaurantId]);
    const getRemoteOrderById = useCallback((id: string) => serverData.getRemoteOrderById(id, restaurantId), [restaurantId]);
    const addRemoteOrder = useCallback((order: any) => serverData.addRemoteOrder(order, restaurantId), [restaurantId]);
    const getUsers = useCallback(() => serverData.getUsers(restaurantId), [restaurantId]);
    const getUserById = useCallback((id: string) => serverData.getUserById(id, restaurantId), [restaurantId]);
    const getUserByUsername = useCallback((username: string) => serverData.getUserByUsername(username, restaurantId), [restaurantId]);
    const getUserByEmail = useCallback((email: string) => serverData.getUserByEmail(email, restaurantId), [restaurantId]);
    const createUser = useCallback((user: Omit<AppUser, 'id'>) => serverData.createUserInFirestore(user, restaurantId), [restaurantId]);
    const updateUser = useCallback((id: string, user: Partial<AppUser>) => serverData.updateUser(id, user, restaurantId), [restaurantId]);
    const deleteUser = useCallback((id: string) => serverData.deleteUser(id, restaurantId), [restaurantId]);
    const getBranches = useCallback(() => serverData.getBranches(restaurantId), [restaurantId]);
    const getMainBranch = useCallback(() => serverData.getMainBranch(restaurantId), [restaurantId]);
    const getBranchById = useCallback((id: string) => serverData.getBranchById(id, restaurantId), [restaurantId]);
    const createBranch = useCallback((name: string, isMain: boolean) => serverData.createBranch(name, isMain, restaurantId), [restaurantId]);
    const setMainBranch = useCallback((id: string) => serverData.setMainBranch(id, restaurantId), [restaurantId]);
    const deleteBranch = useCallback((id: string) => serverData.deleteBranch(id, restaurantId), [restaurantId]);
    const getSettings = useCallback((branchId?: string, overrideRestaurantId?: string) => serverData.getSettings(branchId, overrideRestaurantId || restaurantId), [restaurantId]);
    const updateSettings = useCallback((branchId: string | undefined, settings: Partial<RestaurantSettings>) => serverData.updateSettings(branchId, settings, restaurantId), [restaurantId]);
    const getDiscounts = useCallback((branchId: string) => serverData.getDiscounts(branchId, restaurantId), [restaurantId]);
    const logActivity = useCallback((userId: string, username: string, action: string, details: string) => serverData.logActivity(userId, username, action, details, restaurantId), [restaurantId]);
    const getActivityLogs = useCallback((limit?: number) => serverData.getActivityLogs(limit, restaurantId), [restaurantId]);

    return useMemo(() => ({
        getTables,
        getTableById,
        createTable,
        updateTableStatus,
        updateTablePosition,
        deleteTable,
        getMenuItems,
        getMenuItemById,
        addMenuItem,
        updateMenuItem,
        toggleMenuItemAvailability,
        toggleMenuItemAddon,
        deleteMenuItem,
        getOrders,
        getOrderById,
        getOrdersByTableId,
        getActiveOrders,
        createOrder,
        addItemsToOrder,
        updateOrderStatus,
        updateOrderItemStatus,
        cancelOrderItem,
        cancelOrdersForTable,
        deleteOrder,
        updateFullOrder,
        getRemoteOrders,
        getRemoteOrderById,
        addRemoteOrder,
        getUsers,
        getUserById,
        getUserByUsername,
        getUserByEmail,
        createUser,
        updateUser,
        deleteUser,
        getBranches,
        getMainBranch,
        getBranchById,
        createBranch,
        setMainBranch,
        deleteBranch,
        getSettings,
        updateSettings,
        getDiscounts,
        logActivity,
        getActivityLogs,
        restaurantId,
    }), [
        getTables, getTableById, createTable, updateTableStatus, updateTablePosition, deleteTable,
        getMenuItems, getMenuItemById, addMenuItem, updateMenuItem, toggleMenuItemAvailability, toggleMenuItemAddon, deleteMenuItem,
        getOrders, getOrderById, getOrdersByTableId, getActiveOrders, createOrder, addItemsToOrder, updateOrderStatus, updateOrderItemStatus, cancelOrderItem, cancelOrdersForTable, deleteOrder, updateFullOrder,
        getRemoteOrders, getRemoteOrderById, addRemoteOrder,
        getUsers, getUserById, getUserByUsername, getUserByEmail, createUser, updateUser, deleteUser,
        getBranches, getMainBranch, getBranchById, createBranch, setMainBranch, deleteBranch,
        getSettings, updateSettings,
        getDiscounts,
        logActivity, getActivityLogs,
        restaurantId,
    ]);
}
