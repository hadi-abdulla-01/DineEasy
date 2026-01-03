# Firebase Authentication Migration Plan

## Overview
Migrating from Firestore-based username/password authentication to Firebase Authentication with email/password.

## Architecture

### Authentication Flow
1. **Restaurant Admins**: `admin@restaurantname.dineezee`
2. **Kitchen Users**: `kitchen_username@restaurantname.dineezee`
3. **Super Admin**: Your personal Google account (already in Firebase Auth)

### Database Structure
```
restaurants/
  └── {restaurantId}/
      ├── adminEmail: "admin@restaurantname.dineezee"
      ├── kitchenUsers/
      │   └── {userId}/
      │       ├── email: "kitchen_user@restaurantname.dineezee"
      │       ├── role: "Kitchen"
      │       ├── displayName: "Kitchen User"
      │       └── ...
      └── ...
```

### Super Admin Panel Features
1. **Restaurant Management**
   - Create new restaurants
   - Generate admin credentials (email/password)
   - View all restaurants
   - Disable/Enable restaurants

2. **Access Control**
   - Super Admin: Full access to all restaurants
   - Restaurant Admin: Access to their restaurant only
   - Kitchen Users: Limited access to kitchen panel

## Implementation Steps

### Phase 1: Backend Setup
- [x] Document migration plan
- [ ] Create Firebase Auth helper functions
- [ ] Update data.ts to work with Firebase Auth UIDs
- [ ] Create super admin API routes

### Phase 2: Web App Migration
- [ ] Update AdminLoginPage to use email
- [ ] Update KitchenLoginPage to use email
- [ ] Create Super Admin Panel UI
- [ ] Update auth-provider to use Firebase Auth

### Phase 3: Mobile App Migration
- [ ] Update Flutter auth_provider to use Firebase Auth
- [ ] Update login screens to show "Email" instead of "Username"
- [ ] Test authentication flow

### Phase 4: Data Migration
- [ ] Script to migrate existing users to Firebase Auth
- [ ] Update existing user documents with Firebase UIDs
- [ ] Test migration with sample data

## Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Super admin check
    function isSuperAdmin() {
      return request.auth != null && 
             request.auth.token.email == 'your-email@gmail.com';
    }
    
    // Restaurant admin check
    function isRestaurantAdmin(restaurantId) {
      return request.auth != null && 
             get(/databases/$(database)/documents/restaurants/$(restaurantId)).data.adminEmail == request.auth.token.email;
    }
    
    match /restaurants/{restaurantId} {
      allow read: if isSuperAdmin() || isRestaurantAdmin(restaurantId);
      allow write: if isSuperAdmin();
      
      match /kitchenUsers/{userId} {
        allow read, write: if isSuperAdmin() || isRestaurantAdmin(restaurantId);
      }
    }
  }
}
```

## Email Format Convention
- **Admin**: `admin@{restaurantname}.dineezee`
- **Kitchen**: `{username}@{restaurantname}.dineezee`
- **Super Admin**: Your actual Google email

## Migration Notes
- Keep existing password field in Firestore for reference
- Firebase Auth will handle password hashing automatically
- Use Firebase Auth UID as the primary user identifier
- Link Firestore user documents with Firebase Auth UID
