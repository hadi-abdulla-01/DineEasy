# Multi-Tenant SaaS Database Structure

## ✅ New Structure (Implemented)

### Firestore Database Hierarchy

```
restaurants/ (collection)
  │
  ├── restaurant-id-1/ (document)
  │   ├── name: "Pizza Palace"
  │   ├── createdAt: timestamp
  │   ├── isActive: true
  │   ├── restaurantName: "Pizza Palace"
  │   ├── currencySymbol: "$"
  │   ├── ... (other settings)
  │   │
  │   ├── branches/ (subcollection)
  │   │   ├── branch-1/ (Main Branch - auto-created)
  │   │   ├── branch-2/ (created by restaurant admin)
  │   │   └── branch-3/ (created by restaurant admin)
  │   │
  │   ├── kitchenUsers/ (subcollection)
  │   │   ├── user-1/ (admin - auto-created)
  │   │   ├── user-2/ (created by restaurant admin)
  │   │   └── user-3/ (created by restaurant admin)
  │   │
  │   ├── menuItems/ (subcollection)
  │   ├── orders/ (subcollection)
  │   ├── remoteOrders/ (subcollection)
  │   ├── tables/ (subcollection)
  │   └── activityLogs/ (subcollection)
  │
  ├── restaurant-id-2/ (document)
  │   ├── name: "Burger King"
  │   ├── ... (same structure as above)
  │   ├── branches/
  │   ├── kitchenUsers/
  │   ├── menuItems/
  │   └── ... (all subcollections)
  │
  └── restaurant-id-3/ (document)
      └── ... (same structure)
```

## How It Works

### 1. Super Admin Creates Restaurant

When you create a restaurant through the Super Admin Panel:

```typescript
createRestaurant(
  restaurantId: "pizzapalace",
  restaurantName: "Pizza Palace",
  adminUser: { ... }
)
```

**This creates:**
1. **Restaurant document** at `restaurants/pizzapalace`
2. **Main branch** at `restaurants/pizzapalace/branches/{auto-id}`
3. **Admin user** at `restaurants/pizzapalace/kitchenUsers/{auto-id}`
4. **Firebase Auth account** with email `admin@pizzapalace.dineezee`

### 2. Data Isolation

Each restaurant's data is completely isolated:

- **Pizza Palace** data: `restaurants/pizzapalace/*`
- **Burger King** data: `restaurants/burgerking/*`
- **No cross-contamination** - each restaurant can only see their own data

### 3. Restaurant Admin Access

When restaurant admin logs in:
- They access ONLY `restaurants/{their-restaurant-id}/*`
- They can create branches, users, menu items, etc.
- They CANNOT see other restaurants' data

## Super Admin Panel Features

### What Super Admin Sees

```
Super Admin Panel
├── Pizza Palace
│   ├── Admin Email: admin@pizzapalace.dineezee
│   └── Restaurant ID: pizzapalace
│
├── Burger King
│   ├── Admin Email: admin@burgerking.dineezee
│   └── Restaurant ID: burgerking
│
└── Taco Bell
    ├── Admin Email: admin@tacobell.dineezee
    └── Restaurant ID: tacobell
```

### What Super Admin Can Do

✅ Create new restaurants
✅ View all restaurants
✅ Delete restaurants (and all their data)
✅ See admin email for each restaurant

### What Super Admin CANNOT See

❌ Individual branches (managed by restaurant admin)
❌ Kitchen users (managed by restaurant admin)
❌ Menu items (managed by restaurant admin)
❌ Orders (managed by restaurant admin)

## Restaurant ID Format

The `restaurantId` is used as:
1. **Firestore document ID**: `restaurants/{restaurantId}`
2. **Email domain**: `admin@{restaurantId}.dineezee`
3. **Data isolation key**: All data stored under this ID

**Example:**
- Restaurant Name: "Pizza Palace"
- Restaurant ID: `pizzapalace` (lowercase, no spaces)
- Admin Email: `admin@pizzapalace.dineezee`
- Firestore Path: `restaurants/pizzapalace/`

## Benefits

### 1. True Multi-Tenancy
- Each restaurant is a separate tenant
- Complete data isolation
- No risk of data leakage

### 2. Scalability
- Add unlimited restaurants
- Each restaurant can have unlimited branches
- Each restaurant can have unlimited users

### 3. Easy Management
- Super admin creates restaurants with one click
- Restaurant admin manages their own data
- Clear separation of responsibilities

### 4. Security
- Firestore Security Rules can enforce tenant isolation
- Each restaurant can only access their own data
- Super admin has oversight but not day-to-day access

## Migration from Old Structure

### Old Structure (Before)
```
restaurants/
  └── dineeasee-restaurant/
      ├── branches/
      │   ├── Main
      │   ├── branch2
      │   └── RestrauntTwo  ← These should be separate restaurants!
      └── ...
```

### New Structure (After)
```
restaurants/
  ├── main/
  │   └── branches/
  │       └── Main Branch
  ├── branch2/
  │   └── branches/
  │       └── Main Branch
  └── restraunttwo/
      └── branches/
          └── Main Branch
```

## Next Steps

### For Existing Data

If you have existing restaurants in the old structure, you'll need to:

1. **Create new restaurants** via Super Admin Panel
2. **Migrate data** from old structure to new structure
3. **Update admin credentials** to use new email format

### For New Restaurants

Simply use the Super Admin Panel to create new restaurants!

## Code Files

### New Files Created
- `src/lib/restaurant-management.ts` - Multi-tenant restaurant functions
  - `createRestaurant()` - Create new restaurant with isolated data
  - `getAllRestaurants()` - Get all restaurants (super admin only)
  - `deleteRestaurant()` - Delete restaurant and all data

### Updated Files
- `src/components/SuperAdminPanel.tsx` - Uses new restaurant functions
- Shows restaurants (not branches)
- Creates proper multi-tenant structure

## Summary

You now have a **true SaaS multi-tenant architecture** where:

1. **Super Admin** creates restaurants (tenants)
2. Each **restaurant** has completely isolated data
3. **Restaurant Admin** manages their own restaurant
4. **No data mixing** between restaurants

This is the industry-standard approach for SaaS applications! 🎉
