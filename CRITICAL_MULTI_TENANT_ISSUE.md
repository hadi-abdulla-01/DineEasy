# CRITICAL: Multi-Tenant Data Access Issue

## 🚨 Problem

When you create a new restaurant (e.g., "Burger King") and login as its admin, you see data from the old restaurant ("Main"). This is because:

1. `src/lib/data.ts` uses a hardcoded `RESTAURANT_ID = 'dineeasee-restaurant'`
2. All data queries use this hardcoded ID
3. Every restaurant admin sees the same data

## 🔧 Solution Required

We need to make data access **dynamic** based on the logged-in user's restaurant ID.

### Current Code (Wrong):
```typescript
const RESTAURANT_ID = 'dineeasee-restaurant'; // Hardcoded!

const getCollections = () => {
    return {
        tables: collection(firestore, `restaurants/${RESTAURANT_ID}/tables`),
        menuItems: collection(firestore, `restaurants/${RESTAURANT_ID}/menuItems`),
        // ... all using same hardcoded ID
    };
};
```

### Required Code (Correct):
```typescript
// Get restaurant ID from user's email or session
const getRestaurantId = (userEmail: string): string => {
    const match = userEmail.match(/@(.+)\.dineezee$/);
    return match ? match[1] : 'dineeasee-restaurant';
};

const getCollections = (restaurantId: string) => {
    return {
        tables: collection(firestore, `restaurants/${restaurantId}/tables`),
        menuItems: collection(firestore, `restaurants/${restaurantId}/menuItems`),
        // ... all using dynamic restaurant ID
    };
};
```

## 📋 Files That Need Updates

### 1. `src/lib/data.ts`
- Remove hardcoded `RESTAURANT_ID`
- Update `getCollections()` to accept `restaurantId` parameter
- Update ALL functions to accept and use `restaurantId`
- Extract restaurant ID from user context

### 2. `src/app/admin/auth-provider.tsx`
- Store restaurant ID in session along with user
- Make it available to all components

### 3. All Components Using Data Functions
- Pass restaurant ID to data functions
- Get restaurant ID from auth context

## 🎯 Implementation Strategy

### Option A: Context-Based (Recommended)

1. **Update Auth Provider** to store restaurant ID
2. **Create a hook** `useRestaurantId()` to get current restaurant ID
3. **Update all data functions** to use restaurant ID from context
4. **Minimal changes** to existing components

### Option B: Parameter-Based

1. **Update all data functions** to accept `restaurantId` parameter
2. **Update all components** to pass restaurant ID
3. **More changes** but more explicit

## ⚠️ Scope of Changes

This is a **major refactor** affecting:
- ✅ 1 core file: `src/lib/data.ts` (~1000 lines)
- ✅ 50+ functions need updating
- ✅ 20+ components need updating
- ⏱️ Estimated time: 2-3 hours

## 🚀 Quick Fix (Temporary)

For testing purposes, you can manually change the `RESTAURANT_ID` in `src/lib/data.ts`:

```typescript
// Line 25 in src/lib/data.ts
const RESTAURANT_ID = 'burgerking'; // Change to your restaurant ID
```

**Warning**: This is NOT a solution! It just lets you test one restaurant at a time.

## 📝 Recommended Approach

I can implement **Option A (Context-Based)** which involves:

1. **Update Auth Provider** - Store restaurant ID from user email
2. **Create Restaurant Context** - Make restaurant ID available globally
3. **Update Data Functions** - Use restaurant ID from context
4. **Test with Multiple Restaurants** - Verify data isolation

Would you like me to proceed with this refactor? It will take some time but will properly fix the multi-tenant data access.

## 🎯 What You'll Get

After the refactor:
- ✅ Each restaurant sees ONLY their data
- ✅ Burger King admin sees Burger King data
- ✅ Pizza Palace admin sees Pizza Palace data
- ✅ Complete data isolation
- ✅ True multi-tenant SaaS

Let me know if you want me to proceed with the full implementation!
