# Multi-Tenant Data Access - Implementation Progress

## ✅ Completed

1. **Created Restaurant Context** (`src/contexts/restaurant-context.tsx`)
   - Extracts restaurant ID from logged-in user's email
   - Provides `useRestaurantId()` hook
   - Falls back to 'dineeasee-restaurant' if no user

2. **Updated Admin Layout** (`src/app/admin/layout.tsx`)
   - Wrapped with `RestaurantProvider`
   - Restaurant ID now available throughout admin panel

3. **Updated getCollections()** (`src/lib/data.ts`)
   - Now accepts `restaurantId` parameter
   - Default value: 'dineeasee-restaurant'

4. **Created Client Data Wrappers** (`src/lib/client-data.ts`)
   - `useRestaurantData()` hook for client components
   - Automatically passes restaurant ID from context

## 🔄 In Progress

### Approach: Gradual Migration

Instead of updating all 50+ functions at once (risky), we'll use a **hybrid approach**:

1. **Server Functions** (`data.ts`)
   - Add optional `restaurantId` parameter to all functions
   - Default to 'dineeasee-restaurant' for backward compatibility
   - Functions work with or without explicit restaurant ID

2. **Client Components**
   - Use `useRestaurantData()` hook
   - Automatically gets correct restaurant ID from context
   - No manual restaurant ID passing needed

3. **Server Actions** (`actions.ts`)
   - Extract restaurant ID from user session/email
   - Pass to data functions explicitly

## 📝 Next Steps

### Step 1: Update All Data Functions (Automated)

Add `restaurantId` parameter to all functions in `data.ts`:

```typescript
// Before:
export async function getTables(branchId?: string): Promise<Table[]> {
    const { tables } = getCollections();
    // ...
}

// After:
export async function getTables(branchId?: string, restaurantId: string = 'dineeasee-restaurant'): Promise<Table[]> {
    const { tables } = getCollections(restaurantId);
    // ...
}
```

### Step 2: Update Components to Use Hook

```typescript
// Before:
import { getTables } from '@/lib/data';
const tables = await getTables();

// After:
import { useRestaurantData } from '@/lib/client-data';
const { getTables } = useRestaurantData();
const tables = await getTables();
```

### Step 3: Update Server Actions

```typescript
// In actions.ts
import { extractRestaurantId } from '@/lib/auth-utils';

export async function someAction(formData: FormData) {
    const userEmail = // get from session
    const restaurantId = extractRestaurantId(userEmail) || 'dineeasee-restaurant';
    
    const data = await getData(restaurantId);
    // ...
}
```

## 🎯 Current Status

**Working:**
- ✅ Restaurant context created
- ✅ Restaurant ID extraction from email
- ✅ Client-side hook available

**Needs Update:**
- ⏳ All data.ts functions (50+ functions)
- ⏳ All components using data functions (20+ components)
- ⏳ All server actions (10+ actions)

## 🚀 Quick Win Solution

For immediate testing, I recommend:

### Option A: Update Key Functions Only

Update only the most-used functions:
- `getTables()`
- `getMenuItems()`
- `getOrders()`
- `getKitchenUsers()`
- `getBranches()`
- `getSettings()`

This gives you 80% functionality with 20% effort.

### Option B: Use Client Hook in Dashboard

Update just the dashboard page to use `useRestaurantData()`:

```typescript
// src/app/admin/page.tsx
'use client';
import { useRestaurantData } from '@/lib/client-data';

export default function DashboardPage() {
    const { getOrders, getMenuItems, restaurantId } = useRestaurantData();
    
    // Now getOrders() automatically uses correct restaurant ID!
    const orders = await getOrders();
}
```

## 📊 Estimated Effort

- **Full Refactor**: 3-4 hours
- **Key Functions Only**: 1 hour
- **Dashboard Only**: 15 minutes

## 🎯 Recommendation

Let's start with **Option B** (Dashboard Only) to prove the concept works, then gradually migrate other pages.

Would you like me to:
1. Update the dashboard page to use the new hook?
2. Do the full refactor of all functions?
3. Focus on key functions only?
