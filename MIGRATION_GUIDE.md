# Firebase Authentication Migration Guide

## Overview
This guide will help you migrate from the current username/password system to Firebase Authentication.

## Prerequisites
1. Firebase project with Authentication enabled
2. Email/Password sign-in method enabled in Firebase Console
3. Super admin email configured in environment variables

## Step 1: Configure Environment Variables

Add your super admin email to `.env.local`:

```env
SUPER_ADMIN_EMAIL=your-email@gmail.com
```

## Step 2: Create Your Super Admin Account

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Authentication > Users
4. Click "Add User"
5. Enter your email (the one you set as SUPER_ADMIN_EMAIL)
6. Set a password
7. Click "Add User"

## Step 3: Login as Super Admin

1. Start your development server: `npm run dev`
2. Navigate to the Admin Login page
3. Enter your super admin email and password
4. You'll be redirected to `/admin/superadmin`

## Step 4: Create Restaurants via Super Admin Panel

For each restaurant:

1. Click "New Restaurant"
2. Fill in:
   - **Restaurant Name**: Display name (e.g., "Pizza Palace")
   - **Restaurant ID**: Unique identifier (e.g., "pizzapalace")
   - **Admin Password**: Password for the restaurant admin
3. Click "Create Restaurant"

This will:
- Create a Firebase Auth account with email: `admin@{restaurantId}.dineezee`
- Create a branch in Firestore
- Create an admin user document linked to the Firebase Auth account

## Step 5: Migrate Existing Kitchen Users

For each existing kitchen user, you need to:

### Option A: Manual Creation (Recommended for few users)

1. Login as restaurant admin
2. Go to User Management
3. Create new users with:
   - Email format: `{username}@{restaurantId}.dineezee`
   - Password: Set a new password
   - Role: Kitchen
   - Other details as before

### Option B: Programmatic Migration (For many users)

Create a migration script:

\`\`\`typescript
// scripts/migrate-users.ts
import { createAuthUser, generateUserEmail } from '@/lib/auth';
import { getKitchenUsers, updateKitchenUser } from '@/lib/data';

async function migrateUsers() {
  const users = await getKitchenUsers();
  
  for (const user of users) {
    if (user.email) {
      console.log(\`User \${user.username} already migrated\`);
      continue;
    }

    // Generate email based on username
    const email = generateUserEmail(user.username, 'dineeasee-restaurant', false);
    
    try {
      // Create Firebase Auth account
      const result = await createAuthUser(email, user.password, {
        username: user.username,
        password: user.password,
        role: user.role,
        categories: user.categories,
        branchId: user.branchId,
        permissions: user.permissions
      });

      if (result.success) {
        console.log(\`✅ Migrated user: \${user.username} -> \${email}\`);
      } else {
        console.error(\`❌ Failed to migrate \${user.username}: \${result.error}\`);
      }
    } catch (error) {
      console.error(\`❌ Error migrating \${user.username}:\`, error);
    }
  }
}

migrateUsers();
\`\`\`

## Step 6: Update Login Credentials

Inform all users of their new login credentials:

- **Admins**: `admin@{restaurantname}.dineezee`
- **Kitchen Users**: `{username}@{restaurantname}.dineezee`
- **Password**: Same as before (or reset if needed)

## Step 7: Test Authentication

1. Test admin login with new email format
2. Test kitchen user login with new email format
3. Test super admin access to super admin panel
4. Verify role-based redirects work correctly

## Troubleshooting

### "User not found in database"
- The Firebase Auth account exists but Firestore user document is missing
- Create the user document manually or via the User Management panel

### "Email already in use"
- A Firebase Auth account with this email already exists
- Check Firebase Console > Authentication > Users
- Delete the duplicate or use a different email

### "Invalid email or password"
- Check that the email format is correct
- Verify the password is correct
- Check Firebase Console for any account issues

### Cannot access super admin panel
- Verify SUPER_ADMIN_EMAIL matches your Firebase Auth email exactly
- Check that you're logged in with the super admin account
- Clear browser cache and session storage

## Security Best Practices

1. **Use strong passwords** for all accounts
2. **Enable 2FA** for super admin account in Firebase Console
3. **Regularly review** user access in Firebase Console
4. **Set up Firebase Security Rules** to restrict access:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSuperAdmin() {
      return request.auth != null && 
             request.auth.token.email == 'your-email@gmail.com';
    }
    
    function isRestaurantAdmin(restaurantId) {
      return request.auth != null && 
             exists(/databases/$(database)/documents/restaurants/$(restaurantId)/kitchenUsers/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/restaurants/$(restaurantId)/kitchenUsers/$(request.auth.uid)).data.role == 'Admin';
    }
    
    match /restaurants/{restaurantId} {
      allow read: if isSuperAdmin() || isRestaurantAdmin(restaurantId);
      allow write: if isSuperAdmin();
      
      match /kitchenUsers/{userId} {
        allow read: if isSuperAdmin() || 
                      isRestaurantAdmin(restaurantId) ||
                      request.auth.uid == userId;
        allow write: if isSuperAdmin() || isRestaurantAdmin(restaurantId);
      }
      
      match /{document=**} {
        allow read, write: if isSuperAdmin() || isRestaurantAdmin(restaurantId);
      }
    }
  }
}
\`\`\`

## Rollback Plan

If you need to rollback:

1. The old `password` field is still stored in Firestore
2. You can temporarily revert the login pages to use username/password
3. Keep both authentication methods active during transition period
4. Gradually phase out username/password authentication

## Next Steps

1. ✅ Configure super admin email
2. ✅ Create super admin Firebase Auth account
3. ✅ Login and access super admin panel
4. ✅ Create restaurants via super admin panel
5. ✅ Migrate existing kitchen users
6. ✅ Test all authentication flows
7. ✅ Deploy to production
8. ✅ Update Firebase Security Rules
9. ✅ Monitor for any issues

## Support

If you encounter any issues during migration:
1. Check the browser console for errors
2. Check Firebase Console > Authentication for account status
3. Verify environment variables are set correctly
4. Review the migration logs
