# Data.ts Function Updates for Multi-Tenant Support

## Pattern to Apply

All functions need to accept an optional `restaurantId` parameter as the LAST parameter:

```typescript
// Before:
export async function getOrders(branchId?: string): Promise<Order[]> {
    const { orders } = getCollections();
    // ...
}

// After:
export async function getOrders(branchId?: string, restaurantId: string = 'dineeasee-restaurant'): Promise<Order[]> {
    const { orders } = getCollections(restaurantId);
    // ...
}
```

## Functions to Update

### Settings
- ✅ `getSettings(branchId?: string, restaurantId?: string)`
- ✅ `updateSettings(branchId: string | undefined, newSettings: Partial<RestaurantSettings>, restaurantId?: string)`

### Branches
- ✅ `getBranches(restaurantId?: string)`
- ✅ `getMainBranch(restaurantId?: string)`
- ✅ `getBranchById(id: string, restaurantId?: string)`
- ✅ `createBranch(name: string, isMain: boolean, restaurantId?: string)`
- ✅ `deleteBranch(branchId: string, restaurantId?: string)`
- ✅ `setMainBranch(newMainBranchId: string, restaurantId?: string)`

### Tables
- ✅ `getTables(branchId?: string, restaurantId?: string)`
- ✅ `getTableById(id: string, restaurantId?: string)`
- ✅ `createTable(tableNumber: number, branchId: string, restaurantId?: string)`
- ✅ `updateTableStatus(tableId: string, status: Table['status'], restaurantId?: string)`
- ✅ `updateTablePosition(tableId: string, position: { x: number; y: number }, restaurantId?: string)`
- ✅ `deleteTable(tableId: string, restaurantId?: string)`

### Menu Items
- ✅ `getMenuItems(branchId?: string, restaurantId?: string)`
- ✅ `getMenuItemById(id: string, restaurantId?: string)`
- ✅ `addMenuItem(itemData: Omit<MenuItem, 'id' | 'isAvailable'>, restaurantId?: string)`
- ✅ `updateMenuItem(id: string, itemData: Partial<MenuItem>, restaurantId?: string)`
- ✅ `toggleMenuItemAvailability(id: string, isAvailable: boolean, restaurantId?: string)`
- ✅ `toggleMenuItemAddon(id: string, isAddon: boolean, restaurantId?: string)`

### Orders
- ✅ `getOrders(branchId?: string, restaurantId?: string)`
- ✅ `getOrderById(id: string, restaurantId?: string)`
- ✅ `getOrdersByTableId(tableId: string, restaurantId?: string)`
- ✅ `getActiveOrders(branchId?: string, restaurantId?: string)`
- ✅ `createOrder(orderData: ..., restaurantId?: string)`
- ✅ `addItemsToOrder(orderId: string, items: OrderItem[], notes?: string, restaurantId?: string)`
- ✅ `updateOrderStatus(orderId: string, status: OrderStatus, paymentMethod?: Order['paymentMethod'], restaurantId?: string)`
- ✅ `updateOrderItemStatus(orderId: string, orderItemId: string, isReady: boolean, restaurantId?: string)`
- ✅ `cancelOrderItem(orderId: string, orderItemId: string, restaurantId?: string)`
- ✅ `cancelOrdersForTable(tableId: string, restaurantId?: string)`

### Remote Orders
- ✅ `getRemoteOrders(branchId?: string, restaurantId?: string)`
- ✅ `getRemoteOrderById(id: string, restaurantId?: string)`
- ✅ `createRemoteOrder(orderData: ..., restaurantId?: string)`
- ✅ `updateRemoteOrder(id: string, updates: Partial<RemoteOrder>, restaurantId?: string)`
- ✅ `updateRemoteOrderStatus(id: string, status: OrderStatus, paymentMethod?: RemoteOrder['paymentMethod'], restaurantId?: string)`
- ✅ `deleteRemoteOrder(id: string, restaurantId?: string)`

### Kitchen Users
- ✅ `getKitchenUsers(restaurantId?: string)`
- ✅ `getKitchenUserById(id: string, restaurantId?: string)`
- ✅ `getKitchenUserByUsername(username: string, restaurantId?: string)`
- ✅ `getKitchenUserByEmail(email: string, restaurantId?: string)`
- ✅ `createKitchenUser(userData: Omit<KitchenUser, 'id'>, restaurantId?: string)`
- ✅ `updateKitchenUser(id: string, updates: Partial<KitchenUser>, restaurantId?: string)`
- ✅ `deleteKitchenUser(id: string, restaurantId?: string)`

### Activity Logs
- ✅ `logActivity(userId: string, username: string, action: string, details: string, restaurantId?: string)`
- ✅ `getActivityLogs(limit?: number, restaurantId?: string)`

## Implementation Note

Due to the large number of functions (60+) and the risk of introducing errors, I recommend:

1. **Automated Script**: Create a script to update all function signatures
2. **Testing**: Test each category (Tables, Menu, Orders, etc.) separately
3. **Gradual Rollout**: Update components one at a time

## Quick Test

To test if it's working, update just the dashboard page to use the new hook and see if Burger King admin sees different data than Main admin.
