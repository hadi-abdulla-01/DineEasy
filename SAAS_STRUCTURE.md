# DineEasy SaaS Structure

## Multi-Tenant Architecture

### Hierarchy

```
Super Admin (You)
    ↓
Restaurants (Tenants)
    ↓
Restaurant Admin (One per restaurant)
    ↓
Branches (Created by Restaurant Admin)
    ↓
Kitchen Users (Created by Restaurant Admin)
```

## Roles & Responsibilities

### 1. **Super Admin** (SaaS Owner - You)

**Access**: Super Admin Panel (`/admin/superadmin`)

**Can Do**:
- ✅ Create new restaurants (tenants)
- ✅ Generate admin credentials for each restaurant
- ✅ View all restaurants
- ✅ Delete restaurants
- ❌ Cannot manage individual branches (that's the restaurant admin's job)

**Login**: Your personal email (e.g., `admin@yourcompany.com`)

---

### 2. **Restaurant Admin** (Tenant Owner)

**Access**: Restaurant Dashboard (`/admin`)

**Can Do**:
- ✅ Create multiple branches for their restaurant
- ✅ Create kitchen users
- ✅ Manage menu items
- ✅ View orders across all their branches
- ✅ Manage settings for their restaurant
- ❌ Cannot see other restaurants' data

**Login**: `admin@restaurantname.dineezee`

**Example**: If you create "Pizza Palace" restaurant with ID "pizzapalace", the admin logs in with `admin@pizzapalace.dineezee`

---

### 3. **Kitchen Users** (Staff)

**Access**: Kitchen Panel (`/kitchen`)

**Can Do**:
- ✅ View orders for their assigned branch
- ✅ Update order status
- ✅ Mark items as ready
- ❌ Cannot access admin features

**Login**: `username@restaurantname.dineezee`

**Example**: `chef1@pizzapalace.dineezee`

---

## Workflow Example

### Step 1: Super Admin Creates Restaurant

1. Super admin logs in to Super Admin Panel
2. Clicks "New Restaurant"
3. Fills in:
   - Restaurant Name: "Pizza Palace"
   - Restaurant ID: "pizzapalace"
   - Admin Password: "SecurePass123"
4. System creates:
   - Main branch for the restaurant
   - Admin account: `admin@pizzapalace.dineezee`
   - Firebase Auth account

### Step 2: Restaurant Admin Sets Up

1. Restaurant admin logs in with `admin@pizzapalace.dineezee`
2. Goes to Settings → Branches
3. Creates additional branches:
   - "Pizza Palace Downtown"
   - "Pizza Palace Mall"
4. Goes to User Management
5. Creates kitchen users:
   - `chef1@pizzapalace.dineezee` (assigned to Downtown)
   - `chef2@pizzapalace.dineezee` (assigned to Mall)

### Step 3: Kitchen Users Work

1. Kitchen user logs in with `chef1@pizzapalace.dineezee`
2. Sees only orders for Downtown branch
3. Updates order statuses

---

## Email Format Convention

| Role | Email Format | Example |
|------|-------------|---------|
| Super Admin | Your actual email | `admin@yourcompany.com` |
| Restaurant Admin | `admin@{restaurantid}.dineezee` | `admin@pizzapalace.dineezee` |
| Kitchen User | `{username}@{restaurantid}.dineezee` | `chef1@pizzapalace.dineezee` |

---

## Super Admin Panel Features

### Restaurant Cards Show:
- **Restaurant Name**: e.g., "Pizza Palace"
- **Admin Email**: `admin@pizzapalace.dineezee`
- **Capability**: "Admin can create branches & users"
- **Restaurant ID**: Unique identifier

### What Super Admin Does NOT See:
- Individual branches (managed by restaurant admin)
- Kitchen users (managed by restaurant admin)
- Menu items (managed by restaurant admin)
- Orders (managed by restaurant admin)

### What Super Admin DOES See:
- All restaurants in the system
- Ability to create new restaurants
- Ability to delete restaurants

---

## Benefits of This Structure

### For You (Super Admin):
- ✅ Simple management - just create restaurants
- ✅ Each restaurant is independent
- ✅ Easy to onboard new clients
- ✅ Clear separation of data

### For Restaurant Admins:
- ✅ Full control over their restaurant
- ✅ Can create multiple branches
- ✅ Can manage their own staff
- ✅ Cannot see other restaurants' data

### For Kitchen Users:
- ✅ Simple interface
- ✅ Only see relevant orders
- ✅ Cannot access admin features

---

## Security

- Each restaurant's data is isolated
- Restaurant admins can only access their own data
- Kitchen users can only access their assigned branch
- Super admin has oversight but doesn't manage day-to-day operations

---

## Scaling

As you add more restaurants:
- Each gets their own admin account
- Each manages their own branches
- No limit on number of restaurants
- No limit on branches per restaurant
- No limit on users per restaurant

---

## Summary

**You (Super Admin)**: Create restaurants → Give admin credentials to clients
**Restaurant Admin**: Create branches → Create users → Manage operations
**Kitchen Users**: Process orders → Update statuses

This is a true SaaS multi-tenant architecture where you manage tenants (restaurants), and each tenant manages their own operations!
