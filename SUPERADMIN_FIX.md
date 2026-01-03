# Quick Fix: Super Admin Not Redirecting

## Problem
You're logging in successfully but seeing the restaurant dashboard instead of the Super Admin Panel.

## Solution

### Step 1: Update .env.local

Add this line to your `.env.local` file:

```env
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=your-email@gmail.com
```

**Important**: 
- Replace `your-email@gmail.com` with the EXACT email you created in Firebase Authentication
- Must start with `NEXT_PUBLIC_` so it works on the client side
- No spaces, no quotes around the email

### Step 2: Restart Dev Server

After updating `.env.local`:

1. Stop the server (Ctrl+C in terminal)
2. Restart: `npm run dev`

### Step 3: Test Login

1. Go to `http://localhost:3000/admin`
2. Login with your super admin email and password
3. You should now be redirected to `/admin/superadmin`

## Example .env.local File

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABC123

# Super Admin Email (MUST start with NEXT_PUBLIC_)
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=admin@mycompany.com
```

## Verify It's Working

After restarting, check the browser console (F12):
- The `isSuperAdmin()` function should return `true` for your email
- You should be redirected to `/admin/superadmin` after login

## Still Not Working?

1. **Check the email matches exactly**
   - Firebase Console → Authentication → Users
   - Copy the email from there
   - Paste it into `.env.local`

2. **Check for typos**
   - `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` (not `SUPER_ADMIN_EMAIL`)
   - No extra spaces
   - No quotes around the email

3. **Clear browser cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear browser data

4. **Check browser console for errors**
   - Press F12
   - Look for any red errors
   - Share them if you need help
